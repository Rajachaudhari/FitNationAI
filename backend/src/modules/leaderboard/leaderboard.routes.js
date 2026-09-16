import { Router } from "express";
import { query } from "../../config/db.js";
import { authenticate, requireUser } from "../../middleware/auth.js";
import { successResponse } from "../../utils/apiResponse.js";

const router = Router();

// GET /api/leaderboard?scope=global|college|city|state&scope_value=...
router.get("/", authenticate, requireUser, async (req, res, next) => {
  try {
    const { scope = "global", scope_value } = req.query;

    let sql = `
      SELECT id, name, avatar_url, points, level, streak_days
      FROM users
      ORDER BY points DESC
      LIMIT 50
    `;

    const { rows: leaders } = await query(sql);

    // Annotate with rank (1-indexed)
    const rankedLeaders = leaders.map((u, idx) => ({
      rank: idx + 1,
      id: u.id,
      name: u.name,
      avatar_url: u.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      points: u.points || 0,
      level: u.level || 1,
      streak_days: u.streak_days || 0,
      is_current_user: u.id === req.user.id,
    }));

    // Find current user's position
    const currentUserEntry = rankedLeaders.find((l) => l.is_current_user);
    const userRank = currentUserEntry
      ? currentUserEntry.rank
      : {
          rank: rankedLeaders.length + 1,
          id: req.user.id,
          name: req.user.name,
          points: req.user.points || 0,
          is_current_user: true,
        };

    return successResponse(res, {
      scope,
      leaders: rankedLeaders,
      user_rank: userRank,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
