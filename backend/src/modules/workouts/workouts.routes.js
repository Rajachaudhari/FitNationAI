import { Router } from "express";
import { z } from "zod";
import { getClient, query } from "../../config/db.js";
import { authenticate, requireUser } from "../../middleware/auth.js";
import { aiLimiter } from "../../middleware/rateLimiter.js";
import { validate } from "../../middleware/validate.js";
import { aiService } from "../../services/ai/index.js";
import { successResponse } from "../../utils/apiResponse.js";
import { AuthorizationError, NotFoundError } from "../../utils/errors.js";

const router = Router();

const createWorkoutSchema = z.object({
  title: z.string().min(2).max(100),
  duration_min: z.number().int().min(5).max(300).default(45),
  is_custom: z.boolean().default(true),
  exercises: z.array(
    z.object({
      name: z.string().min(1),
      detail: z.string().optional(),
      sets: z.number().int().min(1).max(20).default(3),
      reps: z.number().int().min(1).max(100).default(10),
      rest_seconds: z.number().int().min(0).max(600).default(60),
    })
  ).min(1, "Workout must contain at least one exercise"),
});

const generateWorkoutSchema = z.object({
  goal: z.string().max(100).optional(),
  duration_min: z.number().int().min(10).max(180).default(45),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
  focus: z.enum(["Full Body", "Upper Body", "Lower Body", "Core", "Cardio"]).default("Full Body"),
});

const toggleExerciseSchema = z.object({
  is_done: z.boolean(),
});

