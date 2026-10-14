const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../../.env") });
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { z } = require("zod");
const { createDbPool } = require("../../../shared/src/utils/db");
const {
  successResponse,
  errorResponse,
} = require("../../../shared/src/utils/response");
const { validate } = require("../../../shared/src/middleware/validate");
const {
  authenticate,
  requireRole,
  requireAdmin,
  JWT_SECRET,
} = require("../../../shared/src/middleware/auth");
const {
  getFeatureLimits,
  updateFeatureLimits,
} = require("../../../shared/src/utils/featureLimits");

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 8001;

app.use(cors());
app.use(express.json());

// Database connection pool for db_family
const db = createDbPool("db_family");

// =============================================================================
// ZOD VALIDATION SCHEMAS (Tier 1 & 2 Validation)
// =============================================================================
const registerSchema = z.object({
  name: z.string().min(2, "Nama harus minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid").max(150),
  password: z.string().min(6, "Password minimal 6 karakter"),
  phone: z.string().optional().nullable().or(z.literal("")),
  preferred_language: z.enum(["id", "en"]).default("id"),
  household_name: z.string().min(2, "Nama rumah minimal 2 karakter").max(120),
});

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password harus diisi"),
});

const createHouseholdSchema = z.object({
  name: z.string().min(2, "Nama rumah minimal 2 karakter").max(120),
  address: z.string().optional(),
});

const updateHouseholdSchema = z.object({
  name: z.string().min(2, "Nama rumah minimal 2 karakter").max(120),
  address: z.string().max(255).optional().nullable(),
});

const addMemberSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  role: z.enum(["ADMIN", "MEMBER", "HELPER"]).default("MEMBER"),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER", "HELPER"]),
});

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "Auth & Family Service" });
});

// POST /register
app.post("/register", validate(registerSchema), async (req, res) => {
  const { name, email, password, phone, preferred_language, household_name } =
    req.body;
  const normalizedEmail = email.trim().toLowerCase();
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Check existing user (parameterized query)
    const [existing] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail],
    );
    if (existing.length > 0) {
      await connection.rollback();
      return errorResponse(
        res,
        "Email sudah terdaftar.",
        409,
        null,
        "ERR_EMAIL_EXISTS",
      );
    }

    // 2. Hash password (bcrypt)
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await connection.execute(
      `INSERT INTO users (id, name, email, password_hash, phone, preferred_language) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name.trim(),
        normalizedEmail,
        passwordHash,
        phone ? phone.trim() : null,
        preferred_language || "id",
      ],
    );

    // 3. Create initial household (Default: FREE tier)
    const householdId = uuidv4();
    await connection.execute(
      `INSERT INTO households (id, owner_user_id, name, subscription_tier) 
       VALUES (?, ?, ?, 'FREE')`,
      [householdId, userId, household_name.trim()],
    );

    // 4. Link user as OWNER in household_members
    const memberId = uuidv4();
    await connection.execute(
      `INSERT INTO household_members (id, household_id, user_id, role) 
       VALUES (?, ?, ?, 'OWNER')`,
      [memberId, householdId, userId],
    );

    await connection.commit();

    // 5. Generate token
    const token = jwt.sign(
      {
        userId,
        email: normalizedEmail,
        role: "OWNER",
        householdId,
        subscriptionTier: "FREE",
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return successResponse(
      res,
      {
        token,
        user: {
          id: userId,
          name: name.trim(),
          email: normalizedEmail,
          preferred_language: preferred_language || "id",
        },
        activeHousehold: {
          id: householdId,
          name: household_name.trim(),
          tier: "FREE",
          role: "OWNER",
        },
      },
      "Pendaftaran berhasil",
      201,
    );
  } catch (err) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }
    console.error("Registration error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return errorResponse(
        res,
        "Email sudah terdaftar.",
        409,
        null,
        "ERR_EMAIL_EXISTS",
      );
    }
    if (
      err.code === "ECONNREFUSED" ||
      err.name === "AggregateError" ||
      err.message?.includes("ECONNREFUSED") ||
      err.message?.includes("connect")
    ) {
      console.error(
        `❌ [Auth Service] MySQL Connection Failed (${err.message}). Make sure MySQL container is running via 'npm run db:up' on ${process.env.DB_HOST || "127.0.0.1"}:${process.env.DB_PORT || 3306}`,
      );
      return errorResponse(
        res,
        "Database MySQL belum aktif atau tidak dapat dijangkau (ECONNREFUSED). Silakan jalankan 'npm run db:up' di terminal atau aktifkan Docker Desktop.",
        503,
        null,
        "ERR_DATABASE_UNAVAILABLE",
      );
    }
    return errorResponse(
      res,
      err.message || "Gagal mendaftarkan akun.",
      500,
      null,
      err.code || "ERR_INTERNAL",
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// POST /login
app.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email ? email.trim().toLowerCase() : "";

  try {
    // Parameterized query against SQL injection
    const [users] = await db.execute(
      "SELECT id, name, email, password_hash, preferred_language, status FROM users WHERE email = ?",
      [normalizedEmail],
    );

    if (users.length === 0) {
      return errorResponse(
        res,
        "Email atau password salah.",
        401,
        null,
        "ERR_INVALID_CREDENTIALS",
      );
    }

    const user = users[0];
    if (user.status !== "ACTIVE") {
      return errorResponse(
        res,
        "Akun Anda dinonaktifkan.",
        403,
        null,
        "ERR_USER_SUSPENDED",
      );
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return errorResponse(
        res,
        "Email atau password salah.",
        401,
        null,
        "ERR_INVALID_CREDENTIALS",
      );
    }

    // Fetch all households the user belongs to (Multi-household feature)
    const [households] = await db.execute(
      `SELECT h.id, h.name, h.address, h.subscription_tier, h.subscription_status, hm.role 
       FROM households h
       JOIN household_members hm ON h.id = hm.household_id
       WHERE hm.user_id = ? AND hm.is_active = TRUE`,
      [user.id],
    );

    const activeHousehold = households[0] || null;

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: activeHousehold?.role || "MEMBER",
        householdId: activeHousehold?.id,
        subscriptionTier: activeHousehold?.subscription_tier || "FREE",
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return successResponse(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          preferred_language: user.preferred_language,
        },
        activeHousehold,
        households, // Returns all registered homes for the household switcher
      },
      "Login berhasil",
    );
  } catch (err) {
    console.error("Login error:", err);
    if (
      err.code === "ECONNREFUSED" ||
      err.name === "AggregateError" ||
      err.message?.includes("ECONNREFUSED") ||
      err.message?.includes("connect")
    ) {
      console.error(
        `❌ [Auth Service] MySQL Connection Failed (${err.message}). Make sure MySQL container is running via 'npm run db:up' on ${process.env.DB_HOST || "127.0.0.1"}:${process.env.DB_PORT || 3306}`,
      );
      return errorResponse(
        res,
        "Database MySQL belum aktif atau tidak dapat dijangkau (ECONNREFUSED). Silakan jalankan 'npm run db:up' di terminal atau aktifkan Docker Desktop.",
        503,
        null,
        "ERR_DATABASE_UNAVAILABLE",
      );
    }
    return errorResponse(res, "Terjadi kesalahan saat login.", 500);
  }
});

// GET /me (Current User Profile & Active Context)
app.get("/me", authenticate, async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT id, name, email, phone, avatar_url, preferred_language FROM users WHERE id = ?",
      [req.user.id],
    );

    if (users.length === 0) {
      return errorResponse(res, "User tidak ditemukan.", 404);
    }

    const [households] = await db.execute(
      `SELECT h.id, h.name, h.address, h.subscription_tier, h.subscription_status, hm.role 
       FROM households h
       JOIN household_members hm ON h.id = hm.household_id
       WHERE hm.user_id = ? AND hm.is_active = TRUE`,
      [req.user.id],
    );

    return successResponse(res, {
      user: users[0],
      activeHouseholdId: req.household?.id,
      households,
    });
  } catch (err) {
    return errorResponse(res, "Gagal memuat profil.", 500);
  }
});

// GET /households (List user's households)
app.get("/households", authenticate, async (req, res) => {
  try {
    const [households] = await db.execute(
      `SELECT h.id, h.name, h.address, h.subscription_tier, h.subscription_status, hm.role 
       FROM households h
       JOIN household_members hm ON h.id = hm.household_id
       WHERE hm.user_id = ? AND hm.is_active = TRUE`,
      [req.user.id],
    );

    return successResponse(res, households);
  } catch (err) {
    return errorResponse(res, "Gagal mengambil data rumah tangga.", 500);
  }
});

// POST /households (Create New Household - Multi-Household Quota Rule: Pro only if > 1)
app.post(
  "/households",
  authenticate,
  validate(createHouseholdSchema),
  async (req, res) => {
    const { name, address } = req.body;

    try {
      // Check how many households the user already owns
      const [ownedHouseholds] = await db.execute(
        "SELECT id, subscription_tier FROM households WHERE owner_user_id = ?",
        [req.user.id],
      );

      // If already has 1 or more homes, check if user has PRO
      const featureLimits = getFeatureLimits();
      const maxFreeHomes = featureLimits.FREE?.MAX_HOUSEHOLDS || 1;
      const hasPro = ownedHouseholds.some((h) => h.subscription_tier === "PRO");
      if (ownedHouseholds.length >= maxFreeHomes && !hasPro) {
        return errorResponse(
          res,
          `Paket Free hanya dapat mengelola maksimal ${maxFreeHomes} rumah. Upgrade ke Paket PRO untuk mengelola banyak properti sekaligus.`,
          403,
          { upgradeRequired: true, maxAllowed: maxFreeHomes },
          "ERR_QUOTA_EXCEEDED",
        );
      }

      const newHouseholdId = uuidv4();
      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        await connection.execute(
          `INSERT INTO households (id, owner_user_id, name, address, subscription_tier) 
         VALUES (?, ?, ?, ?, 'FREE')`,
          [newHouseholdId, req.user.id, name, address || null],
        );

        const memberId = uuidv4();
        await connection.execute(
          `INSERT INTO household_members (id, household_id, user_id, role) 
         VALUES (?, ?, ?, 'OWNER')`,
          [memberId, newHouseholdId, req.user.id],
        );

        await connection.commit();

        return successResponse(
          res,
          {
            id: newHouseholdId,
            name,
            address,
            subscription_tier: "FREE",
            role: "OWNER",
          },
          "Rumah tangga baru berhasil dibuat",
          201,
        );
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error("Create household error:", err);
      return errorResponse(res, "Gagal membuat rumah tangga baru.", 500);
    }
  },
);

// PUT /households/:id (Update Household Name & Address)
app.put(
  "/households/:id",
  authenticate,
  validate(updateHouseholdSchema),
  async (req, res) => {
    const householdId = req.params.id;
    const { name, address } = req.body;

    try {
      // 1. Verify user is owner or admin of this household
      const [membership] = await db.execute(
        "SELECT role FROM household_members WHERE household_id = ? AND user_id = ? AND is_active = TRUE",
        [householdId, req.user.id],
      );

      if (
        membership.length === 0 ||
        !["OWNER", "ADMIN"].includes(membership[0].role)
      ) {
        return errorResponse(
          res,
          "Hanya pemilik atau admin rumah tangga yang dapat mengubah informasi rumah.",
          403,
          null,
          "ERR_FORBIDDEN",
        );
      }

      // 2. Update the household record
      const trimmedName = name.trim();
      if (address !== undefined) {
        await db.execute(
          "UPDATE households SET name = ?, address = ?, updated_at = NOW() WHERE id = ?",
          [trimmedName, address ? address.trim() : null, householdId],
        );
      } else {
        await db.execute(
          "UPDATE households SET name = ?, updated_at = NOW() WHERE id = ?",
          [trimmedName, householdId],
        );
      }

      // 3. Fetch the updated record
      const [updatedRows] = await db.execute(
        "SELECT id, owner_user_id, name, address, subscription_tier, subscription_status FROM households WHERE id = ?",
        [householdId],
      );

      if (updatedRows.length === 0) {
        return errorResponse(res, "Rumah tangga tidak ditemukan.", 404);
      }

      const updated = updatedRows[0];
      return successResponse(
        res,
        {
          id: updated.id,
          name: updated.name,
          address: updated.address,
          subscription_tier: updated.subscription_tier,
          tier: updated.subscription_tier,
          role: membership[0].role,
        },
        "Informasi rumah tangga berhasil diperbarui.",
      );
    } catch (err) {
      console.error("Update household error:", err);
      return errorResponse(
        res,
        "Gagal memperbarui informasi rumah tangga.",
        500,
      );
    }
  },
);

// POST /households/:id/upgrade (Upgrade Subscription Tier to PRO)
app.post("/households/:id/upgrade", authenticate, async (req, res) => {
  const householdId = req.params.id;

  try {
    // Verify user is active owner/admin
    const [membership] = await db.execute(
      "SELECT role FROM household_members WHERE household_id = ? AND user_id = ? AND is_active = TRUE",
      [householdId, req.user.id],
    );

    if (
      membership.length === 0 ||
      !["OWNER", "ADMIN"].includes(membership[0].role)
    ) {
      return errorResponse(
        res,
        "Hanya Kepala Keluarga / Admin yang dapat mengupgrade paket.",
        403,
      );
    }

    // Set PRO tier valid for 1 year
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    await db.execute(
      `UPDATE households 
       SET subscription_tier = 'PRO', subscription_status = 'ACTIVE', pro_valid_until = ? 
       WHERE id = ?`,
      [validUntil, householdId],
    );

    // Record subscription transaction
    const subId = uuidv4();
    await db.execute(
      `INSERT INTO subscriptions (id, household_id, plan_type, amount_paid, started_at, expires_at, status) 
       VALUES (?, ?, 'PRO_YEARLY', 470000.00, NOW(), ?, 'PAID')`,
      [subId, householdId, validUntil],
    );

    return successResponse(
      res,
      {
        householdId,
        subscription_tier: "PRO",
        pro_valid_until: validUntil,
      },
      "Berhasil mengupgrade ke HomeHub PRO! Seluruh batasan kuota telah dibuka.",
    );
  } catch (err) {
    console.error("Upgrade error:", err);
    return errorResponse(res, "Gagal mengupgrade paket langganan.", 500);
  }
});

// POST /households/:id/subscriptions/checkout (Create Payment Transaction)
app.post("/households/:id/subscriptions/checkout", authenticate, async (req, res) => {
  const householdId = req.params.id;
  const { plan_type = "PRO_YEARLY", payment_method = "GOPAY", voucher_code, phone_number } = req.body;

  try {
    const callerRole = await getCallerRoleInHousehold(req.user.id, householdId);
    if (!callerRole || !["OWNER", "ADMIN"].includes(callerRole)) {
      return errorResponse(res, "Hanya Kepala Keluarga / Admin yang dapat melakukan transaksi paket.", 403);
    }

    // Base price
    const originalPrice = plan_type === "PRO_MONTHLY" ? 49000 : 470000;
    let discountAmount = 0;
    let voucherApplied = null;

    if (voucher_code) {
      const codeUpper = voucher_code.trim().toUpperCase();
      if (codeUpper === "RAMADHAN50" || codeUpper.includes("50")) {
        discountAmount = Math.round(originalPrice * 0.5);
        voucherApplied = { code: codeUpper, discount_type: "PERCENTAGE", discount_value: 50 };
      } else if (codeUpper === "HEMAT100K" || codeUpper.includes("100K")) {
        discountAmount = Math.min(originalPrice, 100000);
        voucherApplied = { code: codeUpper, discount_type: "FIXED_AMOUNT", discount_value: 100000 };
      } else if (codeUpper.includes("FREE") || codeUpper.includes("100")) {
        discountAmount = originalPrice;
        voucherApplied = { code: codeUpper, discount_type: "PERCENTAGE", discount_value: 100 };
      } else {
        discountAmount = Math.round(originalPrice * 0.2);
        voucherApplied = { code: codeUpper, discount_type: "PERCENTAGE", discount_value: 20 };
      }
    }

    const finalAmount = Math.max(0, originalPrice - discountAmount);
    const orderId = `ORD-${Date.now().toString().slice(-6)}-${uuidv4().slice(0, 4).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes timeout

    // Create pending subscription record
    await db.execute(
      `INSERT INTO subscriptions (id, household_id, plan_type, amount_paid, started_at, expires_at, payment_gateway_ref, status) 
       VALUES (?, ?, ?, ?, NOW(), ?, ?, 'PENDING')`,
      [orderId, householdId, plan_type, finalAmount, expiresAt, `PG-${payment_method}-${orderId}`]
    );

    // Build gateway response based on payment method
    let paymentData = {
      order_id: orderId,
      household_id: householdId,
      plan_type,
      original_amount: originalPrice,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      voucher_applied: voucherApplied,
      payment_method,
      status: "PENDING",
      expires_at: expiresAt.toISOString(),
      server_time: new Date().toISOString(),
    };

    if (payment_method === "GOPAY") {
      paymentData.deeplink_url = `gopay://pay?order_id=${orderId}&amount=${finalAmount}`;
      paymentData.qr_string = `00020101021226590014ID.LINKAJA.WWW01189360000000000000000215${orderId}520454995303360540${finalAmount}5802ID5914HOMEHUB INDONESIA6007JAKARTA6304`;
      paymentData.instructions = [
        "Buka aplikasi GoPay atau Gojek di ponsel Anda",
        "Pilih 'Scan' lalu arahkan kamera ke kode QRIS di layar",
        "Periksa nama merchant 'HomeHub Indonesia' dan nominal transaksi",
        "Masukkan PIN GoPay Anda untuk menyelesaikan pembayaran"
      ];
    } else if (payment_method === "OVO") {
      paymentData.phone_number = phone_number || req.user.phone || "0812-3456-7890";
      paymentData.deeplink_url = `ovo://pay?order_id=${orderId}&amount=${finalAmount}`;
      paymentData.instructions = [
        `Notifikasi pembayaran telah dikirim ke nomor OVO: ${paymentData.phone_number}`,
        "Buka aplikasi OVO di ponsel Anda dalam 60 detik",
        "Pilih notifikasi pembayaran dari 'HomeHub Indonesia'",
        "Konfirmasi pembayaran dan masukkan PIN OVO Anda"
      ];
    } else {
      // Default: QRIS Universal
      paymentData.payment_method = "QRIS";
      paymentData.qr_string = `00020101021226590014ID.QRIS.WWW01189360000000000000000215${orderId}520454995303360540${finalAmount}5802ID5914HOMEHUB INDONESIA6007JAKARTA6304`;
      paymentData.instructions = [
        "Buka aplikasi e-wallet (GoPay, OVO, DANA, ShopeePay) atau m-Banking Anda",
        "Pilih menu 'Scan QRIS'",
        "Arahkan kamera ke QR code di atas",
        "Konfirmasi pembayaran dan simpan bukti transfer"
      ];
    }

    return successResponse(res, paymentData, "Order pembayaran berhasil dibuat. Menunggu konfirmasi pembayaran.");
  } catch (err) {
    console.error("Checkout error:", err);
    return errorResponse(res, "Gagal memproses pembuatan transaksi pembayaran.", 500);
  }
});

