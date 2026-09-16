import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/db.js";
import { authenticate, requireUser } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { successResponse } from "../../utils/apiResponse.js";

const router = Router();

const deviceTokenSchema = z.object({
  token: z.string().min(10).max(500),
  platform: z.enum(["web", "ios", "android"]).default("web"),
});

// POST /api/notifications/device-token — register push device token
router.post("/device-token", authenticate, requireUser, validate({ body: deviceTokenSchema }), async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    await query(
      `INSERT INTO device_tokens (user_id, token, platform, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (token) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         platform = EXCLUDED.platform,
         updated_at = now()`,
      [req.user.id, token, platform]
    );

    return successResponse(res, { registered: true }, "Device token registered successfully");
  } catch (err) {
    next(err);
  }
});

// GET /api/notifications — list user notifications
router.get("/", authenticate, requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [req.user.id]
    );
    return successResponse(res, rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read — mark as read
router.patch("/:id/read", authenticate, requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );
    return successResponse(res, rows[0] || { id: req.params.id, is_read: true });
  } catch (err) {
    next(err);
  }
});

export default router;
