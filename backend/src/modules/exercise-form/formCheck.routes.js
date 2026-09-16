import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/db.js";
import { authenticate, requireUser } from "../../middleware/auth.js";
import { poseLimiter } from "../../middleware/rateLimiter.js";
import { validate } from "../../middleware/validate.js";
import { successResponse } from "../../utils/apiResponse.js";
import { FormAnalysisEngine } from "./engine.js";

const router = Router();

const formCheckSchema = z.object({
  exercise: z.string().min(1).default("Squat"),
  pose_keypoints: z.any(),
});

// POST /api/form-check/analyze — real-time biomechanical analysis
router.post("/analyze", authenticate, requireUser, poseLimiter, validate({ body: formCheckSchema }), async (req, res, next) => {
  try {
    const { exercise, pose_keypoints } = req.body;
    const analysis = FormAnalysisEngine.analyze(exercise, pose_keypoints);

    // Persist session summary to form_check_sessions
    const { rows } = await query(
      `INSERT INTO form_check_sessions (user_id, exercise, score, feedback, detected_flaws, pose_keypoints)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, exercise, score, feedback, detected_flaws, created_at`,
      [
        req.user.id,
        analysis.exercise,
        analysis.score,
        analysis.feedback,
        JSON.stringify(analysis.flaws),
        JSON.stringify(pose_keypoints ? (pose_keypoints.landmarks ? pose_keypoints.landmarks.slice(0, 10) : []) : []),
      ]
    );

    return successResponse(res, {
      id: rows[0]?.id,
      ...analysis,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/form-check/history — past sessions
router.get("/history", authenticate, requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, exercise, score, feedback, detected_flaws, created_at
       FROM form_check_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    return successResponse(res, rows);
  } catch (err) {
    next(err);
  }
});

export default router;
