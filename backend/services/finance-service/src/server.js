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
const PORT = process.env.FINANCE_SERVICE_PORT || 8005;

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));
app.use(authenticate);

// Database connection pool for db_finance
const db = createDbPool("db_finance");

// Quota count helper for monthly expenses (max 5 for Free)
const countMonthlyExpenses = async (householdId) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const formattedStart = startOfMonth.toISOString().split("T")[0];

  const [rows] = await db.execute(
    "SELECT COUNT(*) as total FROM expenses WHERE household_id = ? AND expense_date >= ?",
    [householdId, formattedStart],
  );
  return rows[0].total;
};

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================
const createExpenseSchema = z.object({
  title: z.string().min(2, "Judul pengeluaran minimal 2 karakter").max(150),
  amount: z.number().positive("Nominal pengeluaran harus lebih besar dari 0"),
  expense_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD"),
  category: z.string().min(2).max(60),
  description: z.string().optional(),
  receipt_url: z.string().optional(),
  source_type: z
    .enum(["MANUAL", "UTILITY_BILL", "ASSET_MAINTENANCE"])
    .default("MANUAL"),
  source_reference_id: z.string().optional(),
  recorded_by_name: z.string().optional(),
  user_id: z.string().optional(),
});

const setBudgetSchema = z.object({
  period_month: z.string().regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM"),
  limit_amount: z.number().positive("Batas anggaran harus lebih dari 0"),
});

// =============================================================================
// ROUTES
// =============================================================================

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "Finance & Expense Service" });
});

