/**
 * Safe LocalStorage helpers with automatic JSON serialization,
 * error handling, and corruption protection.
 */

export function safeGetJSON(key, fallback = null) {
  try {
    const val = localStorage.getItem(key);
    if (!val || val === "undefined" || val === "null") {
      return fallback;
    }
    const parsed = JSON.parse(val);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (err) {
    console.warn(`[safeStorage] Failed reading JSON key "${key}":`, err);
    return fallback;
  }
}

export function safeSetJSON(key, val) {
  try {
    if (val === undefined || val === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(val));
    }
  } catch (err) {
    console.warn(`[safeStorage] Failed setting JSON key "${key}":`, err);
  }
}

export function safeGet(key, fallback = "") {
  try {
    const val = localStorage.getItem(key);
    if (!val || val === "undefined" || val === "null") {
      return fallback;
    }
    return val;
  } catch (err) {
    console.warn(`[safeStorage] Failed reading string key "${key}":`, err);
    return fallback;
  }
}

export function safeSet(key, val) {
  try {
    if (val === undefined || val === null || val === "") {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, String(val));
    }
  } catch (err) {
    console.warn(`[safeStorage] Failed setting string key "${key}":`, err);
  }
}
