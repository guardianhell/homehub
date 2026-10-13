import { useState, useEffect } from 'react';
import api from '../services/api';
import { safeGetJSON, safeSetJSON } from './safeStorage';
import { getCrossPortCookie } from './syncBridge';

// Storage keys
const STORAGE_KEYS = {
  asset: 'homehub_asset_categories',
  grocery: 'homehub_grocery_categories',
  expense: 'homehub_expense_categories',
  activity: 'homehub_activity_categories'
};

// Cookie sync keys
const COOKIE_KEYS = {
  asset: 'homehub_asset_categories_sync',
  grocery: 'homehub_grocery_categories_sync',
  expense: 'homehub_expense_categories_sync',
  activity: 'homehub_activity_categories_sync'
};

// Default Master Categories
export const DEFAULT_ASSET_CATEGORIES = [
  { id: 'cat-ast-elec', code: 'ELECTRONIC', name: 'Elektronik Rumah Tangga', name_en: 'Household Electronics', icon: '❄️', icon_url: null, color: 'emerald', metadata: { subcategories: ['AC', 'Kulkas', 'Smart TV', 'Mesin Cuci', 'Microwave', 'Dispenser Air'] }, is_default: true, is_active: true },
  { id: 'cat-ast-veh', code: 'VEHICLE', name: 'Kendaraan Bermotor', name_en: 'Motor Vehicles', icon: '🚗', icon_url: null, color: 'blue', metadata: { subcategories: ['Mobil', 'Sepeda Motor', 'Sepeda Listrik'], has_odometer: true }, is_default: true, is_active: true },
  { id: 'cat-ast-furn', code: 'FURNITURE', name: 'Perabotan / Furnitur', name_en: 'Furniture & Fixtures', icon: '🛋️', icon_url: null, color: 'amber', metadata: { subcategories: ['Sofa & Kursi', 'Meja Makan', 'Tempat Tidur', 'Lemari Pakaian', 'Kitchen Set'] }, is_default: true, is_active: true },
  { id: 'cat-ast-prop', code: 'PROPERTY', name: 'Properti & Bangunan', name_en: 'Property & Buildings', icon: '🏡', icon_url: null, color: 'indigo', metadata: { subcategories: ['Rumah Utama', 'Villa', 'Ruko / Toko', 'Tanah'] }, is_default: true, is_active: true },
  { id: 'cat-ast-jwl', code: 'JEWELRY', name: 'Perhiasan & Logam Mulia', name_en: 'Jewelry & Precious Metals', icon: '💎', icon_url: null, color: 'purple', metadata: { subcategories: ['Emas Batangan', 'Cincin & Kalung', 'Jam Tangan Mewah'] }, is_default: true, is_active: true },
  { id: 'cat-ast-oth', code: 'OTHER', name: 'Aset Lainnya', name_en: 'Other Assets', icon: '📦', icon_url: null, color: 'slate', metadata: { subcategories: ['Kamera & Lensa', 'Sepeda Olahraga', 'Peralatan Bengkel / Hobi'] }, is_default: true, is_active: true }
];

