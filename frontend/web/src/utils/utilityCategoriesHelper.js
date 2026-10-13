import { useState, useEffect } from 'react';
import api from '../services/api';
import { safeGetJSON, safeSetJSON } from './safeStorage';
import { getCrossPortCookie } from './syncBridge';

const CATEGORIES_STORAGE_KEY = 'homehub_utility_categories';
const UTILITY_CATEGORIES_COOKIE = 'homehub_utility_categories_sync';

export const DEFAULT_UTILITY_CATEGORIES = [
  {
    id: 'cat-elec',
    code: 'ELECTRICITY',
    name: 'Listrik & Daya',
    name_en: 'Electricity & Power',
    icon: '⚡',
    icon_url: null,
    color: 'amber',
    providers: ['PLN Pascabayar', 'PLN Prabayar (Token)'],
    is_default: true,
    is_active: true
  },
  {
    id: 'cat-water',
    code: 'WATER',
    name: 'Air PDAM / Bersih',
    name_en: 'Clean Water / PDAM',
    icon: '💧',
    icon_url: null,
    color: 'blue',
    providers: ['PDAM Tirtawening', 'PAM Jaya', 'Aetra Air'],
    is_default: true,
    is_active: true
  },
  {
    id: 'cat-inet',
    code: 'INTERNET',
    name: 'Internet & WiFi Fiber',
    name_en: 'Internet & Fiber WiFi',
    icon: '🌐',
    icon_url: null,
    color: 'purple',
    providers: ['IndiHome Fiber', 'Biznet Home', 'MyRepublic', 'First Media'],
    is_default: true,
    is_active: true
  },
  {
    id: 'cat-ipl',
    code: 'MAINTENANCE_IPL',
    name: 'Iuran Pengelola (IPL)',
    name_en: 'Building & Security Dues (IPL)',
    icon: '🏢',
    icon_url: null,
    color: 'emerald',
    providers: ['Iuran IPL Pengelola', 'Iuran Keamanan RT/RW', 'Retribusi Kebersihan'],
    is_default: true,
    is_active: true
  },
  {
    id: 'cat-gas',
    code: 'GAS',
    name: 'Gas PGN & Tabung LPG',
    name_en: 'PGN Gas & LPG Tank',
    icon: '🔥',
    icon_url: null,
    color: 'orange',
    providers: ['PGN GasKita', 'Pertamina Bright Gas 12kg', 'LPG 3kg'],
    is_default: true,
    is_active: true
  },
  {
    id: 'cat-other',
    code: 'OTHER',
    name: 'Lainnya / Tagihan Umum',
    name_en: 'General Bills / Other',
    icon: '📄',
    icon_url: null,
    color: 'slate',
    providers: ['BPJS Kesehatan', 'Asuransi Rumah', 'Tagihan Lainnya'],
    is_default: true,
    is_active: true
  }
];

export const CATEGORY_COLOR_STYLES = {
  amber: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    iconBg: 'bg-amber-100 text-amber-700',
    activeOption: 'border-amber-500 bg-amber-50 text-amber-900',
    textColor: 'text-amber-600'
  },
  blue: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-100 text-blue-700',
    activeOption: 'border-blue-500 bg-blue-50 text-blue-900',
    textColor: 'text-blue-600'
  },
  purple: {
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    iconBg: 'bg-purple-100 text-purple-700',
    activeOption: 'border-purple-500 bg-purple-50 text-purple-900',
    textColor: 'text-purple-600'
  },
  emerald: {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-100 text-emerald-700',
    activeOption: 'border-emerald-500 bg-emerald-50 text-emerald-900',
    textColor: 'text-emerald-600'
  },
  orange: {
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    iconBg: 'bg-orange-100 text-orange-700',
    activeOption: 'border-orange-500 bg-orange-50 text-orange-900',
    textColor: 'text-orange-600'
  },
  rose: {
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    iconBg: 'bg-rose-100 text-rose-700',
    activeOption: 'border-rose-500 bg-rose-50 text-rose-900',
    textColor: 'text-rose-600'
  },
  cyan: {
    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    iconBg: 'bg-cyan-100 text-cyan-700',
    activeOption: 'border-cyan-500 bg-cyan-50 text-cyan-900',
    textColor: 'text-cyan-600'
  },
  slate: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    iconBg: 'bg-slate-100 text-slate-700',
    activeOption: 'border-slate-500 bg-slate-50 text-slate-900',
    textColor: 'text-slate-600'
  }
};

