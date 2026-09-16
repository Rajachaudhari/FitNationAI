import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { NotFoundError } from "./utils/errors.js";

// Domain Routes
import activityRoutes from "./modules/activity/activity.routes.js";
import aiCoachRoutes from "./modules/ai-coach/aiCoach.routes.js";
import challengesRoutes from "./modules/challenges/challenges.routes.js";
import formCheckRoutes from "./modules/exercise-form/formCheck.routes.js";
import gamificationRoutes from "./modules/gamification/gamification.routes.js";
import groupsRoutes from "./modules/groups/groups.routes.js";
import leaderboardRoutes from "./modules/leaderboard/leaderboard.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import nutritionRoutes from "./modules/nutrition/nutrition.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import workoutsRoutes from "./modules/workouts/workouts.routes.js";

const app = express();

// Security Headers & Cross-Origin
app.use(helmet());
app.use(
  cors({
    origin: "*", // allow web and mobile clients
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser (5mb for video pose keypoint payloads)
app.use(express.json({ limit: "5mb" }));

// Rate Limiting
app.use(generalLimiter);

// Health & Diagnostic Endpoints
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "FitNation AI Backend",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "FitNation AI API is live and operational",
    version: "2.0.0",
  });
});

// Domain Routing Modules
app.use("/api/users", usersRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/workouts", workoutsRoutes);
app.use("/api/form-check", formCheckRoutes);
app.use("/api/ai", aiCoachRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/challenges", challengesRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/notifications", notificationsRoutes);

// Catch 404s
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
