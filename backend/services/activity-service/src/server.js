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

const app = express();
const PORT = process.env.ACTIVITY_SERVICE_PORT || 8006;

app.use(cors());
app.use(express.json());
app.use(authenticate);

// Database connection pool for db_activity
const db = createDbPool("db_activity");

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================
const createActivitySchema = z.object({
  title: z.string().min(2, "Judul aktivitas minimal 2 karakter").max(150),
  activity_type: z.string().min(2, "Tipe aktivitas minimal 2 karakter").max(50),
  start_datetime: z.string().min(10, "Format tanggal waktu harus valid"),
  end_datetime: z.string().optional(),
  location: z.string().max(200).optional(),
  reminder_minutes_before: z.number().int().nonnegative().default(30),
  notes: z.string().optional().nullable(),
  attendee_user_ids: z.array(z.string()).optional(),
  is_recurring: z.boolean().optional(),
  is_master: z.boolean().optional(),
  recurrence_group_id: z.string().optional().nullable(),
  recurrence_rule: z.string().optional().nullable(),
  recurrence_summary: z.string().optional().nullable(),
  activities: z.array(z.any()).optional(),
  created_by_name: z.string().optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "UP", service: "Activity & Calendar Service" });
});

// GET / (List activities for household)
app.get("/", async (req, res) => {
  const { date, type } = req.query;

  try {
    let query = `
      SELECT a.*, 
        (SELECT COUNT(*) FROM activity_attendees at WHERE at.activity_id = a.id) as attendees_count
      FROM activities a 
      WHERE a.household_id = ?
    `;
    const params = [req.household.id];

    if (date) {
      query += " AND DATE(a.start_datetime) = ?";
      params.push(date);
    }
    if (type) {
      query += " AND a.activity_type = ?";
      params.push(type);
    }

    query += " ORDER BY a.start_datetime ASC";

    const [activities] = await db.execute(query, params);
    return successResponse(res, activities);
  } catch (err) {
    console.error("Fetch activities error:", err);
    return errorResponse(res, "Gagal memuat agenda aktivitas keluarga.", 500);
  }
});

// POST / (Create activity or recurring bulk activities)
app.post("/", validate(createActivitySchema), async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Check if bulk activities are passed (from recurring generator)
    if (
      req.body.activities &&
      Array.isArray(req.body.activities) &&
      req.body.activities.length > 0
    ) {
      const createdItems = [];
      let idx = 0;
      for (const item of req.body.activities) {
        const activityId = item.id || uuidv4();
        const isMasterVal =
          item.is_master !== undefined ? item.is_master : idx === 0;
        await connection.execute(
          `INSERT INTO activities (id, household_id, created_by_user_id, title, activity_type, start_datetime, end_datetime, location, reminder_minutes_before, notes, recurrence_group_id, recurrence_rule, recurrence_summary, is_master)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            activityId,
            req.household.id,
            req.user.id,
            item.title || req.body.title,
            item.activity_type || req.body.activity_type,
            item.start_datetime,
            item.end_datetime || null,
            item.location || req.body.location || null,
            item.reminder_minutes_before !== undefined
              ? item.reminder_minutes_before
              : req.body.reminder_minutes_before || 30,
            item.notes || req.body.notes || null,
            item.recurrence_group_id || req.body.recurrence_group_id || null,
            item.recurrence_rule || req.body.recurrence_rule || null,
            item.recurrence_summary || req.body.recurrence_summary || null,
            isMasterVal ? 1 : 0,
          ],
        );
        createdItems.push({ id: activityId, ...item, is_master: isMasterVal });
        idx++;
      }

      await connection.commit();
      return successResponse(
        res,
        { createdCount: createdItems.length, activities: createdItems },
        "Seluruh agenda jadwal berulang berhasil disimpan",
        201,
      );
    }

    // Single activity
    const activityId = uuidv4();
    const {
      title,
      activity_type,
      start_datetime,
      end_datetime,
      location,
      reminder_minutes_before,
      notes,
      attendee_user_ids,
      recurrence_group_id,
      recurrence_rule,
      recurrence_summary,
      is_master,
    } = req.body;

    await connection.execute(
      `INSERT INTO activities (id, household_id, created_by_user_id, title, activity_type, start_datetime, end_datetime, location, reminder_minutes_before, notes, recurrence_group_id, recurrence_rule, recurrence_summary, is_master)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activityId,
        req.household.id,
        req.user.id,
        title,
        activity_type,
        start_datetime,
        end_datetime || null,
        location || null,
        reminder_minutes_before || 30,
        notes || null,
        recurrence_group_id || null,
        recurrence_rule || null,
        recurrence_summary || null,
        is_master ? 1 : 0,
      ],
    );

    // Add attendees if provided
    if (attendee_user_ids && attendee_user_ids.length > 0) {
      for (const uid of attendee_user_ids) {
        const attendeeId = uuidv4();
        await connection.execute(
          'INSERT INTO activity_attendees (id, activity_id, user_id, status) VALUES (?, ?, ?, "ATTENDING")',
          [attendeeId, activityId, uid],
        );
      }
    }

    await connection.commit();

    return successResponse(
      res,
      { id: activityId, ...req.body },
      "Agenda aktivitas berhasil dibuat",
      201,
    );
  } catch (err) {
    await connection.rollback();
    console.error("Create activity error:", err);
    return errorResponse(res, "Gagal membuat agenda aktivitas.", 500);
  } finally {
    connection.release();
  }
});

