import crypto from "crypto";
import admin from "firebase-admin";
import { env } from "./env.js";
import { logger } from "./logger.js";

let firebaseInitialized = false;

export const JWT_SECRET = process.env.JWT_SECRET || "fitnation-ai-super-secret-jwt-key-2026";

export function signJwt(payload, expiresInSeconds = 7 * 24 * 3600) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT token format");
  const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest("base64url");
  if (expectedSig !== parts[2]) throw new Error("Invalid JWT token signature");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("JWT token has expired");
  }
  return payload;
}

if (env.FIREBASE_PROJECT_ID && env.FIREBASE_PRIVATE_KEY && env.FIREBASE_PRIVATE_KEY.length > 50) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
        storageBucket: env.FIREBASE_STORAGE_BUCKET || undefined,
      });
      firebaseInitialized = true;
      logger.info("Firebase Admin SDK successfully initialized");
    }
  } catch (err) {
    logger.warn("Firebase Admin SDK initialization failed; running in mock auth mode", { error: err.message });
  }
} else {
  logger.info("Firebase credentials not configured; running in mock development auth mode");
}

export const auth = firebaseInitialized ? admin.auth() : null;
export const messaging = firebaseInitialized ? admin.messaging() : null;
export const bucket = (firebaseInitialized && env.FIREBASE_STORAGE_BUCKET) ? admin.storage().bucket() : null;

/**
 * Verify Firebase ID token or JWT with graceful fallback to dev mock tokens in development/testing
 */
export async function verifyIdToken(token) {
  if (!token) throw new Error("Missing auth token");

  // Handle standard JWT token
  if (token.split(".").length === 3) {
    try {
      const decoded = verifyJwt(token);
      return {
        uid: decoded.uid || decoded.id,
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        phone: decoded.phone,
        picture: decoded.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        firebase: { sign_in_provider: "password" },
      };
    } catch (err) {
      throw new Error(err.message || "Invalid or expired JWT token");
    }
  }

  // Handle dev/mock token in test or development environments
  if (token.startsWith("dev-token:") || token.startsWith("mock-") || !firebaseInitialized) {
    if (env.DEV_AUTH_BYPASS || env.NODE_ENV !== "production") {
      const parts = token.split(":");
      const uid = parts[1] || "dev-user-123";
      const email = parts[2] || `${uid}@fitnation.ai`;
      const name = parts[3] || "Vishal Fit";
      return {
        uid,
        email,
        name,
        picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        firebase: { sign_in_provider: "password" },
      };
    }
  }

  if (!firebaseInitialized) {
    throw new Error("Firebase Authentication is not configured on this server");
  }

  return await auth.verifyIdToken(token);
}
