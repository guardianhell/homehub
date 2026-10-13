const { errorResponse } = require("../utils/response");

/**
 * 3-Tier Validation Middleware (Tier 2: Backend Zod Schema Verification)
 * Validates request body, query parameters, or route params against a Zod schema.
 * Rejects invalid payloads with 400 Bad Request before hitting business logic.
 */
const validate = (schema, source = "body") => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = await schema.parseAsync(dataToValidate);
      // Replace with sanitized/validated data
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return errorResponse(
          res,
          "Validation failed. Please check input parameters.",
          400,
          formattedErrors,
          "ERR_VALIDATION",
        );
      }
      return errorResponse(
        res,
        "Malformed request data.",
        400,
        null,
        "ERR_BAD_REQUEST",
      );
    }
  };
};

module.exports = {
  validate,
};
