import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/db.js";
import { authenticate, requireUser } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { successResponse } from "../../utils/apiResponse.js";

const router = Router();

const activityUpsertSchema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  steps: z.number().int().min(0).max(200000).default(0),
  distance_km: z.number().min(0).max(500).default(0),
  calories: z.number().min(0).max(20000).default(0),
  active_minutes: z.number().int().min(0).max(1440).default(0),
  source: z.enum(["manual", "health_api", "wearable", "google_maps"]).default("manual"),
});

const rangeQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// POST /api/activity — upsert activity log
router.post("/", authenticate, requireUser, validate({ body: activityUpsertSchema }), async (req, res, next) => {
  try {
    const { log_date, steps, distance_km, calories, active_minutes, source } = req.body;
    const { rows } = await query(
      `INSERT INTO activity_logs (user_id, log_date, steps, distance_km, calories, active_minutes, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, log_date)
       DO UPDATE SET
         steps = EXCLUDED.steps,
         distance_km = EXCLUDED.distance_km,
         calories = EXCLUDED.calories,
         active_minutes = EXCLUDED.active_minutes,
         source = EXCLUDED.source,
         updated_at = now()
       RETURNING *`,
      [req.user.id, log_date, steps, distance_km, calories, active_minutes, source]
    );

    return successResponse(res, rows[0], "Activity recorded successfully");
  } catch (err) {
    next(err);
  }
});

// GET /api/activity/today — current day metrics
router.get("/today", authenticate, requireUser, async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { rows } = await query(
      "SELECT * FROM activity_logs WHERE user_id = $1 AND log_date = $2",
      [req.user.id, today]
    );

    const data = rows[0] || {
      user_id: req.user.id,
      log_date: today,
      steps: 0,
      distance_km: 0,
      calories: 0,
      active_minutes: 0,
      source: "manual",
    };

    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
});

// GET /api/activity/range?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/range", authenticate, requireUser, validate({ query: rangeQuerySchema }), async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { rows } = await query(
      `SELECT log_date, steps, distance_km, calories, active_minutes, source
       FROM activity_logs
       WHERE user_id = $1 AND log_date BETWEEN $2 AND $3
       ORDER BY log_date ASC`,
      [req.user.id, from, to]
    );

    return successResponse(res, rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/activity/summary?period=7d|30d|90d
router.get("/summary", authenticate, requireUser, async (req, res, next) => {
  try {
    const days = req.query.period === "90d" ? 90 : req.query.period === "30d" ? 30 : 7;
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - days);

    const fromStr = fromDate.toISOString().slice(0, 10);
    const toStr = toDate.toISOString().slice(0, 10);

    const { rows } = await query(
      `SELECT log_date, steps, distance_km, calories, active_minutes
       FROM activity_logs
       WHERE user_id = $1 AND log_date BETWEEN $2 AND $3
       ORDER BY log_date ASC`,
      [req.user.id, fromStr, toStr]
    );

    const totalSteps = rows.reduce((sum, r) => sum + (Number(r.steps) || 0), 0);
    const totalDistance = rows.reduce((sum, r) => sum + (Number(r.distance_km) || 0), 0);
    const totalCalories = rows.reduce((sum, r) => sum + (Number(r.calories) || 0), 0);
    const totalMinutes = rows.reduce((sum, r) => sum + (Number(r.active_minutes) || 0), 0);

    const count = rows.length || 1;
    const summary = {
      period_days: days,
      from: fromStr,
      to: toStr,
      total_steps: totalSteps,
      avg_daily_steps: Math.round(totalSteps / count),
      total_distance_km: Number(totalDistance.toFixed(2)),
      total_calories: Math.round(totalCalories),
      avg_daily_calories: Math.round(totalCalories / count),
      total_active_minutes: totalMinutes,
      logs: rows,
    };

    return successResponse(res, summary);
  } catch (err) {
    next(err);
  }
});

export default router;