export const DEFAULT_GROCERY_CATEGORIES = [
  { id: 'cat-groc-bumbu', code: 'BUMBU', name: 'Bumbu Masak', name_en: 'Cooking Seasoning', icon: '🧂', icon_url: null, color: 'amber', metadata: { item_suggestions: ['Bawang Merah', 'Bawang Putih', 'Garam Dapur', 'Merica Bubuk', 'Kecap Manis', 'Minyak Goreng 2L'] }, is_default: true, is_active: true },
  { id: 'cat-groc-pokok', code: 'BAHAN_POKOK', name: 'Bahan Pokok', name_en: 'Staple Foods', icon: '🌾', icon_url: null, color: 'orange', metadata: { item_suggestions: ['Beras Pandan Wangi 10kg', 'Gula Pasir 1kg', 'Tepung Terigu Segitiga', 'Telur Ayam 1kg'] }, is_default: true, is_active: true },
  { id: 'cat-groc-sayur', code: 'SAYUR_BUAH', name: 'Sayuran & Buah', name_en: 'Vegetables & Fruits', icon: '🥦', icon_url: null, color: 'emerald', metadata: { item_suggestions: ['Wortel Impor', 'Bayam Segar', 'Brokoli Hijau', 'Apel Fuji', 'Pisang Cavendish'] }, is_default: true, is_active: true },
  { id: 'cat-groc-daging', code: 'DAGING_IKAN', name: 'Daging, Ikan & Telur', name_en: 'Meat, Fish & Eggs', icon: '🥩', icon_url: null, color: 'rose', metadata: { item_suggestions: ['Daging Sapi Has Dalam', 'Dada Ayam Fillet', 'Ikan Salmon', 'Udang Segar'] }, is_default: true, is_active: true },
  { id: 'cat-groc-bersih', code: 'KEBERSIHAN', name: 'Kebersihan & Mandi', name_en: 'Cleaning & Bathing', icon: '🧼', icon_url: null, color: 'cyan', metadata: { item_suggestions: ['Deterjen Cair', 'Sabun Mandi Refill', 'Shampoo', 'Pembersih Lantai', 'Pasta Gigi'] }, is_default: true, is_active: true },
  { id: 'cat-groc-minum', code: 'MINUMAN_SUSU', name: 'Minuman & Susu', name_en: 'Beverages & Milk', icon: '🥛', icon_url: null, color: 'blue', metadata: { item_suggestions: ['Susu UHT Full Cream', 'Air Galon Aqua', 'Teh Celup', 'Kopi Bubuk'] }, is_default: true, is_active: true },
  { id: 'cat-groc-snack', code: 'SNACK', name: 'Makanan Ringan', name_en: 'Snacks', icon: '🍪', icon_url: null, color: 'purple', metadata: { item_suggestions: ['Biskuit Roma', 'Keripik Kentang', 'Kacang Almond', 'Roti Tawar Gandum'] }, is_default: true, is_active: true },
  { id: 'cat-groc-oth', code: 'OTHER', name: 'Lainnya', name_en: 'Others', icon: '📦', icon_url: null, color: 'slate', metadata: { item_suggestions: ['Baterai AA', 'Tisu Basah', 'Kantong Sampah Hitam'] }, is_default: true, is_active: true }
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'cat-exp-bln', code: 'EXP_BULANAN', name: 'Belanja Bulanan & Supermarket', name_en: 'Monthly & Supermarket Shopping', icon: '🛒', icon_url: null, color: 'blue', metadata: { budget: 2500000 }, is_default: true, is_active: true },
  { id: 'cat-exp-dpr', code: 'EXP_DAPUR', name: 'Kebutuhan Dapur & Bahan Pokok', name_en: 'Kitchen Supplies & Staple Food', icon: '🍳', icon_url: null, color: 'emerald', metadata: { budget: 1500000 }, is_default: true, is_active: true },
  { id: 'cat-exp-utl', code: 'EXP_UTILITAS', name: 'Tagihan & Utilitas (Listrik/Air/Wifi)', name_en: 'Bills & Utilities', icon: '⚡', icon_url: null, color: 'amber', metadata: { budget: 1200000 }, is_default: true, is_active: true },
  { id: 'cat-exp-trn', code: 'EXP_TRANSPORT', name: 'Transportasi, Bensin & Tol', name_en: 'Transportation, Fuel & Toll', icon: '🚗', icon_url: null, color: 'orange', metadata: { budget: 1000000 }, is_default: true, is_active: true },
  { id: 'cat-exp-srv', code: 'EXP_SERVIS', name: 'Servis Kendaraan & Rumah', name_en: 'Vehicle & Home Maintenance', icon: '🔧', icon_url: null, color: 'purple', metadata: { budget: 800000 }, is_default: true, is_active: true },
  { id: 'cat-exp-pdd', code: 'EXP_PENDIDIKAN', name: 'Pendidikan & Les Anak', name_en: 'Education & Courses', icon: '📚', icon_url: null, color: 'rose', metadata: { budget: 1200000 }, is_default: true, is_active: true },
  { id: 'cat-exp-med', code: 'EXP_KESEHATAN', name: 'Kesehatan, Obat & Medis', name_en: 'Healthcare & Medicines', icon: '💊', icon_url: null, color: 'teal', metadata: { budget: 500000 }, is_default: true, is_active: true },
  { id: 'cat-exp-hbr', code: 'EXP_HIBURAN', name: 'Gaya Hidup, Kuliner & Hiburan', name_en: 'Lifestyle & Entertainment', icon: '☕', icon_url: null, color: 'cyan', metadata: { budget: 800000 }, is_default: true, is_active: true },
  { id: 'cat-exp-inv', code: 'EXP_INVESTASI', name: 'Investasi & Tabungan', name_en: 'Investment & Savings', icon: '📈', icon_url: null, color: 'emerald', metadata: { budget: 2000000 }, is_default: true, is_active: true },
  { id: 'cat-exp-dns', code: 'EXP_DONASI', name: 'Sosial & Zakat/Donasi', name_en: 'Social & Donations', icon: '🤲', icon_url: null, color: 'indigo', metadata: { budget: 500000 }, is_default: true, is_active: true },
  { id: 'cat-exp-oth', code: 'EXP_LAINNYA', name: 'Lainnya', name_en: 'Others', icon: '📦', icon_url: null, color: 'slate', metadata: { budget: 300000 }, is_default: true, is_active: true }
];

