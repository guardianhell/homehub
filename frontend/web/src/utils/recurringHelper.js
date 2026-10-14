/**
 * recurringHelper.js
 * Utility to generate recurring calendar occurrences for family activities.
 */

export const DAY_NAMES_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
export const DAY_NAMES_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const DAY_SHORT_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
export const DAY_SHORT_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MONTH_NAMES_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
export const MONTH_NAMES_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pad = (n) => String(n).padStart(2, "0");

/**
 * Format a Date object to 'YYYY-MM-DD HH:mm:ss'
 */
export function formatDatetimeDb(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

/**
 * Format a Date object to 'YYYY-MM-DD'
 */
export function formatDateDb(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Generate human readable recurring summary like "Setiap Selasa" or "Every Tuesday"
 */
export function getRecurrenceSummary(pattern, daysOfWeek, lang = "id") {
  const dayNames = lang === "id" ? DAY_NAMES_ID : DAY_NAMES_EN;
  const prefix = lang === "id" ? "Setiap" : "Every";

  if (pattern === "DAILY") {
    return lang === "id" ? "Setiap Hari" : "Every Day";
  }

  if (pattern === "MONTHLY") {
    return lang === "id" ? "Setiap Bulan" : "Every Month";
  }

  if (daysOfWeek && daysOfWeek.length > 0) {
    const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
    const dayLabels = sortedDays.map((d) => dayNames[d]).join(", ");
    if (pattern === "BIWEEKLY") {
      return lang === "id"
        ? `Setiap 2 Minggu (${dayLabels})`
        : `Every 2 Weeks (${dayLabels})`;
    }
    return `${prefix} ${dayLabels}`;
  }

  return lang === "id" ? "Mingguan" : "Weekly";
}

/**
 * Calculates recurring date occurrences between start_datetime and recurrence_end_date
 *
 * @param {Object} baseActivity
 * @param {Object} recurrenceConfig
 * @param {string} lang - 'id' | 'en'
 * @returns {Array} Array of activity objects
 */
export function generateRecurringOccurrences(
  baseActivity,
  recurrenceConfig,
  lang = "id",
) {
  const {
    is_recurring = false,
    recurrence_pattern = "WEEKLY",
    recurrence_days = [],
    recurrence_end_date = "",
  } = recurrenceConfig;

  // If not recurring or no end date, return the single base activity
  if (!is_recurring || !recurrence_end_date) {
    return [baseActivity];
  }

  const startDate = new Date(baseActivity.start_datetime);
  if (isNaN(startDate.getTime())) {
    return [baseActivity];
  }

  // End date boundary at end of that day: 23:59:59
  const endDateLimit = new Date(`${recurrence_end_date}T23:59:59`);
  if (isNaN(endDateLimit.getTime()) || endDateLimit < startDate) {
    return [baseActivity];
  }

  // Calculate duration between start and end if specified
  let durationMs = 0;
  if (baseActivity.end_datetime) {
    const originalEnd = new Date(baseActivity.end_datetime);
    if (!isNaN(originalEnd.getTime()) && originalEnd > startDate) {
      durationMs = originalEnd.getTime() - startDate.getTime();
    }
  }

  const occurrences = [];
  const recurrenceGroupId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startHour = startDate.getHours();
  const startMinute = startDate.getMinutes();

  // Determine target days (default to startDate's day of week if empty)
  const targetDays =
    recurrence_days.length > 0 ? recurrence_days : [startDate.getDay()];
  const recurrenceSummary = getRecurrenceSummary(
    recurrence_pattern,
    targetDays,
    lang,
  );
  const recurrenceRule = `${recurrence_pattern}:${targetDays.join(",")}`;

  // Max occurrence safety limit: 120 sessions
  const MAX_LIMIT = 120;

  if (recurrence_pattern === "WEEKLY" || recurrence_pattern === "BIWEEKLY") {
    let curr = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const initialDayMidnight = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    ).getTime();

    while (curr <= endDateLimit && occurrences.length < MAX_LIMIT) {
      const dayOfWeek = curr.getDay();

      let isAllowedWeek = true;
      if (recurrence_pattern === "BIWEEKLY") {
        const diffDays = Math.round(
          (curr.getTime() - initialDayMidnight) / (1000 * 60 * 60 * 24),
        );
        const weekNumber = Math.floor(diffDays / 7);
        if (weekNumber % 2 !== 0) {
          isAllowedWeek = false;
        }
      }

      if (isAllowedWeek && targetDays.includes(dayOfWeek)) {
        const itemStart = new Date(curr);
        itemStart.setHours(startHour, startMinute, 0, 0);

        // Only include if itemStart is >= original startDate
        if (itemStart >= startDate && itemStart <= endDateLimit) {
          let itemEndStr = null;
          if (durationMs > 0) {
            const itemEnd = new Date(itemStart.getTime() + durationMs);
            itemEndStr = formatDatetimeDb(itemEnd);
          }

          occurrences.push({
            ...baseActivity,
            id: `act_${Date.now()}_${occurrences.length + 1}`,
            start_datetime: formatDatetimeDb(itemStart),
            end_datetime: itemEndStr,
            is_recurring: true,
            recurrence_group_id: recurrenceGroupId,
            recurrence_rule: recurrenceRule,
            recurrence_summary: recurrenceSummary,
          });
        }
      }

      // Next day
      curr.setDate(curr.getDate() + 1);
    }
  } else if (recurrence_pattern === "DAILY") {
    let curr = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );

    while (curr <= endDateLimit && occurrences.length < MAX_LIMIT) {
      const itemStart = new Date(curr);
      itemStart.setHours(startHour, startMinute, 0, 0);

      if (itemStart >= startDate && itemStart <= endDateLimit) {
        let itemEndStr = null;
        if (durationMs > 0) {
          const itemEnd = new Date(itemStart.getTime() + durationMs);
          itemEndStr = formatDatetimeDb(itemEnd);
        }

        occurrences.push({
          ...baseActivity,
          id: `act_${Date.now()}_${occurrences.length + 1}`,
          start_datetime: formatDatetimeDb(itemStart),
          end_datetime: itemEndStr,
          is_recurring: true,
          recurrence_group_id: recurrenceGroupId,
          recurrence_rule: "DAILY",
          recurrence_summary: recurrenceSummary,
        });
      }

      curr.setDate(curr.getDate() + 1);
    }
  } else if (recurrence_pattern === "MONTHLY") {
    const targetDay = startDate.getDate();
    let monthOffset = 0;

    while (occurrences.length < 60) {
      const totalMonth = startDate.getMonth() + monthOffset;
      const targetYear = startDate.getFullYear() + Math.floor(totalMonth / 12);
      const targetMonth = totalMonth % 12;
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const clampedDay = Math.min(targetDay, daysInMonth);

      const itemStart = new Date(targetYear, targetMonth, clampedDay, startHour, startMinute, 0, 0);

      if (itemStart > endDateLimit) break;

      if (itemStart >= startDate) {
        let itemEndStr = null;
        if (durationMs > 0) {
          const itemEnd = new Date(itemStart.getTime() + durationMs);
          itemEndStr = formatDatetimeDb(itemEnd);
        }

        occurrences.push({
          ...baseActivity,
          id: `act_${Date.now()}_${occurrences.length + 1}`,
          start_datetime: formatDatetimeDb(itemStart),
          end_datetime: itemEndStr,
          is_recurring: true,
          recurrence_group_id: recurrenceGroupId,
          recurrence_rule: "MONTHLY",
          recurrence_summary: `${recurrenceSummary} (Tgl ${startDate.getDate()})`,
        });
      }

      monthOffset++;
    }
  }

  if (occurrences.length > 0) {
    const total = occurrences.length;
    return occurrences.map((occ, idx) => ({
      ...occ,
      is_master: idx === 0,
      session_index: idx + 1,
      total_sessions: total,
    }));
  }

  return [{ ...baseActivity, is_master: false }];
}