/**
 * Load utility categories from cookie sync, localStorage, or fallback
 */
export function getLocalUtilityCategories() {
  const fromCookie = getCrossPortCookie(UTILITY_CATEGORIES_COOKIE);
  if (Array.isArray(fromCookie) && fromCookie.length > 0) {
    return fromCookie;
  }
  return safeGetJSON(CATEGORIES_STORAGE_KEY, DEFAULT_UTILITY_CATEGORIES);
}

/**
 * Save utility categories to cache
 */
export function setLocalUtilityCategories(cats) {
  if (Array.isArray(cats) && cats.length > 0) {
    safeSetJSON(CATEGORIES_STORAGE_KEY, cats);
  }
}

/**
 * Find category object by code
 */
export function getCategoryByCode(code, categories = null) {
  const list = categories || getLocalUtilityCategories();
  const normalized = (code || '').toUpperCase();
  return list.find(c => c.code.toUpperCase() === normalized) || null;
}

/**
 * Get category icon / logo by code
 */
export function getCategoryIcon(code, categories = null) {
  const cat = getCategoryByCode(code, categories);
  if (cat && cat.icon) return cat.icon;
  
  // Built-in emoji fallbacks for standard codes
  switch ((code || '').toUpperCase()) {
    case 'ELECTRICITY': return '⚡';
    case 'WATER': return '💧';
    case 'INTERNET': return '🌐';
    case 'MAINTENANCE_IPL': return '🏢';
    case 'GAS': return '🔥';
    default: return '📄';
  }
}

/**
 * Get category styling config by code
 */
export function getCategoryStyle(code, categories = null) {
  const cat = getCategoryByCode(code, categories);
  const colorKey = (cat?.color || 'blue').toLowerCase();
  return CATEGORY_COLOR_STYLES[colorKey] || CATEGORY_COLOR_STYLES.blue;
}

import { getCategoryDisplayName } from './categoryTranslator';
export { getCategoryDisplayName };

/**
 * Get category display name by code (supports bilingual lang: 'id' or 'en')
 */
export function getCategoryName(code, categories = null, lang = 'id') {
  const cat = getCategoryByCode(code, categories);
  if (cat) {
    return getCategoryDisplayName(cat, lang);
  }

  const isEn = lang === 'en';
  switch ((code || '').toUpperCase()) {
    case 'ELECTRICITY': return isEn ? 'Electricity' : 'Listrik';
    case 'WATER': return isEn ? 'Clean Water' : 'Air PDAM';
    case 'INTERNET': return isEn ? 'Internet' : 'Internet';
    case 'MAINTENANCE_IPL': return isEn ? 'Building Dues (IPL)' : 'Iuran IPL';
    case 'GAS': return isEn ? 'Gas' : 'Gas';
    default: return code || (isEn ? 'Bill' : 'Tagihan');
  }
}

/**
 * React hook to access live dynamic utility categories
 */
export function useUtilityCategories() {
  const [categories, setCategories] = useState(() => getLocalUtilityCategories());

  const refreshCategories = async () => {
    // 1. Primary: Fetch live categories from backend database
    try {
      const res = await api.get('/categories/utility').catch(() => api.get('/utilities/categories')).catch(() => api.get('/auth/utilities/categories'));
      const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : res?.data?.data);
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
        setLocalUtilityCategories(data);
        return;
      }
    } catch (err) {
      console.warn('Utility categories backend fetch notice:', err?.message || err);
    }

    // 2. Secondary: Check cross-port cookie
    const fromCookie = getCrossPortCookie(UTILITY_CATEGORIES_COOKIE);
    if (Array.isArray(fromCookie) && fromCookie.length > 0) {
      setCategories(fromCookie);
      setLocalUtilityCategories(fromCookie);
      return;
    }

    // 3. Fallback: storage / default
    setCategories(getLocalUtilityCategories());
  };

  useEffect(() => {
    refreshCategories();

    // BroadcastChannel real-time sync listener
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('homehub_live_sync_bus');
        bc.onmessage = (event) => {
          if (event?.data?.type === 'UTILITY_CATEGORIES_UPDATED') {
            if (Array.isArray(event.data.categories) && event.data.categories.length > 0) {
              setCategories(event.data.categories);
              setLocalUtilityCategories(event.data.categories);
            } else {
              refreshCategories();
            }
          }
        };
      }
    } catch (e) {}

    // Focus listener
    const handleFocus = () => refreshCategories();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (bc) bc.close();
    };
  }, []);

  return { categories, refreshCategories };
}
