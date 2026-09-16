import { Router } from "express";
import { z } from "zod";
import { getClient, query } from "../../config/db.js";
import { authenticate, requireUser } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { successResponse } from "../../utils/apiResponse.js";
import { NotFoundError } from "../../utils/errors.js";

const router = Router();

const createGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().default(""),
  avatar_url: z.string().url().or(z.literal("")).optional(),
  is_private: z.boolean().default(false),
});

// GET /api/groups — user's joined groups
router.get("/", authenticate, requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT g.*, gm.role, gm.joined_at
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1
       ORDER BY gm.joined_at DESC`,
      [req.user.id]
    );
    return successResponse(res, rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/groups/discover — discoverable public groups
router.get("/discover", authenticate, requireUser, async (req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM groups WHERE is_private = false LIMIT 20");
    return successResponse(res, rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/groups — create group
router.post("/", authenticate, requireUser, validate({ body: createGroupSchema }), async (req, res, next) => {
  try {
    const { name, description, avatar_url, is_private } = req.body;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const client = await getClient();

    try {
      const { rows: groupRows } = await client.query(
        `INSERT INTO groups (name, description, avatar_url, is_private, invite_code, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, description, avatar_url || "", is_private, inviteCode, req.user.id]
      );

      const group = groupRows[0];
      await client.query(
        `INSERT INTO group_members (group_id, user_id, role)
         VALUES ($1, $2, 'owner')
         ON CONFLICT DO NOTHING`,
        [group.id, req.user.id]
      );

      return successResponse(res, group, "Group created successfully", 201);
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:id/join — join group
router.post("/:id/join", authenticate, requireUser, async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const { rows: gRows } = await query("SELECT * FROM groups WHERE id = $1", [groupId]);

    if (gRows.length === 0) {
      throw new NotFoundError("Group");
    }

    await query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [groupId, req.user.id]
    );

    return successResponse(res, { group_id: groupId, joined: true }, "Joined group successfully");
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:id/leave — leave group
router.post("/:id/leave", authenticate, requireUser, async (req, res, next) => {
  try {
    const groupId = req.params.id;
    await query("DELETE FROM group_members WHERE group_id = $1 AND user_id = $2", [groupId, req.user.id]);
    return successResponse(res, { group_id: groupId, left: true }, "Left group successfully");
  } catch (err) {
    next(err);
  }
});

export default router;