export const DEFAULT_ACTIVITY_CATEGORIES = [
  { id: 'cat-act-les', code: 'COURSE_LES', name: 'Kursus / Les / Bimbel', name_en: 'Courses & Tutoring', icon: '🎓', icon_url: null, color: 'amber', metadata: { reminder: 30, tag: 'Les' }, is_default: true, is_active: true },
  { id: 'cat-act-lib', code: 'VACATION', name: 'Liburan / Rekreasi Keluarga', name_en: 'Vacation & Family Recreation', icon: '🌴', icon_url: null, color: 'emerald', metadata: { reminder: 1440, tag: 'Liburan' }, is_default: true, is_active: true },
  { id: 'cat-act-dns', code: 'BIZTRIP', name: 'Perjalanan Bisnis / Dinas', name_en: 'Business Trip', icon: '💼', icon_url: null, color: 'blue', metadata: { reminder: 120, tag: 'Dinas' }, is_default: true, is_active: true },
  { id: 'cat-act-udg', code: 'INVITATION', name: 'Undangan / Hajatan', name_en: 'Invitation / Party', icon: '✉️', icon_url: null, color: 'purple', metadata: { reminder: 60, tag: 'Undangan' }, is_default: true, is_active: true },
  { id: 'cat-act-ult', code: 'BIRTHDAY', name: 'Ulang Tahun / Perayaan', name_en: 'Birthday & Celebration', icon: '🎂', icon_url: null, color: 'pink', metadata: { reminder: 1440, tag: 'Ulang Tahun' }, is_default: true, is_active: true },
  { id: 'cat-act-rtn', code: 'ROUTINE', name: 'Rutinitas / Ibadah', name_en: 'Routine & Worship', icon: '⚡', icon_url: null, color: 'indigo', metadata: { reminder: 15, tag: 'Rutinitas' }, is_default: true, is_active: true },
  { id: 'cat-act-med', code: 'HEALTH_CHECK', name: 'Pemeriksaan Kesehatan / Dokter', name_en: 'Doctor & Health Checkup', icon: '🩺', icon_url: null, color: 'rose', metadata: { reminder: 60, tag: 'Kesehatan' }, is_default: true, is_active: true },
  { id: 'cat-act-rpt', code: 'MEETING', name: 'Rapat RT/RW / Komunitas', name_en: 'Community Meeting', icon: '👥', icon_url: null, color: 'teal', metadata: { reminder: 30, tag: 'Rapat' }, is_default: true, is_active: true },
  { id: 'cat-act-oth', code: 'OTHER', name: 'Lainnya', name_en: 'Others', icon: '📌', icon_url: null, color: 'slate', metadata: { reminder: 30, tag: 'Agenda' }, is_default: true, is_active: true }
];

export const CATEGORY_DEFAULTS = {
  asset: DEFAULT_ASSET_CATEGORIES,
  grocery: DEFAULT_GROCERY_CATEGORIES,
  expense: DEFAULT_EXPENSE_CATEGORIES,
  activity: DEFAULT_ACTIVITY_CATEGORIES
};

// Helper: load local categories with fallback
export function getLocalMasterCategories(moduleName) {
  const cookieKey = COOKIE_KEYS[moduleName];
  const storageKey = STORAGE_KEYS[moduleName];
  const def = CATEGORY_DEFAULTS[moduleName] || [];

  const fromCookie = cookieKey ? getCrossPortCookie(cookieKey) : null;
  if (Array.isArray(fromCookie) && fromCookie.length > 0) {
    return fromCookie;
  }
  return storageKey ? safeGetJSON(storageKey, def) : def;
}

