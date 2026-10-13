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
const PORT = process.env.ASSET_SERVICE_PORT || 8003;

app.use(cors());
app.use(express.json());
app.use(authenticate);

// Database connection pool for db_asset
const db = createDbPool("db_asset");

// Quota count helper for registered assets (max 2 for Free)
const countAssets = async (householdId) => {
  const [rows] = await db.execute(
    'SELECT COUNT(*) as total FROM assets WHERE household_id = ? AND status != "DISPOSED"',
    [householdId],
  );
  return rows[0].total;
};

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================
const createAssetSchema = z.object({
  asset_type: z.string().min(2, "Tipe aset minimal 2 karakter").max(50),
  category: z.string().min(2, "Kategori minimal 2 karakter").max(50),
  name: z.string().min(2, "Nama aset minimal 2 karakter").max(120),
  brand: z.string().max(80).optional(),
  model_type: z.string().max(100).optional(),
  serial_or_plate_number: z.string().max(100).optional(),
  location_room: z.string().max(80).optional(),
  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD")
    .optional(),
  purchase_price: z
    .number()
    .nonnegative("Harga pembelian tidak boleh negatif")
    .optional(),
  warranty_expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD")
    .optional(),
  service_center_contact: z.string().optional(),
  invoice_url: z.string().optional(),
  current_odometer: z.number().int().nonnegative().optional().nullable(),
});

const createScheduleSchema = z.object({
  title: z.string().min(2, "Judul jadwal minimal 2 karakter").max(120),
  frequency_type: z.enum(["DAYS", "MONTHS", "ODOMETER", "WHICHEVER_FIRST"]),
  frequency_value: z
    .number()
    .int()
    .positive("Frekuensi harus bernilai positif"),
  frequency_months: z.number().int().positive().optional().nullable(),
  frequency_km: z.number().int().positive().optional().nullable(),
  next_due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD")
    .optional()
    .nullable(),
  next_due_odometer: z.number().int().nonnegative().optional().nullable(),
});

const createLogSchema = z.object({
  performed_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD"),
  vendor_name: z.string().max(120).optional(),
  vendor_phone: z.string().max(30).optional(),
  cost: z.number().nonnegative("Biaya tidak boleh negatif").default(0),
  current_odometer: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  receipt_url: z.string().optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "Asset & Vehicle Service" });
});

// GET / (List assets for household with maintenance schedules)
app.get("/", async (req, res) => {
  const { type, category } = req.query;

  try {
    let query = `
      SELECT a.*, 
        DATEDIFF(a.warranty_expiry_date, CURDATE()) as warranty_days_remaining,
        (SELECT COUNT(*) FROM maintenance_schedules s WHERE s.asset_id = a.id AND s.is_active = TRUE) as active_schedules_count,
        (SELECT COUNT(*) FROM maintenance_logs l WHERE l.asset_id = a.id) as logs_count
      FROM assets a
      WHERE a.household_id = ? AND a.status != 'DISPOSED'
    `;
    const params = [req.household.id];

    if (type) {
      query += " AND a.asset_type = ?";
      params.push(type);
    }
    if (category) {
      query += " AND a.category = ?";
      params.push(category);
    }

    query += " ORDER BY a.created_at DESC";

    const [assets] = await db.execute(query, params);
    return successResponse(res, assets);
  } catch (err) {
    console.error("Fetch assets error:", err);
    return errorResponse(res, "Gagal memuat inventaris aset.", 500);
  }
});

