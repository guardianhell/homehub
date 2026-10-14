const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../../.env") });
const jwt = require("jsonwebtoken");
const { errorResponse } = require("../utils/response");

const JWT_SECRET =
  process.env.JWT_SECRET || "supersecret_jwt_key_homehub_2026_dev_mode";

/**
 * Authentication Middleware
 * 1. Checks for internal Gateway headers (in microservices context)
 * 2. Falls back to Bearer JWT token verification
 */
const authenticate = (req, res, next) => {
  // Check if headers were already verified & injected by API Gateway
  const gatewayUserId = req.headers["x-user-id"];
  const gatewayHouseholdId = req.headers["x-household-id"];
  const gatewayUserRole = req.headers["x-user-role"];
  const gatewaySubscriptionTier = req.headers["x-subscription-tier"] || "FREE";

  if (gatewayUserId && gatewayHouseholdId) {
    req.user = {
      id: gatewayUserId,
      role: gatewayUserRole,
    };
    req.household = {
      id: gatewayHouseholdId,
      tier: gatewaySubscriptionTier,
    };
    return next();
  }

  // Fallback: Check Authorization Header (Direct call / standalone testing)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(
      res,
      "Authentication token required.",
      401,
      null,
      "ERR_UNAUTHORIZED",
    );
  }

  const token = authHeader.split(" ")[1];

  // Demo Token Bypass is only permitted in isolated test runner
  if (process.env.NODE_ENV === "test" && token.startsWith("demo_")) {
    const isPro = token.includes("pro");
    req.user = {
      id: isPro ? "u-2" : "u-1",
      email: isPro ? "siti@keluarga.com" : "budi@keluarga.com",
      role: "OWNER",
    };
    req.household = {
      id: isPro ? "villa_pro" : "tebet_free",
      tier: isPro ? "PRO" : "FREE",
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role || "MEMBER",
    };
    req.household = {
      id: decoded.householdId,
      tier: decoded.subscriptionTier || "FREE",
    };
    next();
  } catch (err) {
    return errorResponse(
      res,
      "Invalid or expired token.",
      401,
      null,
      "ERR_INVALID_TOKEN",
    );
  }
};

/**
 * Role-Based Access Control (RBAC) Guard
 */
const requireRole = (allowedRoles = ["OWNER", "ADMIN"]) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        "Access forbidden. Insufficient permissions.",
        403,
        null,
        "ERR_FORBIDDEN",
      );
    }
    next();
  };
};

/**
 * Admin Access Guard
 */
const requireAdmin = (allowedRoles = ["SUPERADMIN", "HELPDESK", "FINANCE", "AUDITOR", "ADMIN"]) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        "Akses ditolak: Memerlukan hak akses administrator.",
        403,
        null,
        "ERR_FORBIDDEN",
      );
    }
    next();
  };
};

module.exports = {
  authenticate,
  requireRole,
  requireAdmin,
  JWT_SECRET,
};
