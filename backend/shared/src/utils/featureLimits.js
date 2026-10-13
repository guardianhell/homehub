/**
 * Dynamic Feature Limits Configuration for Free and PRO Tiers
 * Controlled via Admin Backoffice (No longer hardcoded!)
 */

const fs = require('fs');
const path = require('path');

const LIMITS_FILE = path.resolve(__dirname, '../../../feature-limits.json');

const DEFAULT_FEATURE_LIMITS = {
  FREE: {
    MAX_MEMBERS: 5,
    MAX_HOUSEHOLDS: 1,
    MAX_ASSETS: 3,
    MAX_BILLS: 3,
    MAX_PANTRY_ITEMS: 10,
    MAX_EXPENSES_PER_MONTH: 15,
    ALLOW_EXPORT_REPORT: false,
    ALLOW_AI_OCR: false,
  },
  PRO: {
    MAX_MEMBERS: Infinity,
    MAX_HOUSEHOLDS: Infinity,
    MAX_ASSETS: Infinity,
    MAX_BILLS: Infinity,
    MAX_PANTRY_ITEMS: Infinity,
    MAX_EXPENSES_PER_MONTH: Infinity,
    ALLOW_EXPORT_REPORT: true,
    ALLOW_AI_OCR: true,
  },
  updated_at: new Date().toISOString(),
  updated_by: 'System Default'
};

let inMemoryLimits = null;

function loadLimits() {
  if (inMemoryLimits) return inMemoryLimits;
  try {
    if (fs.existsSync(LIMITS_FILE)) {
      const data = JSON.parse(fs.readFileSync(LIMITS_FILE, 'utf-8'));
      // Parse Infinity strings back to Infinity
      if (data.PRO) {
        for (const k of Object.keys(data.PRO)) {
          if (data.PRO[k] === null || data.PRO[k] === 'Infinity' || data.PRO[k] === 999999) {
            data.PRO[k] = Infinity;
          }
        }
      }
      inMemoryLimits = data;
      return data;
    }
  } catch (err) {
    console.warn('Could not read feature-limits.json, using defaults:', err.message);
  }
  inMemoryLimits = { ...DEFAULT_FEATURE_LIMITS };
  return inMemoryLimits;
}

function getFeatureLimits() {
  return loadLimits();
}

function updateFeatureLimits(newLimits, adminName = 'Admin Super') {
  const current = loadLimits();
  const updated = {
    FREE: {
      ...current.FREE,
      ...(newLimits.FREE || {})
    },
    PRO: {
      ...current.PRO,
      ...(newLimits.PRO || {})
    },
    updated_at: new Date().toISOString(),
    updated_by: adminName
  };

  inMemoryLimits = updated;

  // Persist to file for cross-process sync
  try {
    const toSave = {
      ...updated,
      PRO: Object.fromEntries(
        Object.entries(updated.PRO).map(([k, v]) => [k, v === Infinity ? 'Infinity' : v])
      )
    };
    fs.writeFileSync(LIMITS_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist feature-limits.json to disk:', err.message);
  }

  return updated;
}

function resetFeatureLimits(adminName = 'System Reset') {
  return updateFeatureLimits(DEFAULT_FEATURE_LIMITS, adminName);
}

module.exports = {
  DEFAULT_FEATURE_LIMITS,
  getFeatureLimits,
  updateFeatureLimits,
  resetFeatureLimits,
};
