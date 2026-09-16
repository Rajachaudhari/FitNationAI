import rateLimit from "express-rate-limit";
import { RateLimitError } from "../utils/errors.js";

const standardHandler = (req, res, next) => {
  next(new RateLimitError());
};

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardHandler,
  skip: (req) => process.env.NODE_ENV === "test",
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardHandler,
  skip: (req) => process.env.NODE_ENV === "test",
});

export const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardHandler,
  skip: (req) => process.env.NODE_ENV === "test",
});

export const poseLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // high throughput for real-time video keypoints
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardHandler,
  skip: (req) => process.env.NODE_ENV === "test",
});
