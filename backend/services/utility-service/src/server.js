require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { z } = require("zod");
const { createDbPool } = require("../../../shared/src/utils/db");
const {
  successResponse,
  errorResponse,
} = require("../../../shared/src/utils/response");
const { validate } = require("../../../shared/src/middleware/validate");
const { authenticate } = require("../../../shared/src/middleware/auth");
const { verifyQuota } = require("../../../shared/src/middleware/quotaGuard");

const app = express();
const PORT = process.env.UTILITY_SERVICE_PORT || 8002;

app.use(cors());
app.use(express.json());
app.use(authenticate);

// Database connection pool for db_utility
const db = createDbPool("db_utility");

// Quota count helper for routine bills
const countAccounts = async (householdId) => {
  const [rows] = await db.execute(
    "SELECT COUNT(*) as total FROM utility_accounts WHERE household_id = ?",
    [householdId],
  );
  return rows[0].total;
};

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================
const createAccountSchema = z.object({
  category_code: z.string().min(2, "Kode kategori minimal 2 karakter").max(50),
  provider_name: z.string().min(2, "Nama penyedia minimal 2 karakter").max(100),
  customer_number: z
    .string()
    .min(3, "Nomor pelanggan minimal 3 karakter")
    .max(100),
  account_name: z.string().min(2, "Nama akun minimal 2 karakter").max(120),
  default_due_day: z.number().int().min(1).max(31).optional(),
});

const createBillSchema = z.object({
  account_id: z.string().uuid("ID Akun tidak valid"),
  billing_period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM (misal: 2026-09)"),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  amount: z.number().positive("Nominal tagihan harus lebih besar dari 0"),
  notes: z.string().optional(),
});

const payBillSchema = z.object({
  paid_at: z.string().optional(),
  receipt_attachment_url: z.string().optional(),
  notes: z.string().optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "Utility & Bills Service" });
});

// GET / (List accounts in household)
app.get("/", async (req, res) => {
  try {
    const [accounts] = await db.execute(
      `SELECT a.*, 
        (SELECT COUNT(*) FROM utility_bills b WHERE b.account_id = a.id AND b.status = 'UNPAID') as unpaid_bills_count
       FROM utility_accounts a
       WHERE a.household_id = ?
       ORDER BY a.created_at DESC`,
      [req.household.id],
    );

    return successResponse(res, accounts);
  } catch (err) {
    console.error("Fetch utility accounts error:", err);
    return errorResponse(res, "Gagal memuat akun tagihan utilitas.", 500);
  }
});

// POST / (Add account - Guarded by Free Quota: Max 1 bill account)
app.post(
  "/",
  verifyQuota("BILLS", countAccounts),
  validate(createAccountSchema),
  async (req, res) => {
    const {
      category_code,
      provider_name,
      customer_number,
      account_name,
      default_due_day,
    } = req.body;
    const accountId = uuidv4();

    try {
      // Parameterized INSERT
      await db.execute(
        `INSERT INTO utility_accounts (id, household_id, category_code, provider_name, customer_number, account_name, default_due_day)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          accountId,
          req.household.id,
          category_code,
          provider_name,
          customer_number,
          account_name,
          default_due_day || null,
        ],
      );

      return successResponse(
        res,
        {
          id: accountId,
          category_code,
          provider_name,
          customer_number,
          account_name,
          default_due_day,
        },
        "Akun tagihan berhasil ditambahkan",
        201,
      );
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return errorResponse(
          res,
          "Nomor pelanggan ini sudah terdaftar untuk penyedia tersebut di rumah ini.",
          409,
          null,
          "ERR_DUPLICATE",
        );
      }
      console.error("Create utility account error:", err);
      return errorResponse(res, "Gagal menambahkan akun tagihan.", 500);
    }
  },
);

// GET /bills (List bills for household)
app.get("/bills", async (req, res) => {
  const { status, period } = req.query;

  try {
    let query = `
      SELECT b.*, a.provider_name, a.category_code, a.account_name, a.customer_number
      FROM utility_bills b
      JOIN utility_accounts a ON b.account_id = a.id
      WHERE b.household_id = ?
    `;
    const params = [req.household.id];

    if (status) {
      query += " AND b.status = ?";
      params.push(status);
    }
    if (period) {
      query += " AND b.billing_period = ?";
      params.push(period);
    }

    query += " ORDER BY b.due_date ASC";

    const [bills] = await db.execute(query, params);
    return successResponse(res, bills);
  } catch (err) {
    console.error("Fetch bills error:", err);
    return errorResponse(res, "Gagal memuat daftar tagihan.", 500);
  }
});

// POST /bills (Create new bill)
app.post("/bills", validate(createBillSchema), async (req, res) => {
  const { account_id, billing_period, due_date, amount, notes } = req.body;
  const billId = uuidv4();

  try {
    const [accounts] = await db.execute(
      "SELECT id FROM utility_accounts WHERE id = ? AND household_id = ?",
      [account_id, req.household.id],
    );
    if (accounts.length === 0) {
      return errorResponse(
        res,
        "Akun tagihan tidak ditemukan atau tidak memiliki akses.",
        404,
      );
    }

    await db.execute(
      `INSERT INTO utility_bills (id, household_id, account_id, billing_period, due_date, amount, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'UNPAID', ?)`,
      [
        billId,
        req.household.id,
        account_id,
        billing_period,
        due_date,
        amount,
        notes || null,
      ],
    );

    return successResponse(
      res,
      {
        id: billId,
        account_id,
        billing_period,
        due_date,
        amount,
        status: "UNPAID",
      },
      "Tagihan berhasil dicatat",
      201,
    );
  } catch (err) {
    console.error("Create bill error:", err);
    return errorResponse(res, "Gagal mencatat tagihan.", 500);
  }
});

// PATCH /bills/:id/pay (Mark bill as paid)
app.patch("/bills/:id/pay", validate(payBillSchema), async (req, res) => {
  const billId = req.params.id;
  const { receipt_attachment_url, notes } = req.body;
  const paidAt = new Date();

  try {
    const [result] = await db.execute(
      `UPDATE utility_bills 
       SET status = 'PAID', paid_at = ?, paid_by_user_id = ?, receipt_attachment_url = ?, notes = COALESCE(?, notes)
       WHERE id = ? AND household_id = ?`,
      [
        paidAt,
        req.user.id,
        receipt_attachment_url || null,
        notes || null,
        billId,
        req.household.id,
      ],
    );

    if (result.affectedRows === 0) {
      return errorResponse(
        res,
        "Tagihan tidak ditemukan atau bukan milik rumah tangga ini.",
        404,
      );
    }

    return successResponse(
      res,
      { billId, status: "PAID", paidAt },
      "Tagihan berhasil ditandai lunas.",
    );
  } catch (err) {
    console.error("Pay bill error:", err);
    return errorResponse(res, "Gagal memproses pelunasan tagihan.", 500);
  }
});

app.listen(PORT, () => {
  console.log(`⚡ Utility & Bills Service running on port ${PORT}`);
});
