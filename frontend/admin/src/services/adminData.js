import api from './api';

// Safe localStorage helpers
const safeGet = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

const safeSet = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
};

// Initial Seed Data (Realistic production-like dataset)
const INITIAL_MEMBERS = [
  {
    id: 'usr-calvin-01',
    name: 'Calvin Tantio',
    email: 'calvin@homehub.app',
    phone: '0812-3456-7890',
    status: 'ACTIVE',
    preferred_language: 'id',
    created_at: '2026-01-10T08:30:00Z',
    last_login_at: '2026-10-03T05:20:00Z',
    households: [
      { id: 'hh-tebet-01', name: 'Rumah Tinggal - Tebet', role: 'OWNER', tier: 'FREE' },
      { id: 'hh-villa-02', name: 'Villa Puncak', role: 'OWNER', tier: 'PRO' }
    ],
    highest_tier: 'PRO',
    pro_valid_until: '2027-01-15T10:00:00Z',
    notes: 'Pelanggan utama sejak awal peluncuran'
  },
  {
    id: 'usr-siti-02',
    name: 'Siti Aminah',
    email: 'siti@keluarga.com',
    phone: '0812-9876-5432',
    status: 'ACTIVE',
    preferred_language: 'id',
    created_at: '2026-02-14T11:00:00Z',
    last_login_at: '2026-10-02T19:40:00Z',
    households: [
      { id: 'hh-tebet-01', name: 'Rumah Tinggal - Tebet', role: 'ADMIN', tier: 'FREE' }
    ],
    highest_tier: 'FREE',
    pro_valid_until: null,
    notes: 'Pengelola belanja & tagihan rumah tangga'
  },
  {
    id: 'usr-nathan-03',
    name: 'Nathan Santoso',
    email: 'nathan@keluarga.com',
    phone: '0813-1122-3344',
    status: 'ACTIVE',
    preferred_language: 'id',
    created_at: '2026-03-01T14:15:00Z',
    last_login_at: '2026-09-30T10:10:00Z',
    households: [
      { id: 'hh-tebet-01', name: 'Rumah Tinggal - Tebet', role: 'MEMBER', tier: 'FREE' }
    ],
    highest_tier: 'FREE',
    pro_valid_until: null,
    notes: 'Anak / Siswa les & kegiatan sekolah'
  },
  {
    id: 'usr-budi-04',
    name: 'Budi Hartono',
    email: 'budi.hartono@bisnis.co.id',
    phone: '0811-4567-8901',
    status: 'ACTIVE',
    preferred_language: 'id',
    created_at: '2026-04-12T09:00:00Z',
    last_login_at: '2026-10-03T02:00:00Z',
    households: [
      { id: 'hh-senopati-03', name: 'Apartemen Senopati Penthouse', role: 'OWNER', tier: 'PRO' },
      { id: 'hh-bali-04', name: 'Villa Canggu Sanctuary', role: 'OWNER', tier: 'PRO' }
    ],
    highest_tier: 'PRO',
    pro_valid_until: '2027-04-12T09:00:00Z',
    notes: 'Mengelola 2 unit properti sewa dan liburan'
  },
  {
    id: 'usr-maya-05',
    name: 'Dr. Maya Lestari',
    email: 'maya.lestari@medika.org',
    phone: '0815-7788-9900',
    status: 'ACTIVE',
    preferred_language: 'en',
    created_at: '2026-05-20T16:45:00Z',
    last_login_at: '2026-10-01T12:00:00Z',
    households: [
      { id: 'hh-menteng-05', name: 'Rumah Menteng Residence', role: 'OWNER', tier: 'PRO' }
    ],
    highest_tier: 'PRO',
    pro_valid_until: '2026-11-20T16:45:00Z',
    notes: 'Langganan paket PRO bulanan'
  },
  {
    id: 'usr-hendra-06',
    name: 'Hendra Gunawan',
    email: 'hendra.gunawan@techindo.com',
    phone: '0818-0912-3456',
    status: 'ACTIVE',
    preferred_language: 'id',
    created_at: '2026-06-18T10:30:00Z',
    last_login_at: '2026-09-28T08:15:00Z',
    households: [
      { id: 'hh-bsd-06', name: 'Rumah Cluster The Icon BSD', role: 'OWNER', tier: 'FREE' }
    ],
    highest_tier: 'FREE',
    pro_valid_until: null,
    notes: 'Prospek upgrade ke PRO (sering mengecek batas kuota)'
  },
  {
    id: 'usr-rina-07',
    name: 'Rina Kusuma Dewi',
    email: 'rina.kdewi@gmail.com',
    phone: '0819-3344-5566',
    status: 'SUSPENDED',
    preferred_language: 'id',
    created_at: '2026-07-02T13:20:00Z',
    last_login_at: '2026-08-15T09:00:00Z',
    households: [
      { id: 'hh-kelapagading-07', name: 'Townhouse Kelapa Gading', role: 'OWNER', tier: 'FREE' }
    ],
    highest_tier: 'FREE',
    pro_valid_until: null,
    notes: 'Akun ditangguhkan sementara karena laporan spam pendaftaran'
  },
  {
    id: 'usr-dewi-08',
    name: 'Dewi Anggraeni',
    email: 'dewi.anggraeni@outlook.co.id',
    phone: '0821-6677-8899',
    status: 'ACTIVE',
    preferred_language: 'id',
    created_at: '2026-08-11T15:10:00Z',
    last_login_at: '2026-10-02T22:30:00Z',
    households: [
      { id: 'hh-surabaya-08', name: 'Pakuwon City Surabaya', role: 'OWNER', tier: 'PRO' }
    ],
    highest_tier: 'PRO',
    pro_valid_until: '2027-08-11T15:10:00Z',
    notes: 'Aktivasi manual via Transfer BCA Helpdesk'
  }
];

const INITIAL_TENANTS = [
  {
    id: 'hh-tebet-01',
    name: 'Rumah Tinggal - Tebet',
    owner_id: 'usr-calvin-01',
    owner_name: 'Calvin Tantio',
    owner_email: 'calvin@homehub.app',
    address: 'Jl. Tebet Barat Dalam No. 12, Tebet, Jakarta Selatan',
    subscription_tier: 'FREE',
    subscription_status: 'ACTIVE',
    pro_valid_until: null,
    active_members_count: 4,
    created_at: '2026-01-10T08:30:00Z',
    bills_count: 5,
    assets_count: 4,
    groceries_count: 8,
  },
  {
    id: 'hh-villa-02',
    name: 'Villa Puncak Indah',
    owner_id: 'usr-calvin-01',
    owner_name: 'Calvin Tantio',
    owner_email: 'calvin@homehub.app',
    address: 'Komplek Green Hill Blok C-4, Puncak, Bogor, Jawa Barat',
    subscription_tier: 'PRO',
    subscription_status: 'ACTIVE',
    pro_valid_until: '2027-01-15T10:00:00Z',
    active_members_count: 6,
    created_at: '2026-01-15T10:00:00Z',
    bills_count: 8,
    assets_count: 12,
    groceries_count: 15,
  },
  {
    id: 'hh-senopati-03',
    name: 'Apartemen Senopati Penthouse',
    owner_id: 'usr-budi-04',
    owner_name: 'Budi Hartono',
    owner_email: 'budi.hartono@bisnis.co.id',
    address: 'Senopati Tower Lt. 28, Kebayoran Baru, Jakarta Selatan',
    subscription_tier: 'PRO',
    subscription_status: 'ACTIVE',
    pro_valid_until: '2027-04-12T09:00:00Z',
    active_members_count: 5,
    created_at: '2026-04-12T09:00:00Z',
    bills_count: 10,
    assets_count: 18,
    groceries_count: 22,
  },
  {
    id: 'hh-bali-04',
    name: 'Villa Canggu Sanctuary',
    owner_id: 'usr-budi-04',
    owner_name: 'Budi Hartono',
    owner_email: 'budi.hartono@bisnis.co.id',
    address: 'Jl. Batu Bolong No. 88, Canggu, Kuta Utara, Bali',
    subscription_tier: 'PRO',
    subscription_status: 'ACTIVE',
    pro_valid_until: '2027-04-12T09:00:00Z',
    active_members_count: 8,
    created_at: '2026-04-15T11:00:00Z',
    bills_count: 12,
    assets_count: 24,
    groceries_count: 30,
  },
  {
    id: 'hh-menteng-05',
    name: 'Rumah Menteng Residence',
    owner_id: 'usr-maya-05',
    owner_name: 'Dr. Maya Lestari',
    owner_email: 'maya.lestari@medika.org',
    address: 'Jl. Teuku Umar No. 19, Menteng, Jakarta Pusat',
    subscription_tier: 'PRO',
    subscription_status: 'ACTIVE',
    pro_valid_until: '2026-11-20T16:45:00Z',
    active_members_count: 3,
    created_at: '2026-05-20T16:45:00Z',
    bills_count: 6,
    assets_count: 9,
    groceries_count: 14,
  },
  {
    id: 'hh-bsd-06',
    name: 'Rumah Cluster The Icon BSD',
    owner_id: 'usr-hendra-06',
    owner_name: 'Hendra Gunawan',
    owner_email: 'hendra.gunawan@techindo.com',
    address: 'Cluster Simplicity Blok D-11, BSD City, Tangerang Selatan',
    subscription_tier: 'FREE',
    subscription_status: 'ACTIVE',
    pro_valid_until: null,
    active_members_count: 3,
    created_at: '2026-06-18T10:30:00Z',
    bills_count: 4,
    assets_count: 2,
    groceries_count: 3,
  },
  {
    id: 'hh-surabaya-08',
    name: 'Pakuwon City Surabaya',
    owner_id: 'usr-dewi-08',
    owner_name: 'Dewi Anggraeni',
    owner_email: 'dewi.anggraeni@outlook.co.id',
    address: 'Villa Laguna Blok F-2, Pakuwon City, Surabaya Timur',
    subscription_tier: 'PRO',
    subscription_status: 'ACTIVE',
    pro_valid_until: '2027-08-11T15:10:00Z',
    active_members_count: 4,
    created_at: '2026-08-11T15:10:00Z',
    bills_count: 7,
    assets_count: 14,
    groceries_count: 16,
  }
];

