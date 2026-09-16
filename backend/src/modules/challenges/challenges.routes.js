import { Router } from "express";
import { z } from "zod";
import { getClient, query } from "../../config/db.js";
import { authenticate, requireUser } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { successResponse } from "../../utils/apiResponse.js";
import { ConflictError, NotFoundError } from "../../utils/errors.js";

const router = Router();

const progressSchema = z.object({
  increment: z.number().int().min(1).max(1000).default(1),
});

// GET /api/challenges — active challenges with user progress
router.get("/", authenticate, requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.*, COALESCE(uc.progress, 0) AS progress, uc.completed_at, COALESCE(uc.reward_claimed, false) AS reward_claimed
       FROM challenges c
       LEFT JOIN user_challenges uc ON uc.challenge_id = c.id AND uc.user_id = $1
       ORDER BY c.starts_at DESC NULLS LAST`,
      [req.user.id]
    );
    return successResponse(res, rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/challenges/:id/join — join challenge
router.post("/:id/join", authenticate, requireUser, async (req, res, next) => {
  try {
    const challengeId = req.params.id;

    const { rows: challengeRows } = await query(
      "SELECT * FROM challenges WHERE id = $1",
      [challengeId]
    );
    if (challengeRows.length === 0) {
      throw new NotFoundError("Challenge");
    }

    const { rows } = await query(
      `INSERT INTO user_challenges (user_id, challenge_id, progress, reward_claimed)
       VALUES ($1, $2, 0, false)
       ON CONFLICT (user_id, challenge_id) DO NOTHING
       RETURNING *`,
      [req.user.id, challengeId]
    );

    return successResponse(res, rows[0] || { joined: true }, "Successfully joined challenge");
  } catch (err) {
    next(err);
  }
});

// POST /api/challenges/:id/progress — idempotent challenge progress and transactional reward
router.post("/:id/progress", authenticate, requireUser, validate({ body: progressSchema }), async (req, res, next) => {
  try {
    const challengeId = req.params.id;
    const { increment } = req.body;
    const client = await getClient();

    try {
      // 1. Fetch challenge details
      const { rows: chRows } = await client.query(
        "SELECT * FROM challenges WHERE id = $1",
        [challengeId]
      );
      if (chRows.length === 0) {
        throw new NotFoundError("Challenge");
      }
      const challenge = chRows[0];

      // 2. Upsert user challenge progress
      const { rows: ucRows } = await client.query(
        `INSERT INTO user_challenges (user_id, challenge_id, progress, reward_claimed)
         VALUES ($1, $2, $3, false)
         ON CONFLICT (user_id, challenge_id)
         DO UPDATE SET progress = user_challenges.progress + $3
         RETURNING *`,
        [req.user.id, challengeId, increment]
      );

      const userChallenge = ucRows[0];
      let rewardAwarded = false;

      // 3. IDEMPOTENT REWARD CHECK: Award points ONLY IF target reached AND reward was NEVER claimed
      if (userChallenge.progress >= challenge.total_units && !userChallenge.reward_claimed) {
        // Atomically mark reward_claimed to true
        await client.query(
          `UPDATE user_challenges SET
             completed_at = COALESCE(completed_at, now()),
             reward_claimed = true
           WHERE id = $1`,
          [userChallenge.id]
        );

        // Record immutable point transaction audit trail
        await client.query(
          `INSERT INTO point_transactions (user_id, amount, source, reference_id, description)
           VALUES ($1, $2, 'challenge_reward', $3, $4)`,
          [req.user.id, challenge.reward_points, challenge.id, `Completed challenge: ${challenge.title}`]
        );

        // Increment user's aggregate points
        await client.query(
          "UPDATE users SET points = points + $1 WHERE id = $2",
          [challenge.reward_points, req.user.id]
        );

        rewardAwarded = true;
        userChallenge.reward_claimed = true;
        userChallenge.completed_at = new Date().toISOString();
      }

      return successResponse(
        res,
        {
          challenge: userChallenge,
          reward_awarded: rewardAwarded,
          reward_points: rewardAwarded ? challenge.reward_points : 0,
        },
        rewardAwarded ? "Challenge completed! Reward points awarded!" : "Challenge progress updated"
      );
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

export default router;
