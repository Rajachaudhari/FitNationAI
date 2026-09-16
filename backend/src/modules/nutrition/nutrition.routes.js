import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/db.js";
import { authenticate, requireUser } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { successResponse } from "../../utils/apiResponse.js";
import { AuthorizationError, NotFoundError } from "../../utils/errors.js";

const router = Router();

const createFoodSchema = z.object({
  meal: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  description: z.string().min(1).max(250),
  calories: z.number().min(0).max(10000),
  protein_g: z.number().min(0).max(500).default(0),
  carbs_g: z.number().min(0).max(1000).default(0),
  fat_g: z.number().min(0).max(500).default(0),
  serving_size: z.string().max(100).optional(),
});

// GET /api/nutrition/today — today's nutrition overview
router.get("/today", authenticate, requireUser, async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { rows } = await query(
      `SELECT * FROM food_logs
       WHERE user_id = $1 AND logged_at::text LIKE $2
       ORDER BY logged_at DESC`,
      [req.user.id, `${today}%`]
    );

    const totalCalories = rows.reduce((sum, r) => sum + (Number(r.calories) || 0), 0);
    const totalProtein = rows.reduce((sum, r) => sum + (Number(r.protein_g) || 0), 0);
    const totalCarbs = rows.reduce((sum, r) => sum + (Number(r.carbs_g) || 0), 0);
    const totalFat = rows.reduce((sum, r) => sum + (Number(r.fat_g) || 0), 0);

    return successResponse(res, {
      date: today,
      meals: rows,
      totals: {
        calories: Math.round(totalCalories),
        protein_g: Math.round(totalProtein),
        carbs_g: Math.round(totalCarbs),
        fat_g: Math.round(totalFat),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/nutrition/history
router.get("/history", authenticate, requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM food_logs
       WHERE user_id = $1
       ORDER BY logged_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    return successResponse(res, rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/nutrition — log food item
router.post("/", authenticate, requireUser, validate({ body: createFoodSchema }), async (req, res, next) => {
  try {
    const { meal, description, calories, protein_g, carbs_g, fat_g, serving_size } = req.body;
    const { rows } = await query(
      `INSERT INTO food_logs (user_id, meal, description, calories, protein_g, carbs_g, fat_g)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, meal, description, calories, protein_g, carbs_g, fat_g]
    );

    return successResponse(res, rows[0], "Food logged successfully", 201);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/nutrition/:id — IDOR Protected: delete meal item
router.delete("/:id", authenticate, requireUser, async (req, res, next) => {
  try {
    const mealId = req.params.id;

    // Check ownership
    const { rows: existing } = await query(
      "SELECT user_id FROM food_logs WHERE id = $1",
      [mealId]
    );

    if (existing.length === 0) {
      throw new NotFoundError("Food log entry");
    }

    if (existing[0].user_id !== req.user.id) {
      throw new AuthorizationError("You cannot delete another athlete's food log");
    }

    await query("DELETE FROM food_logs WHERE id = $1", [mealId]);
    return successResponse(res, { id: mealId }, "Food log deleted successfully");
  } catch (err) {
    next(err);
  }
});

export default router;
