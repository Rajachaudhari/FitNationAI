import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/db.js";
import { authenticate, requireUser } from "../../middleware/auth.js";
import { aiLimiter } from "../../middleware/rateLimiter.js";
import { validate } from "../../middleware/validate.js";
import { aiService } from "../../services/ai/index.js";
import { successResponse } from "../../utils/apiResponse.js";

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
  })).optional().default([]),
});

const parseFoodSchema = z.object({
  text: z.string().min(2).max(500),
});

// POST /api/ai/chat — conversational AI fitness coach
router.post("/chat", authenticate, requireUser, aiLimiter, validate({ body: chatSchema }), async (req, res, next) => {
  try {
    const { message, history } = req.body;

    // 1. Record user message
    await query(
      "INSERT INTO chat_messages (user_id, role, content) VALUES ($1, 'user', $2)",
      [req.user.id, message]
    );

    // 2. Prepare user context for prompt
    const userContext = {
      name: req.user.name,
      fitness_level: req.user.fitness_level,
      goal: req.user.goal,
      streak_days: req.user.streak_days,
      points: req.user.points,
    };

    // 3. Request reply from AI provider
    const fullMessages = [...history, { role: "user", content: message }];
    const reply = await aiService.chat(fullMessages, userContext);

    // 4. Record assistant message
    await query(
      "INSERT INTO chat_messages (user_id, role, content) VALUES ($1, 'assistant', $2)",
      [req.user.id, reply]
    );

    return successResponse(res, { reply });
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/chat/history — load past chat conversation
router.get("/chat/history", authenticate, requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, role, content, created_at
       FROM chat_messages
       WHERE user_id = $1
       ORDER BY created_at ASC
       LIMIT 100`,
      [req.user.id]
    );
    return successResponse(res, rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/parse-food — natural language food parser
router.post("/parse-food", authenticate, requireUser, aiLimiter, validate({ body: parseFoodSchema }), async (req, res, next) => {
  try {
    const { text } = req.body;
    const nutrition = await aiService.parseFood(text);
    return successResponse(res, nutrition);
  } catch (err) {
    next(err);
  }
});

export default router;
