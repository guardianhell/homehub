const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../../.env") });
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "supersecret_jwt_key_homehub_2026_dev_mode";
const FALLBACK_SECRET = "homehub-super-secret-key-change-in-production";

// Public endpoints that bypass authentication
const PUBLIC_PATHS = [
  "/health",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/forgot-password",
  "/admin",
  "/api/v1/admin",
  "/auth/admin",
  "/api/v1/auth/admin",
  "/admin/feature-limits",
  "/api/v1/admin/feature-limits",
  "/auth/admin/feature-limits",
  "/api/v1/auth/admin/feature-limits",
  "/subscriptions/webhook",
  "/api/v1/auth/subscriptions/webhook",
  "/vouchers",
  "/api/v1/auth/vouchers",
  "/auth/vouchers",
  "/categories",
  "/api/v1/categories",
  "/auth/categories",
  "/api/v1/auth/categories",
  "/utilities/categories",
  "/api/v1/utilities/categories",
  "/auth/utilities/categories",
  "/api/v1/auth/utilities/categories",
];

/**
 * Gateway Auth Guard
 * Verifies JWT and decorates headers for downstream microservices
 */
const gatewayAuthGuard = (req, res, next) => {
  // Normalize paths to check (handling express sub-router path stripping)
  const path = (req.path || "").replace(/\/+$/, "");
  const originalUrl = (
    req.originalUrl ? req.originalUrl.split("?")[0] : ""
  ).replace(/\/+$/, "");
  const url = (req.url ? req.url.split("?")[0] : "").replace(/\/+$/, "");
  const fullPath = ((req.baseUrl || "") + (req.path || "")).replace(/\/+$/, "");

  // Check if current path is public
  const isPublic = PUBLIC_PATHS.some((pub) => {
    const cleanPub = pub.replace(/\/+$/, "");
    return (
      path === cleanPub ||
      path.startsWith(cleanPub + "/") ||
      originalUrl === cleanPub ||
      originalUrl.startsWith(cleanPub + "/") ||
      fullPath === cleanPub ||
      fullPath.startsWith(cleanPub + "/") ||
      url === cleanPub ||
      url.startsWith(cleanPub + "/")
    );
  });

  if (isPublic) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Akses ditolak: Token autentikasi dibutuhkan.",
      errorCode: "ERR_UNAUTHORIZED",
    });
  }

  const token = authHeader.split(" ")[1];

  // Demo Token Bypass for Pair Testing / Instant Mode
  if (token.startsWith("demo_")) {
    const isPro = token.includes("pro");
    req.headers["x-user-id"] = isPro ? "u-2" : "u-1";
    req.headers["x-user-email"] = isPro
      ? "siti@keluarga.com"
      : "budi@keluarga.com";
    req.headers["x-user-role"] = "OWNER";
    req.headers["x-household-id"] =
      req.headers["x-household-id"] || (isPro ? "villa_pro" : "tebet_free");
    req.headers["x-subscription-tier"] =
      req.headers["x-subscription-tier"] || (isPro ? "PRO" : "FREE");
    return next();
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (verifyErr) {
      if (verifyErr.name === "TokenExpiredError") {
        throw verifyErr;
      }
      if (JWT_SECRET !== FALLBACK_SECRET) {
        decoded = jwt.verify(token, FALLBACK_SECRET);
      } else {
        throw verifyErr;
      }
    }

    // Inject verified context headers for downstream microservices
    req.headers["x-user-id"] = decoded.userId;
    req.headers["x-user-email"] = decoded.email;
    req.headers["x-user-role"] = decoded.role || "MEMBER";

    // Use active household from client header or fallback to token household
    const activeHouseholdId =
      req.headers["x-household-id"] || decoded.householdId;
    const activeTier =
      req.headers["x-subscription-tier"] || decoded.subscriptionTier || "FREE";

    req.headers["x-household-id"] = activeHouseholdId;
    req.headers["x-subscription-tier"] = activeTier;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message:
        "Sesi kedaluwarsa atau token tidak valid. Silakan login kembali.",
      errorCode: "ERR_INVALID_TOKEN",
    });
  }
};

module.exports = {
  gatewayAuthGuard,
};