// GET /monthly-comparison (Last 6 months trend comparison)
app.get("/monthly-comparison", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
         DATE_FORMAT(expense_date, '%Y-%m') as period_month,
         SUM(amount) as total_spent,
         COUNT(*) as transaction_count
       FROM expenses 
       WHERE household_id = ? 
         AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
       ORDER BY period_month ASC`,
      [req.household.id],
    );

    return successResponse(res, rows);
  } catch (err) {
    console.error("Fetch monthly comparison error:", err);
    return errorResponse(
      res,
      "Gagal memuat perbandingan pengeluaran bulanan.",
      500,
    );
  }
});

// GET / (List expenses for household)
app.get("/", async (req, res) => {
  const { month, category } = req.query;

  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    return errorResponse(res, "Format bulan tidak valid, gunakan YYYY-MM.", 400);
  }

  try {
    let query = "SELECT * FROM expenses WHERE household_id = ?";
    const params = [req.household.id];

    if (month) {
      query += " AND expense_date LIKE ?";
      params.push(`${month}%`);
    }
    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY expense_date DESC, created_at DESC";

    const [expenses] = await db.execute(query, params);
    return successResponse(res, expenses);
  } catch (err) {
    console.error("Fetch expenses error:", err);
    return errorResponse(res, "Gagal memuat daftar pengeluaran.", 500);
  }
});

// Helper function to normalize Indonesian currency amounts (handling . thousands and , or . decimals)
function normalizeIndonesianAmount(val) {
  if (val === null || val === undefined || val === "") return 0;

  // If already a number
  if (typeof val === "number") {
    return Math.round(val);
  }

  let s = String(val).trim();
  // Remove currency prefix
  s = s.replace(/^(?:rp\.?|idr)\s*/i, "").trim();

  // Strip trailing cents: ,00 or .00 or ,- or .-
  s = s.replace(/[,.]00$/, "");
  s = s.replace(/[,-]-$/, "");

  // Check for both dot and comma
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      // Indonesian format: 35.000,50 -> drop decimal part
      s = s.slice(0, lastComma).replace(/\./g, "");
    } else {
      // US format: 35,000.50 -> drop decimal part
      s = s.slice(0, lastDot).replace(/,/g, "");
    }
  } else if (lastDot !== -1) {
    const parts = s.split(".");
    if (parts.length > 2) {
      // Multiple dots: e.g. 1.250.000 -> 1250000
      s = s.replace(/\./g, "");
    } else if (parts.length === 2) {
      if (parts[1].length === 3) {
        // e.g. 35.000 -> 35000
        s = parts[0] + parts[1];
      } else if (parts[1].length === 2) {
        // e.g. 35000.50 (cents) -> 35000
        s = parts[0];
      } else {
        s = s.replace(/\./g, "");
      }
    }
  } else if (lastComma !== -1) {
    const parts = s.split(",");
    if (parts.length > 2) {
      s = s.replace(/,/g, "");
    } else if (parts.length === 2) {
      if (parts[1].length === 3) {
        // e.g. 35,000 -> 35000
        s = parts[0] + parts[1];
      } else if (parts[1].length === 2) {
        // e.g. 35000,00 -> 35000
        s = parts[0];
      } else {
        s = s.replace(/,/g, "");
      }
    }
  }

  const cleanDigits = s.replace(/[^0-9]/g, "");
  return parseInt(cleanDigits || "0", 10);
}

// POST /scan-receipt (Server-Side Google Gemini Vision AI OCR)
app.post("/scan-receipt", async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return errorResponse(
      res,
      "Gambar struk (imageBase64) wajib disertakan.",
      400,
    );
  }

  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return errorResponse(
      res,
      "GEMINI_API_KEY belum dikonfigurasi pada file .env di backend server.",
      503,
      null,
      "ERR_GEMINI_KEY_NOT_CONFIGURED",
    );
  }

  try {
    let cleanBase64 = imageBase64;
    let mimeType = "image/jpeg";
    if (imageBase64.includes(";base64,")) {
      const parts = imageBase64.split(";base64,");
      mimeType = parts[0].replace("data:", "");
      cleanBase64 = parts[1];
    }

    const prompt = `Anda adalah asisten akuntansi rumah tangga profesional Indonesia. Analisis foto struk / nota belanja ini.
Lakukan ekstraksi data terstruktur dengan sangat teliti.

PERHATIAN KHUSUS FORMAT NOMINAL RUPIAH (IDR):
1. Format Indonesia menggunakan titik (.) sebagai pemisah ribuan dan koma (,) sebagai desimal sen (contoh: 35.000,00 atau 35.000).
2. JANGAN PERNAH memasukkan angka desimal sen (,00 atau .00) ke dalam nominal rupiah!
   - Contoh: Jika tertulis "Rp 35.000,00" atau "35,000.00" atau "35.000" maka "amount" HARUS bernilai angka 35000 (tiga puluh lima ribu), BUKAN 3500000 dan BUKAN 35!
   - Contoh: Jika tertulis "Rp 124.500" maka "amount" HARUS bernilai 124500 (BUKAN 124.5).
   - Contoh: Jika tertulis "87.500,-" maka "amount" HARUS bernilai 87500.
   - Contoh: Jika tertulis "1.250.000" maka "amount" HARUS bernilai 1250000.
3. Ambil angka GRAND TOTAL / TOTAL BAYAR belanja (bukan uang tunai yang diserahkan dan bukan uang kembalian/change).
4. Nilai "amount" pada JSON HARUS berupa angka integer bulat murni tanpa desimal dan tanpa titik/koma.

Hasilkan output HANYA berupa JSON valid dengan format persis:
{
  "title": "Nama toko / merchant / penyedia layanan (misal: Indomaret Point, Superindo Tebet, SPBU Shell, Tokopedia, PLN)",
  "amount": 0,
  "expense_date": "YYYY-MM-DD",
  "category": "Pilih satu: 'Belanja Bulanan' | 'Kebutuhan Dapur' | 'Tagihan & Utilitas' | 'Transportasi & Bensin' | 'Servis & Pemeliharaan' | 'Pendidikan & Les' | 'Kesehatan & Medis' | 'Gaya Hidup & Hiburan' | 'Lainnya'",
  "description": "Rincian singkat item belanjaan yang dibeli beserta kuantitasnya"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: cleanBase64 } },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const errObj = await response.json().catch(() => ({}));
      console.error("Gemini Vision AI upstream error:", errObj);
      return errorResponse(
        res,
        errObj.error?.message ||
          `Gemini API mengembalikan status ${response.status}`,
        response.status,
      );
    }

    const resJson = await response.json();
    const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return errorResponse(
        res,
        "Gemini Vision AI tidak mengembalikan teks hasil pemindaian.",
        500,
      );
    }

    const cleanJson = rawText
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsedData = JSON.parse(cleanJson);

    // Sanitize amount with robust Indonesian currency normalizer
    parsedData.amount = normalizeIndonesianAmount(parsedData.amount);

    return successResponse(
      res,
      parsedData,
      "Struk berhasil dianalisis dengan Google Gemini Vision AI di backend server.",
    );
  } catch (err) {
    console.error("Backend receipt scan error:", err);
    return errorResponse(
      res,
      "Gagal memproses struk dengan AI di server: " + err.message,
      500,
    );
  }
});