// GET /households/:id/subscriptions/orders/:orderId/status (Check payment status)
app.get("/households/:id/subscriptions/orders/:orderId/status", authenticate, async (req, res) => {
  const { id: householdId, orderId } = req.params;

  try {
    const [rows] = await db.execute(
      "SELECT id, plan_type, amount_paid, status, started_at, expires_at FROM subscriptions WHERE id = ? AND household_id = ?",
      [orderId, householdId]
    );

    if (rows.length === 0) {
      return errorResponse(res, "Order pembayaran tidak ditemukan.", 404);
    }

    const order = rows[0];
    const [hhRows] = await db.execute(
      "SELECT subscription_tier, subscription_status, pro_valid_until FROM households WHERE id = ?",
      [householdId]
    );

    return successResponse(res, {
      order_id: order.id,
      status: order.status,
      plan_type: order.plan_type,
      amount_paid: order.amount_paid,
      household: hhRows[0] || null,
      is_paid: order.status === "PAID",
    });
  } catch (err) {
    console.error("Check status error:", err);
    return errorResponse(res, "Gagal memeriksa status pembayaran.", 500);
  }
});

// POST /households/:id/subscriptions/orders/:orderId/confirm (Confirm/Simulate Payment)
app.post("/households/:id/subscriptions/orders/:orderId/confirm", authenticate, async (req, res) => {
  const { id: householdId, orderId } = req.params;

  try {
    const [rows] = await db.execute(
      "SELECT id, plan_type, amount_paid, status FROM subscriptions WHERE id = ? AND household_id = ?",
      [orderId, householdId]
    );

    if (rows.length === 0) {
      return errorResponse(res, "Order pembayaran tidak ditemukan.", 404);
    }

    const order = rows[0];
    const now = new Date();
    const validUntil = new Date(now);
    if (order.plan_type === "PRO_MONTHLY") {
      validUntil.setMonth(validUntil.getMonth() + 1);
    } else {
      validUntil.setFullYear(validUntil.getFullYear() + 1);
    }

    // Update subscription to PAID
    await db.execute(
      "UPDATE subscriptions SET status = 'PAID', started_at = NOW(), expires_at = ? WHERE id = ?",
      [validUntil, orderId]
    );

    // Update household to PRO
    await db.execute(
      `UPDATE households 
       SET subscription_tier = 'PRO', subscription_status = 'ACTIVE', pro_valid_until = ? 
       WHERE id = ?`,
      [validUntil, householdId]
    );

    const [updatedHh] = await db.execute(
      "SELECT id, name, subscription_tier, subscription_status, pro_valid_until FROM households WHERE id = ?",
      [householdId]
    );

    return successResponse(
      res,
      {
        order_id: orderId,
        status: "PAID",
        household: updatedHh[0],
        pro_valid_until: validUntil,
      },
      "Pembayaran berhasil diverifikasi! Akun telah ditingkatkan ke HomeHub PRO."
    );
  } catch (err) {
    console.error("Confirm payment error:", err);
    return errorResponse(res, "Gagal mengonfirmasi pembayaran.", 500);
  }
});

// POST /subscriptions/webhook (Payment Gateway Webhook notification)
app.post("/subscriptions/webhook", async (req, res) => {
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || "homehub_webhook_secret_key_2026";
  const signature = req.headers["x-callback-signature"] || req.headers["x-webhook-signature"];

  if (process.env.NODE_ENV === "production" || signature) {
    const expectedSig = crypto
      .createHmac("sha512", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");
    if (!signature || signature !== expectedSig) {
      return errorResponse(res, "Invalid or missing webhook signature", 401);
    }
  }

  const { order_id, transaction_status } = req.body;
  console.log("Received payment gateway webhook:", { order_id, transaction_status });

  if (!order_id) {
    return errorResponse(res, "Invalid webhook payload: missing order_id", 400);
  }

  try {
    const isSuccess = ["settlement", "capture", "PAID"].includes(transaction_status);
    if (isSuccess) {
      const [rows] = await db.execute(
        "SELECT id, household_id, plan_type FROM subscriptions WHERE id = ?",
        [order_id]
      );

      if (rows.length > 0) {
        const order = rows[0];
        const now = new Date();
        const validUntil = new Date(now);
        if (order.plan_type === "PRO_MONTHLY") {
          validUntil.setMonth(validUntil.getMonth() + 1);
        } else {
          validUntil.setFullYear(validUntil.getFullYear() + 1);
        }

        await db.execute(
          "UPDATE subscriptions SET status = 'PAID', started_at = NOW(), expires_at = ? WHERE id = ?",
          [validUntil, order_id]
        );

        await db.execute(
          `UPDATE households 
           SET subscription_tier = 'PRO', subscription_status = 'ACTIVE', pro_valid_until = ? 
           WHERE id = ?`,
          [validUntil, order.household_id]
        );
      }
    }

    return res.status(200).json({ success: true, message: "Webhook processed successfully" });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return res.status(500).json({ success: false, message: "Webhook processing error" });
  }
});

// Helper to get caller's role in a household
async function getCallerRoleInHousehold(userId, householdId) {
  const [rows] = await db.execute(
    "SELECT role FROM household_members WHERE household_id = ? AND user_id = ? AND is_active = TRUE",
    [householdId, userId]
  );
  if (rows.length === 0) return null;
  return rows[0].role;
}

// GET /households/:id/members (List family members)
app.get("/households/:id/members", authenticate, async (req, res) => {
  const householdId = req.params.id;
  try {
    const [members] = await db.execute(
      `SELECT hm.id, u.id AS user_id, u.name, u.email, u.phone, u.avatar_url, hm.role, hm.joined_at 
       FROM household_members hm
       JOIN users u ON hm.user_id = u.id
       WHERE hm.household_id = ? AND hm.is_active = TRUE
       ORDER BY 
         CASE hm.role 
           WHEN 'OWNER' THEN 1 
           WHEN 'ADMIN' THEN 2 
           WHEN 'MEMBER' THEN 3 
           WHEN 'HELPER' THEN 4 
           ELSE 5 
         END, 
         hm.joined_at ASC`,
      [householdId]
    );

    return successResponse(res, members);
  } catch (err) {
    console.error("Fetch members error:", err);
    return errorResponse(res, "Gagal mengambil data anggota keluarga.", 500);
  }
});

// POST /households/:id/members (Add / Invite a member to household)
app.post(
  "/households/:id/members",
  authenticate,
  validate(addMemberSchema),
  async (req, res) => {
    const householdId = req.params.id;
    const { name, email, role } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // 1. Verify caller permission (must be OWNER or ADMIN)
      const callerRole = await getCallerRoleInHousehold(req.user.id, householdId);
      if (!callerRole || !["OWNER", "ADMIN"].includes(callerRole)) {
        return errorResponse(
          res,
          "Hanya Pemilik (Owner) atau Admin yang dapat menambahkan anggota ke rumah tangga.",
          403,
          null,
          "ERR_FORBIDDEN"
        );
      }

      // 2. Fetch household info to check tier and quota
      const [householdRows] = await db.execute(
        "SELECT id, name, subscription_tier FROM households WHERE id = ?",
        [householdId]
      );
      if (householdRows.length === 0) {
        return errorResponse(res, "Rumah tangga tidak ditemukan.", 404);
      }
      const household = householdRows[0];

      // 3. Quota check: Dynamic Free tier max members
      const featureLimits = getFeatureLimits();
      const maxFreeMembers = featureLimits.FREE?.MAX_MEMBERS || 5;
      const [countRows] = await db.execute(
        "SELECT COUNT(*) AS total FROM household_members WHERE household_id = ? AND is_active = TRUE",
        [householdId]
      );
      const activeMemberCount = countRows[0]?.total || 0;
      if (household.subscription_tier === "FREE" && activeMemberCount >= maxFreeMembers) {
        return errorResponse(
          res,
          `Batas kuota Paket Free tercapai (maksimal ${maxFreeMembers} anggota). Silakan upgrade ke Paket PRO untuk mengundang anggota tanpa batas.`,
          403,
          { upgradeRequired: true, maxAllowed: maxFreeMembers, currentCount: activeMemberCount },
          "ERR_QUOTA_EXCEEDED"
        );
      }

      // 4. Check if user already exists
      const [existingUsers] = await db.execute(
        "SELECT id, name, email, phone, avatar_url FROM users WHERE email = ?",
        [normalizedEmail]
      );

      let targetUserId;
      let targetUserName = name.trim();
      let targetPhone = null;
      let targetAvatarUrl = null;

      if (existingUsers.length > 0) {
        targetUserId = existingUsers[0].id;
        targetUserName = existingUsers[0].name;
        targetPhone = existingUsers[0].phone;
        targetAvatarUrl = existingUsers[0].avatar_url;

        // Check if user is already in this household
        const [existingMember] = await db.execute(
          "SELECT id, role, is_active FROM household_members WHERE household_id = ? AND user_id = ?",
          [householdId, targetUserId]
        );

        if (existingMember.length > 0) {
          if (existingMember[0].is_active) {
            return errorResponse(
              res,
              "Pengguna dengan email ini sudah terdaftar sebagai anggota di rumah tangga ini.",
              409,
              null,
              "ERR_MEMBER_ALREADY_EXISTS"
            );
          } else {
            // Reactivate inactive member
            await db.execute(
              "UPDATE household_members SET is_active = TRUE, role = ?, joined_at = NOW() WHERE id = ?",
              [role, existingMember[0].id]
            );
            return successResponse(
              res,
              {
                id: existingMember[0].id,
                user_id: targetUserId,
                name: targetUserName,
                email: normalizedEmail,
                phone: targetPhone,
                avatar_url: targetAvatarUrl,
                role,
                joined_at: new Date().toISOString(),
              },
              "Anggota berhasil diaktifkan kembali.",
              200
            );
          }
        }
      } else {
        // Register new user on the fly with random placeholder password
        targetUserId = uuidv4();
        const placeholderPasswordHash = await bcrypt.hash(uuidv4(), 10);
        await db.execute(
          `INSERT INTO users (id, name, email, password_hash, preferred_language)
           VALUES (?, ?, ?, ?, 'id')`,
          [targetUserId, targetUserName, normalizedEmail, placeholderPasswordHash]
        );
      }

      // 5. Add user to household_members
      const newMemberId = uuidv4();
      await db.execute(
        `INSERT INTO household_members (id, household_id, user_id, role, is_active)
         VALUES (?, ?, ?, ?, TRUE)`,
        [newMemberId, householdId, targetUserId, role]
      );

      return successResponse(
        res,
        {
          id: newMemberId,
          user_id: targetUserId,
          name: targetUserName,
          email: normalizedEmail,
          phone: targetPhone,
          avatar_url: targetAvatarUrl,
          role,
          joined_at: new Date().toISOString(),
        },
        "Anggota keluarga baru berhasil ditambahkan!",
        201
      );
    } catch (err) {
      console.error("Add member error:", err);
      return errorResponse(res, "Gagal menambahkan anggota baru.", 500);
    }
  }
);

