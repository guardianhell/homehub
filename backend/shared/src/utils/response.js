/**
 * Standardized API Response Helpers
 */

const successResponse = (
  res,
  data = null,
  message = "Success",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
};

const errorResponse = (
  res,
  message = "An error occurred",
  statusCode = 500,
  errors = null,
  errorCode = "ERR_INTERNAL",
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    errors,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
