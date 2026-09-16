import admin from "firebase-admin";
import { env } from "./env.js";
import { logger } from "./logger.js";

let firebaseInitialized = false;

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
 * Verify Firebase ID token with graceful fallback to dev mock tokens in development/testing
 */
export async function verifyIdToken(token) {
  if (!token) throw new Error("Missing auth token");

  // Handle dev/mock token in test or development environments
  if (token.startsWith("dev-token:") || token.startsWith("mock-") || !firebaseInitialized) {
    if (env.DEV_AUTH_BYPASS || env.NODE_ENV !== "production") {
      const parts = token.split(":");
      const uid = parts[1] || "dev-user-123";
      const email = parts[2] || `${uid}@fitnation.ai`;
      const name = parts[3] || "Alex Fit";
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
