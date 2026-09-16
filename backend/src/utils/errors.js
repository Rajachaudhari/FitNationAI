export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_SERVER_ERROR", details = []) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input data", details = []) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Access denied: insufficient permissions or not resource owner") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict or duplicate operation") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export class ExternalAPIError extends AppError {
  constructor(service = "External service", originalError = null) {
    super(`${service} request failed`, 502, "EXTERNAL_API_ERROR", originalError ? [originalError.message] : []);
  }
}