// PUT /:id (Update activity or entire recurring series if ?update_series=true)
app.put("/:id", async (req, res) => {
  const activityId = req.params.id;
  const { update_series } = req.query;
  const {
    title,
    activity_type,
    start_datetime,
    end_datetime,
    location,
    reminder_minutes_before,
    notes,
  } = req.body;

  try {
    if (update_series === "true") {
      // Find recurrence_group_id
      const [found] = await db.execute(
        "SELECT recurrence_group_id FROM activities WHERE id = ? AND household_id = ?",
        [activityId, req.household.id],
      );

      if (found.length > 0 && found[0].recurrence_group_id) {
        const groupId = found[0].recurrence_group_id;
        await db.execute(
          `UPDATE activities 
           SET title = COALESCE(?, title),
               activity_type = COALESCE(?, activity_type),
               location = ?,
               reminder_minutes_before = COALESCE(?, reminder_minutes_before),
               notes = ?
           WHERE recurrence_group_id = ? AND household_id = ?`,
          [
            title || null,
            activity_type || null,
            location !== undefined ? location : null,
            reminder_minutes_before !== undefined
              ? reminder_minutes_before
              : null,
            notes !== undefined ? notes : null,
            groupId,
            req.household.id,
          ],
        );

        return successResponse(
          res,
          { recurrence_group_id: groupId, ...req.body },
          "Seluruh rangkaian jadwal berulang berhasil diperbarui dari Master.",
        );
      }
    }

    // Update single activity
    const [result] = await db.execute(
      `UPDATE activities 
       SET title = COALESCE(?, title),
           activity_type = COALESCE(?, activity_type),
           start_datetime = COALESCE(?, start_datetime),
           end_datetime = ?,
           location = ?,
           reminder_minutes_before = COALESCE(?, reminder_minutes_before),
           notes = ?
       WHERE id = ? AND household_id = ?`,
      [
        title || null,
        activity_type || null,
        start_datetime || null,
        end_datetime !== undefined ? end_datetime : null,
        location !== undefined ? location : null,
        reminder_minutes_before !== undefined ? reminder_minutes_before : null,
        notes !== undefined ? notes : null,
        activityId,
        req.household.id,
      ],
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, "Aktivitas tidak ditemukan.", 404);
    }

    return successResponse(
      res,
      { id: activityId, ...req.body },
      "Agenda aktivitas berhasil diperbarui.",
    );
  } catch (err) {
    console.error("Update activity error:", err);
    return errorResponse(res, "Gagal memperbarui aktivitas.", 500);
  }
});

// DELETE /:id (supports ?all_recurring=true)
app.delete("/:id", async (req, res) => {
  const activityId = req.params.id;
  const { all_recurring } = req.query;

  try {
    if (all_recurring === "true") {
      // Find the activity's recurrence_group_id first
      const [found] = await db.execute(
        "SELECT recurrence_group_id FROM activities WHERE id = ? AND household_id = ?",
        [activityId, req.household.id],
      );

      if (found.length > 0 && found[0].recurrence_group_id) {
        const groupId = found[0].recurrence_group_id;
        const [delResult] = await db.execute(
          "DELETE FROM activities WHERE recurrence_group_id = ? AND household_id = ?",
          [groupId, req.household.id],
        );
        return successResponse(
          res,
          { recurrence_group_id: groupId, deletedRows: delResult.affectedRows },
          "Seluruh jadwal aktivitas berulang berhasil dihapus.",
        );
      }
    }

    const [result] = await db.execute(
      "DELETE FROM activities WHERE id = ? AND household_id = ?",
      [activityId, req.household.id],
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, "Aktivitas tidak ditemukan.", 404);
    }

    return successResponse(
      res,
      { id: activityId },
      "Agenda aktivitas berhasil dihapus.",
    );
  } catch (err) {
    console.error("Delete activity error:", err);
    return errorResponse(res, "Gagal menghapus aktivitas.", 500);
  }
});

app.listen(PORT, () => {
  console.log(`📅 Activity & Calendar Service running on port ${PORT}`);
});
