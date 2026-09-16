import * as Sentry from "@sentry/node";
import { logger } from "../config/logger.js";
import { errorResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/errors.js";

export function errorHandler(err, req, res, next) {
  // Capture unhandled 500 errors to Sentry
  if (!err.statusCode || err.statusCode >= 500) {
    logger.error("Unhandled Exception:", {
      path: req.path,
      method: req.method,
      error: err.message,
      stack: err.stack,
    });
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
  } else {
    logger.warn("Client Error:", {
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
    });
  }

  if (err instanceof AppError) {
    return errorResponse(res, err);
  }

  // Handle SyntaxError (e.g. malformed JSON in body)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return errorResponse(res, {
      statusCode: 400,
      code: "MALFORMED_JSON",
      message: "Malformed JSON payload in request body",
    });
  }

  // Handle generic error
  return errorResponse(res, {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
}