// POST / (Add expense - Guarded by Free Quota: Max 5 per month)
app.post(
  "/",
  verifyQuota("EXPENSES", countMonthlyExpenses),
  validate(createExpenseSchema),
  async (req, res) => {
    const expenseId = uuidv4();
    const {
      title,
      amount,
      expense_date,
      category,
      description,
      receipt_url,
      source_type,
      source_reference_id,
    } = req.body;

    try {
      await db.execute(
        `INSERT INTO expenses (id, household_id, user_id, title, amount, expense_date, category, description, receipt_url, source_type, source_reference_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          expenseId,
          req.household.id,
          req.user.id,
          title,
          amount,
          expense_date,
          category,
          description || null,
          receipt_url || null,
          source_type || "MANUAL",
          source_reference_id || null,
        ],
      );

      return successResponse(
        res,
        { id: expenseId, ...req.body },
        "Pengeluaran berhasil dicatat",
        201,
      );
    } catch (err) {
      console.error("Create expense error:", err);
      return errorResponse(res, "Gagal mencatat pengeluaran.", 500);
    }
  },
);

// GET /summary (Monthly analytics & category breakdown)
app.get("/summary", async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7); // YYYY-MM

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return errorResponse(res, "Format bulan tidak valid, gunakan YYYY-MM.", 400);
  }

  try {
    // Total spent
    const [totalRows] = await db.execute(
      "SELECT SUM(amount) as total_spent, COUNT(*) as total_entries FROM expenses WHERE household_id = ? AND expense_date LIKE ?",
      [req.household.id, `${month}%`],
    );

    // Breakdown by category
    const [categoryRows] = await db.execute(
      `SELECT category, SUM(amount) as category_total, COUNT(*) as count
       FROM expenses 
       WHERE household_id = ? AND expense_date LIKE ?
       GROUP BY category
       ORDER BY category_total DESC`,
      [req.household.id, `${month}%`],
    );

    // Budget limit for this month
    const [budgetRows] = await db.execute(
      "SELECT limit_amount FROM budgets WHERE household_id = ? AND period_month = ?",
      [req.household.id, month],
    );

    const totalSpent = parseFloat(totalRows[0].total_spent || 0);
    const budgetLimit =
      budgetRows.length > 0 ? parseFloat(budgetRows[0].limit_amount) : 10000000; // Default 10jt

    return successResponse(res, {
      month,
      totalSpent,
      totalEntries: totalRows[0].total_entries || 0,
      budgetLimit,
      remainingBudget: Math.max(0, budgetLimit - totalSpent),
      percentageUsed:
        budgetLimit > 0 ? Math.round((totalSpent / budgetLimit) * 100) : 0,
      categories: categoryRows,
    });
  } catch (err) {
    console.error("Fetch finance summary error:", err);
    return errorResponse(res, "Gagal memuat ringkasan keuangan.", 500);
  }
});

// GET /budget (Get monthly budget for household)
app.get("/budget", async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return errorResponse(res, "Format bulan tidak valid, gunakan YYYY-MM.", 400);
  }

  try {
    const [rows] = await db.execute(
      "SELECT * FROM budgets WHERE household_id = ? AND period_month = ?",
      [req.household.id, month],
    );
    const limitAmount =
      rows.length > 0 ? parseFloat(rows[0].limit_amount) : 10000000;
    return successResponse(res, {
      period_month: month,
      limit_amount: limitAmount,
      is_custom: rows.length > 0,
    });
  } catch (err) {
    console.error("Fetch budget error:", err);
    return errorResponse(res, "Gagal memuat anggaran.", 500);
  }
});

// POST /budget (Set or update monthly budget)
app.post("/budget", validate(setBudgetSchema), async (req, res) => {
  const { period_month, limit_amount } = req.body;
  const budgetId = uuidv4();

  try {
    await db.execute(
      `INSERT INTO budgets (id, household_id, period_month, limit_amount)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE limit_amount = VALUES(limit_amount)`,
      [budgetId, req.household.id, period_month, limit_amount],
    );

    return successResponse(
      res,
      { period_month, limit_amount },
      "Anggaran bulanan berhasil disimpan.",
    );
  } catch (err) {
    console.error("Save budget error:", err);
    return errorResponse(res, "Gagal menyimpan anggaran.", 500);
  }
});

app.listen(PORT, () => {
  console.log(`💰 Finance & Expense Service running on port ${PORT}`);
});