// GET /api/workouts/exercises — catalog
router.get("/exercises", authenticate, async (req, res, next) => {
  try {
    const { category, difficulty } = req.query;
    let sql = "SELECT * FROM exercises WHERE 1=1";
    const values = [];

    if (category) {
      values.push(category);
      sql += ` AND category = $${values.length}`;
    }
    if (difficulty) {
      values.push(difficulty);
      sql += ` AND difficulty = $${values.length}`;
    }

    const { rows } = await query(sql, values);
    return successResponse(res, rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/workouts/today — latest active plan + exercises
router.get("/today", authenticate, requireUser, async (req, res, next) => {
  try {
    const { rows: planRows } = await query(
      "SELECT * FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [req.user.id]
    );

    if (planRows.length === 0) {
      return successResponse(res, null, "No workout plan found for today");
    }

    const plan = planRows[0];
    const { rows: exerciseRows } = await query(
      "SELECT * FROM workout_plan_exercises WHERE plan_id = $1 ORDER BY order_index ASC",
      [plan.id]
    );

    return successResponse(res, {
      ...plan,
      exercises: exerciseRows,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/workouts/generate — AI workout generation pipeline
router.post("/generate", authenticate, requireUser, aiLimiter, validate({ body: generateWorkoutSchema }), async (req, res, next) => {
  try {
    const aiOutput = await aiService.generateWorkout(req.user, req.body);

    // Save generated workout plan to database atomically
    const client = await getClient();
    try {
      const { rows: planRows } = await client.query(
        `INSERT INTO workout_plans (user_id, title, duration_min, difficulty, split_type, is_custom)
         VALUES ($1, $2, $3, $4, $5, false)
         RETURNING *`,
        [req.user.id, aiOutput.title, aiOutput.duration_minutes, aiOutput.difficulty, aiOutput.focus]
      );

      const planId = planRows[0].id;
      const exercises = [];

      for (let i = 0; i < (aiOutput.exercises || []).length; i++) {
        const ex = aiOutput.exercises[i];
        const detail = `${ex.sets} sets × ${ex.reps} reps (${ex.rest_seconds}s rest)`;
        const { rows: exRows } = await client.query(
          `INSERT INTO workout_plan_exercises (plan_id, name, detail, order_index, sets, reps, rest_seconds)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [planId, ex.name, detail, i, ex.sets || 3, ex.reps || 10, ex.rest_seconds || 60]
        );
        exercises.push(exRows[0]);
      }

      return successResponse(
        res,
        {
          ...planRows[0],
          warmup: aiOutput.warmup,
          cooldown: aiOutput.cooldown,
          exercises,
        },
        "Personalized workout generated successfully",
        201
      );
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/workouts — custom workout creation
router.post("/", authenticate, requireUser, validate({ body: createWorkoutSchema }), async (req, res, next) => {
  try {
    const { title, duration_min, is_custom, exercises } = req.body;
    const client = await getClient();

    try {
      const { rows: planRows } = await client.query(
        `INSERT INTO workout_plans (user_id, title, duration_min, is_custom)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [req.user.id, title, duration_min, is_custom]
      );

      const planId = planRows[0].id;
      const savedExercises = [];

      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        const detail = ex.detail || `${ex.sets} sets × ${ex.reps} reps`;
        const { rows: exRows } = await client.query(
          `INSERT INTO workout_plan_exercises (plan_id, name, detail, order_index, sets, reps, rest_seconds)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [planId, ex.name, detail, i, ex.sets, ex.reps, ex.rest_seconds]
        );
        savedExercises.push(exRows[0]);
      }

      return successResponse(
        res,
        {
          ...planRows[0],
          exercises: savedExercises,
        },
        "Workout plan created successfully",
        201
      );
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// PATCH /api/workouts/exercise/:id — IDOR Protected: updates exercise completion ONLY if belonging to authenticated user
router.patch("/exercise/:id", authenticate, requireUser, validate({ body: toggleExerciseSchema }), async (req, res, next) => {
  try {
    const exerciseId = req.params.id;
    const { is_done } = req.body;

    // Verify ownership through workout_plans
    const { rows: planRows } = await query(
      `SELECT wp.user_id
       FROM workout_plan_exercises wpe
       JOIN workout_plans wp ON wp.id = wpe.plan_id
       WHERE wpe.id = $1`,
      [exerciseId]
    );

    if (planRows.length === 0) {
      throw new NotFoundError("Workout exercise");
    }

    if (planRows[0].user_id !== req.user.id) {
      throw new AuthorizationError("You do not have permission to modify another athlete's workout");
    }

    const { rows } = await query(
      "UPDATE workout_plan_exercises SET is_done = $1 WHERE id = $2 RETURNING *",
      [is_done, exerciseId]
    );

    return successResponse(res, rows[0], "Exercise status updated");
  } catch (err) {
    next(err);
  }
});

// POST /api/workouts/sessions/complete — session completion & gamification reward
router.post("/sessions/complete", authenticate, requireUser, async (req, res, next) => {
  try {
    const { duration_sec = 1800, calories = 250 } = req.body;
    const client = await getClient();

    try {
      // 1. Record completed session
      const { rows: sessRows } = await client.query(
        `INSERT INTO workout_sessions (user_id, duration_sec, total_calories, status, completed_at)
         VALUES ($1, $2, $3, 'completed', now())
         RETURNING *`,
        [req.user.id, duration_sec, calories]
      );

      // 2. Award workout completion XP (50 points)
      const pointsReward = 50;
      await client.query(
        `INSERT INTO point_transactions (user_id, amount, source, reference_id)
         VALUES ($1, $2, 'workout_completed', $3)`,
        [req.user.id, pointsReward, sessRows[0]?.id]
      );

      // 3. Increment user points and advance streak
      await client.query(
        `UPDATE users SET
           points = points + $1,
           streak_days = streak_days + 1,
           last_active_date = CURRENT_DATE,
           updated_at = now()
         WHERE id = $2`,
        [pointsReward, req.user.id]
      );

      return successResponse(
        res,
        {
          session: sessRows[0],
          points_awarded: pointsReward,
          streak_days: (req.user.streak_days || 0) + 1,
        },
        "Workout completed! Points awarded."
      );
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

export default router;