const INITIAL_SUBSCRIPTIONS = [
  {
    id: 'sub-2026-001',
    household_id: 'hh-villa-02',
    household_name: 'Villa Puncak Indah',
    user_name: 'Calvin Tantio',
    user_email: 'calvin@homehub.app',
    plan_type: 'PRO_YEARLY',
    amount: 470000,
    payment_method: 'MIDTRANS_BCA_VA',
    payment_gateway_ref: 'MID-2026-881920',
    status: 'PAID',
    started_at: '2026-01-15T10:00:00Z',
    expires_at: '2027-01-15T10:00:00Z',
    is_manual_activation: false,
    activated_by: null,
  },
  {
    id: 'sub-2026-002',
    household_id: 'hh-senopati-03',
    household_name: 'Apartemen Senopati Penthouse',
    user_name: 'Budi Hartono',
    user_email: 'budi.hartono@bisnis.co.id',
    plan_type: 'PRO_YEARLY',
    amount: 470000,
    payment_method: 'XENDIT_QRIS',
    payment_gateway_ref: 'XEN-QRIS-774910',
    status: 'PAID',
    started_at: '2026-04-12T09:00:00Z',
    expires_at: '2027-04-12T09:00:00Z',
    is_manual_activation: false,
    activated_by: null,
  },
  {
    id: 'sub-2026-003',
    household_id: 'hh-bali-04',
    household_name: 'Villa Canggu Sanctuary',
    user_name: 'Budi Hartono',
    user_email: 'budi.hartono@bisnis.co.id',
    plan_type: 'PRO_YEARLY',
    amount: 470000,
    payment_method: 'XENDIT_CREDIT_CARD',
    payment_gateway_ref: 'XEN-CC-552914',
    status: 'PAID',
    started_at: '2026-04-15T11:00:00Z',
    expires_at: '2027-04-15T11:00:00Z',
    is_manual_activation: false,
    activated_by: null,
  },
  {
    id: 'sub-2026-004',
    household_id: 'hh-menteng-05',
    household_name: 'Rumah Menteng Residence',
    user_name: 'Dr. Maya Lestari',
    user_email: 'maya.lestari@medika.org',
    plan_type: 'PRO_MONTHLY',
    amount: 49000,
    payment_method: 'GOPAY_ECOMMERCE',
    payment_gateway_ref: 'GOPAY-992138',
    status: 'PAID',
    started_at: '2026-09-20T16:45:00Z',
    expires_at: '2026-10-20T16:45:00Z',
    is_manual_activation: false,
    activated_by: null,
  },
  {
    id: 'sub-2026-005',
    household_id: 'hh-surabaya-08',
    household_name: 'Pakuwon City Surabaya',
    user_name: 'Dewi Anggraeni',
    user_email: 'dewi.anggraeni@outlook.co.id',
    plan_type: 'PRO_YEARLY',
    amount: 470000,
    payment_method: 'MANUAL_BANK_TRANSFER',
    payment_gateway_ref: 'HELP-TRF-BCA-991',
    status: 'PAID',
    started_at: '2026-08-11T15:10:00Z',
    expires_at: '2027-08-11T15:10:00Z',
    is_manual_activation: true,
    activated_by: 'Dimas Helpdesk',
    notes: 'Aktivasi manual verifikasi transfer bank bukti struk ATM BCA'
  }
];

const INITIAL_AUDIT_LOGS = [
  {
    id: 'aud-01',
    admin_name: 'Dimas Helpdesk',
    admin_role: 'HELPDESK',
    action: 'ACTIVATE_PRO_MANUAL',
    target_type: 'HOUSEHOLD',
    target_id: 'hh-surabaya-08',
    target_name: 'Pakuwon City Surabaya (Dewi Anggraeni)',
    details: 'Aktivasi Paket PRO Tahunan 12 bulan via verifikasi transfer manual',
    timestamp: '2026-08-11T15:10:00Z'
  },
  {
    id: 'aud-02',
    admin_name: 'Bramantyo Superadmin',
    admin_role: 'SUPERADMIN',
    action: 'SUSPEND_USER',
    target_type: 'USER',
    target_id: 'usr-rina-07',
    target_name: 'Rina Kusuma Dewi (rina.kdewi@gmail.com)',
    details: 'Penangguhan akun sementara karena terindikasi aktivitas spam pendaftaran bot',
    timestamp: '2026-08-15T09:00:00Z'
  }
];

const INITIAL_VOUCHERS = [
  {
    id: 'vouch-01',
    code: 'RAMADHAN50',
    description: 'Promo Berkah Ramadhan diskon 50% seluruh paket PRO HomeHub',
    discount_type: 'PERCENTAGE', // PERCENTAGE or FIXED_AMOUNT
    discount_value: 50,
    target_plan: 'ALL', // ALL, PRO_YEARLY, PRO_MONTHLY
    max_quota: 20,
    claimed_count: 3,
    status: 'ACTIVE', // ACTIVE, EXHAUSTED, EXPIRED, DISABLED
    valid_until: '2026-12-31T23:59:59Z',
    generated_by_name: 'Reza Pratama',
    generated_by_role: 'MARKETING',
    created_at: '2026-03-01T10:00:00Z',
    claims: [
      {
        id: 'clm-01',
        user_id: 'usr-budi-04',
        user_name: 'Budi Hartono',
        user_email: 'budi.hartono@bisnis.co.id',
        household_id: 'hh-senopati-03',
        household_name: 'Apartemen Senopati Penthouse',
        claimed_at: '2026-04-12T09:00:00Z',
        applied_plan: 'PRO_YEARLY',
        original_price: 470000,
        discount_amount: 235000,
        final_price: 235000
      },
      {
        id: 'clm-02',
        user_id: 'usr-maya-05',
        user_name: 'Dr. Maya Lestari',
        user_email: 'maya.lestari@medika.org',
        household_id: 'hh-menteng-05',
        household_name: 'Rumah Menteng Residence',
        claimed_at: '2026-05-20T16:45:00Z',
        applied_plan: 'PRO_MONTHLY',
        original_price: 49000,
        discount_amount: 24500,
        final_price: 24500
      },
      {
        id: 'clm-03',
        user_id: 'usr-dewi-08',
        user_name: 'Dewi Anggraeni',
        user_email: 'dewi.anggraeni@outlook.co.id',
        household_id: 'hh-surabaya-08',
        household_name: 'Pakuwon City Surabaya',
        claimed_at: '2026-08-11T15:10:00Z',
        applied_plan: 'PRO_YEARLY',
        original_price: 470000,
        discount_amount: 235000,
        final_price: 235000
      }
    ]
  },
  {
    id: 'vouch-02',
    code: 'HEMAT100K',
    description: 'Potongan langsung Rp 100.000 untuk langganan PRO Tahunan pertama',
    discount_type: 'FIXED_AMOUNT',
    discount_value: 100000,
    target_plan: 'PRO_YEARLY',
    max_quota: 5,
    claimed_count: 5,
    status: 'EXHAUSTED',
    valid_until: '2026-11-30T23:59:59Z',
    generated_by_name: 'Clarissa Natalia',
    generated_by_role: 'FINANCE',
    created_at: '2026-02-15T08:30:00Z',
    claims: [
      {
        id: 'clm-04',
        user_id: 'usr-calvin-01',
        user_name: 'Calvin Tantio',
        user_email: 'calvin@homehub.app',
        household_id: 'hh-villa-02',
        household_name: 'Villa Puncak Indah',
        claimed_at: '2026-02-20T11:00:00Z',
        applied_plan: 'PRO_YEARLY',
        original_price: 470000,
        discount_amount: 100000,
        final_price: 370000
      }
    ]
  },
  {
    id: 'vouch-03',
    code: 'FREE1MO-COMMUNITY',
    description: 'Voucher Uji Coba Gratis 100% Paket PRO 1 Bulan untuk Pengurus RT/RW Mitra',
    discount_type: 'PERCENTAGE',
    discount_value: 100,
    target_plan: 'PRO_MONTHLY',
    max_quota: 50,
    claimed_count: 14,
    status: 'ACTIVE',
    valid_until: '2027-01-31T23:59:59Z',
    generated_by_name: 'Bramantyo Superadmin',
    generated_by_role: 'SUPERADMIN',
    created_at: '2026-06-01T14:00:00Z',
    claims: []
  }
];

export const DEFAULT_FEATURE_LIMITS = {
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

export const INITIAL_UTILITY_CATEGORIES = [
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
    name_en: 'Other / General Bills',
    icon: '📄',
    icon_url: null,
    color: 'slate',
    providers: ['BPJS Kesehatan', 'Asuransi Rumah', 'Tagihan Lainnya'],
    is_default: true,
    is_active: true
  }
];

export const INITIAL_ASSET_CATEGORIES = [
  { id: 'cat-ast-elec', code: 'ELECTRONIC', name: 'Elektronik Rumah Tangga', name_en: 'Household Electronics', icon: '❄️', icon_url: null, color: 'emerald', metadata: { subcategories: ['AC', 'Kulkas', 'Smart TV', 'Mesin Cuci', 'Microwave', 'Dispenser Air'] }, is_default: true, is_active: true },
  { id: 'cat-ast-veh', code: 'VEHICLE', name: 'Kendaraan Bermotor', name_en: 'Motor Vehicles', icon: '🚗', icon_url: null, color: 'blue', metadata: { subcategories: ['Mobil', 'Sepeda Motor', 'Sepeda Listrik'], has_odometer: true }, is_default: true, is_active: true },
  { id: 'cat-ast-furn', code: 'FURNITURE', name: 'Perabotan / Furnitur', name_en: 'Furniture & Fixtures', icon: '🛋️', icon_url: null, color: 'amber', metadata: { subcategories: ['Sofa & Kursi', 'Meja Makan', 'Tempat Tidur', 'Lemari Pakaian', 'Kitchen Set'] }, is_default: true, is_active: true },
  { id: 'cat-ast-prop', code: 'PROPERTY', name: 'Properti & Bangunan', name_en: 'Property & Buildings', icon: '🏡', icon_url: null, color: 'indigo', metadata: { subcategories: ['Rumah Utama', 'Villa', 'Ruko / Toko', 'Tanah'] }, is_default: true, is_active: true },
  { id: 'cat-ast-jwl', code: 'JEWELRY', name: 'Perhiasan & Logam Mulia', name_en: 'Jewelry & Precious Metals', icon: '💎', icon_url: null, color: 'purple', metadata: { subcategories: ['Emas Batangan', 'Cincin & Kalung', 'Jam Tangan Mewah'] }, is_default: true, is_active: true },
  { id: 'cat-ast-oth', code: 'OTHER', name: 'Aset Lainnya', name_en: 'Other Assets', icon: '📦', icon_url: null, color: 'slate', metadata: { subcategories: ['Kamera & Lensa', 'Sepeda Olahraga', 'Peralatan Bengkel / Hobi'] }, is_default: true, is_active: true }
];