export function setLocalMasterCategories(moduleName, data) {
  const storageKey = STORAGE_KEYS[moduleName];
  if (storageKey && Array.isArray(data)) {
    safeSetJSON(storageKey, data);
  }
}

// React Hook Creator for Master Categories
function useModuleCategories(moduleName) {
  const [categories, setCategories] = useState(() => getLocalMasterCategories(moduleName));

  const refresh = async () => {
    // 1. Primary: Fetch live categories from backend database
    try {
      const res = await api.get(`/categories/${moduleName}`).catch(() => api.get(`/auth/categories/${moduleName}`));
      const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : res?.data?.data);
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
        setLocalMasterCategories(moduleName, data);
        return;
      }
    } catch (err) {
      console.warn(`Master categories [${moduleName}] backend fetch notice:`, err?.message || err);
    }

    // 2. Secondary: Check cross port cookie
    const fromCookie = getCrossPortCookie(COOKIE_KEYS[moduleName]);
    if (Array.isArray(fromCookie) && fromCookie.length > 0) {
      setCategories(fromCookie);
      setLocalMasterCategories(moduleName, fromCookie);
      return;
    }

    // 3. Fallback: cached storage / local defaults
    setCategories(getLocalMasterCategories(moduleName));
  };

  useEffect(() => {
    refresh();

    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('homehub_live_sync_bus');
        bc.onmessage = (event) => {
          const evtType = event?.data?.type || '';
          const targetModule = event?.data?.module || '';
          if (
            evtType === 'MASTER_CATEGORIES_UPDATED' ||
            evtType === `${moduleName.toUpperCase()}_CATEGORIES_UPDATED` ||
            targetModule === moduleName
          ) {
            if (Array.isArray(event.data?.categories) && event.data.categories.length > 0) {
              setCategories(event.data.categories);
              setLocalMasterCategories(moduleName, event.data.categories);
            } else {
              refresh();
            }
          }
        };
      }
    } catch (e) {}

    const handleFocus = () => refresh();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (bc) bc.close();
    };
  }, [moduleName]);

  const activeCategories = categories.filter(c => c.is_active !== false);

  return { categories, activeCategories, refreshCategories: refresh };
}

// Module Hooks
export const useAssetCategories = () => useModuleCategories('asset');
export const useGroceryCategories = () => useModuleCategories('grocery');
export const useExpenseCategories = () => useModuleCategories('expense');
export const useActivityCategories = () => useModuleCategories('activity');
export const useUtilityMasterCategories = () => useModuleCategories('utility');

// Global batch fetch helper to sync all 5 modules from MySQL DB at startup
export async function fetchAndCacheAllMasterCategories() {
  const modules = ['utility', 'asset', 'grocery', 'expense', 'activity'];
  await Promise.allSettled(
    modules.map(async (mod) => {
      try {
        const res = await api.get(`/categories/${mod}`).catch(() => api.get(`/auth/categories/${mod}`));
        const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : res?.data?.data);
        if (Array.isArray(data) && data.length > 0) {
          if (mod === 'utility') {
            safeSetJSON('homehub_utility_categories', data);
          } else {
            setLocalMasterCategories(mod, data);
          }
        }
      } catch (e) {}
    })
  );
}

// Icon & Visual Lookups
export function getAssetTypeIcon(codeOrType) {
  const norm = String(codeOrType || '').toUpperCase();
  const list = getLocalMasterCategories('asset');
  const found = list.find(c => c.code.toUpperCase() === norm);
  if (found && found.icon) return found.icon;

  if (norm.includes('VEH') || norm.includes('MOBIL') || norm.includes('MOTOR')) return '🚗';
  if (norm.includes('FURN')) return '🛋️';
  if (norm.includes('PROP') || norm.includes('RUMAH')) return '🏡';
  if (norm.includes('JWL') || norm.includes('EMAS')) return '💎';
  return '❄️';
}

