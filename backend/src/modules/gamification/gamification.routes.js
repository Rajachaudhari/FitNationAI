import { Router } from "express";
import { getClient, query } from "../../config/db.js";
import { authenticate, requireUser } from "../../middleware/auth.js";
import { successResponse } from "../../utils/apiResponse.js";

const router = Router();

// GET /api/gamification/status — user points, level, and transaction history
router.get("/status", authenticate, requireUser, async (req, res, next) => {
  try {
    const { rows: userRows } = await query(
      "SELECT id, name, points, level, streak_days, last_active_date, avatar_url FROM users WHERE id = $1",
      [req.user.id]
    );

    const user = userRows[0] || req.user;

    // Calculate level based on formula: level = Math.floor(Math.sqrt(points / 100)) + 1
    const currentPoints = user.points || 0;
    const computedLevel = Math.max(1, Math.floor(Math.sqrt(currentPoints / 100)) + 1);
    const nextLevelPoints = Math.pow(computedLevel, 2) * 100;
    const currentLevelBasePoints = Math.pow(computedLevel - 1, 2) * 100;
    const levelProgress = Math.min(
      100,
      Math.round(((currentPoints - currentLevelBasePoints) / Math.max(1, nextLevelPoints - currentLevelBasePoints)) * 100)
    );

    // Fetch recent point transactions
    const { rows: transactions } = await query(
      `SELECT id, amount, source, description, created_at
       FROM point_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.user.id]
    );

    return successResponse(res, {
      points: currentPoints,
      level: computedLevel,
      next_level_points: nextLevelPoints,
      level_progress_percent: levelProgress,
      streak_days: user.streak_days || 1,
      transactions,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/gamification/achievements — all badges & unlocks
router.get("/achievements", authenticate, requireUser, async (req, res, next) => {
  try {
    const { rows: achievements } = await query("SELECT * FROM achievements");
    const { rows: userAchievements } = await query(
      "SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = $1",
      [req.user.id]
    );

    const unlockedMap = new Map(userAchievements.map((ua) => [ua.achievement_id, ua.unlocked_at]));

    const result = achievements.map((a) => ({
      ...a,
      is_unlocked: unlockedMap.has(a.id),
      unlocked_at: unlockedMap.get(a.id) || null,
    }));

    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /api/gamification/claim-streak — daily streak claim
router.post("/claim-streak", authenticate, requireUser, async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const lastActive = req.user.last_active_date ? new Date(req.user.last_active_date).toISOString().slice(0, 10) : null;

    if (lastActive === today) {
      return successResponse(res, { already_claimed: true, streak_days: req.user.streak_days }, "Daily streak already claimed today");
    }

    const client = await getClient();
    try {
      const streakPoints = 20;

      await client.query(
        `INSERT INTO point_transactions (user_id, amount, source, description)
         VALUES ($1, $2, 'daily_streak', 'Daily streak login bonus')`,
        [req.user.id, streakPoints]
      );

      const { rows: updatedUser } = await client.query(
        `UPDATE users SET
           points = points + $1,
           streak_days = streak_days + 1,
           last_active_date = CURRENT_DATE,
           updated_at = now()
         WHERE id = $2
         RETURNING points, streak_days`,
        [streakPoints, req.user.id]
      );

      return successResponse(
        res,
        {
          already_claimed: false,
          points_awarded: streakPoints,
          total_points: updatedUser[0]?.points,
          streak_days: updatedUser[0]?.streak_days,
        },
        "Daily streak bonus claimed!"
      );
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

export default router;