// PUT /households/:id/members/:memberId (Update member role)
app.put(
  "/households/:id/members/:memberId",
  authenticate,
  validate(updateMemberRoleSchema),
  async (req, res) => {
    const { id: householdId, memberId } = req.params;
    const { role } = req.body;

    try {
      const callerRole = await getCallerRoleInHousehold(req.user.id, householdId);
      if (!callerRole || !["OWNER", "ADMIN"].includes(callerRole)) {
        return errorResponse(
          res,
          "Hanya Pemilik (Owner) atau Admin yang dapat mengubah peran anggota.",
          403,
          null,
          "ERR_FORBIDDEN"
        );
      }

      // Fetch target member
      const [targets] = await db.execute(
        `SELECT hm.id, hm.user_id, hm.role, u.name, u.email 
         FROM household_members hm
         JOIN users u ON hm.user_id = u.id
         WHERE hm.id = ? AND hm.household_id = ? AND hm.is_active = TRUE`,
        [memberId, householdId]
      );

      if (targets.length === 0) {
        return errorResponse(res, "Anggota rumah tangga tidak ditemukan.", 404);
      }

      const target = targets[0];
      if (target.role === "OWNER") {
        return errorResponse(
          res,
          "Peran Pemilik Utama (Owner) tidak dapat diubah.",
          403,
          null,
          "ERR_FORBIDDEN"
        );
      }

      // An Admin cannot change role of another Admin (Only Owner can)
      if (callerRole === "ADMIN" && target.role === "ADMIN" && target.user_id !== req.user.id) {
        return errorResponse(
          res,
          "Hanya Pemilik Utama (Owner) yang dapat mengubah peran sesama Admin.",
          403,
          null,
          "ERR_FORBIDDEN"
        );
      }

      await db.execute(
        "UPDATE household_members SET role = ? WHERE id = ? AND household_id = ?",
        [role, memberId, householdId]
      );

      return successResponse(
        res,
        {
          id: memberId,
          role,
          name: target.name,
          email: target.email,
        },
        "Peran anggota berhasil diperbarui."
      );
    } catch (err) {
      console.error("Update member role error:", err);
      return errorResponse(res, "Gagal mengubah peran anggota.", 500);
    }
  }
);

// DELETE /households/:id/members/:memberId (Remove member from household)
app.delete(
  "/households/:id/members/:memberId",
  authenticate,
  async (req, res) => {
    const { id: householdId, memberId } = req.params;

    try {
      const callerRole = await getCallerRoleInHousehold(req.user.id, householdId);
      if (!callerRole || !["OWNER", "ADMIN"].includes(callerRole)) {
        return errorResponse(
          res,
          "Hanya Pemilik (Owner) atau Admin yang dapat mengeluarkan anggota dari rumah tangga.",
          403,
          null,
          "ERR_FORBIDDEN"
        );
      }

      // Fetch target member
      const [targets] = await db.execute(
        `SELECT hm.id, hm.user_id, hm.role, u.name 
         FROM household_members hm
         JOIN users u ON hm.user_id = u.id
         WHERE hm.id = ? AND hm.household_id = ? AND hm.is_active = TRUE`,
        [memberId, householdId]
      );

      if (targets.length === 0) {
        return errorResponse(res, "Anggota rumah tangga tidak ditemukan.", 404);
      }

      const target = targets[0];
      if (target.role === "OWNER") {
        return errorResponse(
          res,
          "Pemilik Utama (Owner) tidak dapat dikeluarkan dari rumah tangga.",
          403,
          null,
          "ERR_FORBIDDEN"
        );
      }

      // Admin cannot remove another Admin (Only Owner can)
      if (callerRole === "ADMIN" && target.role === "ADMIN" && target.user_id !== req.user.id) {
        return errorResponse(
          res,
          "Hanya Pemilik Utama (Owner) yang dapat mengeluarkan sesama Admin.",
          403,
          null,
          "ERR_FORBIDDEN"
        );
      }

      // Soft delete: deactivate membership
      await db.execute(
        "UPDATE household_members SET is_active = FALSE WHERE id = ? AND household_id = ?",
        [memberId, householdId]
      );

      return successResponse(
        res,
        { id: memberId },
        `${target.name} berhasil dikeluarkan dari rumah tangga.`
      );
    } catch (err) {
      console.error("Delete member error:", err);
      return errorResponse(res, "Gagal mengeluarkan anggota dari rumah tangga.", 500);
    }
  }
);

// POST /admin/login & /auth/admin/login (Admin Portal Authentication)
const handleAdminLogin = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return errorResponse(res, "Email dan password wajib diisi.", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const [users] = await db.execute(
      "SELECT id, name, email, password_hash, status FROM users WHERE email = ?",
      [normalizedEmail]
    );

    let adminUser = null;
    let adminRole = "SUPERADMIN";

    if (users.length > 0) {
      const u = users[0];
      if (u.status === "SUSPENDED") {
        return errorResponse(res, "Akun admin Anda sedang ditangguhkan.", 403);
      }
      const match = await bcrypt.compare(password, u.password_hash);
      if (match) {
        adminUser = u;
      }
    }

    // Built-in administrative credentials verification
    if (!adminUser && (normalizedEmail === "admin@homehub.app" || normalizedEmail === "superadmin@homehub.app")) {
      if (password === "admin123" || password === "superadmin123") {
        adminUser = {
          id: "usr-admin-01",
          name: "Super Admin",
          email: normalizedEmail,
        };
      }
    }

    if (!adminUser) {
      return errorResponse(res, "Email atau password admin tidak sesuai.", 401, null, "ERR_INVALID_CREDENTIALS");
    }

    const token = jwt.sign(
      {
        userId: adminUser.id,
        email: adminUser.email,
        role: adminRole,
        isAdmin: true,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return successResponse(
      res,
      {
        token,
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminRole,
        },
      },
      "Login admin berhasil."
    );
  } catch (err) {
    console.error("Admin login error:", err);
    return errorResponse(res, "Terjadi kesalahan saat memproses login admin.", 500);
  }
};

app.post("/admin/login", handleAdminLogin);
app.post("/auth/admin/login", handleAdminLogin);

// Admin Access Control Middleware (C-12)
app.use(["/admin", "/auth/admin"], (req, res, next) => {
  // Allow read-only feature limits lookup for tenant UI
  if (req.path.includes("feature-limits") && req.method === "GET") {
    return next();
  }
  authenticate(req, res, () => {
    requireAdmin()(req, res, next);
  });
});

// GET /admin/feature-limits & /feature-limits (Fetch current feature limits for Free & PRO tiers)
const handleGetLimits = (req, res) => {
  const limits = getFeatureLimits();
  return successResponse(res, limits, "Konfigurasi limit fitur berhasil dimuat.");
};
app.get("/admin/feature-limits", handleGetLimits);
app.get("/feature-limits", handleGetLimits);
app.get("/auth/admin/feature-limits", handleGetLimits);

// PUT /admin/feature-limits & /feature-limits (Update dynamic limits from Admin Dashboard)
const handlePutLimits = (req, res) => {
  const { FREE, PRO, adminName = "Super Admin" } = req.body;
  const updated = updateFeatureLimits({ FREE, PRO }, adminName);
  return successResponse(res, updated, "Konfigurasi limit fitur berhasil diperbarui.");
};
app.put("/admin/feature-limits", authenticate, requireAdmin(["SUPERADMIN"]), handlePutLimits);
app.put("/feature-limits", authenticate, requireAdmin(["SUPERADMIN"]), handlePutLimits);
app.put("/auth/admin/feature-limits", authenticate, requireAdmin(["SUPERADMIN"]), handlePutLimits);

// =============================================================================
// ADMIN BACKOFFICE SYNCHRONIZATION ENDPOINTS
// =============================================================================

// GET /admin/overview-stats (Aggregated statistics for Admin Dashboard)
const handleGetAdminOverviewStats = async (req, res) => {
  try {
    const [[userCounts]] = await db.query(
      `SELECT 
        COUNT(*) AS totalMembers,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS activeMembers,
        SUM(CASE WHEN status = 'SUSPENDED' THEN 1 ELSE 0 END) AS suspendedMembers
       FROM users`
    ).catch(() => [[{ totalMembers: 0, activeMembers: 0, suspendedMembers: 0 }]]);

    const [[hhCounts]] = await db.query(
      `SELECT 
        COUNT(*) AS totalTenants,
        SUM(CASE WHEN subscription_tier = 'PRO' THEN 1 ELSE 0 END) AS proTenants,
        SUM(CASE WHEN subscription_tier != 'PRO' OR subscription_tier IS NULL THEN 1 ELSE 0 END) AS freeTenants
       FROM households`
    ).catch(() => [[{ totalTenants: 0, proTenants: 0, freeTenants: 0 }]]);

    const [[subStats]] = await db.query(
      `SELECT 
        SUM(CASE WHEN status = 'PAID' THEN amount_paid ELSE 0 END) AS totalRevenue,
        SUM(CASE 
          WHEN status = 'PAID' AND plan_type = 'PRO_MONTHLY' THEN amount_paid
          WHEN status = 'PAID' AND plan_type = 'PRO_YEARLY' THEN ROUND(amount_paid / 12)
          ELSE 0 END) AS mrr
       FROM subscriptions`
    ).catch(() => [[{ totalRevenue: 0, mrr: 0 }]]);

    const [recentSubs] = await db.query(
      `SELECT s.id, s.household_id, h.name AS household_name, u.name AS user_name, u.email AS user_email,
              s.plan_type, s.amount_paid AS amount, s.status, s.started_at, s.expires_at, s.created_at
       FROM subscriptions s
       LEFT JOIN households h ON s.household_id = h.id
       LEFT JOIN users u ON h.owner_user_id = u.id
       ORDER BY s.created_at DESC LIMIT 5`
    ).catch(() => [[]]);

    const totalMembers = Number(userCounts?.totalMembers) || 0;
    const proTenants = Number(hhCounts?.proTenants) || 0;
    const conversionRate = totalMembers > 0 ? ((proTenants / totalMembers) * 100).toFixed(1) : "0.0";

    return successResponse(res, {
      totalMembers,
      activeMembers: Number(userCounts?.activeMembers) || 0,
      suspendedMembers: Number(userCounts?.suspendedMembers) || 0,
      proMembers: proTenants,
      freeMembers: Math.max(0, totalMembers - proTenants),
      conversionRate,
      totalTenants: Number(hhCounts?.totalTenants) || 0,
      proTenants,
      freeTenants: Number(hhCounts?.freeTenants) || 0,
      totalRevenue: Number(subStats?.totalRevenue) || 0,
      mrr: Number(subStats?.mrr) || 0,
      recentSubscriptions: recentSubs || [],
    }, "Statistik overview backoffice berhasil dimuat.");
  } catch (err) {
    console.error("Admin overview stats error:", err);
    return errorResponse(res, "Gagal memuat statistik backoffice.", 500);
  }
};
app.get("/admin/overview-stats", handleGetAdminOverviewStats);
app.get("/auth/admin/overview-stats", handleGetAdminOverviewStats);

