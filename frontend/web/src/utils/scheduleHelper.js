import { parseDateFlexible, formatWarrantyDisplay } from "./warrantyHelper.js";

/**
 * Calculates real-time upcoming maintenance schedule for an asset from the active schedules list.
 *
 * @param {Object} asset - The asset object (must contain .id, optional .odo / .current_odometer)
 * @param {Array} schedules - The complete list of maintenance schedules
 * @param {string} lang - 'id' | 'en'
 * @returns {Object}
 */
export function getAssetUpcomingSchedule(asset, schedules = [], lang = "id") {
  if (!asset || !asset.id || !Array.isArray(schedules)) {
    return {
      nextService: null,
      scheduleTitle: null,
      nextOdo: null,
      odoScheduleTitle: null,
      nearestDateSchedule: null,
      nearestOdoSchedule: null,
      remainingKm: null,
      remainingKmFormatted: null,
      remainingKmLabel: null,
      dashboardBadge: null,
      totalSchedules: 0,
    };
  }

  // Filter schedules belonging to this asset and currently active
  const assetSchedules = schedules.filter(
    (s) => s.asset_id === asset.id && s.is_active !== false,
  );

  if (assetSchedules.length === 0) {
    return {
      nextService: null,
      scheduleTitle: null,
      nextOdo: null,
      odoScheduleTitle: null,
      nearestDateSchedule: null,
      nearestOdoSchedule: null,
      remainingKm: null,
      remainingKmFormatted: null,
      remainingKmLabel: null,
      dashboardBadge: null,
      totalSchedules: 0,
    };
  }

  // 1. Find nearest schedule by date
  const schedulesWithDate = assetSchedules
    .filter((s) => Boolean(s.next_due_date))
    .sort((a, b) => {
      const dateA = parseDateFlexible(a.next_due_date)?.getTime() || 0;
      const dateB = parseDateFlexible(b.next_due_date)?.getTime() || 0;
      return dateA - dateB;
    });

  const nearestDateSchedule = schedulesWithDate[0] || null;

  // 2. Find nearest schedule by odometer
  const schedulesWithOdo = assetSchedules
    .filter(
      (s) =>
        s.next_due_odometer !== null &&
        s.next_due_odometer !== undefined &&
        s.next_due_odometer !== "",
    )
    .sort((a, b) => Number(a.next_due_odometer) - Number(b.next_due_odometer));

  const nearestOdoSchedule = schedulesWithOdo[0] || null;

  const nextService = nearestDateSchedule
    ? formatWarrantyDisplay(nearestDateSchedule.next_due_date, lang)
    : null;

  const scheduleTitle = nearestDateSchedule ? nearestDateSchedule.title : null;

  const nextOdo = nearestOdoSchedule
    ? Number(nearestOdoSchedule.next_due_odometer)
    : null;

  const odoScheduleTitle = nearestOdoSchedule ? nearestOdoSchedule.title : null;

  // 3. Dynamic Remaining KM Calculation
  const currentOdo =
    asset.odo !== undefined && asset.odo !== null
      ? Number(asset.odo)
      : asset.current_odometer
        ? Number(asset.current_odometer)
        : null;

  let remainingKm = null;
  let remainingKmFormatted = null;
  let remainingKmLabel = null;

  if (nextOdo !== null && currentOdo !== null) {
    remainingKm = nextOdo - currentOdo;
    const absRemaining = Math.abs(remainingKm);
    const formattedKm =
      lang === "id"
        ? absRemaining.toLocaleString("id-ID")
        : absRemaining.toLocaleString("en-US");

    if (remainingKm > 0) {
      remainingKmLabel =
        lang === "id"
          ? `Sisa ${formattedKm} KM`
          : `${formattedKm} KM remaining`;
    } else if (remainingKm === 0) {
      remainingKmLabel =
        lang === "id" ? "Target KM Tercapai" : "Target KM reached";
    } else {
      remainingKmLabel =
        lang === "id" ? `Lewat ${formattedKm} KM` : `${formattedKm} KM overdue`;
    }
    remainingKmFormatted = formattedKm;
  }

  // 4. Compute dynamic Dashboard Badge
  let dashboardBadge = null;

  if (nearestDateSchedule && nearestDateSchedule.next_due_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = parseDateFlexible(nearestDateSchedule.next_due_date);
    if (targetDate) {
      targetDate.setHours(0, 0, 0, 0);
      const diffMs = targetDate.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        dashboardBadge = {
          label:
            lang === "id"
              ? `⚠️ Servis Lewat (${Math.abs(diffDays)} hr)`
              : `⚠️ Overdue (${Math.abs(diffDays)}d)`,
          badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
        };
      } else if (diffDays === 0) {
        dashboardBadge = {
          label: lang === "id" ? "🔔 Servis Hari Ini" : "🔔 Due Today",
          badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
        };
      } else if (diffDays <= 7) {
        dashboardBadge = {
          label:
            lang === "id"
              ? `📅 Servis ${diffDays} hari lagi`
              : `📅 Due in ${diffDays}d`,
          badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
        };
      } else {
        dashboardBadge = {
          label:
            lang === "id"
              ? `📅 Servis ${diffDays} hari lagi`
              : `📅 In ${diffDays}d`,
          badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
        };
      }
    }
  } else if (nearestOdoSchedule && nearestOdoSchedule.next_due_odometer) {
    if (remainingKm !== null && remainingKm <= 0) {
      dashboardBadge = {
        label:
          lang === "id" ? "⚠️ Waktunya Servis KM!" : "⚠️ Service Due (KM)!",
        badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
      };
    } else if (remainingKmLabel) {
      dashboardBadge = {
        label: `🚗 ${remainingKmLabel}`,
        badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
      };
    }
  }

  return {
    nextService,
    scheduleTitle,
    nextOdo,
    odoScheduleTitle,
    nearestDateSchedule,
    nearestOdoSchedule,
    remainingKm,
    remainingKmFormatted,
    remainingKmLabel,
    dashboardBadge,
    totalSchedules: assetSchedules.length,
  };
}