export const INITIAL_GROCERY_CATEGORIES = [
  { id: 'cat-groc-bumbu', code: 'BUMBU', name: 'Bumbu Masak', name_en: 'Cooking Seasoning', icon: '🧂', icon_url: null, color: 'amber', metadata: { item_suggestions: ['Bawang Merah', 'Bawang Putih', 'Garam Dapur', 'Merica Bubuk', 'Kecap Manis', 'Minyak Goreng 2L'] }, is_default: true, is_active: true },
  { id: 'cat-groc-pokok', code: 'BAHAN_POKOK', name: 'Bahan Pokok', name_en: 'Staple Foods', icon: '🌾', icon_url: null, color: 'orange', metadata: { item_suggestions: ['Beras Pandan Wangi 10kg', 'Gula Pasir 1kg', 'Tepung Terigu Segitiga', 'Telur Ayam 1kg'] }, is_default: true, is_active: true },
  { id: 'cat-groc-sayur', code: 'SAYUR_BUAH', name: 'Sayuran & Buah', name_en: 'Vegetables & Fruits', icon: '🥦', icon_url: null, color: 'emerald', metadata: { item_suggestions: ['Wortel Impor', 'Bayam Segar', 'Brokoli Hijau', 'Apel Fuji', 'Pisang Cavendish'] }, is_default: true, is_active: true },
  { id: 'cat-groc-daging', code: 'DAGING_IKAN', name: 'Daging, Ikan & Telur', name_en: 'Meat, Fish & Eggs', icon: '🥩', icon_url: null, color: 'rose', metadata: { item_suggestions: ['Daging Sapi Has Dalam', 'Dada Ayam Fillet', 'Ikan Salmon', 'Udang Segar'] }, is_default: true, is_active: true },
  { id: 'cat-groc-bersih', code: 'KEBERSIHAN', name: 'Kebersihan & Mandi', name_en: 'Cleaning & Bathing', icon: '🧼', icon_url: null, color: 'cyan', metadata: { item_suggestions: ['Deterjen Cair', 'Sabun Mandi Refill', 'Shampoo', 'Pembersih Lantai', 'Pasta Gigi'] }, is_default: true, is_active: true },
  { id: 'cat-groc-minum', code: 'MINUMAN_SUSU', name: 'Minuman & Susu', name_en: 'Beverages & Milk', icon: '🥛', icon_url: null, color: 'blue', metadata: { item_suggestions: ['Susu UHT Full Cream', 'Air Galon Aqua', 'Teh Celup', 'Kopi Bubuk'] }, is_default: true, is_active: true },
  { id: 'cat-groc-snack', code: 'SNACK', name: 'Makanan Ringan', name_en: 'Snacks', icon: '🍪', icon_url: null, color: 'purple', metadata: { item_suggestions: ['Biskuit Roma', 'Keripik Kentang', 'Kacang Almond', 'Roti Tawar Gandum'] }, is_default: true, is_active: true },
  { id: 'cat-groc-oth', code: 'OTHER', name: 'Lainnya', name_en: 'Others', icon: '📦', icon_url: null, color: 'slate', metadata: { item_suggestions: ['Baterai AA', 'Tisu Basah', 'Kantong Sampah Hitam'] }, is_default: true, is_active: true }
];

export const INITIAL_EXPENSE_CATEGORIES = [
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

export const INITIAL_ACTIVITY_CATEGORIES = [
  { id: 'cat-act-les', code: 'COURSE_LES', name: 'Kursus / Les / Bimbel', name_en: 'Courses & Tutoring', icon: '🎓', icon_url: null, color: 'amber', metadata: { reminder: 30, tag: 'Les' }, is_default: true, is_active: true },
  { id: 'cat-act-lib', code: 'VACATION', name: 'Liburan / Rekreasi Keluarga', name_en: 'Vacation & Family Recreation', icon: '🌴', icon_url: null, color: 'emerald', metadata: { reminder: 1440, tag: 'Liburan' }, is_default: true, is_active: true },
  { id: 'cat-act-dns', code: 'BIZTRIP', name: 'Perjalanan Bisnis / Dinas', name_en: 'Business Trip', icon: '💼', icon_url: null, color: 'blue', metadata: { reminder: 120, tag: 'Dinas' }, is_default: true, is_active: true },
  { id: 'cat-act-udg', code: 'INVITATION', name: 'Undangan / Hajatan', name_en: 'Invitation / Party', icon: '✉️', icon_url: null, color: 'purple', metadata: { reminder: 60, tag: 'Undangan' }, is_default: true, is_active: true },
  { id: 'cat-act-ult', code: 'BIRTHDAY', name: 'Ulang Tahun / Perayaan', name_en: 'Birthday & Celebration', icon: '🎂', icon_url: null, color: 'pink', metadata: { reminder: 1440, tag: 'Ulang Tahun' }, is_default: true, is_active: true },
  { id: 'cat-act-rtn', code: 'ROUTINE', name: 'Rutinitas / Ibadah', name_en: 'Routine & Worship', icon: '⚡', icon_url: null, color: 'indigo', metadata: { reminder: 15, tag: 'Rutinitas' }, is_default: true, is_active: true },
  { id: 'cat-act-med', code: 'HEALTH_CHECK', name: 'Pemeriksaan Kesehatan / Dokter', name_en: 'Doctor & Health Checkup', icon: '🩺', icon_url: null, color: 'rose', metadata: { reminder: 60, tag: 'Kesehatan' }, is_default: true, is_active: true },
  { id: 'cat-act-rpt', code: 'MEETING', name: 'Rapat RT/RW / Komunitas', name_en: 'Community & Neighborhood Meeting', icon: '👥', icon_url: null, color: 'teal', metadata: { reminder: 30, tag: 'Rapat' }, is_default: true, is_active: true },
  { id: 'cat-act-oth', code: 'OTHER', name: 'Lainnya', name_en: 'Others', icon: '📌', icon_url: null, color: 'slate', metadata: { reminder: 30, tag: 'Agenda' }, is_default: true, is_active: true }
];

const UTILITY_CATEGORIES_COOKIE = 'homehub_utility_categories_sync';
const ASSET_CATEGORIES_COOKIE = 'homehub_asset_categories_sync';
const GROCERY_CATEGORIES_COOKIE = 'homehub_grocery_categories_sync';
const EXPENSE_CATEGORIES_COOKIE = 'homehub_expense_categories_sync';
const ACTIVITY_CATEGORIES_COOKIE = 'homehub_activity_categories_sync';

export const MODULE_CATEGORY_REGISTRY = {
  utility: {
    name: 'Utilitas & Tagihan',
    icon: '⚡',
    cookie: UTILITY_CATEGORIES_COOKIE,
    storageKey: 'homehub_admin_utility_categories',
    initial: INITIAL_UTILITY_CATEGORIES,
    apiPath: '/admin/utility-categories',
    broadcastEvent: 'UTILITY_CATEGORIES_UPDATED',
    auditType: 'UTILITY_CATEGORY',
    codePrefix: 'CAT',
    defaultIcon: '⚡'
  },
  asset: {
    name: 'Tipe & Kategori Aset',
    icon: '🚗',
    cookie: ASSET_CATEGORIES_COOKIE,
    storageKey: 'homehub_admin_asset_categories',
    initial: INITIAL_ASSET_CATEGORIES,
    apiPath: '/admin/asset-categories',
    broadcastEvent: 'ASSET_CATEGORIES_UPDATED',
    auditType: 'ASSET_CATEGORY',
    codePrefix: 'AST',
    defaultIcon: '📦'
  },
  grocery: {
    name: 'Kategori Belanjaan',
    icon: '🛒',
    cookie: GROCERY_CATEGORIES_COOKIE,
    storageKey: 'homehub_admin_grocery_categories',
    initial: INITIAL_GROCERY_CATEGORIES,
    apiPath: '/admin/grocery-categories',
    broadcastEvent: 'GROCERY_CATEGORIES_UPDATED',
    auditType: 'GROCERY_CATEGORY',
    codePrefix: 'GRC',
    defaultIcon: '🛒'
  },
  expense: {
    name: 'Kategori Pengeluaran',
    icon: '💰',
    cookie: EXPENSE_CATEGORIES_COOKIE,
    storageKey: 'homehub_admin_expense_categories',
    initial: INITIAL_EXPENSE_CATEGORIES,
    apiPath: '/admin/expense-categories',
    broadcastEvent: 'EXPENSE_CATEGORIES_UPDATED',
    auditType: 'EXPENSE_CATEGORY',
    codePrefix: 'EXP',
    defaultIcon: '💰'
  },
  activity: {
    name: 'Kategori Agenda',
    icon: '📅',
    cookie: ACTIVITY_CATEGORIES_COOKIE,
    storageKey: 'homehub_admin_activity_categories',
    initial: INITIAL_ACTIVITY_CATEGORIES,
    apiPath: '/admin/activity-categories',
    broadcastEvent: 'ACTIVITY_CATEGORIES_UPDATED',
    auditType: 'ACTIVITY_CATEGORY',
    codePrefix: 'ACT',
    defaultIcon: '📅'
  }
};
const LIVE_STATE_COOKIE = 'homehub_live_sync_state';
const ADMIN_ACTION_COOKIE = 'homehub_admin_action_event';
const VOUCHERS_COOKIE = 'homehub_admin_vouchers_sync';
const ORDERS_COOKIE = 'homehub_live_orders_sync';

let adminBroadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    adminBroadcastChannel = new BroadcastChannel('homehub_live_sync_bus');
  }
} catch (e) {}

const getNamedCookie = (name) => {
  try {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    if (!match || !match[1]) return null;
    return JSON.parse(decodeURIComponent(match[1]));
  } catch (e) {
    return null;
  }
};

