export function successResponse(res, data = {}, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

export function errorResponse(res, error) {
  const statusCode = error.statusCode || 500;
  const code = error.code || "INTERNAL_SERVER_ERROR";
  const message = error.message || "An unexpected error occurred";
  const details = error.details || [];

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}
