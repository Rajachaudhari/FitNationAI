import { query } from "../config/db.js";
import { verifyIdToken } from "../config/firebase.js";
import { AuthenticationError, AuthorizationError } from "../utils/errors.js";

/**
 * Validates Firebase ID Token from Authorization header
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or malformed Authorization header. Expected Bearer <token>");
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new AuthenticationError("Authentication token is empty");
    }

    const decoded = await verifyIdToken(token);
    req.firebaseUser = decoded;
    next();
  } catch (err) {
    if (err instanceof AuthenticationError) return next(err);
    return next(new AuthenticationError(err.message || "Invalid or expired authentication token"));
  }
}

/**
 * Resolves local PostgreSQL user profile and attaches req.user
 * Auto-creates profile row if missing during initial login
 */
export async function requireUser(req, res, next) {
  try {
    if (!req.firebaseUser || !req.firebaseUser.uid) {
      throw new AuthenticationError("Authentication required before resolving user context");
    }

    const { uid, email, name, picture } = req.firebaseUser;

    // Check if user exists in database
    const { rows } = await query("SELECT * FROM users WHERE firebase_uid = $1", [uid]);

    if (rows.length > 0) {
      req.user = rows[0];
      return next();
    }

    // Automatically synchronize on first request
    const insertRes = await query(
      `INSERT INTO users (firebase_uid, name, email, avatar_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [uid, name || (email ? email.split("@")[0] : "Athlete"), email || `${uid}@fitnation.ai`, picture || ""]
    );

    req.user = insertRes.rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(allowedRoles = ["member"]) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError("User context not established"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError(`Requires one of the following roles: ${allowedRoles.join(", ")}`));
    }
    next();
  };
}

/**
 * Optional authentication middleware for public endpoints that can be enhanced with user context
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token) {
        const decoded = await verifyIdToken(token);
        req.firebaseUser = decoded;
        const { rows } = await query("SELECT * FROM users WHERE firebase_uid = $1", [decoded.uid]);
        if (rows.length > 0) {
          req.user = rows[0];
        }
      }
    }
  } catch (e) {
    // ignore in optional auth
  }
  next();
}
