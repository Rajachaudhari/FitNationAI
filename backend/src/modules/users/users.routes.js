import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/db.js";
import { authenticate, requireUser } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { successResponse } from "../../utils/apiResponse.js";
import { NotFoundError } from "../../utils/errors.js";

const router = Router();

const syncSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().or(z.literal("")).optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  age: z.number().int().min(10).max(120).optional(),
  height_cm: z.number().positive().max(300).optional(),
  weight_kg: z.number().positive().max(500).optional(),
  fitness_level: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
  goal: z.string().max(200).optional(),
  activity_level: z.enum(["sedentary", "lightly_active", "moderately_active", "very_active"]).optional(),
  avatar_url: z.string().url().or(z.literal("")).optional(),
  location: z.string().max(100).optional(),
});

const assessmentSchema = z.object({
  fitness_level: z.string().optional(),
  goal: z.string().optional(),
  experience: z.string().optional(),
  available_days: z.number().int().min(1).max(7).optional(),
  equipment: z.array(z.string()).optional(),
  preferred_duration: z.number().int().min(10).max(180).optional(),
  activity_level: z.string().optional(),
  limitations: z.array(z.string()).optional(),
  answers: z.record(z.any()).optional(),
});

// POST /api/users/sync — synchronize user after Firebase login
router.post("/sync", authenticate, validate({ body: syncSchema }), async (req, res, next) => {
  try {
    const { uid, email, picture } = req.firebaseUser;
    const name = req.body.name || req.firebaseUser.name || (email ? email.split("@")[0] : "Athlete");
    const avatar = req.body.avatar_url || picture || "";

    const { rows } = await query(
      `INSERT INTO users (firebase_uid, name, email, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (firebase_uid) DO UPDATE SET
         name = COALESCE(EXCLUDED.name, users.name),
         avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
         updated_at = now()
       RETURNING *`,
      [uid, name, email, avatar]
    );

    return successResponse(res, rows[0], "User synchronized successfully");
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me — profile for authenticated user
router.get("/me", authenticate, requireUser, async (req, res) => {
  return successResponse(res, req.user);
});

// PATCH /api/users/me — update user profile fields
router.patch("/me", authenticate, requireUser, validate({ body: updateProfileSchema }), async (req, res, next) => {
  try {
    const allowedFields = [
      "name",
      "gender",
      "age",
      "height_cm",
      "weight_kg",
      "fitness_level",
      "goal",
      "activity_level",
      "avatar_url",
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        values.push(req.body[field]);
        updates.push(`${field} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      return successResponse(res, req.user, "No fields modified");
    }

    values.push(req.user.id);
    const sql = `UPDATE users SET ${updates.join(", ")}, updated_at = now() WHERE id = $${values.length} RETURNING *`;
    const { rows } = await query(sql, values);

    if (rows.length === 0) {
      throw new NotFoundError("User");
    }

    return successResponse(res, rows[0], "Profile updated successfully");
  } catch (err) {
    next(err);
  }
});

// POST /api/users/assessment — store multi-step onboarding assessment
router.post("/assessment", authenticate, requireUser, validate({ body: assessmentSchema }), async (req, res, next) => {
  try {
    const answers = req.body;
    const { rows: assessmentRows } = await query(
      `INSERT INTO fitness_assessments (user_id, answers)
       VALUES ($1, $2)
       RETURNING *`,
      [req.user.id, JSON.stringify(answers)]
    );

    // Update user profile goal and fitness_level if provided in assessment
    if (answers.fitness_level || answers.goal) {
      await query(
        `UPDATE users SET
           fitness_level = COALESCE($1, fitness_level),
           goal = COALESCE($2, goal),
           updated_at = now()
         WHERE id = $3`,
        [answers.fitness_level || null, answers.goal || null, req.user.id]
      );
    }

    return successResponse(res, assessmentRows[0], "Assessment saved successfully", 201);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/assessment/history
router.get("/assessment/history", authenticate, requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT * FROM fitness_assessments WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    return successResponse(res, rows);
  } catch (err) {
    next(err);
  }
});

export default router;
