/**
 * warrantyHelper.js
 * Utility to calculate dynamic real-time warranty status and normalize date formats.
 */

export function parseDateFlexible(dateStr) {
  if (
    !dateStr ||
    dateStr === "-" ||
    dateStr === "null" ||
    dateStr === "undefined"
  )
    return null;

  const str = String(dateStr).trim();
  if (!str) return null;

  // 1. Check YYYY-MM-DD, 00YY-MM-DD, or YY-MM-DD (Year first)
  const ymdMatch = str.match(/^(\d{1,4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    let year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    if (year < 100) {
      year = year <= 69 ? 2000 + year : 1900 + year;
    }
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Check DD/MM/YYYY, DD-MM-YYYY, or DD/MM/YY (Indonesian / European format, day first)
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) {
      year = year <= 69 ? 2000 + year : 1900 + year;
    }
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Text format: e.g. "4 Sep 2029", "15-Jan-2028", "4 September 2029", "15 Jan 29"
  const parts = str.replace(/-/g, " ").split(/\s+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthMap = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      mei: 4,
      may: 4,
      jun: 5,
      jul: 6,
      agu: 7,
      aug: 7,
      sep: 8,
      okt: 9,
      oct: 9,
      nov: 10,
      des: 11,
      dec: 11,
    };
    const mStr = parts[1].toLowerCase().slice(0, 3);
    const month = monthMap[mStr];
    let year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      if (year < 100) {
        year = year <= 69 ? 2000 + year : 1900 + year;
      }
      return new Date(year, month, day);
    }
  }

  // 4. Fallback to standard Date parsing (e.g. ISO strings with time)
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) {
    let year = fallback.getFullYear();
    if (year < 100) {
      year = year <= 69 ? 2000 + year : 1900 + year;
      return new Date(year, fallback.getMonth(), fallback.getDate());
    }
    return fallback;
  }

  return null;
}

export function toInputDateFormat(dateStr) {
  const d = parseDateFlexible(dateStr);
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const padYear = (y) => String(y).padStart(4, "0");
  return `${padYear(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatWarrantyDisplay(dateStr, lang = "id") {
  const d = parseDateFlexible(dateStr);
  if (!d) return dateStr || "-";
  const monthNamesId = [
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
  const monthNamesEn = [
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
  const monthNames = lang === "id" ? monthNamesId : monthNamesEn;
  return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Returns real-time dynamic warranty status
 * @param {string} dateStr
 * @param {string} lang - 'id' | 'en'
 * @returns {{ status: string, label: string, badgeClass: string, badgeColor: string, isActive: boolean, daysRemaining: number|null }}
 */
export function getWarrantyStatus(dateStr, lang = "id") {
  const expiryDate = parseDateFlexible(dateStr);
  if (!expiryDate) {
    return {
      status: "NO_WARRANTY",
      label: lang === "id" ? "Tanpa Garansi" : "No Warranty",
      badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
      badgeColor: "slate",
      isActive: false,
      daysRemaining: null,
    };
  }

  // Compare with today's midnight
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDay = new Date(
    expiryDate.getFullYear(),
    expiryDate.getMonth(),
    expiryDate.getDate(),
  );

  const diffMs = expiryDay.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: "EXPIRED",
      label: lang === "id" ? "Garansi Habis" : "Warranty Expired",
      badgeClass: "bg-rose-50 text-rose-600 border-rose-200",
      badgeColor: "rose",
      isActive: false,
      daysRemaining: diffDays,
    };
  }

  if (diffDays <= 30) {
    return {
      status: "EXPIRING_SOON",
      label:
        lang === "id"
          ? diffDays === 0
            ? "Habis Hari Ini"
            : `Segera Habis (${diffDays} hr)`
          : diffDays === 0
            ? "Expires Today"
            : `Expiring Soon (${diffDays}d)`,
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      badgeColor: "amber",
      isActive: true,
      daysRemaining: diffDays,
    };
  }

  return {
    status: "ACTIVE",
    label: lang === "id" ? "Garansi Aktif" : "Warranty Active",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeColor: "emerald",
    isActive: true,
    daysRemaining: diffDays,
  };
}