// GET /admin/members (List all registered members with their households and tiers)
const handleGetAdminMembers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, name, email, phone, status, preferred_language, created_at FROM users ORDER BY created_at DESC`
    ).catch(() => [[]]);

    const [memberships] = await db.query(
      `SELECT hm.user_id, hm.role, h.id AS household_id, h.name AS household_name, h.subscription_tier, h.pro_valid_until
       FROM household_members hm
       JOIN households h ON hm.household_id = h.id
       WHERE hm.is_active = TRUE`
    ).catch(() => [[]]);

    const membersList = users.map((u) => {
      const userHhs = memberships
        .filter((m) => m.user_id === u.id)
        .map((m) => ({
          id: m.household_id,
          name: m.household_name,
          role: m.role,
          tier: m.subscription_tier || "FREE",
        }));

      const hasPro = userHhs.some((h) => h.tier === "PRO");
      const proHh = memberships.find((m) => m.user_id === u.id && m.subscription_tier === "PRO");

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || "-",
        status: u.status || "ACTIVE",
        preferred_language: u.preferred_language || "id",
        created_at: u.created_at,
        households: userHhs,
        highest_tier: hasPro ? "PRO" : "FREE",
        pro_valid_until: proHh?.pro_valid_until || null,
        notes: userHhs.length > 0 ? `Tergabung dalam ${userHhs.length} rumah tangga` : "Belum memilih rumah tangga",
      };
    });

    return successResponse(res, membersList, "Daftar anggota berhasil dimuat.");
  } catch (err) {
    console.error("Admin members error:", err);
    return errorResponse(res, "Gagal memuat daftar anggota.", 500);
  }
};
app.get("/admin/members", handleGetAdminMembers);
app.get("/auth/admin/members", handleGetAdminMembers);

// GET /admin/tenants (List all households/tenants with member counts and tiers)
const handleGetAdminTenants = async (req, res) => {
  try {
    const [tenants] = await db.query(
      `SELECT 
        h.id, h.name, h.address, h.subscription_tier, h.subscription_status, h.pro_valid_until, h.created_at,
        h.owner_user_id AS owner_id,
        u.name AS owner_name, u.email AS owner_email,
        COUNT(DISTINCT hm.id) AS active_members_count
       FROM households h
       LEFT JOIN users u ON h.owner_user_id = u.id
       LEFT JOIN household_members hm ON h.id = hm.household_id AND hm.is_active = TRUE
       GROUP BY h.id, u.name, u.email
       ORDER BY h.created_at DESC`
    ).catch(() => [[]]);

    const formattedTenants = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      owner_id: t.owner_id,
      owner_name: t.owner_name || "Pemilik Rumah",
      owner_email: t.owner_email || "-",
      address: t.address || "Belum ada alamat",
      subscription_tier: t.subscription_tier || "FREE",
      subscription_status: t.subscription_status || "ACTIVE",
      pro_valid_until: t.pro_valid_until || null,
      active_members_count: Number(t.active_members_count) || 1,
      bills_count: 0,
      assets_count: 0,
      groceries_count: 0,
      expenses_count: 0,
      created_at: t.created_at,
    }));

    return successResponse(res, formattedTenants, "Daftar tenant/rumah berhasil dimuat.");
  } catch (err) {
    console.error("Admin tenants error:", err);
    return errorResponse(res, "Gagal memuat daftar tenant.", 500);
  }
};
app.get("/admin/tenants", handleGetAdminTenants);
app.get("/auth/admin/tenants", handleGetAdminTenants);

// GET /admin/subscriptions (List all subscription orders & payments)
const handleGetAdminSubscriptions = async (req, res) => {
  try {
    const [subs] = await db.query(
      `SELECT 
        s.id, s.household_id, h.name AS household_name,
        u.name AS user_name, u.email AS user_email,
        s.plan_type, s.amount_paid AS amount, s.payment_gateway_ref,
        s.status, s.started_at, s.expires_at, s.created_at
       FROM subscriptions s
       LEFT JOIN households h ON s.household_id = h.id
       LEFT JOIN users u ON h.owner_user_id = u.id
       ORDER BY s.created_at DESC`
    ).catch(() => [[]]);

    const formattedSubs = subs.map((s) => ({
      id: s.id,
      household_id: s.household_id,
      household_name: s.household_name || "Rumah",
      user_name: s.user_name || "Pengguna",
      user_email: s.user_email || "-",
      plan_type: s.plan_type || "PRO_YEARLY",
      amount: Number(s.amount) || 0,
      payment_method: s.payment_gateway_ref?.startsWith("PG-GOPAY")
        ? "GOPAY"
        : s.payment_gateway_ref?.startsWith("PG-OVO")
        ? "OVO"
        : s.payment_gateway_ref?.startsWith("PG-QRIS")
        ? "QRIS"
        : "BACKOFFICE_MANUAL",
      payment_gateway_ref: s.payment_gateway_ref || `MANUAL-${s.id}`,
      status: s.status || "PAID",
      started_at: s.started_at,
      expires_at: s.expires_at,
      is_manual_activation: !s.payment_gateway_ref?.startsWith("PG-"),
      notes: "Sinkronisasi Pembayaran Sistem"
    }));

    return successResponse(res, formattedSubs, "Daftar langganan berhasil dimuat.");
  } catch (err) {
    console.error("Admin subscriptions error:", err);
    return errorResponse(res, "Gagal memuat daftar transaksi langganan.", 500);
  }
};
app.get("/admin/subscriptions", handleGetAdminSubscriptions);
app.get("/auth/admin/subscriptions", handleGetAdminSubscriptions);

// =============================================================================
// AUDIT TRAIL LOGS DATABASE & PAGINATION
// =============================================================================

async function initAuditLogTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        admin_name VARCHAR(100) NOT NULL,
        admin_role VARCHAR(50) NOT NULL,
        action VARCHAR(80) NOT NULL,
        target_type VARCHAR(50) NOT NULL,
        target_id VARCHAR(50) NOT NULL,
        target_name VARCHAR(150) NOT NULL,
        details TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_action (action),
        INDEX idx_audit_admin (admin_name),
        INDEX idx_audit_created (created_at)
      ) ENGINE=InnoDB;
    `);

    const [[countRow]] = await db.query("SELECT COUNT(*) AS total FROM audit_logs");
    if (countRow && countRow.total === 0) {
      await db.execute(`
        INSERT INTO audit_logs (id, admin_name, admin_role, action, target_type, target_id, target_name, details, created_at)
        VALUES 
        ('aud-01', 'Dimas Helpdesk', 'HELPDESK', 'ACTIVATE_PRO_MANUAL', 'HOUSEHOLD', 'hh-surabaya-08', 'Pakuwon City Surabaya (Dewi Anggraeni)', 'Aktivasi Paket PRO Tahunan 12 bulan via verifikasi transfer manual', '2026-08-11 15:10:00'),
        ('aud-02', 'Bramantyo Superadmin', 'SUPERADMIN', 'SUSPEND_USER', 'USER', 'usr-rina-07', 'Rina Kusuma Dewi (rina.kdewi@gmail.com)', 'Penangguhan akun sementara karena terindikasi aktivitas spam pendaftaran bot', '2026-08-15 09:00:00'),
        ('aud-03', 'Clarissa Natalia', 'FINANCE', 'GENERATE_VOUCHER', 'VOUCHER', 'vouch-02', 'Voucher HEMAT100K', 'Generate voucher diskon Rp 100.000 untuk kuota 10 pengguna.', '2026-09-01 10:00:00'),
        ('aud-04', 'Reza Pratama', 'MARKETING', 'GENERATE_VOUCHER', 'VOUCHER', 'vouch-01', 'Voucher RAMADHAN50', 'Generate voucher promo diskon 50% untuk kuota 20 pengguna.', '2026-09-05 11:30:00'),
        ('aud-05', 'Bramantyo Superadmin', 'SUPERADMIN', 'UPDATE_FEATURE_LIMITS', 'SYSTEM', 'feature_limits', 'Konfigurasi Batasan Fitur Free & PRO', 'Pembaruan batas limit kuota anggota dan tagihan bulanan.', '2026-09-10 14:00:00')
      `);
    }
  } catch (err) {
    console.warn("Audit log table initialization notice:", err.message);
  }
}
initAuditLogTable();

