const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { gatewayAuthGuard } = require("./middleware/authGuard");

const app = express();
const PORT = process.env.GATEWAY_PORT || 8000;

// Microservice Target URLs (configurable via environment variables)
const SERVICE_TARGETS = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:8001",
  utility: process.env.UTILITY_SERVICE_URL || "http://localhost:8002",
  asset: process.env.ASSET_SERVICE_URL || "http://localhost:8003",
  grocery: process.env.GROCERY_SERVICE_URL || "http://localhost:8004",
  finance: process.env.FINANCE_SERVICE_URL || "http://localhost:8005",
  activity: process.env.ACTIVITY_SERVICE_URL || "http://localhost:8006",
};

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. Strict CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "*"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-household-id",
      "x-subscription-tier",
      "Accept-Language",
    ],
  }),
);

// 3. Rate Limiting (Prevent Brute Force & DDoS)
const isDev = process.env.NODE_ENV !== "production";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX
    ? parseInt(process.env.RATE_LIMIT_MAX, 10)
    : (isDev ? 10000 : 2000), // 10,000 in dev/local, 2,000 in production
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // In development or local testing, bypass rate limit for localhost to avoid blocking SPA workflows
    if (isDev) {
      const clientIp = req.ip || req.connection?.remoteAddress || "";
      if (
        clientIp.includes("127.0.0.1") ||
        clientIp.includes("::1") ||
        clientIp.includes("localhost")
      ) {
        return true;
      }
    }
    // Always skip health check
    return req.path === "/health";
  },
  message: {
    success: false,
    message: "Terlalu banyak permintaan dari IP ini. Silakan coba lagi nanti.",
    errorCode: "ERR_RATE_LIMIT_EXCEEDED",
  },
});
app.use(limiter);

// 4. Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "HomeHub API Gateway",
    timestamp: new Date().toISOString(),
    routes: {
      auth: `${SERVICE_TARGETS.auth}/health`,
      utility: `${SERVICE_TARGETS.utility}/health`,
      asset: `${SERVICE_TARGETS.asset}/health`,
      grocery: `${SERVICE_TARGETS.grocery}/health`,
      finance: `${SERVICE_TARGETS.finance}/health`,
      activity: `${SERVICE_TARGETS.activity}/health`,
    },
  });
});

// 5. JWT Auth Guard for all /api/v1/ routes
app.use("/api/v1", gatewayAuthGuard);

// 6. Reverse Proxy Routes to Downstream Microservices
const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  logLevel: "debug",
  on: {
    error: (err, req, res) => {
      console.error(`Proxy error connecting to ${target}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          message: "Layanan mikro downstream tidak dapat dihubungi.",
          errorCode: "ERR_BAD_GATEWAY",
        });
      }
    },
  },
});

// Route mappings
app.use(
  "/api/v1/auth",
  createProxyMiddleware(proxyOptions(SERVICE_TARGETS.auth)),
);
app.use(
  "/api/v1/admin",
  createProxyMiddleware({
    ...proxyOptions(SERVICE_TARGETS.auth),
    pathRewrite: (pathReq) => (pathReq.startsWith("/admin") ? pathReq : "/admin" + pathReq),
  }),
);
app.use(
  "/api/v1/family",
  createProxyMiddleware(proxyOptions(SERVICE_TARGETS.auth)),
);
app.use(
  "/api/v1/utilities",
  createProxyMiddleware(proxyOptions(SERVICE_TARGETS.utility)),
);
app.use(
  "/api/v1/assets",
  createProxyMiddleware(proxyOptions(SERVICE_TARGETS.asset)),
);
app.use(
  "/api/v1/vehicles",
  createProxyMiddleware(proxyOptions(SERVICE_TARGETS.asset)),
);
app.use(
  "/api/v1/groceries",
  createProxyMiddleware(proxyOptions(SERVICE_TARGETS.grocery)),
);
app.use(
  "/api/v1/shopping",
  createProxyMiddleware(proxyOptions(SERVICE_TARGETS.grocery)),
);
app.use(
  "/api/v1/finance",
  createProxyMiddleware(proxyOptions(SERVICE_TARGETS.finance)),
);
app.use(
  "/api/v1/activities",
  createProxyMiddleware(proxyOptions(SERVICE_TARGETS.activity)),
);
app.use(
  "/api/v1/categories",
  createProxyMiddleware({
    ...proxyOptions(SERVICE_TARGETS.auth),
    pathRewrite: (pathReq) => (pathReq.startsWith("/categories") ? pathReq : "/categories" + pathReq),
  }),
);

// 7. 404 Fallback for Unmatched Routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} tidak ditemukan di HomeHub Gateway.`,
    errorCode: "ERR_NOT_FOUND",
  });
});

// Start Gateway
app.listen(PORT, () => {
  console.log(`🚀 HomeHub API Gateway running on port ${PORT}`);
  console.log(`Routing table initialized for 6 core microservices.`);
});
