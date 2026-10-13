const { errorResponse } = require("../utils/response");
const { getFeatureLimits, DEFAULT_FEATURE_LIMITS } = require("../utils/featureLimits");

const TIER_LIMITS = DEFAULT_FEATURE_LIMITS;

/**
 * Subscription Quota Guard Middleware
 * Evaluates whether the current household has reached its Free Tier limit dynamically.
 *
 * @param {string} resourceType - 'ASSETS' | 'BILLS' | 'PANTRY' | 'EXPENSES'
 * @param {Function} countFn - async function(householdId) that queries DB and returns current count
 */
const verifyQuota = (resourceType, countFn) => {
  return async (req, res, next) => {
    try {
      const tier = req.household?.tier || "FREE";

      // Pro users have unlimited access
      if (tier === "PRO") {
        return next();
      }

      const householdId = req.household?.id;
      if (!householdId) {
        return errorResponse(
          res,
          "Household context missing.",
          400,
          null,
          "ERR_HOUSEHOLD_MISSING",
        );
      }

      const currentCount = await countFn(householdId);
      const featureLimits = getFeatureLimits();
      const currentTierLimits = featureLimits[tier] || featureLimits.FREE;

      let maxAllowed;
      let resourceLabel;

      switch (resourceType) {
        case "ASSETS":
          maxAllowed = currentTierLimits.MAX_ASSETS;
          resourceLabel = "Aset Rumah & Kendaraan";
          break;
        case "BILLS":
          maxAllowed = currentTierLimits.MAX_BILLS;
          resourceLabel = "Akun Tagihan Rutin";
          break;
        case "PANTRY":
          maxAllowed = currentTierLimits.MAX_PANTRY_ITEMS;
          resourceLabel = "Catatan Kebutuhan Dapur";
          break;
        case "EXPENSES":
          maxAllowed = currentTierLimits.MAX_EXPENSES_PER_MONTH;
          resourceLabel = "Pencatatan Pengeluaran Bulanan";
          break;
        default:
          return next();
      }

      if (currentCount >= maxAllowed) {
        return errorResponse(
          res,
          `Batas kuota Paket Free tercapai: Maksimal ${maxAllowed} ${resourceLabel}. Tingkatkan ke Paket PRO untuk akses tanpa batas.`,
          403,
          {
            resourceType,
            currentCount,
            maxAllowed,
            tier: "FREE",
            upgradeRequired: true,
          },
          "ERR_QUOTA_EXCEEDED",
        );
      }

      next();
    } catch (err) {
      console.error("Quota verification error:", err);
      return errorResponse(res, "Gagal memeriksa kuota langganan.", 500);
    }
  };
};

module.exports = {
  verifyQuota,
  TIER_LIMITS,
};
