/**
 * Smart Bilingual Category Translator Utility
 * Provides instant dictionary-based translation and online fallback from Indonesian to English
 */

const DICTIONARY_PHRASES = {
  // Utilities
  'listrik & daya': 'Electricity & Power',
  'listrik': 'Electricity',
  'daya': 'Power',
  'air bersih': 'Clean Water',
  'air pdam': 'Clean Water (PDAM)',
  'air pdam / bersih': 'Clean Water / PDAM',
  'air': 'Water',
  'internet & wifi fiber': 'Internet & Fiber WiFi',
  'internet & wifi': 'Internet & WiFi',
  'internet': 'Internet',
  'wifi': 'WiFi',
  'iuran pengelola (ipl)': 'Building & Security Dues (IPL)',
  'iuran pengelola': 'Building Management Dues',
  'iuran keamanan': 'Security Dues',
  'iuran kebersihan': 'Cleaning Dues',
  'iuran lingkungan': 'Neighborhood Dues',
  'gas pgn & tabung lpg': 'PGN Gas & LPG Tank',
  'gas alam': 'Natural Gas',
  'gas elpiji': 'LPG Gas',
  'gas': 'Gas',
  'tagihan umum': 'General Bills',
  'tagihan rutin': 'Routine Bills',
  'tagihan': 'Bills',

  // Assets
  'elektronik rumah tangga': 'Household Electronics',
  'elektronik': 'Electronics',
  'kendaraan bermotor': 'Motor Vehicles',
  'kendaraan': 'Vehicles',
  'mobil': 'Car',
  'sepeda motor': 'Motorcycle',
  'sepeda': 'Bicycle',
  'perabotan / furnitur': 'Furniture & Fixtures',
  'perabotan': 'Furniture',
  'furnitur': 'Furniture',
  'properti & bangunan': 'Property & Buildings',
  'properti': 'Property',
  'bangunan': 'Buildings',
  'rumah': 'House',
  'tanah': 'Land',
  'perhiasan & logam mulia': 'Jewelry & Precious Metals',
  'perhiasan': 'Jewelry',
  'logam mulia': 'Precious Metals',
  'emas': 'Gold',
  'aset lainnya': 'Other Assets',

  // Groceries
  'bumbu masak': 'Cooking Seasoning',
  'bumbu dapur': 'Kitchen Seasoning',
  'bumbu': 'Seasoning',
  'bahan pokok': 'Staple Foods',
  'sembako': 'Basic Groceries',
  'sayuran & buah': 'Vegetables & Fruits',
  'sayuran': 'Vegetables',
  'buah-buahan': 'Fruits',
  'buah': 'Fruits',
  'daging, ikan & telur': 'Meat, Fish & Eggs',
  'daging & ikan': 'Meat & Fish',
  'daging': 'Meat',
  'ikan': 'Fish',
  'telur': 'Eggs',
  'kebersihan & mandi': 'Cleaning & Bathing',
  'perlengkapan mandi': 'Toiletries',
  'alat mandi': 'Bath Supplies',
  'minuman & susu': 'Beverages & Milk',
  'minuman': 'Beverages',
  'susu': 'Milk',
  'kopi & teh': 'Coffee & Tea',
  'makanan ringan': 'Snacks',
  'camilan': 'Snacks',
  'snack': 'Snacks',

  // Expenses
  'belanja bulanan & supermarket': 'Monthly & Supermarket Shopping',
  'belanja bulanan': 'Monthly Shopping',
  'belanja harian': 'Daily Shopping',
  'kebutuhan dapur & bahan pokok': 'Kitchen Supplies & Staple Food',
  'kebutuhan dapur': 'Kitchen Supplies',
  'dapur': 'Kitchen',
  'tagihan & utilitas': 'Bills & Utilities',
  'transportasi, bensin & tol': 'Transportation, Fuel & Toll',
  'transportasi': 'Transportation',
  'bensin': 'Fuel',
  'servis kendaraan & rumah': 'Vehicle & Home Maintenance',
  'servis & pemeliharaan': 'Service & Maintenance',
  'servis': 'Maintenance',
  'pendidikan & les anak': 'Education & Courses',
  'pendidikan': 'Education',
  'sekolah': 'School',
  'les & kursus': 'Courses & Tutoring',
  'kesehatan, obat & medis': 'Healthcare & Medicines',
  'kesehatan': 'Healthcare',
  'obat & medis': 'Medicines & Medical',
  'dokter': 'Doctor',
  'gaya hidup, kuliner & hiburan': 'Lifestyle & Entertainment',
  'kuliner & hiburan': 'Culinary & Entertainment',
  'gaya hidup': 'Lifestyle',
  'hiburan': 'Entertainment',
  'investasi & tabungan': 'Investment & Savings',
  'investasi': 'Investment',
  'tabungan': 'Savings',
  'sosial & zakat/donasi': 'Social & Donations',
  'zakat & donasi': 'Zakat & Donations',
  'donasi': 'Donation',

  // Activities
  'kursus / les / bimbel': 'Courses & Tutoring',
  'kursus': 'Courses',
  'les': 'Tutoring',
  'bimbel': 'Tutoring',
  'liburan / rekreasi keluarga': 'Vacation & Family Recreation',
  'liburan keluarga': 'Family Vacation',
  'liburan': 'Vacation',
  'rekreasi': 'Recreation',
  'perjalanan bisnis / dinas': 'Business Trip',
  'perjalanan dinas': 'Business Trip',
  'dinas': 'Business Trip',
  'undangan / hajatan': 'Invitation / Party',
  'undangan': 'Invitation',
  'hajatan': 'Party',
  'pesta': 'Party',
  'ulang tahun / perayaan': 'Birthday & Celebration',
  'ulang tahun': 'Birthday',
  'perayaan': 'Celebration',
  'rutinitas / ibadah': 'Routine & Worship',
  'rutinitas': 'Routine',
  'ibadah': 'Worship',
  'pemeriksaan kesehatan / dokter': 'Doctor & Health Checkup',
  'pemeriksaan dokter': 'Doctor Checkup',
  'rapat rt/rw / komunitas': 'Community & Neighborhood Meeting',
  'rapat komunitas': 'Community Meeting',
  'rapat kerja': 'Work Meeting',
  'rapat': 'Meeting',
  'olahraga': 'Sports & Workout',
  'lainnya': 'Others'
};