export function getGroceryCategoryIcon(category) {
  const norm = String(category || '').toLowerCase();
  const list = getLocalMasterCategories('grocery');
  const found = list.find(c => c.name.toLowerCase() === norm || c.code.toLowerCase() === norm);
  if (found && found.icon) return found.icon;

  if (norm.includes('bumbu')) return '🧂';
  if (norm.includes('pokok') || norm.includes('beras')) return '🌾';
  if (norm.includes('sayur') || norm.includes('buah')) return '🥦';
  if (norm.includes('daging') || norm.includes('ayam') || norm.includes('ikan') || norm.includes('telur')) return '🥩';
  if (norm.includes('bersih') || norm.includes('mandi') || norm.includes('sabun')) return '🧼';
  if (norm.includes('susu') || norm.includes('minum')) return '🥛';
  if (norm.includes('snack') || norm.includes('roti')) return '🍪';
  return '🛒';
}

export function getExpenseCategoryIcon(category) {
  const norm = String(category || '').toLowerCase();
  const list = getLocalMasterCategories('expense');
  const found = list.find(c => c.name.toLowerCase() === norm || c.code.toLowerCase() === norm || c.id === category);
  if (found && found.icon) return found.icon;

  if (norm.includes('bulanan') || norm.includes('supermarket')) return '🛒';
  if (norm.includes('dapur')) return '🍳';
  if (norm.includes('utilitas') || norm.includes('listrik') || norm.includes('tagihan')) return '⚡';
  if (norm.includes('transport') || norm.includes('bensin') || norm.includes('tol')) return '🚗';
  if (norm.includes('servis') || norm.includes('bengkel')) return '🔧';
  if (norm.includes('pendidikan') || norm.includes('les') || norm.includes('sekolah')) return '📚';
  if (norm.includes('kesehatan') || norm.includes('obat') || norm.includes('dokter')) return '💊';
  if (norm.includes('hiburan') || norm.includes('kuliner') || norm.includes('kopi')) return '☕';
  if (norm.includes('investasi') || norm.includes('tabungan')) return '📈';
  if (norm.includes('zakat') || norm.includes('donasi')) return '🤲';
  return '💰';
}

import { getCategoryDisplayName } from './categoryTranslator';
export { getCategoryDisplayName };

/**
 * Localized Category Name Resolver
 * Resolves localized name for any module given a category object, code, or Indonesian name
 * @param {string|object} categoryOrName - Category object, code, or name string
 * @param {string} moduleName - 'utility' | 'asset' | 'grocery' | 'expense' | 'activity'
 * @param {string} lang - 'id' | 'en'
 * @returns {string} - Localized display name
 */
export function getLocalizedCategoryName(categoryOrName, moduleName, lang = 'id') {
  if (!categoryOrName) return '';

  // If already an object
  if (typeof categoryOrName === 'object') {
    return getCategoryDisplayName(categoryOrName, lang);
  }

  const rawStr = String(categoryOrName).trim();
  if (!rawStr) return '';

  // Look up in the respective module's categories
  let list = [];
  if (moduleName === 'utility') {
    list = getCrossPortCookie('homehub_utility_categories_sync') || safeGetJSON('homehub_utility_categories', []);
  } else {
    list = getLocalMasterCategories(moduleName);
  }

  const lowerRaw = rawStr.toLowerCase();
  const upperRaw = rawStr.toUpperCase();

  const found = list.find(c => 
    (c.code && c.code.toUpperCase() === upperRaw) ||
    (c.id && c.id === rawStr) ||
    (c.name && c.name.toLowerCase() === lowerRaw) ||
    (c.name_en && c.name_en.toLowerCase() === lowerRaw)
  );

  if (found) {
    return getCategoryDisplayName(found, lang);
  }

  // Fallback to title case / raw string
  return rawStr;
}

export function getActivityCategoryTheme(activityTypeOrTag, lang = 'id') {
  const norm = String(activityTypeOrTag || '').toUpperCase();
  const list = getLocalMasterCategories('activity');
  const found = list.find(c => c.code.toUpperCase() === norm);
  
  const icon = found?.icon || (norm.includes('COURSE') || norm.includes('LES') ? '🎓' : norm.includes('VACATION') ? '🌴' : norm.includes('BIZ') ? '💼' : norm.includes('BIRTHDAY') ? '🎂' : '📅');
  const name = found ? getCategoryDisplayName(found, lang) : (activityTypeOrTag || (lang === 'en' ? 'Activity' : 'Agenda'));

  return {
    icon,
    name,
    color: found?.color || 'indigo'
  };
}
