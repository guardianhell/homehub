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
const PORT = process.env.GROCERY_SERVICE_PORT || 8004;

app.use(cors());
app.use(express.json());
app.use(authenticate);

// Database connection pool for db_grocery
const db = createDbPool("db_grocery");

// Quota count helper for pantry items (max 3 for Free)
const countItems = async (householdId) => {
  const [rows] = await db.execute(
    "SELECT COUNT(*) as total FROM shopping_items WHERE household_id = ?",
    [householdId],
  );
  return rows[0].total;
};

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================
const createItemSchema = z.object({
  name: z.string().min(2, "Nama bahan/barang minimal 2 karakter").max(120),
  category: z.string().max(60).default("Bumbu Dapur"),
  quantity: z.string().max(50).optional(),
  stock_status: z
    .enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"])
    .default("OUT_OF_STOCK"),
  estimated_price: z.number().nonnegative().default(0).optional(),
  actual_price: z.number().nonnegative().optional().nullable(),
  notes: z.string().max(255).optional(),
  created_by_name: z.string().optional(),
  bought_by_name: z.string().optional(),
});

const updateStatusSchema = z.object({
  stock_status: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]).optional(),
  is_bought: z.boolean().optional(),
  bought_by_name: z.string().optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "Pantry & Grocery Service" });
});

// GET / (List shopping and pantry items for household)
app.get("/", async (req, res) => {
  const { status, category } = req.query;

  try {
    let query =
      "SELECT * FROM shopping_items WHERE household_id = ? ORDER BY is_bought ASC, created_at DESC";
    const params = [req.household.id];

    const [items] = await db.execute(query, params);
    return successResponse(res, items);
  } catch (err) {
    console.error("Fetch shopping items error:", err);
    return errorResponse(res, "Gagal memuat catatan kebutuhan dapur.", 500);
  }
});

// POST / (Add item - Guarded by Free Quota: Max 3 items)
app.post(
  "/",
  verifyQuota("PANTRY", countItems),
  validate(createItemSchema),
  async (req, res) => {
    const itemId = uuidv4();
    const {
      name,
      category,
      quantity,
      stock_status,
      estimated_price,
      actual_price,
      notes,
    } = req.body;

    try {
      await db.execute(
        `INSERT INTO shopping_items (id, household_id, name, category, quantity, stock_status, estimated_price, actual_price, is_bought, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?)`,
        [
          itemId,
          req.household.id,
          name,
          category || "Bumbu Dapur",
          quantity || null,
          stock_status || "OUT_OF_STOCK",
          estimated_price || 0,
          actual_price || null,
          notes || null,
        ],
      );

      return successResponse(
        res,
        {
          id: itemId,
          name,
          category,
          quantity,
          stock_status,
          estimated_price: estimated_price || 0,
          actual_price: actual_price || null,
          is_bought: false,
          notes,
        },
        "Catatan belanja berhasil ditambahkan",
        201,
      );
    } catch (err) {
      console.error("Create shopping item error:", err);
      return errorResponse(res, "Gagal menambahkan catatan belanja.", 500);
    }
  },
);

// PATCH /:id/toggle (Toggle bought status with actual price and date)
app.patch("/:id/toggle", async (req, res) => {
  const itemId = req.params.id;
  const { is_bought, actual_price, bought_at: customBoughtAt } = req.body || {};

  try {
    const [current] = await db.execute(
      "SELECT is_bought, actual_price FROM shopping_items WHERE id = ? AND household_id = ?",
      [itemId, req.household.id],
    );

    if (current.length === 0) {
      return errorResponse(res, "Barang tidak ditemukan.", 404);
    }

    const nextState =
      is_bought !== undefined ? Boolean(is_bought) : !current[0].is_bought;
    const boughtAt = nextState
      ? customBoughtAt
        ? new Date(customBoughtAt)
        : new Date()
      : null;
    const boughtBy = nextState ? req.user.id : null;
    const finalActualPrice = nextState
      ? actual_price !== undefined
        ? actual_price
        : current[0].actual_price
      : null;

    await db.execute(
      `UPDATE shopping_items 
       SET is_bought = ?, bought_at = ?, bought_by_user_id = ?, 
           actual_price = ?,
           stock_status = IF(? = TRUE, 'IN_STOCK', 'OUT_OF_STOCK')
       WHERE id = ? AND household_id = ?`,
      [
        nextState,
        boughtAt,
        boughtBy,
        finalActualPrice,
        nextState,
        itemId,
        req.household.id,
      ],
    );

    return successResponse(
      res,
      {
        id: itemId,
        is_bought: nextState,
        actual_price: finalActualPrice,
        bought_at: boughtAt,
      },
      "Status pembelian diperbarui.",
    );
  } catch (err) {
    console.error("Toggle item error:", err);
    return errorResponse(res, "Gagal memperbarui status belanja.", 500);
  }
});

// DELETE /:id
app.delete("/:id", async (req, res) => {
  const itemId = req.params.id;

  try {
    const [result] = await db.execute(
      "DELETE FROM shopping_items WHERE id = ? AND household_id = ?",
      [itemId, req.household.id],
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, "Barang tidak ditemukan.", 404);
    }

    return successResponse(res, { id: itemId }, "Barang berhasil dihapus.");
  } catch (err) {
    console.error("Delete item error:", err);
    return errorResponse(res, "Gagal menghapus barang.", 500);
  }
});

// PUT /:id (Update shopping item details)
app.put("/:id", async (req, res) => {
  const itemId = req.params.id;
  const {
    name,
    category,
    quantity,
    stock_status,
    estimated_price,
    actual_price,
    notes,
  } = req.body;

  try {
    const [result] = await db.execute(
      `UPDATE shopping_items 
       SET name = COALESCE(?, name),
           category = COALESCE(?, category),
           quantity = ?,
           stock_status = COALESCE(?, stock_status),
           estimated_price = COALESCE(?, estimated_price),
           actual_price = COALESCE(?, actual_price),
           notes = ?
       WHERE id = ? AND household_id = ?`,
      [
        name || null,
        category || null,
        quantity || null,
        stock_status || null,
        estimated_price !== undefined ? estimated_price : null,
        actual_price !== undefined ? actual_price : null,
        notes || null,
        itemId,
        req.household.id,
      ],
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, "Barang tidak ditemukan.", 404);
    }

    return successResponse(
      res,
      { id: itemId, ...req.body },
      "Catatan belanja berhasil diperbarui.",
    );
  } catch (err) {
    console.error("Update item error:", err);
    return errorResponse(res, "Gagal memperbarui catatan belanja.", 500);
  }
});

app.listen(PORT, () => {
  console.log(`🛒 Pantry & Grocery Service running on port ${PORT}`);
});