// POST / (Create asset - Guarded by Free Quota: Max 2 assets)
app.post(
  "/",
  verifyQuota("ASSETS", countAssets),
  validate(createAssetSchema),
  async (req, res) => {
    const assetId = uuidv4();
    const {
      asset_type,
      category,
      name,
      brand,
      model_type,
      serial_or_plate_number,
      location_room,
      purchase_date,
      purchase_price,
      warranty_expiry_date,
      service_center_contact,
      invoice_url,
      current_odometer,
    } = req.body;

    try {
      await db.execute(
        `INSERT INTO assets 
       (id, household_id, asset_type, category, name, brand, model_type, 
        serial_or_plate_number, location_room, purchase_date, purchase_price, 
        warranty_expiry_date, service_center_contact, invoice_url, current_odometer, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [
          assetId,
          req.household.id,
          asset_type,
          category,
          name,
          brand || null,
          model_type || null,
          serial_or_plate_number || null,
          location_room || null,
          purchase_date || null,
          purchase_price || null,
          warranty_expiry_date || null,
          service_center_contact || null,
          invoice_url || null,
          current_odometer || null,
        ],
      );

      return successResponse(
        res,
        { id: assetId, ...req.body, status: "ACTIVE" },
        "Aset berhasil didaftarkan",
        201,
      );
    } catch (err) {
      console.error("Create asset error:", err);
      return errorResponse(res, "Gagal menambahkan aset.", 500);
    }
  },
);

// GET /:id (Get asset details with schedules & logs)
app.get("/:id", async (req, res) => {
  const assetId = req.params.id;

  try {
    const [assets] = await db.execute(
      "SELECT * FROM assets WHERE id = ? AND household_id = ?",
      [assetId, req.household.id],
    );

    if (assets.length === 0) {
      return errorResponse(res, "Aset tidak ditemukan.", 404);
    }

    const [schedules] = await db.execute(
      "SELECT * FROM maintenance_schedules WHERE asset_id = ? ORDER BY created_at DESC",
      [assetId],
    );

    const [logs] = await db.execute(
      "SELECT * FROM maintenance_logs WHERE asset_id = ? ORDER BY performed_date DESC",
      [assetId],
    );

    return successResponse(res, {
      asset: assets[0],
      schedules,
      logs,
    });
  } catch (err) {
    console.error("Fetch asset details error:", err);
    return errorResponse(res, "Gagal memuat detail aset.", 500);
  }
});

// POST /:id/schedules (Add maintenance schedule e.g. cuci AC, ganti oli)
app.post("/:id/schedules", validate(createScheduleSchema), async (req, res) => {
  const assetId = req.params.id;
  const scheduleId = uuidv4();
  const {
    title,
    frequency_type,
    frequency_value,
    frequency_months,
    frequency_km,
    next_due_date,
    next_due_odometer,
  } = req.body;

  try {
    await db.execute(
      `INSERT INTO maintenance_schedules 
       (id, asset_id, title, frequency_type, frequency_value, frequency_months, frequency_km, next_due_date, next_due_odometer, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        scheduleId,
        assetId,
        title,
        frequency_type,
        frequency_value,
        frequency_months ||
          (frequency_type === "MONTHS" ? frequency_value : null),
        frequency_km ||
          (frequency_type === "ODOMETER" ? frequency_value : null),
        next_due_date || null,
        next_due_odometer || null,
      ],
    );

    return successResponse(
      res,
      { id: scheduleId, asset_id: assetId, ...req.body },
      "Jadwal servis berhasil ditambahkan",
      201,
    );
  } catch (err) {
    console.error("Create schedule error:", err);
    return errorResponse(res, "Gagal menambahkan jadwal pemeliharaan.", 500);
  }
});

// POST /:id/logs (Record performed maintenance)
app.post("/:id/logs", validate(createLogSchema), async (req, res) => {
  const assetId = req.params.id;
  const logId = uuidv4();
  const {
    performed_date,
    vendor_name,
    vendor_phone,
    cost,
    current_odometer,
    notes,
    receipt_url,
  } = req.body;

  try {
    await db.execute(
      `INSERT INTO maintenance_logs 
       (id, asset_id, household_id, performed_date, vendor_name, vendor_phone, cost, current_odometer, notes, receipt_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        assetId,
        req.household.id,
        performed_date,
        vendor_name || null,
        vendor_phone || null,
        cost,
        current_odometer || null,
        notes || null,
        receipt_url || null,
      ],
    );

    return successResponse(
      res,
      { id: logId, asset_id: assetId, ...req.body },
      "Log servis berhasil dicatat",
      201,
    );
  } catch (err) {
    console.error("Create maintenance log error:", err);
    return errorResponse(res, "Gagal mencatat log servis.", 500);
  }
});

// DELETE /:id/schedules/:scheduleId (Delete a maintenance schedule)
app.delete("/:id/schedules/:scheduleId", async (req, res) => {
  const { id: assetId, scheduleId } = req.params;

  try {
    const [result] = await db.execute(
      "DELETE FROM maintenance_schedules WHERE id = ? AND asset_id = ?",
      [scheduleId, assetId],
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, "Jadwal servis tidak ditemukan.", 404);
    }

    return successResponse(
      res,
      { id: scheduleId },
      "Jadwal servis berhasil dihapus",
    );
  } catch (err) {
    console.error("Delete schedule error:", err);
    return errorResponse(res, "Gagal menghapus jadwal pemeliharaan.", 500);
  }
});

// DELETE /:id/logs/:logId (Delete a maintenance log)
app.delete("/:id/logs/:logId", async (req, res) => {
  const { id: assetId, logId } = req.params;

  try {
    const [result] = await db.execute(
      "DELETE FROM maintenance_logs WHERE id = ? AND asset_id = ?",
      [logId, assetId],
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, "Log servis tidak ditemukan.", 404);
    }

    return successResponse(
      res,
      { id: logId },
      "Log riwayat servis berhasil dihapus",
    );
  } catch (err) {
    console.error("Delete maintenance log error:", err);
    return errorResponse(res, "Gagal menghapus log servis.", 500);
  }
});

app.listen(PORT, () => {
  console.log(`❄️ Asset & Vehicle Service running on port ${PORT}`);
});