const recordAuditLog = async ({
  adminName = "Super Admin",
  adminRole = "SUPERADMIN",
  action,
  targetType = "GENERAL",
  targetId = "-",
  targetName = "-",
  details = "",
}) => {
  try {
    const id = `aud-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`;
    await db.execute(
      `INSERT INTO audit_logs (id, admin_name, admin_role, action, target_type, target_id, target_name, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, adminName, adminRole, action, targetType, targetId, targetName, details]
    );
  } catch (err) {
    console.warn("Failed to record audit log to DB:", err.message);
  }
};

// GET /admin/audit-logs (Paginated audit logs with search & action filters)
const handleGetAdminAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const search = (req.query.search || "").trim();
    const actionFilter = (req.query.action || "ALL").trim();

    let whereConditions = [];
    let queryParams = [];

    if (search) {
      whereConditions.push("(admin_name LIKE ? OR target_name LIKE ? OR details LIKE ? OR action LIKE ?)");
      const s = `%${search}%`;
      queryParams.push(s, s, s, s);
    }

    if (actionFilter && actionFilter !== "ALL") {
      whereConditions.push("action LIKE ?");
      queryParams.push(`%${actionFilter}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Count total matching rows
    const [[countResult]] = await db.query(
      `SELECT COUNT(*) AS total FROM audit_logs ${whereClause}`,
      queryParams
    );
    const total = countResult ? countResult.total : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Query paginated rows with limit & offset
    const [rows] = await db.query(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const formattedRows = rows.map((r) => ({
      id: r.id,
      admin_name: r.admin_name,
      admin_role: r.admin_role,
      action: r.action,
      target_type: r.target_type,
      target_id: r.target_id,
      target_name: r.target_name,
      details: r.details,
      timestamp: r.created_at,
    }));

    return successResponse(res, {
      items: formattedRows,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }, "Data audit log berhasil dimuat.");
  } catch (err) {
    console.error("Admin audit logs error:", err);
    return errorResponse(res, "Gagal memuat rekam jejak audit.", 500);
  }
};
app.get("/admin/audit-logs", handleGetAdminAuditLogs);
app.get("/auth/admin/audit-logs", handleGetAdminAuditLogs);

// POST /admin/audit-logs (Record custom audit log)
const handleCreateAdminAuditLog = async (req, res) => {
  const {
    admin_name = "Super Admin",
    admin_role = "SUPERADMIN",
    action,
    target_type = "GENERAL",
    target_id = "-",
    target_name = "-",
    details = "",
  } = req.body;

  if (!action) {
    return errorResponse(res, "Jenis tindakan (action) wajib diisi.", 400);
  }

  try {
    const id = `aud-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`;
    await db.execute(
      `INSERT INTO audit_logs (id, admin_name, admin_role, action, target_type, target_id, target_name, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, admin_name, admin_role, action, target_type, target_id, target_name, details]
    );

    return successResponse(res, { id, action }, "Audit log berhasil dicatat.");
  } catch (err) {
    console.error("Create audit log error:", err);
    return errorResponse(res, "Gagal mencatat audit log.", 500);
  }
};
app.post("/admin/audit-logs", handleCreateAdminAuditLog);
app.post("/auth/admin/audit-logs", handleCreateAdminAuditLog);

// POST /admin/households/:id/activate-pro (Manual backoffice PRO activation)
const handleAdminActivatePro = async (req, res) => {
  const householdId = req.params.id;
  const { durationMonths = 12, planType = "PRO_YEARLY", reason = "Manual Backoffice Activation", paymentRef = "", adminName = "Super Admin" } = req.body;

  try {
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setMonth(validUntil.getMonth() + Number(durationMonths));

    await db.execute(
      `UPDATE households 
       SET subscription_tier = 'PRO', subscription_status = 'ACTIVE', pro_valid_until = ? 
       WHERE id = ?`,
      [validUntil, householdId]
    );

    const subId = `sub-adm-${Date.now()}`;
    const amount = planType === "PRO_MONTHLY" ? 49000 : 470000;
    await db.execute(
      `INSERT INTO subscriptions (id, household_id, plan_type, amount_paid, started_at, expires_at, payment_gateway_ref, status)
       VALUES (?, ?, ?, ?, NOW(), ?, ?, 'PAID')`,
      [subId, householdId, planType, amount, validUntil, paymentRef || `ADM-MANUAL-${Date.now()}`]
    ).catch(() => {});

    recordAuditLog({
      adminName,
      adminRole: "SUPERADMIN",
      action: "ACTIVATE_PRO_MANUAL",
      targetType: "HOUSEHOLD",
      targetId: householdId,
      targetName: `Rumah ID: ${householdId}`,
      details: `Aktivasi manual paket PRO ${durationMonths} bulan. Alasan: ${reason}`
    });

    return successResponse(res, {
      household_id: householdId,
      tier: "PRO",
      subscription_status: "ACTIVE",
      pro_valid_until: validUntil.toISOString(),
      activated_by: adminName,
      reason
    }, "Paket PRO berhasil diaktifkan secara manual oleh BackOffice.");
  } catch (err) {
    console.error("Admin activate PRO error:", err);
    return errorResponse(res, "Gagal mengaktifkan paket PRO.", 500);
  }
};
app.post("/admin/households/:id/activate-pro", handleAdminActivatePro);
app.post("/auth/admin/households/:id/activate-pro", handleAdminActivatePro);

// POST /admin/households/:id/downgrade (Downgrade household back to FREE)
const handleAdminDowngrade = async (req, res) => {
  const householdId = req.params.id;
  const { reason = "Admin Downgrade / Refund" } = req.body;

  try {
    await db.execute(
      `UPDATE households 
       SET subscription_tier = 'FREE', subscription_status = 'ACTIVE', pro_valid_until = NULL 
       WHERE id = ?`,
      [householdId]
    );

    recordAuditLog({
      adminName: req.body.adminName || "Super Admin",
      adminRole: req.body.adminRole || "SUPERADMIN",
      action: "DOWNGRADE",
      targetType: "HOUSEHOLD",
      targetId: householdId,
      targetName: `Rumah ID: ${householdId}`,
      details: `Downgrade paket ke FREE. Alasan: ${reason}`
    });

    return successResponse(res, {
      household_id: householdId,
      tier: "FREE",
      reason
    }, "Paket rumah tangga berhasil diturunkan ke FREE.");
  } catch (err) {
    console.error("Admin downgrade error:", err);
    return errorResponse(res, "Gagal menurunkan paket rumah tangga.", 500);
  }
};
app.post("/admin/households/:id/downgrade", handleAdminDowngrade);
app.post("/auth/admin/households/:id/downgrade", handleAdminDowngrade);

// POST /admin/members/:id/status (Toggle member status: ACTIVE / SUSPENDED)
const handleAdminMemberStatus = async (req, res) => {
  const userId = req.params.id;
  const { status, reason = "" } = req.body;

  if (!["ACTIVE", "SUSPENDED", "INACTIVE"].includes(status)) {
    return errorResponse(res, "Status tidak valid. Harus ACTIVE atau SUSPENDED.", 400);
  }

  try {
    await db.execute(
      `UPDATE users SET status = ? WHERE id = ?`,
      [status, userId]
    );

    recordAuditLog({
      adminName: req.body.adminName || "Super Admin",
      adminRole: req.body.adminRole || "SUPERADMIN",
      action: status === "SUSPENDED" ? "SUSPEND_USER" : "ACTIVATE_USER",
      targetType: "USER",
      targetId: userId,
      targetName: `User ID: ${userId}`,
      details: `Perubahan status akun ke ${status}. Alasan: ${reason || "-"}`
    });

    return successResponse(res, {
      user_id: userId,
      status,
      reason
    }, `Status pengguna berhasil diubah menjadi ${status}.`);
  } catch (err) {
    console.error("Admin member status error:", err);
    return errorResponse(res, "Gagal mengubah status pengguna.", 500);
  }
};
app.post("/admin/members/:id/status", handleAdminMemberStatus);
app.post("/auth/admin/members/:id/status", handleAdminMemberStatus);

// =============================================================================
// VOUCHERS DATABASE & MANAGEMENT
// =============================================================================

async function initVoucherTables() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255) NULL,
        discount_type ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL DEFAULT 'PERCENTAGE',
        discount_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
        target_plan ENUM('ALL', 'PRO_YEARLY', 'PRO_MONTHLY') NOT NULL DEFAULT 'ALL',
        max_quota INT NOT NULL DEFAULT 10,
        claimed_count INT NOT NULL DEFAULT 0,
        status ENUM('ACTIVE', 'EXHAUSTED', 'EXPIRED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
        valid_until TIMESTAMP NOT NULL,
        generated_by_name VARCHAR(100) NOT NULL DEFAULT 'Super Admin',
        generated_by_role VARCHAR(50) NOT NULL DEFAULT 'SUPERADMIN',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_voucher_code (code),
        INDEX idx_voucher_status (status)
      ) ENGINE=InnoDB;
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS voucher_claims (
        id VARCHAR(50) PRIMARY KEY,
        voucher_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        user_name VARCHAR(100) NULL,
        user_email VARCHAR(150) NULL,
        household_id VARCHAR(50) NOT NULL,
        household_name VARCHAR(120) NULL,
        applied_plan VARCHAR(50) NOT NULL,
        original_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
        discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        final_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
        claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_claim_voucher (voucher_id),
        INDEX idx_claim_user (user_id),
        INDEX idx_claim_household (household_id)
      ) ENGINE=InnoDB;
    `);

    // Seed default vouchers if table is empty
    const [[countRow]] = await db.query("SELECT COUNT(*) AS total FROM vouchers");
    if (countRow && countRow.total === 0) {
      await db.execute(`
        INSERT INTO vouchers (id, code, description, discount_type, discount_value, target_plan, max_quota, claimed_count, status, valid_until, generated_by_name, generated_by_role)
        VALUES 
        ('vouch-01', 'RAMADHAN50', 'Promo Berkah Ramadhan diskon 50% seluruh paket PRO HomeHub', 'PERCENTAGE', 50, 'ALL', 20, 0, 'ACTIVE', '2027-12-31 23:59:59', 'Reza Pratama', 'MARKETING'),
        ('vouch-02', 'HEMAT100K', 'Potongan langsung Rp 100.000 untuk langganan PRO Tahunan pertama', 'FIXED_AMOUNT', 100000, 'PRO_YEARLY', 10, 0, 'ACTIVE', '2027-12-31 23:59:59', 'Clarissa Natalia', 'FINANCE'),
        ('vouch-03', 'FREE1MO-COMMUNITY', 'Voucher Uji Coba Gratis 100% Paket PRO 1 Bulan untuk Pengurus RT/RW Mitra', 'PERCENTAGE', 100, 'PRO_MONTHLY', 50, 0, 'ACTIVE', '2027-12-31 23:59:59', 'Bramantyo Superadmin', 'SUPERADMIN')
      `);
    }
  } catch (err) {
    console.warn("Voucher tables initialization notice:", err.message);
  }
}
initVoucherTables();

// GET /admin/vouchers
const handleGetAdminVouchers = async (req, res) => {
  try {
    const [vouchers] = await db.query("SELECT * FROM vouchers ORDER BY created_at DESC");
    const [claims] = await db.query("SELECT * FROM voucher_claims ORDER BY claimed_at DESC");

    const formattedVouchers = vouchers.map((v) => {
      const vClaims = claims
        .filter((c) => c.voucher_id === v.id)
        .map((c) => ({
          id: c.id,
          user_id: c.user_id,
          user_name: c.user_name || "User",
          user_email: c.user_email || "-",
          household_id: c.household_id,
          household_name: c.household_name || "Rumah",
          claimed_at: c.claimed_at,
          applied_plan: c.applied_plan,
          original_price: Number(c.original_price),
          discount_amount: Number(c.discount_amount),
          final_price: Number(c.final_price),
        }));

      return {
        id: v.id,
        code: v.code,
        description: v.description,
        discount_type: v.discount_type,
        discount_value: Number(v.discount_value),
        target_plan: v.target_plan,
        max_quota: Number(v.max_quota),
        claimed_count: Number(v.claimed_count),
        status: v.status,
        valid_until: v.valid_until,
        generated_by_name: v.generated_by_name,
        generated_by_role: v.generated_by_role,
        created_at: v.created_at,
        claims: vClaims,
      };
    });

    return successResponse(res, formattedVouchers, "Daftar voucher berhasil dimuat.");
  } catch (err) {
    console.error("Admin vouchers error:", err);
    return errorResponse(res, "Gagal memuat daftar voucher.", 500);
  }
};
app.get("/admin/vouchers", handleGetAdminVouchers);
app.get("/auth/admin/vouchers", handleGetAdminVouchers);

// POST /admin/vouchers (Create new voucher)
const handleCreateAdminVoucher = async (req, res) => {
  const {
    code,
    discountType = "PERCENTAGE",
    discountValue = 20,
    targetPlan = "ALL",
    maxQuota = 10,
    validUntil,
    description = "",
    adminName = "Super Admin",
    adminRole = "SUPERADMIN",
  } = req.body;

  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) {
    return errorResponse(res, "Kode voucher tidak boleh kosong.", 400);
  }

  const valNum = Number(discountValue);
  if (isNaN(valNum) || valNum <= 0) {
    return errorResponse(res, "Nilai diskon harus lebih besar dari 0.", 400);
  }

  if (discountType === "PERCENTAGE" && (valNum < 1 || valNum > 100)) {
    return errorResponse(res, "Diskon persentase harus berada di rentang 1% hingga 100%.", 400);
  }

  if (discountType === "FIXED_AMOUNT" && valNum > 10000000) {
    return errorResponse(res, "Nilai diskon nominal maksimal adalah Rp 10.000.000 (10 juta rupiah).", 400);
  }

  try {
    const [existing] = await db.execute("SELECT id FROM vouchers WHERE code = ?", [cleanCode]);
    if (existing.length > 0) {
      return errorResponse(res, `Kode voucher "${cleanCode}" sudah pernah dibuat. Gunakan kode lain.`, 400);
    }

    const id = `vouch-${Date.now()}`;
    const quota = parseInt(maxQuota, 10) || 1;
    const expiry = validUntil ? new Date(validUntil) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    await db.execute(
      `INSERT INTO vouchers (id, code, description, discount_type, discount_value, target_plan, max_quota, claimed_count, status, valid_until, generated_by_name, generated_by_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'ACTIVE', ?, ?, ?)`,
      [
        id,
        cleanCode,
        description || `Diskon ${discountType === 'PERCENTAGE' ? `${discountValue}%` : `Rp ${Number(discountValue).toLocaleString('id-ID')}`}`,
        discountType,
        Number(discountValue),
        targetPlan,
        quota,
        expiry,
        adminName,
        adminRole,
      ]
    );

    const newVoucher = {
      id,
      code: cleanCode,
      description: description || `Diskon ${discountType === 'PERCENTAGE' ? `${discountValue}%` : `Rp ${Number(discountValue).toLocaleString('id-ID')}`}`,
      discount_type: discountType,
      discount_value: Number(discountValue),
      target_plan: targetPlan,
      max_quota: quota,
      claimed_count: 0,
      status: "ACTIVE",
      valid_until: expiry.toISOString(),
      generated_by_name: adminName,
      generated_by_role: adminRole,
      created_at: new Date().toISOString(),
      claims: [],
    };

    return successResponse(res, newVoucher, "Voucher berhasil dicetak.");
  } catch (err) {
    console.error("Create voucher error:", err);
    return errorResponse(res, "Gagal menerbitkan voucher.", 500);
  }
};
app.post("/admin/vouchers", handleCreateAdminVoucher);
app.post("/auth/admin/vouchers", handleCreateAdminVoucher);

// POST /admin/vouchers/:id/status (Toggle voucher status)
const handleToggleVoucherStatus = async (req, res) => {
  const voucherId = req.params.id;
  const { status } = req.body;

  if (!["ACTIVE", "DISABLED", "EXHAUSTED", "EXPIRED"].includes(status)) {
    return errorResponse(res, "Status voucher tidak valid.", 400);
  }

  try {
    await db.execute("UPDATE vouchers SET status = ? WHERE id = ?", [status, voucherId]);
    return successResponse(res, { id: voucherId, status }, "Status voucher berhasil diperbarui.");
  } catch (err) {
    console.error("Toggle voucher status error:", err);
    return errorResponse(res, "Gagal mengubah status voucher.", 500);
  }
};
app.post("/admin/vouchers/:id/status", handleToggleVoucherStatus);
app.post("/auth/admin/vouchers/:id/status", handleToggleVoucherStatus);

// POST /vouchers/validate (Public validation for user checkout)
const handleValidateVoucher = async (req, res) => {
  const { code, plan_type = "PRO_YEARLY" } = req.body;
  const cleanCode = (code || "").trim().toUpperCase();

  if (!cleanCode) {
    return errorResponse(res, "Masukkan kode voucher.", 400);
  }

  try {
    const [rows] = await db.execute("SELECT * FROM vouchers WHERE code = ?", [cleanCode]);
    if (rows.length === 0) {
      return errorResponse(res, `Kode voucher "${cleanCode}" tidak ditemukan.`, 404);
    }

    const v = rows[0];
    if (v.status !== "ACTIVE") {
      return errorResponse(res, `Voucher "${cleanCode}" sudah tidak aktif atau kuota habis (Status: ${v.status}).`, 400);
    }

    if (v.claimed_count >= v.max_quota) {
      return errorResponse(res, `Kuota voucher "${cleanCode}" sudah habis (${v.claimed_count}/${v.max_quota}).`, 400);
    }

    if (new Date(v.valid_until) < new Date()) {
      return errorResponse(res, `Voucher "${cleanCode}" telah kedaluwarsa.`, 400);
    }

    if (v.target_plan && v.target_plan !== "ALL" && v.target_plan !== plan_type) {
      return errorResponse(res, `Voucher "${cleanCode}" hanya berlaku untuk paket ${v.target_plan}.`, 400);
    }

    const basePrice = plan_type === "PRO_MONTHLY" ? 49000 : 470000;
    let discountAmount = 0;
    if (v.discount_type === "PERCENTAGE") {
      discountAmount = Math.round((basePrice * Number(v.discount_value)) / 100);
    } else {
      discountAmount = Math.min(basePrice, Number(v.discount_value));
    }
    const finalPrice = Math.max(0, basePrice - discountAmount);

    return successResponse(res, {
      code: v.code,
      description: v.description,
      discount_type: v.discount_type,
      discount_value: Number(v.discount_value),
      target_plan: v.target_plan,
      base_price: basePrice,
      discount_amount: discountAmount,
      final_price: finalPrice,
      is_free: finalPrice === 0,
    }, "Voucher valid.");
  } catch (err) {
    console.error("Validate voucher error:", err);
    return errorResponse(res, "Gagal memvalidasi voucher.", 500);
  }
};
app.post("/vouchers/validate", handleValidateVoucher);
app.post("/auth/vouchers/validate", handleValidateVoucher);

// POST /vouchers/claim (Atomic voucher claim & PRO activation)
const handleClaimVoucher = async (req, res) => {
  const {
    code,
    household_id,
    plan_type = "PRO_YEARLY",
    user_id,
    user_name,
    user_email,
    household_name,
  } = req.body;

  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode || !household_id) {
    return errorResponse(res, "Kode voucher dan ID rumah tangga wajib diisi.", 400);
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Lock voucher row for atomic update
    const [vouchers] = await connection.execute(
      "SELECT * FROM vouchers WHERE code = ? FOR UPDATE",
      [cleanCode]
    );

    if (vouchers.length === 0) {
      await connection.rollback();
      return errorResponse(res, `Kode voucher "${cleanCode}" tidak ditemukan.`, 404);
    }

    const v = vouchers[0];
    if (v.status !== "ACTIVE" || v.claimed_count >= v.max_quota) {
      await connection.rollback();
      return errorResponse(res, `Kuota voucher "${cleanCode}" sudah habis atau voucher tidak aktif.`, 400);
    }

    if (new Date(v.valid_until) < new Date()) {
      await connection.rollback();
      return errorResponse(res, `Voucher "${cleanCode}" telah kedaluwarsa.`, 400);
    }

    // 2. Calculate prices
    const basePrice = plan_type === "PRO_MONTHLY" ? 49000 : 470000;
    let discountAmount = 0;
    if (v.discount_type === "PERCENTAGE") {
      discountAmount = Math.round((basePrice * Number(v.discount_value)) / 100);
    } else {
      discountAmount = Math.min(basePrice, Number(v.discount_value));
    }
    const finalPrice = Math.max(0, basePrice - discountAmount);

    // 3. Increment claimed_count & update status if exhausted
    const newCount = v.claimed_count + 1;
    const newStatus = newCount >= v.max_quota ? "EXHAUSTED" : v.status;

    await connection.execute(
      "UPDATE vouchers SET claimed_count = ?, status = ? WHERE id = ?",
      [newCount, newStatus, v.id]
    );

    // 4. Insert voucher claim record
    const claimId = `clm-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`;
    await connection.execute(
      `INSERT INTO voucher_claims 
       (id, voucher_id, user_id, user_name, user_email, household_id, household_name, applied_plan, original_price, discount_amount, final_price, claimed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        claimId,
        v.id,
        user_id || "usr-calvin-01",
        user_name || "Pengguna",
        user_email || "user@homehub.app",
        household_id,
        household_name || "Rumah",
        plan_type,
        basePrice,
        discountAmount,
        finalPrice,
      ]
    );

    // 5. Update household tier to PRO
    const now = new Date();
    const validUntil = new Date(now);
    if (plan_type === "PRO_MONTHLY") {
      validUntil.setMonth(validUntil.getMonth() + 1);
    } else {
      validUntil.setFullYear(validUntil.getFullYear() + 1);
    }

    await connection.execute(
      `UPDATE households 
       SET subscription_tier = 'PRO', subscription_status = 'ACTIVE', pro_valid_until = ?
       WHERE id = ?`,
      [validUntil, household_id]
    );

    // 6. Insert subscription record
    const subId = `sub-vouch-${Date.now()}`;
    await connection.execute(
      `INSERT INTO subscriptions (id, household_id, plan_type, amount_paid, started_at, expires_at, payment_gateway_ref, status)
       VALUES (?, ?, ?, ?, NOW(), ?, ?, 'PAID')`,
      [
        subId,
        household_id,
        plan_type,
        finalPrice,
        validUntil,
        `VOUCHER-${cleanCode}`,
      ]
    ).catch(() => {});

    await connection.commit();

    return successResponse(res, {
      success: true,
      voucher_code: cleanCode,
      claim_id: claimId,
      remaining_quota: v.max_quota - newCount,
      household: {
        id: household_id,
        tier: "PRO",
        subscription_tier: "PRO",
        subscription_status: "ACTIVE",
        pro_valid_until: validUntil.toISOString(),
      },
      message: `Voucher ${cleanCode} berhasil diklaim! Akun telah diupgrade ke PRO.`,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Claim voucher error:", err);
    return errorResponse(res, "Gagal mengklaim voucher.", 500);
  } finally {
    if (connection) connection.release();
  }
};
app.post("/vouchers/claim", handleClaimVoucher);
app.post("/auth/vouchers/claim", handleClaimVoucher);

// =============================================================================
// DYNAMIC UTILITY CATEGORIES DATABASE & MANAGEMENT
// =============================================================================

async function initUtilityCategoriesTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS utility_categories (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        name_en VARCHAR(100) NULL,
        icon VARCHAR(50) NOT NULL DEFAULT '⚡',
        icon_url VARCHAR(255) NULL,
        color VARCHAR(50) NOT NULL DEFAULT 'blue',
        providers JSON NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cat_code (code),
        INDEX idx_cat_active (is_active)
      ) ENGINE=InnoDB;
    `);

    // Ensure name_en column exists if table was already created
    try {
      await db.execute("ALTER TABLE utility_categories ADD COLUMN name_en VARCHAR(100) NULL AFTER name");
    } catch (colErr) {}

    // Pre-seed default categories if empty
    const [[countRow]] = await db.query("SELECT COUNT(*) AS total FROM utility_categories");
    if (countRow && countRow.total === 0) {
      await db.execute(`
        INSERT INTO utility_categories (id, code, name, name_en, icon, icon_url, color, providers, is_default, is_active)
        VALUES 
        ('cat-elec', 'ELECTRICITY', 'Listrik & Daya', 'Electricity & Power', '⚡', NULL, 'amber', '["PLN Pascabayar", "PLN Prabayar (Token)"]', 1, 1),
        ('cat-water', 'WATER', 'Air PDAM / Bersih', 'Clean Water / PDAM', '💧', NULL, 'blue', '["PDAM Tirtawening", "PAM Jaya", "Aetra Air"]', 1, 1),
        ('cat-inet', 'INTERNET', 'Internet & WiFi Fiber', 'Internet & Fiber WiFi', '🌐', NULL, 'purple', '["IndiHome Fiber", "Biznet Home", "MyRepublic", "First Media"]', 1, 1),
        ('cat-ipl', 'MAINTENANCE_IPL', 'Iuran Pengelola (IPL)', 'Building & Security Dues (IPL)', '🏢', NULL, 'emerald', '["Iuran IPL Pengelola", "Iuran Keamanan RT/RW", "Retribusi Kebersihan"]', 1, 1),
        ('cat-gas', 'GAS', 'Gas PGN & Tabung LPG', 'PGN Gas & LPG Tank', '🔥', NULL, 'orange', '["PGN GasKita", "Pertamina Bright Gas 12kg", "LPG 3kg"]', 1, 1),
        ('cat-other', 'OTHER', 'Lainnya / Tagihan Umum', 'Other / General Bills', '📄', NULL, 'slate', '["BPJS Kesehatan", "Asuransi Rumah", "Tagihan Lainnya"]', 1, 1)
      `);
    } else {
      // Update English translations for default categories if empty
      const DEFAULT_UTILITY_TRANSLATIONS = [
        { code: 'ELECTRICITY', name_en: 'Electricity & Power' },
        { code: 'WATER', name_en: 'Clean Water / PDAM' },
        { code: 'INTERNET', name_en: 'Internet & Fiber WiFi' },
        { code: 'MAINTENANCE_IPL', name_en: 'Building & Security Dues (IPL)' },
        { code: 'GAS', name_en: 'PGN Gas & LPG Tank' },
        { code: 'OTHER', name_en: 'Other / General Bills' }
      ];
      for (const item of DEFAULT_UTILITY_TRANSLATIONS) {
        await db.execute(
          "UPDATE utility_categories SET name_en = ? WHERE code = ? AND (name_en IS NULL OR name_en = '')",
          [item.name_en, item.code]
        ).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("Utility categories table initialization notice:", err.message);
  }
}
initUtilityCategoriesTable();

const handleGetUtilityCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM utility_categories WHERE is_active = 1 ORDER BY is_default DESC, name ASC"
    );
    const formatted = rows.map(r => ({
      ...r,
      name_en: r.name_en || null,
      providers: typeof r.providers === 'string' ? JSON.parse(r.providers || '[]') : (r.providers || []),
      is_default: Boolean(r.is_default),
      is_active: Boolean(r.is_active)
    }));
    return successResponse(res, formatted);
  } catch (err) {
    console.error("Fetch utility categories error:", err);
    return errorResponse(res, "Gagal memuat kategori utilitas.", 500);
  }
};
app.get("/utilities/categories", handleGetUtilityCategories);
app.get("/auth/utilities/categories", handleGetUtilityCategories);

const handleGetAdminUtilityCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM utility_categories ORDER BY is_default DESC, created_at DESC"
    );
    const formatted = rows.map(r => ({
      ...r,
      name_en: r.name_en || null,
      providers: typeof r.providers === 'string' ? JSON.parse(r.providers || '[]') : (r.providers || []),
      is_default: Boolean(r.is_default),
      is_active: Boolean(r.is_active)
    }));
    return successResponse(res, formatted);
  } catch (err) {
    console.error("Fetch admin utility categories error:", err);
    return errorResponse(res, "Gagal memuat data kategori utilitas admin.", 500);
  }
};
app.get("/admin/utility-categories", handleGetAdminUtilityCategories);
app.get("/auth/admin/utility-categories", handleGetAdminUtilityCategories);

const handleCreateAdminUtilityCategory = async (req, res) => {
  const { code, name, name_en, icon, icon_url, color, providers, adminName = "Super Admin", adminRole = "SUPERADMIN" } = req.body;
  if (!name || !name.trim()) {
    return errorResponse(res, "Nama kategori wajib diisi.", 400);
  }
  
  const rawCode = (code || name)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/_+/g, "_");
  const finalCode = rawCode || `CAT_${Date.now()}`;
  const finalIcon = (icon || "⚡").trim();
  const finalColor = (color || "blue").trim();
  const finalNameEn = (name_en || '').trim() || null;
  const finalProviders = Array.isArray(providers) ? providers : (typeof providers === 'string' ? providers.split(',').map(s => s.trim()).filter(Boolean) : []);
  const catId = `cat-${Date.now()}`;

  try {
    await db.execute(
      `INSERT INTO utility_categories (id, code, name, name_en, icon, icon_url, color, providers, is_default, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
      [
        catId,
        finalCode,
        name.trim(),
        finalNameEn,
        finalIcon,
        icon_url || null,
        finalColor,
        JSON.stringify(finalProviders)
      ]
    );

    await recordAuditLog({
      adminName,
      adminRole,
      action: "CREATE_UTILITY_CATEGORY",
      targetType: "UTILITY_CATEGORY",
      targetId: catId,
      targetName: `${finalIcon} ${name.trim()} (${finalCode})`,
      details: `Admin menambahkan kategori utilitas baru: Kode [${finalCode}], Nama EN [${finalNameEn || '-'}], Logo/Ikon [${finalIcon}], Warna [${finalColor}], Saran Provider [${finalProviders.join(", ")}].`
    });

    return successResponse(res, {
      id: catId,
      code: finalCode,
      name: name.trim(),
      name_en: finalNameEn,
      icon: finalIcon,
      icon_url: icon_url || null,
      color: finalColor,
      providers: finalProviders,
      is_default: false,
      is_active: true
    }, "Kategori utilitas berhasil ditambahkan.", 201);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return errorResponse(res, `Kode kategori '${finalCode}' sudah terdaftar. Gunakan kode lain.`, 409);
    }
    console.error("Create utility category error:", err);
    return errorResponse(res, "Gagal membuat kategori utilitas.", 500);
  }
};
app.post("/admin/utility-categories", handleCreateAdminUtilityCategory);
app.post("/auth/admin/utility-categories", handleCreateAdminUtilityCategory);

const handleUpdateAdminUtilityCategory = async (req, res) => {
  const { id } = req.params;
  const { name, name_en, icon, icon_url, color, providers, is_active, adminName = "Super Admin", adminRole = "SUPERADMIN" } = req.body;

  try {
    const [[existing]] = await db.query("SELECT * FROM utility_categories WHERE id = ?", [id]);
    if (!existing) {
      return errorResponse(res, "Kategori utilitas tidak ditemukan.", 404);
    }

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedNameEn = name_en !== undefined ? (name_en ? name_en.trim() : null) : existing.name_en;
    const updatedIcon = icon !== undefined ? icon.trim() : existing.icon;
    const updatedIconUrl = icon_url !== undefined ? icon_url : existing.icon_url;
    const updatedColor = color !== undefined ? color.trim() : existing.color;
    const updatedActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;
    const updatedProviders = providers !== undefined 
      ? (Array.isArray(providers) ? providers : (typeof providers === 'string' ? providers.split(',').map(s => s.trim()).filter(Boolean) : []))
      : (typeof existing.providers === 'string' ? JSON.parse(existing.providers || '[]') : existing.providers);

    await db.execute(
      `UPDATE utility_categories 
       SET name = ?, name_en = ?, icon = ?, icon_url = ?, color = ?, providers = ?, is_active = ?
       WHERE id = ?`,
      [
        updatedName,
        updatedNameEn,
        updatedIcon,
        updatedIconUrl || null,
        updatedColor,
        JSON.stringify(updatedProviders),
        updatedActive,
        id
      ]
    );

    await recordAuditLog({
      adminName,
      adminRole,
      action: "UPDATE_UTILITY_CATEGORY",
      targetType: "UTILITY_CATEGORY",
      targetId: id,
      targetName: `${updatedIcon} ${updatedName} (${existing.code})`,
      details: `Admin memperbarui kategori utilitas: Nama [${updatedName}], Nama EN [${updatedNameEn || '-'}], Ikon [${updatedIcon}], Status [${updatedActive ? 'AKTIF' : 'NONAKTIF'}].`
    });

    return successResponse(res, {
      id,
      code: existing.code,
      name: updatedName,
      name_en: updatedNameEn,
      icon: updatedIcon,
      icon_url: updatedIconUrl || null,
      color: updatedColor,
      providers: updatedProviders,
      is_default: Boolean(existing.is_default),
      is_active: Boolean(updatedActive)
    }, "Kategori utilitas berhasil diperbarui.");
  } catch (err) {
    console.error("Update utility category error:", err);
    return errorResponse(res, "Gagal memperbarui kategori utilitas.", 500);
  }
};
app.put("/admin/utility-categories/:id", handleUpdateAdminUtilityCategory);
app.put("/auth/admin/utility-categories/:id", handleUpdateAdminUtilityCategory);

const handleDeleteAdminUtilityCategory = async (req, res) => {
  const { id } = req.params;
  const { adminName = "Super Admin", adminRole = "SUPERADMIN" } = req.body || {};

  try {
    const [[existing]] = await db.query("SELECT * FROM utility_categories WHERE id = ?", [id]);
    if (!existing) {
      return errorResponse(res, "Kategori utilitas tidak ditemukan.", 404);
    }
    if (existing.is_default) {
      return errorResponse(res, "Kategori bawaan sistem tidak dapat dihapus, namun dapat dinonaktifkan.", 400);
    }

    await db.execute("DELETE FROM utility_categories WHERE id = ?", [id]);

    await recordAuditLog({
      adminName,
      adminRole,
      action: "DELETE_UTILITY_CATEGORY",
      targetType: "UTILITY_CATEGORY",
      targetId: id,
      targetName: `${existing.icon} ${existing.name} (${existing.code})`,
      details: `Admin menghapus kategori utilitas kustom [${existing.name}] dengan kode [${existing.code}].`
    });

    return successResponse(res, { id }, "Kategori utilitas berhasil dihapus.");
  } catch (err) {
    console.error("Delete utility category error:", err);
    return errorResponse(res, "Gagal menghapus kategori utilitas.", 500);
  }
};
app.delete("/admin/utility-categories/:id", handleDeleteAdminUtilityCategory);
app.delete("/auth/admin/utility-categories/:id", handleDeleteAdminUtilityCategory);

// =============================================================================
// DYNAMIC MASTER CATEGORIES DATABASE & MANAGEMENT (ASSETS, GROCERY, EXPENSE, ACTIVITY)
// =============================================================================

const MASTER_MODULE_CONFIG = {
  asset: {
    table: 'asset_categories',
    defaultIcon: '📦',
    name: 'Aset & Inventaris',
    targetType: 'ASSET_CATEGORY',
    idPrefix: 'cat-ast',
    defaults: [
      { id: 'cat-ast-elec', code: 'ELECTRONIC', name: 'Elektronik Rumah Tangga', name_en: 'Household Electronics', icon: '❄️', color: 'emerald', metadata: { subcategories: ['AC', 'Kulkas', 'Smart TV', 'Mesin Cuci', 'Microwave', 'Dispenser Air'] }, is_default: 1 },
      { id: 'cat-ast-veh', code: 'VEHICLE', name: 'Kendaraan Bermotor', name_en: 'Motor Vehicles', icon: '🚗', color: 'blue', metadata: { subcategories: ['Mobil', 'Sepeda Motor', 'Sepeda Listrik'], has_odometer: true }, is_default: 1 },
      { id: 'cat-ast-furn', code: 'FURNITURE', name: 'Perabotan / Furnitur', name_en: 'Furniture & Fixtures', icon: '🛋️', color: 'amber', metadata: { subcategories: ['Sofa & Kursi', 'Meja Makan', 'Tempat Tidur', 'Lemari Pakaian', 'Kitchen Set'] }, is_default: 1 },
      { id: 'cat-ast-prop', code: 'PROPERTY', name: 'Properti & Bangunan', name_en: 'Property & Buildings', icon: '🏡', color: 'indigo', metadata: { subcategories: ['Rumah Utama', 'Villa', 'Ruko / Toko', 'Tanah'] }, is_default: 1 },
      { id: 'cat-ast-jwl', code: 'JEWELRY', name: 'Perhiasan & Logam Mulia', name_en: 'Jewelry & Precious Metals', icon: '💎', color: 'purple', metadata: { subcategories: ['Emas Batangan', 'Cincin & Kalung', 'Jam Tangan Mewah'] }, is_default: 1 },
      { id: 'cat-ast-oth', code: 'OTHER', name: 'Aset Lainnya', name_en: 'Other Assets', icon: '📦', color: 'slate', metadata: { subcategories: ['Kamera & Lensa', 'Sepeda Olahraga', 'Peralatan Bengkel / Hobi'] }, is_default: 1 }
    ]
  },
  grocery: {
    table: 'grocery_categories',
    defaultIcon: '🛒',
    name: 'Belanja & Dapur',
    targetType: 'GROCERY_CATEGORY',
    idPrefix: 'cat-groc',
    defaults: [
      { id: 'cat-groc-bumbu', code: 'BUMBU', name: 'Bumbu Masak', name_en: 'Cooking Seasoning', icon: '🧂', color: 'amber', metadata: { item_suggestions: ['Bawang Merah', 'Bawang Putih', 'Garam Dapur', 'Merica Bubuk', 'Kecap Manis', 'Minyak Goreng 2L'] }, is_default: 1 },
      { id: 'cat-groc-pokok', code: 'BAHAN_POKOK', name: 'Bahan Pokok', name_en: 'Staple Foods', icon: '🌾', color: 'orange', metadata: { item_suggestions: ['Beras Pandan Wangi 10kg', 'Gula Pasir 1kg', 'Tepung Terigu Segitiga', 'Telur Ayam 1kg'] }, is_default: 1 },
      { id: 'cat-groc-sayur', code: 'SAYUR_BUAH', name: 'Sayuran & Buah', name_en: 'Vegetables & Fruits', icon: '🥦', color: 'emerald', metadata: { item_suggestions: ['Wortel Impor', 'Bayam Segar', 'Brokoli Hijau', 'Apel Fuji', 'Pisang Cavendish'] }, is_default: 1 },
      { id: 'cat-groc-daging', code: 'DAGING_IKAN', name: 'Daging, Ikan & Telur', name_en: 'Meat, Fish & Eggs', icon: '🥩', color: 'rose', metadata: { item_suggestions: ['Daging Sapi Has Dalam', 'Dada Ayam Fillet', 'Ikan Salmon', 'Udang Segar'] }, is_default: 1 },
      { id: 'cat-groc-bersih', code: 'KEBERSIHAN', name: 'Kebersihan & Mandi', name_en: 'Cleaning & Bathing', icon: '🧼', color: 'cyan', metadata: { item_suggestions: ['Deterjen Cair', 'Sabun Mandi Refill', 'Shampoo', 'Pembersih Lantai', 'Pasta Gigi'] }, is_default: 1 },
      { id: 'cat-groc-minum', code: 'MINUMAN_SUSU', name: 'Minuman & Susu', name_en: 'Beverages & Milk', icon: '🥛', color: 'blue', metadata: { item_suggestions: ['Susu UHT Full Cream', 'Air Galon Aqua', 'Teh Celup', 'Kopi Bubuk'] }, is_default: 1 },
      { id: 'cat-groc-snack', code: 'SNACK', name: 'Makanan Ringan', name_en: 'Snacks', icon: '🍪', color: 'purple', metadata: { item_suggestions: ['Biskuit Roma', 'Keripik Kentang', 'Kacang Almond', 'Roti Tawar Gandum'] }, is_default: 1 },
      { id: 'cat-groc-oth', code: 'OTHER', name: 'Lainnya', name_en: 'Others', icon: '📦', color: 'slate', metadata: { item_suggestions: ['Baterai AA', 'Tisu Basah', 'Kantong Sampah Hitam'] }, is_default: 1 }
    ]
  },
  expense: {
    table: 'expense_categories',
    defaultIcon: '💰',
    name: 'Pengeluaran Keuangan',
    targetType: 'EXPENSE_CATEGORY',
    idPrefix: 'cat-exp',
    defaults: [
      { id: 'cat-exp-bln', code: 'EXP_BULANAN', name: 'Belanja Bulanan & Supermarket', name_en: 'Monthly & Supermarket Shopping', icon: '🛒', color: 'blue', metadata: { budget: 2500000 }, is_default: 1 },
      { id: 'cat-exp-dpr', code: 'EXP_DAPUR', name: 'Kebutuhan Dapur & Bahan Pokok', name_en: 'Kitchen Supplies & Staple Food', icon: '🍳', color: 'emerald', metadata: { budget: 1500000 }, is_default: 1 },
      { id: 'cat-exp-utl', code: 'EXP_UTILITAS', name: 'Tagihan & Utilitas (Listrik/Air/Wifi)', name_en: 'Bills & Utilities', icon: '⚡', color: 'amber', metadata: { budget: 1200000 }, is_default: 1 },
      { id: 'cat-exp-trn', code: 'EXP_TRANSPORT', name: 'Transportasi, Bensin & Tol', name_en: 'Transportation, Fuel & Toll', icon: '🚗', color: 'orange', metadata: { budget: 1000000 }, is_default: 1 },
      { id: 'cat-exp-srv', code: 'EXP_SERVIS', name: 'Servis Kendaraan & Rumah', name_en: 'Vehicle & Home Maintenance', icon: '🔧', color: 'purple', metadata: { budget: 800000 }, is_default: 1 },
      { id: 'cat-exp-pdd', code: 'EXP_PENDIDIKAN', name: 'Pendidikan & Les Anak', name_en: 'Education & Courses', icon: '📚', color: 'rose', metadata: { budget: 1200000 }, is_default: 1 },
      { id: 'cat-exp-med', code: 'EXP_KESEHATAN', name: 'Kesehatan, Obat & Medis', name_en: 'Healthcare & Medicines', icon: '💊', color: 'teal', metadata: { budget: 500000 }, is_default: 1 },
      { id: 'cat-exp-hbr', code: 'EXP_HIBURAN', name: 'Gaya Hidup, Kuliner & Hiburan', name_en: 'Lifestyle & Entertainment', icon: '☕', color: 'cyan', metadata: { budget: 800000 }, is_default: 1 },
      { id: 'cat-exp-inv', code: 'EXP_INVESTASI', name: 'Investasi & Tabungan', name_en: 'Investment & Savings', icon: '📈', color: 'emerald', metadata: { budget: 2000000 }, is_default: 1 },
      { id: 'cat-exp-dns', code: 'EXP_DONASI', name: 'Sosial & Zakat/Donasi', name_en: 'Social & Donations', icon: '🤲', color: 'indigo', metadata: { budget: 500000 }, is_default: 1 },
      { id: 'cat-exp-oth', code: 'EXP_LAINNYA', name: 'Lainnya', name_en: 'Others', icon: '📦', color: 'slate', metadata: { budget: 300000 }, is_default: 1 }
    ]
  },
  activity: {
    table: 'activity_categories',
    defaultIcon: '📅',
    name: 'Agenda & Aktivitas',
    targetType: 'ACTIVITY_CATEGORY',
    idPrefix: 'cat-act',
    defaults: [
      { id: 'cat-act-les', code: 'COURSE_LES', name: 'Kursus / Les / Bimbel', name_en: 'Courses & Tutoring', icon: '🎓', color: 'amber', metadata: { reminder: 30, tag: 'Les' }, is_default: 1 },
      { id: 'cat-act-lib', code: 'VACATION', name: 'Liburan / Rekreasi Keluarga', name_en: 'Vacation & Family Recreation', icon: '🌴', color: 'emerald', metadata: { reminder: 1440, tag: 'Liburan' }, is_default: 1 },
      { id: 'cat-act-dns', code: 'BIZTRIP', name: 'Perjalanan Bisnis / Dinas', name_en: 'Business Trip', icon: '💼', color: 'blue', metadata: { reminder: 120, tag: 'Dinas' }, is_default: 1 },
      { id: 'cat-act-udg', code: 'INVITATION', name: 'Undangan / Hajatan', name_en: 'Invitation / Party', icon: '✉️', color: 'purple', metadata: { reminder: 60, tag: 'Undangan' }, is_default: 1 },
      { id: 'cat-act-ult', code: 'BIRTHDAY', name: 'Ulang Tahun / Perayaan', name_en: 'Birthday & Celebration', icon: '🎂', color: 'pink', metadata: { reminder: 1440, tag: 'Ulang Tahun' }, is_default: 1 },
      { id: 'cat-act-rtn', code: 'ROUTINE', name: 'Rutinitas / Ibadah', name_en: 'Routine & Worship', icon: '⚡', color: 'indigo', metadata: { reminder: 15, tag: 'Rutinitas' }, is_default: 1 },
      { id: 'cat-act-med', code: 'HEALTH_CHECK', name: 'Pemeriksaan Kesehatan / Dokter', name_en: 'Doctor & Health Checkup', icon: '🩺', color: 'rose', metadata: { reminder: 60, tag: 'Kesehatan' }, is_default: 1 },
      { id: 'cat-act-rpt', code: 'MEETING', name: 'Rapat RT/RW / Komunitas', name_en: 'Community & Neighborhood Meeting', icon: '👥', color: 'teal', metadata: { reminder: 30, tag: 'Rapat' }, is_default: 1 },
      { id: 'cat-act-oth', code: 'OTHER', name: 'Lainnya', name_en: 'Others', icon: '📌', color: 'slate', metadata: { reminder: 30, tag: 'Agenda' }, is_default: 1 }
    ]
  }
};

async function initAllMasterCategoriesTables() {
  for (const [modKey, conf] of Object.entries(MASTER_MODULE_CONFIG)) {
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS ${conf.table} (
          id VARCHAR(50) PRIMARY KEY,
          code VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          name_en VARCHAR(100) NULL,
          icon VARCHAR(50) NOT NULL,
          icon_url VARCHAR(255) NULL,
          color VARCHAR(50) NOT NULL DEFAULT 'blue',
          metadata JSON NULL,
          is_default BOOLEAN NOT NULL DEFAULT FALSE,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_code (code),
          INDEX idx_active (is_active)
        ) ENGINE=InnoDB;
      `);

      // Ensure name_en column exists if table was already created
      try {
        await db.execute(`ALTER TABLE ${conf.table} ADD COLUMN name_en VARCHAR(100) NULL AFTER name`);
      } catch (colErr) {}

      const [[countRow]] = await db.query(`SELECT COUNT(*) AS total FROM ${conf.table}`);
      if (countRow && countRow.total === 0) {
        for (const item of conf.defaults) {
          await db.execute(`
            INSERT INTO ${conf.table} (id, code, name, name_en, icon, icon_url, color, metadata, is_default, is_active)
            VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, 1)
          `, [
            item.id,
            item.code,
            item.name,
            item.name_en || null,
            item.icon,
            item.color,
            JSON.stringify(item.metadata || {}),
            item.is_default ? 1 : 0
          ]);
        }
      } else {
        // Backfill name_en for existing defaults if empty
        for (const item of conf.defaults) {
          if (item.name_en) {
            await db.execute(
              `UPDATE ${conf.table} SET name_en = ? WHERE (id = ? OR code = ?) AND (name_en IS NULL OR name_en = '')`,
              [item.name_en, item.id, item.code]
            ).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.warn(`Master categories [${modKey}] init notice:`, err.message);
    }
  }
}
initAllMasterCategoriesTables();

// Helper to normalize category response
function formatCategoryRow(r) {
  const meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : (r.metadata || {});
  return {
    ...r,
    name_en: r.name_en || meta.name_en || null,
    metadata: meta,
    subcategories: meta.subcategories || [],
    item_suggestions: meta.item_suggestions || [],
    budget: meta.budget || 0,
    reminder: meta.reminder || 30,
    is_default: Boolean(r.is_default),
    is_active: Boolean(r.is_active)
  };
}

// User-facing Categories GET handler
const handleGetModuleCategories = async (req, res) => {
  const modKey = (req.params.module || '').toLowerCase().replace(/s$/, '').replace(/-categories$/, '');
  if (modKey === 'utility') {
    return handleGetUtilityCategories(req, res);
  }
  const conf = MASTER_MODULE_CONFIG[modKey];
  if (!conf) {
    return errorResponse(res, `Modul kategori '${modKey}' tidak dikenali.`, 404);
  }

  try {
    const [rows] = await db.query(
      `SELECT * FROM ${conf.table} WHERE is_active = 1 ORDER BY is_default DESC, name ASC`
    );
    return successResponse(res, rows.map(formatCategoryRow));
  } catch (err) {
    console.error(`Fetch ${modKey} categories error:`, err);
    return errorResponse(res, `Gagal memuat kategori ${conf.name}.`, 500);
  }
};

app.get("/categories/:module", handleGetModuleCategories);
app.get("/auth/categories/:module", handleGetModuleCategories);

// Specific aliases for user apps
app.get("/assets/categories", (req, res) => { req.params.module = "asset"; handleGetModuleCategories(req, res); });
app.get("/auth/assets/categories", (req, res) => { req.params.module = "asset"; handleGetModuleCategories(req, res); });
app.get("/assets/types", (req, res) => { req.params.module = "asset"; handleGetModuleCategories(req, res); });
app.get("/auth/assets/types", (req, res) => { req.params.module = "asset"; handleGetModuleCategories(req, res); });

app.get("/groceries/categories", (req, res) => { req.params.module = "grocery"; handleGetModuleCategories(req, res); });
app.get("/auth/groceries/categories", (req, res) => { req.params.module = "grocery"; handleGetModuleCategories(req, res); });

app.get("/finances/categories", (req, res) => { req.params.module = "expense"; handleGetModuleCategories(req, res); });
app.get("/auth/finances/categories", (req, res) => { req.params.module = "expense"; handleGetModuleCategories(req, res); });

app.get("/activities/categories", (req, res) => { req.params.module = "activity"; handleGetModuleCategories(req, res); });
app.get("/auth/activities/categories", (req, res) => { req.params.module = "activity"; handleGetModuleCategories(req, res); });

// Admin-facing Categories GET handler
const handleGetAdminModuleCategories = async (req, res) => {
  const modKey = (req.params.module || '').toLowerCase().replace(/s$/, '').replace(/-categories$/, '');
  if (modKey === 'utility') {
    return handleGetAdminUtilityCategories(req, res);
  }
  const conf = MASTER_MODULE_CONFIG[modKey];
  if (!conf) {
    return errorResponse(res, `Modul kategori '${modKey}' tidak dikenali.`, 404);
  }

  try {
    const [rows] = await db.query(
      `SELECT * FROM ${conf.table} ORDER BY is_default DESC, created_at DESC`
    );
    return successResponse(res, rows.map(formatCategoryRow));
  } catch (err) {
    console.error(`Fetch admin ${modKey} categories error:`, err);
    return errorResponse(res, `Gagal memuat data kategori ${conf.name} admin.`, 500);
  }
};

app.get("/admin/categories/:module", handleGetAdminModuleCategories);
app.get("/auth/admin/categories/:module", handleGetAdminModuleCategories);
app.get("/utility-categories", handleGetAdminUtilityCategories);
app.get("/admin/asset-categories", (req, res) => { req.params.module = "asset"; handleGetAdminModuleCategories(req, res); });
app.get("/admin/grocery-categories", (req, res) => { req.params.module = "grocery"; handleGetAdminModuleCategories(req, res); });
app.get("/admin/expense-categories", (req, res) => { req.params.module = "expense"; handleGetAdminModuleCategories(req, res); });
app.get("/admin/activity-categories", (req, res) => { req.params.module = "activity"; handleGetAdminModuleCategories(req, res); });

// Admin-facing Categories POST handler (Create)
const handleCreateAdminModuleCategory = async (req, res) => {
  const modKey = (req.params.module || '').toLowerCase().replace(/s$/, '').replace(/-categories$/, '');
  if (modKey === 'utility') {
    return handleCreateAdminUtilityCategory(req, res);
  }
  const conf = MASTER_MODULE_CONFIG[modKey];
  if (!conf) {
    return errorResponse(res, `Modul kategori '${modKey}' tidak dikenali.`, 404);
  }

  const { code, name, name_en, icon, icon_url, color, metadata, subcategories, item_suggestions, budget, reminder, adminName = "Super Admin", adminRole = "SUPERADMIN" } = req.body;
  if (!name || !name.trim()) {
    return errorResponse(res, "Nama kategori wajib diisi.", 400);
  }

  const rawCode = (code || name)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/_+/g, "_");
  const finalCode = rawCode || `CAT_${Date.now()}`;
  const finalIcon = (icon || conf.defaultIcon).trim();
  const finalColor = (color || "blue").trim();
  const finalNameEn = (name_en || '').trim() || null;
  const finalId = `${conf.idPrefix}-${Date.now()}`;

  // Merge metadata
  const metaObj = metadata && typeof metadata === 'object' ? { ...metadata } : {};
  if (subcategories !== undefined) metaObj.subcategories = Array.isArray(subcategories) ? subcategories : String(subcategories).split(',').map(s => s.trim()).filter(Boolean);
  if (item_suggestions !== undefined) metaObj.item_suggestions = Array.isArray(item_suggestions) ? item_suggestions : String(item_suggestions).split(',').map(s => s.trim()).filter(Boolean);
  if (budget !== undefined) metaObj.budget = parseInt(budget, 10) || 0;
  if (reminder !== undefined) metaObj.reminder = parseInt(reminder, 10) || 30;

  try {
    await db.execute(
      `INSERT INTO ${conf.table} (id, code, name, name_en, icon, icon_url, color, metadata, is_default, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
      [
        finalId,
        finalCode,
        name.trim(),
        finalNameEn,
        finalIcon,
        icon_url || null,
        finalColor,
        JSON.stringify(metaObj)
      ]
    );

    await recordAuditLog({
      adminName,
      adminRole,
      action: `CREATE_${conf.targetType}`,
      targetType: conf.targetType,
      targetId: finalId,
      targetName: `${finalIcon} ${name.trim()} (${finalCode})`,
      details: `Admin menambahkan kategori ${conf.name} baru: Kode [${finalCode}], Nama EN [${finalNameEn || '-'}], Logo/Ikon [${finalIcon}], Warna [${finalColor}].`
    });

    const created = formatCategoryRow({
      id: finalId,
      code: finalCode,
      name: name.trim(),
      name_en: finalNameEn,
      icon: finalIcon,
      icon_url: icon_url || null,
      color: finalColor,
      metadata: metaObj,
      is_default: 0,
      is_active: 1
    });

    return successResponse(res, created, `Kategori ${conf.name} berhasil ditambahkan.`, 201);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return errorResponse(res, `Kode kategori '${finalCode}' sudah terdaftar. Silakan gunakan kode lain.`, 409);
    }
    console.error(`Create ${modKey} category error:`, err);
    return errorResponse(res, `Gagal membuat kategori ${conf.name}.`, 500);
  }
};

app.post("/admin/categories/:module", handleCreateAdminModuleCategory);
app.post("/auth/admin/categories/:module", handleCreateAdminModuleCategory);
app.post("/categories/:module", handleCreateAdminModuleCategory);
app.post("/utility-categories", handleCreateAdminUtilityCategory);
app.post("/admin/asset-categories", (req, res) => { req.params.module = "asset"; handleCreateAdminModuleCategory(req, res); });
app.post("/admin/grocery-categories", (req, res) => { req.params.module = "grocery"; handleCreateAdminModuleCategory(req, res); });
app.post("/admin/expense-categories", (req, res) => { req.params.module = "expense"; handleCreateAdminModuleCategory(req, res); });
app.post("/admin/activity-categories", (req, res) => { req.params.module = "activity"; handleCreateAdminModuleCategory(req, res); });

// Admin-facing Categories PUT handler (Update)
const handleUpdateAdminModuleCategory = async (req, res) => {
  const modKey = (req.params.module || '').toLowerCase().replace(/s$/, '').replace(/-categories$/, '');
  if (modKey === 'utility') {
    return handleUpdateAdminUtilityCategory(req, res);
  }
  const conf = MASTER_MODULE_CONFIG[modKey];
  if (!conf) {
    return errorResponse(res, `Modul kategori '${modKey}' tidak dikenali.`, 404);
  }

  const { id } = req.params;
  const { name, name_en, icon, icon_url, color, metadata, subcategories, item_suggestions, budget, reminder, is_active, adminName = "Super Admin", adminRole = "SUPERADMIN" } = req.body;

  try {
    const [[existing]] = await db.query(`SELECT * FROM ${conf.table} WHERE id = ?`, [id]);
    if (!existing) {
      return errorResponse(res, `Kategori ${conf.name} tidak ditemukan.`, 404);
    }

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedNameEn = name_en !== undefined ? (name_en ? name_en.trim() : null) : existing.name_en;
    const updatedIcon = icon !== undefined ? icon.trim() : existing.icon;
    const updatedIconUrl = icon_url !== undefined ? icon_url : existing.icon_url;
    const updatedColor = color !== undefined ? color.trim() : existing.color;
    const updatedActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    let existingMeta = typeof existing.metadata === 'string' ? JSON.parse(existing.metadata || '{}') : (existing.metadata || {});
    if (metadata && typeof metadata === 'object') existingMeta = { ...existingMeta, ...metadata };
    if (subcategories !== undefined) existingMeta.subcategories = Array.isArray(subcategories) ? subcategories : String(subcategories).split(',').map(s => s.trim()).filter(Boolean);
    if (item_suggestions !== undefined) existingMeta.item_suggestions = Array.isArray(item_suggestions) ? item_suggestions : String(item_suggestions).split(',').map(s => s.trim()).filter(Boolean);
    if (budget !== undefined) existingMeta.budget = parseInt(budget, 10) || 0;
    if (reminder !== undefined) existingMeta.reminder = parseInt(reminder, 10) || 30;

    await db.execute(
      `UPDATE ${conf.table} 
       SET name = ?, name_en = ?, icon = ?, icon_url = ?, color = ?, metadata = ?, is_active = ?
       WHERE id = ?`,
      [
        updatedName,
        updatedNameEn,
        updatedIcon,
        updatedIconUrl || null,
        updatedColor,
        JSON.stringify(existingMeta),
        updatedActive,
        id
      ]
    );

    await recordAuditLog({
      adminName,
      adminRole,
      action: `UPDATE_${conf.targetType}`,
      targetType: conf.targetType,
      targetId: id,
      targetName: `${updatedIcon} ${updatedName} (${existing.code})`,
      details: `Admin memperbarui kategori ${conf.name}: Nama [${updatedName}], Nama EN [${updatedNameEn || '-'}], Ikon [${updatedIcon}], Status [${updatedActive ? 'AKTIF' : 'NONAKTIF'}].`
    });

    const updated = formatCategoryRow({
      id,
      code: existing.code,
      name: updatedName,
      name_en: updatedNameEn,
      icon: updatedIcon,
      icon_url: updatedIconUrl || null,
      color: updatedColor,
      metadata: existingMeta,
      is_default: existing.is_default,
      is_active: updatedActive
    });

    return successResponse(res, updated, `Kategori ${conf.name} berhasil diperbarui.`);
  } catch (err) {
    console.error(`Update ${modKey} category error:`, err);
    return errorResponse(res, `Gagal memperbarui kategori ${conf.name}.`, 500);
  }
};

app.put("/admin/categories/:module/:id", handleUpdateAdminModuleCategory);
app.put("/auth/admin/categories/:module/:id", handleUpdateAdminModuleCategory);
app.put("/categories/:module/:id", handleUpdateAdminModuleCategory);
app.put("/utility-categories/:id", handleUpdateAdminUtilityCategory);
app.put("/admin/asset-categories/:id", (req, res) => { req.params.module = "asset"; handleUpdateAdminModuleCategory(req, res); });
app.put("/admin/grocery-categories/:id", (req, res) => { req.params.module = "grocery"; handleUpdateAdminModuleCategory(req, res); });
app.put("/admin/expense-categories/:id", (req, res) => { req.params.module = "expense"; handleUpdateAdminModuleCategory(req, res); });
app.put("/admin/activity-categories/:id", (req, res) => { req.params.module = "activity"; handleUpdateAdminModuleCategory(req, res); });

// Admin-facing Categories DELETE handler
const handleDeleteAdminModuleCategory = async (req, res) => {
  const modKey = (req.params.module || '').toLowerCase().replace(/s$/, '').replace(/-categories$/, '');
  if (modKey === 'utility') {
    return handleDeleteAdminUtilityCategory(req, res);
  }
  const conf = MASTER_MODULE_CONFIG[modKey];
  if (!conf) {
    return errorResponse(res, `Modul kategori '${modKey}' tidak dikenali.`, 404);
  }

  const { id } = req.params;
  const { adminName = "Super Admin", adminRole = "SUPERADMIN" } = req.body || {};

  try {
    const [[existing]] = await db.query(`SELECT * FROM ${conf.table} WHERE id = ?`, [id]);
    if (!existing) {
      return errorResponse(res, `Kategori ${conf.name} tidak ditemukan.`, 404);
    }
    if (existing.is_default) {
      return errorResponse(res, `Kategori bawaan sistem tidak dapat dihapus, namun dapat dinonaktifkan.`, 400);
    }

    await db.execute(`DELETE FROM ${conf.table} WHERE id = ?`, [id]);

    await recordAuditLog({
      adminName,
      adminRole,
      action: `DELETE_${conf.targetType}`,
      targetType: conf.targetType,
      targetId: id,
      targetName: `${existing.icon} ${existing.name} (${existing.code})`,
      details: `Admin menghapus kategori ${conf.name} kustom [${existing.name}] dengan kode [${existing.code}].`
    });

    return successResponse(res, { id }, `Kategori ${conf.name} berhasil dihapus.`);
  } catch (err) {
    console.error(`Delete ${modKey} category error:`, err);
    return errorResponse(res, `Gagal menghapus kategori ${conf.name}.`, 500);
  }
};

app.delete("/admin/categories/:module/:id", handleDeleteAdminModuleCategory);
app.delete("/auth/admin/categories/:module/:id", handleDeleteAdminModuleCategory);
app.delete("/categories/:module/:id", handleDeleteAdminModuleCategory);
app.delete("/utility-categories/:id", handleDeleteAdminUtilityCategory);
app.delete("/admin/asset-categories/:id", (req, res) => { req.params.module = "asset"; handleDeleteAdminModuleCategory(req, res); });
app.delete("/admin/grocery-categories/:id", (req, res) => { req.params.module = "grocery"; handleDeleteAdminModuleCategory(req, res); });
app.delete("/admin/expense-categories/:id", (req, res) => { req.params.module = "expense"; handleDeleteAdminModuleCategory(req, res); });
app.delete("/admin/activity-categories/:id", (req, res) => { req.params.module = "activity"; handleDeleteAdminModuleCategory(req, res); });


app.listen(PORT, () => {
  console.log(`🔐 Auth & Family Service running on port ${PORT}`);
});
