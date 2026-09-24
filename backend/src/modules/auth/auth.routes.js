import crypto from "crypto";
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { query } from "../../config/db.js";
import { signJwt, verifyIdToken } from "../../config/firebase.js";
import { authenticate } from "../../middleware/auth.js";
import { successResponse } from "../../utils/apiResponse.js";
import { AuthenticationError, ConflictError, ValidationError } from "../../utils/errors.js";

const router = Router();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  // Demo password fallback for development / seeded users
  if (stored === "pbkdf2:demo") {
    return true;
  }
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(hash, "hex"));
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please provide a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please provide a valid 10-digit Indian mobile number"),
  age: z.coerce.number().int().min(10, "Age must be at least 10").max(120, "Age must be at most 120"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
    errorMap: () => ({ message: "Please select a valid gender option" }),
  }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email or mobile number is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const parseRes = registerSchema.safeParse(req.body);
    if (!parseRes.success) {
      const messages = parseRes.error.errors.map((e) => e.message);
      throw new ValidationError(messages[0] || "Invalid registration data", messages);
    }

    const { name, email, phone, age, gender, password } = parseRes.data;

    // Check if user already exists with this email or phone
    const normalizedEmail = email.toLowerCase();
    const existing = await query(
      "SELECT * FROM users WHERE lower(email) = lower($1) OR phone = $2",
      [normalizedEmail, phone]
    );

    if (existing.rows && existing.rows.length > 0) {
      const matched = existing.rows[0];
      if (matched.email && matched.email.toLowerCase() === normalizedEmail) {
        throw new ConflictError("An account with this email address already exists");
      }
      if (matched.phone === phone) {
        throw new ConflictError("An account with this mobile number already exists");
      }
      throw new ConflictError("An account with these credentials already exists");
    }

    const password_hash = hashPassword(password);
    const userId = uuidv4();
    const firebase_uid = `fn_${userId.slice(0, 12)}`;
    const avatar_url =
      gender === "female"
        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";

    const insertRes = await query(
      `INSERT INTO users (firebase_uid, name, email, phone, age, gender, password_hash, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [firebase_uid, name, normalizedEmail, phone, age, gender, password_hash, avatar_url]
    );

    const newUser = insertRes.rows[0] || {
      id: userId,
      firebase_uid,
      name,
      email: normalizedEmail,
      phone,
      age,
      gender,
      points: 100,
      level: 1,
      streak_days: 1,
      avatar_url,
    };

    const token = signJwt(
      {
        uid: newUser.firebase_uid,
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role || "member",
        avatar_url: newUser.avatar_url,
      },
      7 * 24 * 3600
    );

    return successResponse(
      res,
      {
        user: sanitizeUser(newUser),
        token,
      },
      "Account registered successfully",
      201
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const parseRes = loginSchema.safeParse(req.body);
    if (!parseRes.success) {
      const messages = parseRes.error.errors.map((e) => e.message);
      throw new ValidationError(messages[0] || "Invalid login credentials", messages);
    }

    const { identifier, password, rememberMe } = parseRes.data;
    const cleanId = identifier.trim();
    const lowerId = cleanId.toLowerCase();

    // Query user by email or mobile number
    const result = await query(
      "SELECT * FROM users WHERE lower(email) = lower($1) OR phone = $2",
      [lowerId, cleanId]
    );

    let user = result.rows && result.rows[0];

    // If not found in database, check for demo/fallback matching
    if (!user) {
      if (lowerId === "vishal@fitnation.ai" || cleanId === "9876543210") {
        user = {
          id: "u1000000-0000-0000-0000-000000000001",
          firebase_uid: "vishal-fit",
          name: "Vishal Fit",
          email: "vishal@fitnation.ai",
          phone: "9876543210",
          age: 26,
          gender: "male",
          points: 420,
          level: 3,
          streak_days: 7,
          fitness_level: "Intermediate",
          goal: "Muscle building",
          role: "member",
          avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          password_hash: "pbkdf2:demo",
        };
      }
    }

    if (!user) {
      throw new AuthenticationError("Invalid email/mobile number or password");
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid email/mobile number or password");
    }

    // Determine token expiration (30 days for remember me, 24 hours otherwise)
    const expiresInSeconds = rememberMe ? 30 * 24 * 3600 : 24 * 3600;

    const token = signJwt(
      {
        uid: user.firebase_uid || user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role || "member",
        avatar_url: user.avatar_url,
      },
      expiresInSeconds
    );

    return successResponse(
      res,
      {
        user: sanitizeUser(user),
        token,
      },
      "Sign in successful"
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const uid = req.firebaseUser.uid || req.firebaseUser.id;
    const email = req.firebaseUser.email;

    const { rows } = await query(
      "SELECT * FROM users WHERE firebase_uid = $1 OR lower(email) = lower($2)",
      [uid, email || ""]
    );

    let userProfile = rows[0];

    if (!userProfile) {
      userProfile = {
        id: req.firebaseUser.id || uid,
        firebase_uid: uid,
        name: req.firebaseUser.name || "Athlete",
        email: req.firebaseUser.email || `${uid}@fitnation.ai`,
        phone: req.firebaseUser.phone || "",
        avatar_url: req.firebaseUser.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        points: 100,
        level: 1,
        streak_days: 1,
        fitness_level: "Beginner",
        goal: "General fitness",
        role: "member",
      };
    }

    return successResponse(res, sanitizeUser(userProfile), "Current authenticated user profile");
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  return successResponse(res, null, "Logged out successfully");
});

export default router;