const WORD_MAP = {
  'dan': '&',
  '&': '&',
  'atau': 'or',
  '/': '/',
  'alat': 'Tools',
  'peralatan': 'Equipment',
  'perlengkapan': 'Supplies',
  'kebutuhan': 'Needs',
  'rumah': 'Home',
  'tangga': '',
  'keluarga': 'Family',
  'anak': 'Kids',
  'pribadi': 'Personal',
  'bulanan': 'Monthly',
  'harian': 'Daily',
  'mingguan': 'Weekly',
  'tahunan': 'Annual',
  'rutin': 'Routine',
  'khusus': 'Special',
  'umum': 'General',
  'utama': 'Main',
  'cadangan': 'Backup',
  'darurat': 'Emergency',
  'kebun': 'Garden',
  'taman': 'Park',
  'hewan': 'Pets',
  'peliharaan': 'Pets',
  'makanan': 'Food',
  'minuman': 'Drinks',
  'kendaraan': 'Vehicle',
  'mobil': 'Car',
  'motor': 'Motorcycle',
  'bengkel': 'Workshop',
  'servis': 'Service',
  'keamanan': 'Security',
  'kebersihan': 'Cleaning',
  'kesehatan': 'Health',
  'asuransi': 'Insurance',
  'pajak': 'Tax',
  'belanja': 'Shopping',
  'dapur': 'Kitchen',
  'kamar': 'Room',
  'kantor': 'Office',
  'buku': 'Books',
  'mainan': 'Toys',
  'pakaian': 'Clothing',
  'sepatu': 'Shoes',
  'tas': 'Bags',
  'listrik': 'Electricity',
  'air': 'Water',
  'gas': 'Gas',
  'internet': 'Internet',
  'hiburan': 'Entertainment',
  'hobi': 'Hobbies',
  'liburan': 'Vacation',
  'undangan': 'Invitation',
  'rapat': 'Meeting',
  'kursus': 'Course',
  'les': 'Tutoring',
  'olahraga': 'Sports',
  'kamera': 'Camera',
  'lensa': 'Lenses',
  'elektronik': 'Electronics',
  'sayur': 'Vegetables',
  'buah': 'Fruits',
  'daging': 'Meat',
  'ikan': 'Fish',
  'telur': 'Eggs',
  'susu': 'Milk',
  'kopi': 'Coffee',
  'teh': 'Tea',
  'gula': 'Sugar',
  'garam': 'Salt',
  'minyak': 'Oil',
  'beras': 'Rice',
  'bumbu': 'Seasoning',
  'sabun': 'Soap',
  'sampo': 'Shampoo',
  'tisu': 'Tissue',
  'emas': 'Gold',
  'perhiasan': 'Jewelry',
  'investasi': 'Investment',
  'tabungan': 'Savings',
  'donasi': 'Donation',
  'zakat': 'Zakat',
  'sedekah': 'Alms',
  'medis': 'Medical',
  'obat': 'Medicine',
  'dokter': 'Doctor',
  'rumah': 'Home',
  'kendaraan': 'Vehicle',
  'lainnya': 'Others'
};

function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

/**
 * Translates an Indonesian category title to English
 * @param {string} text - Category name in Indonesian
 * @returns {Promise<string>} - Translated English category name
 */
export async function autoTranslateCategory(text) {
  if (!text || typeof text !== 'string') return '';
  const clean = text.trim();
  if (!clean) return '';

  const lower = clean.toLowerCase();

  // 1. Exact phrase dictionary match
  if (DICTIONARY_PHRASES[lower]) {
    return DICTIONARY_PHRASES[lower];
  }

  // 2. Local dictionary token replacement fallback
  const words = clean.split(/\s+/);
  const translatedWords = words.map(w => {
    const wLower = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    const mapped = WORD_MAP[wLower];
    if (mapped !== undefined) {
      if (!mapped) return '';
      return mapped;
    }
    return toTitleCase(w);
  }).filter(Boolean);

  if (translatedWords.length > 0) {
    return translatedWords.join(' ');
  }

  return toTitleCase(clean);
}

/**
 * Localized name selector for category display
 */
export function getCategoryDisplayName(category, lang = 'id') {
  if (!category) return '';
  if (lang === 'en') {
    return category.name_en || category.metadata?.name_en || category.name || category.code || '';
  }
  return category.name || category.name_id || category.code || '';
}