const setNamedCookie = (name, val, days = 30) => {
  try {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(val))}; expires=${expires}; path=/; SameSite=Lax${secureFlag}`;
  } catch (e) {
    console.warn(`Cookie set error for ${name}:`, e);
  }
};

const setCrossPortCookie = (limits) => {
  try {
    if (typeof document === 'undefined') return;
    const serializable = {
      ...limits,
      PRO: Object.fromEntries(
        Object.entries(limits.PRO || {}).map(([k, v]) => [k, v === Infinity ? 'Infinity' : v])
      )
    };
    const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    document.cookie = `homehub_feature_limits=${encodeURIComponent(JSON.stringify(serializable))}; expires=${expires}; path=/; SameSite=Lax${secureFlag}`;
  } catch (e) {
    console.warn('Cookie set error:', e);
  }
};

const getCrossPortCookie = () => {
  return getNamedCookie('homehub_feature_limits');
};

const getLiveSyncSnapshot = () => {
  const fromCookie = getNamedCookie(LIVE_STATE_COOKIE);
  if (fromCookie && fromCookie.timestamp) {
    return fromCookie;
  }
  return safeGet(LIVE_STATE_COOKIE, null);
};

export class AdminDataManager {
  constructor() {
    this.membersKey = 'homehub_admin_members';
    this.tenantsKey = 'homehub_admin_tenants';
    this.subsKey = 'homehub_admin_subscriptions';
    this.logsKey = 'homehub_admin_audit_logs';
    this.vouchersKey = 'homehub_admin_vouchers';
    this.limitsKey = 'homehub_feature_limits';
    this.categoriesKey = 'homehub_admin_utility_categories';
  }

  getFeatureLimits() {
    const fromCookie = getCrossPortCookie();
    const raw = fromCookie || safeGet(this.limitsKey, DEFAULT_FEATURE_LIMITS);
    if (raw && raw.PRO) {
      for (const k of Object.keys(raw.PRO)) {
        if (raw.PRO[k] === null || raw.PRO[k] === 'Infinity' || raw.PRO[k] === 999999) {
          raw.PRO[k] = Infinity;
        }
      }
    }
    return raw;
  }

  getMembers() {
    const cached = safeGet(this.membersKey, INITIAL_MEMBERS);
    const snapshot = getLiveSyncSnapshot();

    if (!snapshot || !snapshot.user) {
      return cached;
    }

    const { user: liveUser, households: liveHhs, members: liveMembers } = snapshot;
    const result = [...cached];

    // 1. Merge or prepend live active user
    const existingUserIdx = result.findIndex(m => 
      m.id === liveUser.id || 
      (m.email && liveUser.email && m.email.toLowerCase() === liveUser.email.toLowerCase())
    );

    const userHouseholds = (liveHhs || []).map(h => ({
      id: h.id,
      name: h.name,
      role: h.role || 'OWNER',
      tier: h.subscription_tier || h.tier || 'FREE'
    }));

    const highestTier = userHouseholds.some(h => h.tier === 'PRO') ? 'PRO' : 'FREE';
    const proHh = (liveHhs || []).find(h => (h.subscription_tier === 'PRO' || h.tier === 'PRO'));

    const liveMemberRecord = {
      id: liveUser.id || 'usr-calvin-01',
      name: liveUser.name || 'Calvin Tantio',
      email: liveUser.email || 'calvin@homehub.app',
      phone: liveUser.phone || '0812-3456-7890',
      status: liveUser.status || 'ACTIVE',
      preferred_language: liveUser.preferred_language || 'id',
      created_at: liveUser.created_at || '2026-01-10T08:30:00Z',
      last_login_at: liveUser.last_active || new Date().toISOString(),
      households: userHouseholds.length > 0 ? userHouseholds : [
        { id: 'tebet_free', name: 'Rumah Tebet (Utama)', role: 'OWNER', tier: 'FREE' }
      ],
      highest_tier: highestTier,
      pro_valid_until: proHh?.pro_valid_until || (highestTier === 'PRO' ? '2027-01-15T10:00:00Z' : null),
      is_live_synced: true,
      notes: 'Pengguna Aktif Web App (Port 5173 - Real-Time Sync)'
    };

    if (existingUserIdx !== -1) {
      result[existingUserIdx] = {
        ...result[existingUserIdx],
        ...liveMemberRecord,
        notes: result[existingUserIdx].notes || liveMemberRecord.notes
      };
    } else {
      result.unshift(liveMemberRecord);
    }

    // 2. Merge additional live household members (e.g. Siti Aminah, Nathan, Mbak Sri)
    if (Array.isArray(liveMembers)) {
      liveMembers.forEach(mem => {
        const memIdx = result.findIndex(m => 
          m.id === mem.id || 
          (m.email && mem.email && m.email.toLowerCase() === mem.email.toLowerCase())
        );
        if (memIdx === -1 && mem.name) {
          result.push({
            id: mem.id || `mem-${Date.now()}`,
            name: mem.name,
            email: mem.email || `${mem.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@keluarga.com`,
            phone: '0812-9988-1122',
            status: mem.status || 'ACTIVE',
            preferred_language: 'id',
            created_at: '2026-03-01T10:00:00Z',
            last_login_at: new Date().toISOString(),
            households: [
              { id: mem.household_id || 'tebet_free', name: mem.household_name || 'Rumah', role: mem.role || 'MEMBER', tier: mem.tier || 'FREE' }
            ],
            highest_tier: mem.tier || 'FREE',
            pro_valid_until: null,
            is_live_synced: true,
            notes: `Anggota ${mem.household_name || 'Rumah Tangga'} (${mem.role || 'MEMBER'})`
          });
        } else if (memIdx !== -1) {
          result[memIdx].is_live_synced = true;
        }
      });
    }

    return result;
  }

  getTenants() {
    const cached = safeGet(this.tenantsKey, INITIAL_TENANTS);
    const snapshot = getLiveSyncSnapshot();

    if (!snapshot || !Array.isArray(snapshot.households) || snapshot.households.length === 0) {
      return cached;
    }

    const result = [...cached];

    snapshot.households.forEach(liveHh => {
      const idx = result.findIndex(t => 
        t.id === liveHh.id || 
        t.name.trim().toLowerCase() === liveHh.name.trim().toLowerCase()
      );

      const tenantRecord = {
        id: liveHh.id,
        name: liveHh.name,
        owner_id: liveHh.owner_id || snapshot.user?.id || 'usr-calvin-01',
        owner_name: liveHh.owner_name || snapshot.user?.name || 'Calvin Tantio',
        owner_email: liveHh.owner_email || snapshot.user?.email || 'calvin@homehub.app',
        address: liveHh.address || (liveHh.name.toLowerCase().includes('villa') ? 'Komplek Green Hill Blok C-4, Puncak, Bogor' : 'Jl. Tebet Barat Dalam No. 12, Jakarta Selatan'),
        subscription_tier: liveHh.subscription_tier || liveHh.tier || 'FREE',
        subscription_status: liveHh.subscription_status || 'ACTIVE',
        pro_valid_until: liveHh.pro_valid_until || (liveHh.subscription_tier === 'PRO' ? '2027-01-15T10:00:00Z' : null),
        active_members_count: liveHh.active_members_count || 1,
        bills_count: liveHh.bills_count || 0,
        assets_count: liveHh.assets_count || 0,
        groceries_count: liveHh.groceries_count || 0,
        expenses_count: liveHh.expenses_count || 0,
        created_at: liveHh.created_at || '2026-01-10T08:30:00Z',
        is_live_synced: true
      };

      if (idx !== -1) {
        result[idx] = {
          ...result[idx],
          ...tenantRecord
        };
      } else {
        result.unshift(tenantRecord);
      }
    });

    return result;
  }

  getSubscriptions() {
    const cached = safeGet(this.subsKey, INITIAL_SUBSCRIPTIONS);
    const snapshot = getLiveSyncSnapshot();
    const liveOrders = getNamedCookie(ORDERS_COOKIE) || snapshot?.orders || [];

    if (!Array.isArray(liveOrders) || liveOrders.length === 0) {
      return cached;
    }

    const result = [...cached];

    liveOrders.forEach(order => {
      const existingIdx = result.findIndex(s => s.id === order.id);
      const subRecord = {
        id: order.id,
        household_id: order.household_id,
        household_name: order.household_name || 'Rumah',
        user_name: order.user_name || 'User',
        user_email: order.user_email || '-',
        plan_type: order.plan_type || 'PRO_YEARLY',
        amount: Number(order.amount || order.final_amount) || 470000,
        payment_method: order.payment_method || 'GOPAY',
        payment_gateway_ref: order.payment_gateway_ref || order.id,
        status: order.status || 'PAID',
        started_at: order.started_at || order.created_at || new Date().toISOString(),
        expires_at: order.expires_at || new Date(Date.now() + 365 * 864e5).toISOString(),
        is_manual_activation: order.payment_method === 'MANUAL_ACTIVATION_BACKOFFICE',
        is_live_synced: true,
        notes: `Transaksi Pembayaran ${order.payment_method || 'Online'} (Real-Time Sync)`
      };

      if (existingIdx !== -1) {
        result[existingIdx] = { ...result[existingIdx], ...subRecord };
      } else {
        result.unshift(subRecord);
      }
    });

    return result;
  }

  getAuditLogs() {
    return safeGet(this.logsKey, INITIAL_AUDIT_LOGS);
  }

  async fetchAuditLogsPaginated({ page = 1, limit = 10, search = '', action = 'ALL' }) {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: (search || '').trim(),
        action: action || 'ALL'
      });
      const res = await api.get(`/auth/admin/audit-logs?${params.toString()}`)
        .catch(() => api.get(`/admin/audit-logs?${params.toString()}`));

      if (res?.data?.data) {
        return res.data.data;
      }
    } catch (e) {
      console.warn('Backend audit logs fetch fallback to local:', e);
    }

    // Client fallback pagination if backend is offline
    const all = this.getAuditLogs();
    const filtered = all.filter(log => {
      const matchSearch = !search ||
        log.admin_name?.toLowerCase().includes(search.toLowerCase()) ||
        log.target_name?.toLowerCase().includes(search.toLowerCase()) ||
        log.details?.toLowerCase().includes(search.toLowerCase()) ||
        log.action?.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (action === 'ACTIVATE' && !log.action?.includes('ACTIVATE')) return false;
      if (action === 'SUSPEND' && !log.action?.includes('SUSPEND')) return false;
      if (action === 'DOWNGRADE' && !log.action?.includes('DOWNGRADE')) return false;
      if (action === 'VOUCHER' && !log.action?.includes('VOUCHER')) return false;

      return true;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const items = filtered.slice(offset, offset + limit);

    return {
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    };
  }

  getVouchers() {
    return safeGet(this.vouchersKey, INITIAL_VOUCHERS);
  }

  // Calculate comprehensive metrics
  getOverviewStats() {
    const members = this.getMembers();
    const tenants = this.getTenants();
    const subs = this.getSubscriptions();

    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'ACTIVE').length;
    const suspendedMembers = members.filter(m => m.status === 'SUSPENDED').length;

    const proMembers = members.filter(m => m.highest_tier === 'PRO').length;
    const freeMembers = totalMembers - proMembers;
    const conversionRate = totalMembers > 0 ? ((proMembers / totalMembers) * 100).toFixed(1) : 0;

    const totalTenants = tenants.length;
    const proTenants = tenants.filter(t => t.subscription_tier === 'PRO').length;
    const freeTenants = totalTenants - proTenants;

    const paidSubs = subs.filter(s => s.status === 'PAID');
    const totalRevenue = paidSubs.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    // Estimated MRR: Monthly subs * 49k + (Yearly subs * 470k / 12)
    const mrr = paidSubs.reduce((acc, curr) => {
      if (curr.plan_type === 'PRO_MONTHLY') return acc + curr.amount;
      if (curr.plan_type === 'PRO_YEARLY') return acc + Math.round(curr.amount / 12);
      return acc;
    }, 0);

    return {
      totalMembers,
      activeMembers,
      suspendedMembers,
      proMembers,
      freeMembers,
      conversionRate,
      totalTenants,
      proTenants,
      freeTenants,
      totalRevenue,
      mrr,
      recentSubscriptions: subs.slice(0, 5),
    };
  }

  // Manual PRO Activation (Troubleshooting & Manual payment verification)
  activateProManual({ householdId, durationMonths = 12, planType = 'PRO_YEARLY', reason = 'Manual Payment Verification', paymentRef = '', adminName = 'Admin Staff', adminRole = 'HELPDESK' }) {
    const tenants = this.getTenants();
    const members = this.getMembers();
    const subs = this.getSubscriptions();
    const logs = this.getAuditLogs();

    const tenantIndex = tenants.findIndex(t => t.id === householdId);
    if (tenantIndex === -1) {
      throw new Error(`Rumah / Tenant dengan ID ${householdId} tidak ditemukan.`);
    }

    const tenant = tenants[tenantIndex];
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setMonth(validUntil.getMonth() + Number(durationMonths));

    // Update Tenant
    tenant.subscription_tier = 'PRO';
    tenant.subscription_status = 'ACTIVE';
    tenant.pro_valid_until = validUntil.toISOString();
    tenants[tenantIndex] = tenant;
    safeSet(this.tenantsKey, tenants);

    // Update Owner Member Record
    const memberIndex = members.findIndex(m => m.id === tenant.owner_id);
    if (memberIndex !== -1) {
      members[memberIndex].highest_tier = 'PRO';
      members[memberIndex].pro_valid_until = validUntil.toISOString();
      members[memberIndex].households = members[memberIndex].households.map(h => 
        h.id === householdId ? { ...h, tier: 'PRO' } : h
      );
      safeSet(this.membersKey, members);
    }

    // Add Subscription Record
    const newSub = {
      id: `sub-${Date.now()}`,
      household_id: householdId,
      household_name: tenant.name,
      user_name: tenant.owner_name,
      user_email: tenant.owner_email,
      plan_type: planType,
      amount: planType === 'PRO_MONTHLY' ? 49000 : 470000,
      payment_method: 'MANUAL_ACTIVATION_BACKOFFICE',
      payment_gateway_ref: paymentRef || `ADM-MANUAL-${Date.now()}`,
      status: 'PAID',
      started_at: now.toISOString(),
      expires_at: validUntil.toISOString(),
      is_manual_activation: true,
      activated_by: adminName,
      notes: reason
    };
    subs.unshift(newSub);
    safeSet(this.subsKey, subs);

    // Add Audit Log
    const newLog = {
      id: `aud-${Date.now()}`,
      admin_name: adminName,
      admin_role: adminRole,
      action: 'ACTIVATE_PRO_MANUAL',
      target_type: 'HOUSEHOLD',
      target_id: householdId,
      target_name: `${tenant.name} (${tenant.owner_name})`,
      details: `Aktivasi manual paket ${planType} (${durationMonths} bulan). Alasan: ${reason}. Ref: ${paymentRef || 'N/A'}. Berlaku s/d ${validUntil.toISOString().slice(0, 10)}.`,
      timestamp: now.toISOString()
    };
    logs.unshift(newLog);
    safeSet(this.logsKey, logs);

    // ⚡ Cross-Port 2-Way Sync to User Web App (Port 5173)
    const syncAction = {
      action: 'ACTIVATE_PRO',
      householdId,
      tier: 'PRO',
      validUntil: validUntil.toISOString(),
      timestamp: Date.now()
    };
    setNamedCookie(ADMIN_ACTION_COOKIE, syncAction);
    if (adminBroadcastChannel) {
      try {
        adminBroadcastChannel.postMessage({ type: 'ADMIN_ACTION', payload: syncAction });
      } catch (e) {}
    }

    // Call backend API
    api.post(`/auth/admin/households/${householdId}/activate-pro`, {
      durationMonths,
      planType,
      reason,
      paymentRef,
      adminName
    }).catch(() => {
      return api.post(`/admin/households/${householdId}/activate-pro`, {
        durationMonths,
        planType,
        reason,
        paymentRef,
        adminName
      });
    }).catch(() => {});

    return {
      success: true,
      tenant,
      subscription: newSub,
      validUntil: validUntil.toISOString()
    };
  }

  // Downgrade / Cancel PRO
  downgradeHousehold({ householdId, reason = 'Admin Action / Refund', adminName = 'Super Admin', adminRole = 'SUPERADMIN' }) {
    const tenants = this.getTenants();
    const members = this.getMembers();
    const logs = this.getAuditLogs();

    const tenantIndex = tenants.findIndex(t => t.id === householdId);
    if (tenantIndex === -1) {
      throw new Error(`Rumah / Tenant dengan ID ${householdId} tidak ditemukan.`);
    }

    const tenant = tenants[tenantIndex];
    tenant.subscription_tier = 'FREE';
    tenant.subscription_status = 'ACTIVE';
    tenant.pro_valid_until = null;
    tenants[tenantIndex] = tenant;
    safeSet(this.tenantsKey, tenants);

    // Update Owner
    const memberIndex = members.findIndex(m => m.id === tenant.owner_id);
    if (memberIndex !== -1) {
      const otherProHomes = tenants.filter(t => t.owner_id === tenant.owner_id && t.id !== householdId && t.subscription_tier === 'PRO');
      if (otherProHomes.length === 0) {
        members[memberIndex].highest_tier = 'FREE';
        members[memberIndex].pro_valid_until = null;
      }
      members[memberIndex].households = members[memberIndex].households.map(h => 
        h.id === householdId ? { ...h, tier: 'FREE' } : h
      );
      safeSet(this.membersKey, members);
    }

    // Add Audit Log
    const newLog = {
      id: `aud-${Date.now()}`,
      admin_name: adminName,
      admin_role: adminRole,
      action: 'DOWNGRADE_TO_FREE',
      target_type: 'HOUSEHOLD',
      target_id: householdId,
      target_name: `${tenant.name} (${tenant.owner_name})`,
      details: `Paket diturunkan menjadi FREE. Alasan: ${reason}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    safeSet(this.logsKey, logs);

    // ⚡ Cross-Port 2-Way Sync to User Web App (Port 5173)
    const syncAction = {
      action: 'DOWNGRADE',
      householdId,
      tier: 'FREE',
      timestamp: Date.now()
    };
    setNamedCookie(ADMIN_ACTION_COOKIE, syncAction);
    if (adminBroadcastChannel) {
      try {
        adminBroadcastChannel.postMessage({ type: 'ADMIN_ACTION', payload: syncAction });
      } catch (e) {}
    }

    // Call backend API
    api.post(`/auth/admin/households/${householdId}/downgrade`, { reason, adminName })
      .catch(() => api.post(`/admin/households/${householdId}/downgrade`, { reason, adminName }))
      .catch(() => {});

    return { success: true, tenant };
  }

  // Toggle user status (ACTIVE / SUSPENDED)
  toggleUserStatus({ userId, newStatus, reason = '', adminName = 'Admin', adminRole = 'SUPERADMIN' }) {
    const members = this.getMembers();
    const logs = this.getAuditLogs();

    const memberIndex = members.findIndex(m => m.id === userId);
    if (memberIndex === -1) {
      throw new Error(`User dengan ID ${userId} tidak ditemukan.`);
    }

    const member = members[memberIndex];
    member.status = newStatus;
    members[memberIndex] = member;
    safeSet(this.membersKey, members);

    // Audit log
    const newLog = {
      id: `aud-${Date.now()}`,
      admin_name: adminName,
      admin_role: adminRole,
      action: newStatus === 'SUSPENDED' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
      target_type: 'USER',
      target_id: userId,
      target_name: `${member.name} (${member.email})`,
      details: `Status akun diubah menjadi ${newStatus}. Alasan: ${reason || 'Operasional Backoffice'}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    safeSet(this.logsKey, logs);

    // ⚡ Cross-Port 2-Way Sync to User Web App (Port 5173)
    const syncAction = {
      action: newStatus === 'SUSPENDED' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
      userId,
      timestamp: Date.now()
    };
    setNamedCookie(ADMIN_ACTION_COOKIE, syncAction);
    if (adminBroadcastChannel) {
      try {
        adminBroadcastChannel.postMessage({ type: 'ADMIN_ACTION', payload: syncAction });
      } catch (e) {}
    }

    // Call backend API
    api.post(`/auth/admin/members/${userId}/status`, { status: newStatus, reason })
      .catch(() => api.post(`/admin/members/${userId}/status`, { status: newStatus, reason }))
      .catch(() => {});

    return { success: true, member };
  }

  // Create New Voucher
  createVoucher({
    code,
    discountType = 'PERCENTAGE', // PERCENTAGE or FIXED_AMOUNT
    discountValue = 20,
    targetPlan = 'ALL', // ALL, PRO_YEARLY, PRO_MONTHLY
    maxQuota = 10,
    validUntil,
    description = '',
    adminName = 'Super Admin',
    adminRole = 'SUPERADMIN'
  }) {
    const vouchers = this.getVouchers();
    const logs = this.getAuditLogs();

    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      throw new Error('Kode voucher tidak boleh kosong.');
    }

    if (vouchers.some(v => v.code.toUpperCase() === cleanCode)) {
      throw new Error(`Kode voucher "${cleanCode}" sudah pernah dibuat sebelumnya. Gunakan kode lain.`);
    }

    const val = Number(discountValue);
    if (isNaN(val) || val <= 0) {
      throw new Error('Nilai diskon harus lebih besar dari 0.');
    }
    if (discountType === 'PERCENTAGE' && (val < 1 || val > 100)) {
      throw new Error('Nilai diskon persentase harus berada di antara 1% hingga 100%.');
    }
    if (discountType === 'FIXED_AMOUNT' && val > 10000000) {
      throw new Error('Nilai diskon nominal maksimal adalah Rp 10.000.000 (10 juta rupiah).');
    }

    const quotaNum = Number(maxQuota) || 1;
    const now = new Date();

    const newVoucher = {
      id: `vouch-${Date.now()}`,
      code: cleanCode,
      description: description || `Voucher diskon ${discountType === 'PERCENTAGE' ? `${discountValue}%` : `Rp ${Number(discountValue).toLocaleString('id-ID')}`}`,
      discount_type: discountType,
      discount_value: Number(discountValue),
      target_plan: targetPlan,
      max_quota: quotaNum,
      claimed_count: 0,
      status: 'ACTIVE',
      valid_until: validUntil || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      generated_by_name: adminName,
      generated_by_role: adminRole,
      created_at: now.toISOString(),
      claims: []
    };

    vouchers.unshift(newVoucher);
    safeSet(this.vouchersKey, vouchers);

    // Call backend API to persist into MySQL database
    api.post('/auth/admin/vouchers', {
      code: cleanCode,
      discountType,
      discountValue,
      targetPlan,
      maxQuota: quotaNum,
      validUntil: newVoucher.valid_until,
      description: newVoucher.description,
      adminName,
      adminRole
    }).catch(() => api.post('/admin/vouchers', {
      code: cleanCode,
      discountType,
      discountValue,
      targetPlan,
      maxQuota: quotaNum,
      validUntil: newVoucher.valid_until,
      description: newVoucher.description,
      adminName,
      adminRole
    })).catch(() => {});

    if (adminBroadcastChannel) {
      try {
        adminBroadcastChannel.postMessage({ type: 'VOUCHER_CREATED', payload: newVoucher });
      } catch (e) {}
    }

    // Audit log
    const newLog = {
      id: `aud-${Date.now()}`,
      admin_name: adminName,
      admin_role: adminRole,
      action: 'GENERATE_VOUCHER',
      target_type: 'VOUCHER',
      target_id: newVoucher.id,
      target_name: `Voucher ${cleanCode}`,
      details: `Generate voucher diskon ${discountType === 'PERCENTAGE' ? `${discountValue}%` : `Rp ${discountValue}`} untuk kuota ${quotaNum} pengguna. Berlaku s/d ${newVoucher.valid_until.slice(0, 10)}.`,
      timestamp: now.toISOString()
    };
    logs.unshift(newLog);
    safeSet(this.logsKey, logs);

    return { success: true, voucher: newVoucher };
  }

  // Claim / Redeem Voucher
  claimVoucher({
    voucherCode,
    userId,
    userName,
    userEmail,
    householdId,
    householdName,
    appliedPlan = 'PRO_YEARLY',
    adminName = 'System',
    adminRole = 'SUPERADMIN'
  }) {
    const vouchers = this.getVouchers();
    const members = this.getMembers();
    const tenants = this.getTenants();
    const subs = this.getSubscriptions();
    const logs = this.getAuditLogs();

    const cleanCode = (voucherCode || '').trim().toUpperCase();
    const voucherIndex = vouchers.findIndex(v => v.code.toUpperCase() === cleanCode);

    if (voucherIndex === -1) {
      throw new Error(`Kode voucher "${cleanCode}" tidak ditemukan.`);
    }

    const voucher = vouchers[voucherIndex];

    if (voucher.status !== 'ACTIVE') {
      throw new Error(`Voucher "${cleanCode}" tidak aktif (Status: ${voucher.status}).`);
    }

    if (new Date(voucher.valid_until) < new Date()) {
      voucher.status = 'EXPIRED';
      vouchers[voucherIndex] = voucher;
      safeSet(this.vouchersKey, vouchers);
      throw new Error(`Voucher "${cleanCode}" telah kedaluwarsa pada ${voucher.valid_until.slice(0, 10)}.`);
    }

    if (voucher.claimed_count >= voucher.max_quota) {
      voucher.status = 'EXHAUSTED';
      vouchers[voucherIndex] = voucher;
      safeSet(this.vouchersKey, vouchers);
      throw new Error(`Kuota klaim voucher "${cleanCode}" sudah habis (${voucher.max_quota}/${voucher.max_quota}).`);
    }

    // Check if user already claimed this voucher
    if (voucher.claims && voucher.claims.some(c => c.user_id === userId || c.user_email === userEmail)) {
      throw new Error(`User "${userName || userEmail}" sudah pernah mengklaim voucher ini.`);
    }

    // Plan validation
    if (voucher.target_plan !== 'ALL' && voucher.target_plan !== appliedPlan) {
      throw new Error(`Voucher ini hanya berlaku untuk paket ${voucher.target_plan}, bukan ${appliedPlan}.`);
    }

    // Calculate discount
    const originalPrice = appliedPlan === 'PRO_MONTHLY' ? 49000 : 470000;
    let discountAmount = 0;
    if (voucher.discount_type === 'PERCENTAGE') {
      discountAmount = Math.round((originalPrice * voucher.discount_value) / 100);
    } else {
      discountAmount = Math.min(originalPrice, voucher.discount_value);
    }
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    const now = new Date();
    const claimRecord = {
      id: `clm-${Date.now()}`,
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      household_id: householdId,
      household_name: householdName,
      claimed_at: now.toISOString(),
      applied_plan: appliedPlan,
      original_price: originalPrice,
      discount_amount: discountAmount,
      final_price: finalPrice
    };

    if (!voucher.claims) voucher.claims = [];
    voucher.claims.unshift(claimRecord);
    voucher.claimed_count += 1;

    if (voucher.claimed_count >= voucher.max_quota) {
      voucher.status = 'EXHAUSTED';
    }

    vouchers[voucherIndex] = voucher;
    safeSet(this.vouchersKey, vouchers);

    // Also upgrade the household / tenant if householdId is provided
    if (householdId) {
      const durationMonths = appliedPlan === 'PRO_MONTHLY' ? 1 : 12;
      const validUntil = new Date(now);
      validUntil.setMonth(validUntil.getMonth() + durationMonths);

      const tIdx = tenants.findIndex(t => t.id === householdId);
      if (tIdx !== -1) {
        tenants[tIdx].subscription_tier = 'PRO';
        tenants[tIdx].subscription_status = 'ACTIVE';
        tenants[tIdx].pro_valid_until = validUntil.toISOString();
        safeSet(this.tenantsKey, tenants);
      }

      const mIdx = members.findIndex(m => m.id === userId);
      if (mIdx !== -1) {
        members[mIdx].highest_tier = 'PRO';
        members[mIdx].pro_valid_until = validUntil.toISOString();
        members[mIdx].households = members[mIdx].households.map(h => 
          h.id === householdId ? { ...h, tier: 'PRO' } : h
        );
        safeSet(this.membersKey, members);
      }

      // Record subscription
      const newSub = {
        id: `sub-${Date.now()}`,
        household_id: householdId,
        household_name: householdName,
        user_name: userName,
        user_email: userEmail,
        plan_type: appliedPlan,
        amount: finalPrice,
        payment_method: `VOUCHER_${voucher.code}`,
        payment_gateway_ref: `VOUCH-${voucher.code}-${Date.now().toString().slice(-4)}`,
        status: 'PAID',
        started_at: now.toISOString(),
        expires_at: validUntil.toISOString(),
        is_manual_activation: true,
        activated_by: `Voucher (${voucher.code})`,
        notes: `Klaim voucher diskon ${voucher.code}. Diskon Rp ${discountAmount.toLocaleString('id-ID')}`
      };
      subs.unshift(newSub);
      safeSet(this.subsKey, subs);
    }

    // Audit log
    const newLog = {
      id: `aud-${Date.now()}`,
      admin_name: adminName,
      admin_role: adminRole,
      action: 'CLAIM_VOUCHER',
      target_type: 'VOUCHER',
      target_id: voucher.id,
      target_name: `Voucher ${voucher.code}`,
      details: `Voucher ${voucher.code} berhasil diklaim oleh ${userName} (${userEmail}) untuk rumah "${householdName}". Diskon: Rp ${discountAmount.toLocaleString('id-ID')}. Sisa kuota: ${voucher.max_quota - voucher.claimed_count}.`,
      timestamp: now.toISOString()
    };
    logs.unshift(newLog);
    safeSet(this.logsKey, logs);

    return {
      success: true,
      voucher,
      claim: claimRecord,
      remainingQuota: voucher.max_quota - voucher.claimed_count
    };
  }

  // Toggle Voucher Status (ACTIVE / DISABLED)
  toggleVoucherStatus({ voucherId, newStatus, adminName = 'Super Admin', adminRole = 'SUPERADMIN' }) {
    const vouchers = this.getVouchers();
    const logs = this.getAuditLogs();

    const idx = vouchers.findIndex(v => v.id === voucherId);
    if (idx === -1) {
      throw new Error(`Voucher dengan ID ${voucherId} tidak ditemukan.`);
    }

    vouchers[idx].status = newStatus;
    safeSet(this.vouchersKey, vouchers);

    // Call backend API
    api.post(`/auth/admin/vouchers/${voucherId}/status`, { status: newStatus })
      .catch(() => api.post(`/admin/vouchers/${voucherId}/status`, { status: newStatus }))
      .catch(() => {});

    const newLog = {
      id: `aud-${Date.now()}`,
      admin_name: adminName,
      admin_role: adminRole,
      action: 'UPDATE_VOUCHER_STATUS',
      target_type: 'VOUCHER',
      target_id: voucherId,
      target_name: `Voucher ${vouchers[idx].code}`,
      details: `Status voucher diubah menjadi ${newStatus}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    safeSet(this.logsKey, logs);

    return { success: true, voucher: vouchers[idx] };
  }

  async fetchFeatureLimitsFromBackend() {
    try {
      const res = await api.get('/auth/admin/feature-limits');
      if (res.data && res.data.success && res.data.data) {
        safeSet(this.limitsKey, res.data.data);
        return res.data.data;
      }
    } catch (err) {
      console.warn('Backend fetch feature limits fallback to cache:', err.message);
    }
    return this.getFeatureLimits();
  }

  async updateFeatureLimits({ limits, adminName = 'Super Admin', adminRole = 'SUPERADMIN' }) {
    safeSet(this.limitsKey, limits);
    setCrossPortCookie(limits);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('homehub_limits_updated', { detail: limits }));
    }

    try {
      await api.put('/auth/admin/feature-limits', {
        FREE: limits.FREE,
        PRO: limits.PRO,
        adminName
      }).catch(() => {
        return api.put('/admin/feature-limits', {
          FREE: limits.FREE,
          PRO: limits.PRO,
          adminName
        });
      });
    } catch (err) {
      console.warn('Backend update feature limits fallback to local:', err.message);
    }

    const logs = this.getAuditLogs();
    const newLog = {
      id: `aud-${Date.now()}`,
      admin_name: adminName,
      admin_role: adminRole,
      action: 'UPDATE_FEATURE_LIMITS',
      target_type: 'SYSTEM_CONFIG',
      target_id: 'feature-limits',
      target_name: 'Batasan Fitur Free & PRO',
      details: `Admin memperbarui batas kuota: Free Anggota (${limits.FREE.MAX_MEMBERS}), Free Rumah (${limits.FREE.MAX_HOUSEHOLDS}), Free Tagihan (${limits.FREE.MAX_BILLS}), Free Aset (${limits.FREE.MAX_ASSETS}), Free Belanja (${limits.FREE.MAX_PANTRY_ITEMS}), Free Finansial (${limits.FREE.MAX_EXPENSES_PER_MONTH}/bln).`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    safeSet(this.logsKey, logs);

    return { success: true, limits };
  }

  resetFeatureLimits({ adminName = 'Super Admin', adminRole = 'SUPERADMIN' }) {
    return this.updateFeatureLimits({
      limits: DEFAULT_FEATURE_LIMITS,
      adminName,
      adminRole
    });
  }

  // --- UTILITY CATEGORIES MANAGEMENT ---
  getUtilityCategories() {
    const fromCookie = getNamedCookie(UTILITY_CATEGORIES_COOKIE);
    if (Array.isArray(fromCookie) && fromCookie.length > 0) {
      return fromCookie;
    }
    return safeGet(this.categoriesKey, INITIAL_UTILITY_CATEGORIES);
  }

  async createUtilityCategory({ code, name, icon, icon_url = null, color = 'blue', providers = [], adminName = 'Super Admin', adminRole = 'SUPERADMIN' }) {
    const finalCode = (code || name).trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');
    const finalIcon = (icon || '⚡').trim();
    const finalProviders = Array.isArray(providers) ? providers : (typeof providers === 'string' ? providers.split(',').map(s => s.trim()).filter(Boolean) : []);
    
    let createdCategory = null;
    try {
      const res = await api.post('/admin/utility-categories', {
        code: finalCode,
        name: name.trim(),
        name_en: (name_en || '').trim() || null,
        icon: finalIcon,
        icon_url,
        color,
        providers: finalProviders,
        adminName,
        adminRole
      });
      if (res?.data?.data) {
        createdCategory = res.data.data;
      }
    } catch (e) {
      console.warn('Backend create category fallback:', e);
    }

    if (!createdCategory) {
      createdCategory = {
        id: `cat-${Date.now()}`,
        code: finalCode,
        name: name.trim(),
        icon: finalIcon,
        icon_url,
        color,
        providers: finalProviders,
        is_default: false,
        is_active: true
      };
    }

    const current = this.getUtilityCategories();
    const existingIdx = current.findIndex(c => c.code === createdCategory.code);
    if (existingIdx >= 0) {
      current[existingIdx] = createdCategory;
    } else {
      current.push(createdCategory);
    }

    safeSet(this.categoriesKey, current);
    setNamedCookie(UTILITY_CATEGORIES_COOKIE, current);

    if (adminBroadcastChannel) {
      try {
        adminBroadcastChannel.postMessage({
          type: 'UTILITY_CATEGORIES_UPDATED',
          categories: current,
          createdCategory
        });
      } catch (e) {}
    }

    const logs = this.getAuditLogs();
    logs.unshift({
      id: `aud-${Date.now()}`,
      admin_name: adminName,
      admin_role: adminRole,
      action: 'CREATE_UTILITY_CATEGORY',
      target_type: 'UTILITY_CATEGORY',
      target_id: createdCategory.id,
      target_name: `${createdCategory.icon} ${createdCategory.name}`,
      details: `Admin menambahkan kategori utilitas baru: [${createdCategory.name}] (${createdCategory.code}) dengan ikon [${createdCategory.icon}].`,
      timestamp: new Date().toISOString()
    });
    safeSet(this.logsKey, logs);

    return createdCategory;
  }

  async updateUtilityCategory(id, { name, icon, icon_url, color, providers, is_active, adminName = 'Super Admin', adminRole = 'SUPERADMIN' }) {
    let updatedCategory = null;
    try {
      const res = await api.put(`/admin/utility-categories/${id}`, {
        name,
        icon,
        icon_url,
        color,
        providers,
        is_active,
        adminName,
        adminRole
      });
      if (res?.data?.data) {
        updatedCategory = res.data.data;
      }
    } catch (e) {
      console.warn('Backend update category fallback:', e);
    }

    const current = this.getUtilityCategories();
    const idx = current.findIndex(c => c.id === id);
    if (idx >= 0) {
      current[idx] = {
        ...current[idx],
        ...(name !== undefined && { name }),
        ...(name_en !== undefined && { name_en }),
        ...(icon !== undefined && { icon }),
        ...(icon_url !== undefined && { icon_url }),
        ...(color !== undefined && { color }),
        ...(providers !== undefined && { providers }),
        ...(is_active !== undefined && { is_active }),
        ...(updatedCategory || {})
      };
      safeSet(this.categoriesKey, current);
      setNamedCookie(UTILITY_CATEGORIES_COOKIE, current);

      if (adminBroadcastChannel) {
        try {
          adminBroadcastChannel.postMessage({
            type: 'UTILITY_CATEGORIES_UPDATED',
            categories: current
          });
        } catch (e) {}
      }

      return current[idx];
    }
    return null;
  }

  async toggleUtilityCategoryStatus(id, { adminName = 'Super Admin', adminRole = 'SUPERADMIN' } = {}) {
    const current = this.getUtilityCategories();
    const cat = current.find(c => c.id === id);
    if (!cat) return null;
    const newStatus = !cat.is_active;
    return this.updateUtilityCategory(id, { is_active: newStatus, adminName, adminRole });
  }

  async deleteUtilityCategory(id, { adminName = 'Super Admin', adminRole = 'SUPERADMIN' } = {}) {
    const current = this.getUtilityCategories();
    const cat = current.find(c => c.id === id);
    if (!cat) return false;
    if (cat.is_default) {
      throw new Error('Kategori bawaan sistem tidak dapat dihapus permanen, namun dapat dinonaktifkan.');
    }

    try {
      await api.delete(`/admin/utility-categories/${id}`, { data: { adminName, adminRole } });
    } catch (e) {
      console.warn('Backend delete category fallback:', e);
    }

    const filtered = current.filter(c => c.id !== id);
    safeSet(this.categoriesKey, filtered);
    setNamedCookie(UTILITY_CATEGORIES_COOKIE, filtered);

    if (adminBroadcastChannel) {
      try {
        adminBroadcastChannel.postMessage({
          type: 'UTILITY_CATEGORIES_UPDATED',
          categories: filtered
        });
      } catch (e) {}
    }

    return true;
  }

  // ===========================================================================
  // GENERIC MASTER CATEGORIES CRUD (ASSETS, GROCERIES, EXPENSES, ACTIVITIES, UTILITIES)
  // ===========================================================================

  getModuleCategories(moduleName = 'utility') {
    const mod = String(moduleName || 'utility').toLowerCase().replace(/s$/, '').replace(/-categories$/, '');
    const reg = MODULE_CATEGORY_REGISTRY[mod] || MODULE_CATEGORY_REGISTRY.utility;
    const fromCookie = getNamedCookie(reg.cookie);
    if (Array.isArray(fromCookie) && fromCookie.length > 0) {
      return fromCookie;
    }
    return safeGet(reg.storageKey, reg.initial);
  }

  async createModuleCategory(moduleName, { code, name, name_en = null, icon, icon_url = null, color = 'blue', metadata = {}, providers = [], subcategories = [], item_suggestions = [], budget = 0, reminder = 30, adminName = 'Super Admin', adminRole = 'SUPERADMIN' }) {
    const mod = String(moduleName || 'utility').toLowerCase().replace(/s$/, '').replace(/-categories$/, '');
    const reg = MODULE_CATEGORY_REGISTRY[mod] || MODULE_CATEGORY_REGISTRY.utility;

    const finalCode = (code || name).trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');
    const finalIcon = (icon || reg.defaultIcon).trim();
    
    // Merge metadata
    const metaObj = { ...(metadata || {}) };
    if (subcategories && subcategories.length) metaObj.subcategories = subcategories;
    if (item_suggestions && item_suggestions.length) metaObj.item_suggestions = item_suggestions;
    if (budget) metaObj.budget = budget;
    if (reminder) metaObj.reminder = reminder;

    let createdCategory = null;
    const createPayload = {
      code: finalCode,
      name: name.trim(),
      name_en: (name_en || '').trim() || null,
      icon: finalIcon,
      icon_url,
      color,
      metadata: metaObj,
      providers,
      subcategories,
      item_suggestions,
      budget,
      reminder,
      adminName,
      adminRole
    };

    try {
      let res = null;
      try {
        res = await api.post(`/auth/admin/categories/${mod}`, createPayload);
      } catch (err1) {
        try {
          res = await api.post(`/admin/categories/${mod}`, createPayload);
        } catch (err2) {
          if (reg?.apiPath) {
            res = await api.post(reg.apiPath, createPayload);
          }
        }
      }
      if (res?.data?.data) {
        createdCategory = res.data.data;
      }
    } catch (e) {
      console.warn(`Backend create ${mod} category fallback:`, e);
    }

    if (!createdCategory) {
      createdCategory = {
        id: `cat-${mod.slice(0, 3)}-${Date.now()}`,
        code: finalCode,
        name: name.trim(),
        icon: finalIcon,
        icon_url,
        color,
        metadata: metaObj,
        providers: providers || [],
        subcategories: subcategories || [],
        item_suggestions: item_suggestions || [],
        budget: budget || 0,
        reminder: reminder || 30,
        is_default: false,
        is_active: true
      };
    }

    const current = this.getModuleCategories(mod);
    const existingIdx = current.findIndex(c => c.code === createdCategory.code);
    if (existingIdx >= 0) {
      current[existingIdx] = createdCategory;
    } else {
      current.push(createdCategory);
    }

    safeSet(reg.storageKey, current);
    setNamedCookie(reg.cookie, current);

    if (adminBroadcastChannel) {
      try {
        adminBroadcastChannel.postMessage({
          type: reg.broadcastEvent,
          module: mod,
          categories: current,
          createdCategory
        });
        adminBroadcastChannel.postMessage({
          type: 'MASTER_CATEGORIES_UPDATED',
          module: mod,
          categories: current
        });
      } catch (e) {}
    }

    const logs = this.getAuditLogs();
    logs.unshift({
      id: `aud-${Date.now()}`,
      admin_name: adminName,
      admin_role: adminRole,
      action: `CREATE_${reg.auditType}`,
      target_type: reg.auditType,
      target_id: createdCategory.id,
      target_name: `${createdCategory.icon} ${createdCategory.name}`,
      details: `Admin menambahkan kategori ${reg.name} baru: [${createdCategory.name}] (${createdCategory.code}) dengan logo [${createdCategory.icon}].`,
      timestamp: new Date().toISOString()
    });
    safeSet(this.logsKey, logs);

    return createdCategory;
  }

  async updateModuleCategory(moduleName, id, { name, name_en, icon, icon_url, color, metadata, providers, subcategories, item_suggestions, budget, reminder, is_active, adminName = 'Super Admin', adminRole = 'SUPERADMIN' }) {
    const mod = String(moduleName || 'utility').toLowerCase().replace(/s$/, '').replace(/-categories$/, '');
    const reg = MODULE_CATEGORY_REGISTRY[mod] || MODULE_CATEGORY_REGISTRY.utility;

    let updatedCategory = null;
    const updatePayload = {
      name,
      name_en,
      icon,
      icon_url,
      color,
      metadata,
      providers,
      subcategories,
      item_suggestions,
      budget,
      reminder,
      is_active,
      adminName,
      adminRole
    };

    try {
      let res = null;
      try {
        res = await api.put(`/auth/admin/categories/${mod}/${id}`, updatePayload);
      } catch (err1) {
        try {
          res = await api.put(`/admin/categories/${mod}/${id}`, updatePayload);
        } catch (err2) {
          if (reg?.apiPath) {
            res = await api.put(`${reg.apiPath}/${id}`, updatePayload);
          }
        }
      }
      if (res?.data?.data) {
        updatedCategory = res.data.data;
      }
    } catch (e) {
      console.warn(`Backend update ${mod} category fallback:`, e);
    }

    const current = this.getModuleCategories(mod);
    const idx = current.findIndex(c => c.id === id);
    if (idx >= 0) {
      current[idx] = {
        ...current[idx],
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
        ...(icon_url !== undefined && { icon_url }),
        ...(color !== undefined && { color }),
        ...(providers !== undefined && { providers }),
        ...(subcategories !== undefined && { subcategories }),
        ...(item_suggestions !== undefined && { item_suggestions }),
        ...(budget !== undefined && { budget }),
        ...(reminder !== undefined && { reminder }),
        ...(is_active !== undefined && { is_active }),
        ...(updatedCategory || {})
      };
      safeSet(reg.storageKey, current);
      setNamedCookie(reg.cookie, current);

      if (adminBroadcastChannel) {
        try {
          adminBroadcastChannel.postMessage({
            type: reg.broadcastEvent,
            module: mod,
            categories: current
          });
          adminBroadcastChannel.postMessage({
            type: 'MASTER_CATEGORIES_UPDATED',
            module: mod,
            categories: current
          });
        } catch (e) {}
      }

      return current[idx];
    }
    return null;
  }

  async toggleModuleCategoryStatus(moduleName, id, { adminName = 'Super Admin', adminRole = 'SUPERADMIN' } = {}) {
    const current = this.getModuleCategories(moduleName);
    const cat = current.find(c => c.id === id);
    if (!cat) return null;
    const newStatus = !cat.is_active;
    return this.updateModuleCategory(moduleName, id, { is_active: newStatus, adminName, adminRole });
  }

  async deleteModuleCategory(moduleName, id, { adminName = 'Super Admin', adminRole = 'SUPERADMIN' } = {}) {
    const mod = String(moduleName || 'utility').toLowerCase().replace(/s$/, '').replace(/-categories$/, '');
    const reg = MODULE_CATEGORY_REGISTRY[mod] || MODULE_CATEGORY_REGISTRY.utility;

    const current = this.getModuleCategories(mod);
    const cat = current.find(c => c.id === id);
    if (!cat) return false;
    if (cat.is_default) {
      throw new Error(`Kategori bawaan ${reg.name} tidak dapat dihapus permanen, namun dapat dinonaktifkan.`);
    }

    try {
      try {
        await api.delete(`/auth/admin/categories/${mod}/${id}`, { data: { adminName, adminRole } });
      } catch (err1) {
        try {
          await api.delete(`/admin/categories/${mod}/${id}`, { data: { adminName, adminRole } });
        } catch (err2) {
          if (reg?.apiPath) {
            await api.delete(`${reg.apiPath}/${id}`, { data: { adminName, adminRole } });
          }
        }
      }
    } catch (e) {
      console.warn(`Backend delete ${mod} category fallback:`, e);
    }

    const filtered = current.filter(c => c.id !== id);
    safeSet(reg.storageKey, filtered);
    setNamedCookie(reg.cookie, filtered);

    if (adminBroadcastChannel) {
      try {
        adminBroadcastChannel.postMessage({
          type: reg.broadcastEvent,
          module: mod,
          categories: filtered
        });
        adminBroadcastChannel.postMessage({
          type: 'MASTER_CATEGORIES_UPDATED',
          module: mod,
          categories: filtered
        });
      } catch (e) {}
    }

    return true;
  }

  async fetchDataFromBackend() {
    try {
      const [membersRes, tenantsRes, subsRes, vouchersRes, utilRes, assetRes, grocRes, expRes, actRes] = await Promise.allSettled([
        api.get('/auth/admin/members').catch(() => api.get('/admin/members')),
        api.get('/auth/admin/tenants').catch(() => api.get('/admin/tenants')),
        api.get('/auth/admin/subscriptions').catch(() => api.get('/admin/subscriptions')),
        api.get('/auth/admin/vouchers').catch(() => api.get('/admin/vouchers')),
        api.get('/auth/admin/utility-categories').catch(() => api.get('/admin/utility-categories')),
        api.get('/auth/admin/categories/asset').catch(() => api.get('/admin/categories/asset')),
        api.get('/auth/admin/categories/grocery').catch(() => api.get('/admin/categories/grocery')),
        api.get('/auth/admin/categories/expense').catch(() => api.get('/admin/categories/expense')),
        api.get('/auth/admin/categories/activity').catch(() => api.get('/admin/categories/activity')),
      ]);

      if (membersRes.status === 'fulfilled' && membersRes.value?.data?.data) {
        const backendMembers = membersRes.value.data.data;
        if (Array.isArray(backendMembers) && backendMembers.length > 0) {
          safeSet(this.membersKey, backendMembers);
        }
      }

      if (tenantsRes.status === 'fulfilled' && tenantsRes.value?.data?.data) {
        const backendTenants = tenantsRes.value.data.data;
        if (Array.isArray(backendTenants) && backendTenants.length > 0) {
          safeSet(this.tenantsKey, backendTenants);
        }
      }

      if (subsRes.status === 'fulfilled' && subsRes.value?.data?.data) {
        const backendSubs = subsRes.value.data.data;
        if (Array.isArray(backendSubs) && backendSubs.length > 0) {
          safeSet(this.subsKey, backendSubs);
        }
      }

      if (vouchersRes.status === 'fulfilled' && vouchersRes.value?.data?.data) {
        const backendVouchers = vouchersRes.value.data.data;
        if (Array.isArray(backendVouchers) && backendVouchers.length > 0) {
          safeSet(this.vouchersKey, backendVouchers);
        }
      }

      const processModuleRes = (res, mod) => {
        if (res?.status === 'fulfilled' && res.value?.data?.data) {
          const list = res.value.data.data;
          if (Array.isArray(list) && list.length > 0) {
            const reg = MODULE_CATEGORY_REGISTRY[mod];
            if (reg) {
              safeSet(reg.storageKey, list);
              setNamedCookie(reg.cookie, list);
            }
          }
        }
      };

      processModuleRes(utilRes, 'utility');
      processModuleRes(assetRes, 'asset');
      processModuleRes(grocRes, 'grocery');
      processModuleRes(expRes, 'expense');
      processModuleRes(actRes, 'activity');

      return { success: true };
    } catch (e) {
      console.warn('Backend fetch data fallback:', e);
      return { success: false };
    }
  }

  // Reset to initial seed data
  resetAllData() {
    safeSet(this.membersKey, INITIAL_MEMBERS);
    safeSet(this.tenantsKey, INITIAL_TENANTS);
    safeSet(this.subsKey, INITIAL_SUBSCRIPTIONS);
    safeSet(this.logsKey, INITIAL_AUDIT_LOGS);
    safeSet(this.vouchersKey, INITIAL_VOUCHERS);
    safeSet(this.limitsKey, DEFAULT_FEATURE_LIMITS);
    setCrossPortCookie(DEFAULT_FEATURE_LIMITS);

    for (const [mod, reg] of Object.entries(MODULE_CATEGORY_REGISTRY)) {
      safeSet(reg.storageKey, reg.initial);
      setNamedCookie(reg.cookie, reg.initial);
    }
    return true;
  }
}

export const adminData = new AdminDataManager();
