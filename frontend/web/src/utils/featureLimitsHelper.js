/**
 * Feature Limits Helper for HomeHub Client
 * Reads dynamic feature limits set by Admin Dashboard (No hardcoding!)
 * Supports Cross-Port Cookie Synchronization between port 5173 (Web) and port 5174 (Admin) on localhost.
 */

import { useState, useEffect, useCallback } from 'react';

const COOKIE_NAME = 'homehub_feature_limits';

export const DEFAULT_LIMITS = {
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
  }
};

// Cross-port cookie helpers
export function getCrossPortCookie(name = COOKIE_NAME) {
  try {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    if (!match || !match[1]) return null;
    const decoded = decodeURIComponent(match[1]);
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

export function setCrossPortCookie(limits, name = COOKIE_NAME, days = 365) {
  try {
    if (typeof document === 'undefined') return;
    // Prepare object for JSON (turn Infinity to "Infinity")
    const serializable = {
      ...limits,
      PRO: Object.fromEntries(
        Object.entries(limits.PRO || {}).map(([k, v]) => [k, v === Infinity ? 'Infinity' : v])
      )
    };
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(serializable))}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('Could not set cross-port cookie:', e);
  }
}

export function sanitizeLimits(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_LIMITS;
  const result = {
    FREE: {
      ...DEFAULT_LIMITS.FREE,
      ...(raw.FREE || {})
    },
    PRO: {
      ...DEFAULT_LIMITS.PRO,
      ...(raw.PRO || {})
    }
  };

  // Convert "Infinity", null, or 999999 to primitive Infinity
  if (result.PRO) {
    for (const k of Object.keys(result.PRO)) {
      if (result.PRO[k] === null || result.PRO[k] === 'Infinity' || result.PRO[k] === 999999) {
        result.PRO[k] = Infinity;
      }
    }
  }

  return result;
}

export function getFeatureLimits() {
  // 1. Check cross-port cookie first (most up-to-date across localhost ports 5173 & 5174!)
  const cookieVal = getCrossPortCookie();
  if (cookieVal && typeof cookieVal === 'object') {
    const sanitized = sanitizeLimits(cookieVal);
    // sync back to local storage
    try {
      localStorage.setItem('homehub_feature_limits', JSON.stringify(cookieVal));
    } catch (e) {}
    return sanitized;
  }

  // 2. Check localStorage
  try {
    const stored = localStorage.getItem('homehub_feature_limits');
    if (stored) {
      const parsed = JSON.parse(stored);
      const sanitized = sanitizeLimits(parsed);
      // seed cookie as well
      setCrossPortCookie(sanitized);
      return sanitized;
    }
  } catch (e) {
    console.warn('Could not parse homehub_feature_limits:', e);
  }

  return DEFAULT_LIMITS;
}

export function saveFeatureLimitsLocally(limits) {
  const sanitized = sanitizeLimits(limits);
  try {
    localStorage.setItem('homehub_feature_limits', JSON.stringify(sanitized));
  } catch (e) {}
  setCrossPortCookie(sanitized);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('homehub_limits_updated', { detail: sanitized }));
  }
  return sanitized;
}

export function getFreeLimit(key) {
  const limits = getFeatureLimits();
  return limits.FREE?.[key] ?? DEFAULT_LIMITS.FREE[key] ?? 5;
}

export function getProLimit(key) {
  const limits = getFeatureLimits();
  return limits.PRO?.[key] ?? Infinity;
}

export async function syncFeatureLimits(apiInstance) {
  // 1. Attempt backend fetch if API instance provided
  if (apiInstance) {
    try {
      const res = await apiInstance.get('/auth/admin/feature-limits').catch(() =>
        apiInstance.get('/admin/feature-limits')
      );
      if (res?.data?.success && res.data?.data) {
        return saveFeatureLimitsLocally(res.data.data);
      }
    } catch (err) {
      // Backend offline or error, gracefully proceed to cookie / local cache
    }
  }

  // 2. Read from cross-port cookie (set by Admin on port 5174)
  const current = getFeatureLimits();
  saveFeatureLimitsLocally(current);
  return current;
}

/**
 * React Hook for real-time reactive feature limits
 * Automatically updates when user switches tabs (window focus) or Admin updates limits on port 5174.
 */
export function useFeatureLimits(apiInstance) {
  const [limits, setLimits] = useState(() => getFeatureLimits());

  const refresh = useCallback(() => {
    const latest = getFeatureLimits();
    setLimits(latest);
    if (apiInstance) {
      syncFeatureLimits(apiInstance).then(res => {
        if (res) setLimits(res);
      }).catch(() => {});
    }
  }, [apiInstance]);

  useEffect(() => {
    refresh();

    // 1. On window focus (user switches from Admin tab 5174 to Web tab 5173!)
    const handleFocus = () => refresh();
    window.addEventListener('focus', handleFocus);

    // 2. Custom broadcast event
    const handleUpdate = (e) => {
      if (e.detail) setLimits(sanitizeLimits(e.detail));
      else refresh();
    };
    window.addEventListener('homehub_limits_updated', handleUpdate);

    // 3. Storage event (cross-tab same origin)
    const handleStorage = (e) => {
      if (e.key === 'homehub_feature_limits') refresh();
    };
    window.addEventListener('storage', handleStorage);

    // 4. Polling interval (1.5 seconds) for instant reactivity without waiting for click
    const interval = setInterval(refresh, 1500);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('homehub_limits_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [refresh]);

  return {
    limits,
    freeLimits: limits.FREE || DEFAULT_LIMITS.FREE,
    proLimits: limits.PRO || DEFAULT_LIMITS.PRO,
    getFreeLimit: (k) => limits.FREE?.[k] ?? DEFAULT_LIMITS.FREE[k],
    getProLimit: (k) => limits.PRO?.[k] ?? Infinity,
    refresh
  };
}
