import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Zap,
  Snowflake,
  ShoppingCart,
  Wallet,
  Calendar,
  Star,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  Car,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Receipt,
  FileText,
  Filter,
  DollarSign,
  Tag,
  LogOut,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  Edit3,
  MapPin,
  Bell,
  Repeat,
  Wrench,
  Pencil,
  Users,
  UserPlus,
  FileSpreadsheet
} from 'lucide-react';
import api from './services/api';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AddBillModal from './components/AddBillModal';
import AddAssetModal from './components/AddAssetModal';
import InvoiceViewerModal from './components/InvoiceViewerModal';
import AssetServiceModal from './components/AssetServiceModal';
import AddGroceryModal from './components/AddGroceryModal';
import ChecklistBoughtModal from './components/ChecklistBoughtModal';
import EditBudgetModal from './components/EditBudgetModal';
import AddExpenseModal from './components/AddExpenseModal';
import AddHouseholdModal from './components/AddHouseholdModal';
import EditHouseholdModal from './components/EditHouseholdModal';
import ManageMembersModal from './components/ManageMembersModal';
import AddActivityModal from './components/AddActivityModal';
import PaymentModal from './components/PaymentModal';
import ModalErrorBoundary from './components/ModalErrorBoundary';
import MonthlyExpenseChart from './components/MonthlyExpenseChart';
import { safeGetJSON, safeSetJSON, safeGet, safeSet } from './utils/safeStorage';
import { getWarrantyStatus, formatWarrantyDisplay } from './utils/warrantyHelper';
import { getAssetUpcomingSchedule } from './utils/scheduleHelper';
import { isJwtExpired } from './utils/jwtHelper';
import QuotaExceededModal from './components/QuotaExceededModal';
import { useFeatureLimits, getFreeLimit, syncFeatureLimits } from './utils/featureLimitsHelper';
import { broadcastLiveUserState, listenForAdminSyncActions, recordUserPaymentOrder } from './utils/syncBridge';
import { getCategoryIcon, getCategoryStyle, getCategoryName, CATEGORY_COLOR_STYLES } from './utils/utilityCategoriesHelper';
import { getAssetTypeIcon, getGroceryCategoryIcon, getExpenseCategoryIcon, getActivityCategoryTheme, getLocalizedCategoryName } from './utils/masterCategoriesHelper';

const getActivityTheme = (act) => {
  const type = act.activity_type || '';
  const tag = (act.tag || '').toLowerCase();
  const dynamicMeta = getActivityCategoryTheme(type);

  if (type === 'COURSE_LES' || tag.includes('les') || tag.includes('kursus')) {
    return {
      accentBorder: 'bg-pink-500',
      badgeBg: 'bg-pink-50 text-pink-700 border-pink-200',
      dateBadgeBg: 'bg-pink-600 text-white',
      timeBlockBg: 'bg-gradient-to-br from-pink-50/80 via-white to-rose-50/40 border-pink-100',
      noteBg: 'bg-pink-50/70 border-pink-200/80 text-pink-950',
      hoverBorder: 'hover:border-pink-300',
      iconColor: 'text-pink-600',
      icon: dynamicMeta.icon || '🎓',
    };
  }
  if (type === 'VACATION' || tag.includes('liburan')) {
    return {
      accentBorder: 'bg-amber-500',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      dateBadgeBg: 'bg-amber-600 text-white',
      timeBlockBg: 'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40 border-amber-100',
      noteBg: 'bg-amber-50/70 border-amber-200/80 text-amber-950',
      hoverBorder: 'hover:border-amber-300',
      iconColor: 'text-amber-600',
      icon: dynamicMeta.icon || '🌴',
    };
  }
  if (type === 'INVITATION' || tag.includes('undangan') || tag.includes('pesta')) {
    return {
      accentBorder: 'bg-indigo-500',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dateBadgeBg: 'bg-indigo-600 text-white',
      timeBlockBg: 'bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/40 border-indigo-100',
      noteBg: 'bg-indigo-50/70 border-indigo-200/80 text-indigo-950',
      hoverBorder: 'hover:border-indigo-300',
      iconColor: 'text-indigo-600',
      icon: dynamicMeta.icon || '✉️',
    };
  }
  if (type === 'BIZTRIP' || tag.includes('dinas') || tag.includes('bisnis')) {
    return {
      accentBorder: 'bg-sky-500',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      dateBadgeBg: 'bg-sky-600 text-white',
      timeBlockBg: 'bg-gradient-to-br from-sky-50/80 via-white to-blue-50/40 border-sky-100',
      noteBg: 'bg-sky-50/70 border-sky-200/80 text-sky-950',
      hoverBorder: 'hover:border-sky-300',
      iconColor: 'text-sky-600',
      icon: dynamicMeta.icon || '💼',
    };
  }
  if (type === 'BIRTHDAY' || tag.includes('ulang tahun') || tag.includes('ultah')) {
    return {
      accentBorder: 'bg-rose-500',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      dateBadgeBg: 'bg-rose-600 text-white',
      timeBlockBg: 'bg-gradient-to-br from-rose-50/80 via-white to-pink-50/40 border-rose-100',
      noteBg: 'bg-rose-50/70 border-rose-200/80 text-rose-950',
      hoverBorder: 'hover:border-rose-300',
      iconColor: 'text-rose-600',
      icon: dynamicMeta.icon || '🎂',
    };
  }
  if (type === 'ROUTINE' || tag.includes('rutin') || tag.includes('olahraga')) {
    return {
      accentBorder: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dateBadgeBg: 'bg-emerald-600 text-white',
      timeBlockBg: 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 border-emerald-100',
      noteBg: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950',
      hoverBorder: 'hover:border-emerald-300',
      iconColor: 'text-emerald-600',
      icon: dynamicMeta.icon || '⚡',
    };
  }
  return {
    accentBorder: 'bg-purple-500',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    dateBadgeBg: 'bg-purple-600 text-white',
    timeBlockBg: 'bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/40 border-purple-100',
    noteBg: 'bg-purple-50/70 border-purple-200/80 text-purple-950',
    hoverBorder: 'hover:border-purple-300',
    iconColor: 'text-purple-600',
    icon: dynamicMeta.icon || '📌',
  };
};

const isDemoHousehold = (hhId) => {
  return hhId === 'tebet_free' || hhId === 'hh-tebet-01' || hhId === 'villa_pro';
};

const DEMO_SAMPLE_DATA = {
  bills: [
    { id: 'b1', name: 'Listrik PLN Pascabayar', account: '5389-1029-381', amount: 450000, due: '2026-09-05', status: 'UNPAID', category: 'ELECTRICITY' },
    { id: 'b2', name: 'PDAM Tirtawening', account: '0844-2190-01', amount: 120000, due: '2026-09-10', status: 'PAID', category: 'WATER' },
    { id: 'b3', name: 'IndiHome Fiber 100Mbps', account: '1229-3849-1022', amount: 415000, due: '2026-09-20', status: 'PAID', category: 'INTERNET' }
  ],
  assets: [
    { id: 'a1', name: 'AC Daikin Inverter 1 PK', type: 'ELECTRONIC', category: 'AC', room: 'Kamar Utama', warranty: '15 Jan 2028', status: 'ACTIVE' },
    { id: 'a2', name: 'Mobil Honda CR-V 1.5 Turbo', type: 'VEHICLE', category: 'MOBIL', room: 'Garasi', plate: 'B 1234 SK', odo: 44700, status: 'ACTIVE' }
  ],
  groceries: [
    { id: 1, name: 'Garam Dapur Halus Refill', category: 'Bumbu Masak', quantity: '1 bks', estimated_price: 8000, actual_price: null, status: 'OUT_OF_STOCK', bought: false, bought_at: null, notes: 'Merek Dolphin', created_by_name: 'Siti Aminah' },
    { id: 2, name: 'Minyak Goreng SunCo 2L', category: 'Bahan Pokok', quantity: '1 pouch', estimated_price: 36000, actual_price: null, status: 'LOW_STOCK', bought: false, bought_at: null, notes: 'Pouch 2 liter', created_by_name: 'Siti Aminah' },
    { id: 3, name: 'Deterjen Attack Plus 1.2kg', category: 'Kebersihan & Mandi', quantity: '1 pack', estimated_price: 42000, actual_price: 40000, status: 'IN_STOCK', bought: true, bought_at: '2026-09-02', notes: 'Plus softener', created_by_name: 'Siti Aminah', bought_by_name: 'Calvin' },
    { id: 4, name: 'Beras Ramos Super 10kg', category: 'Bahan Pokok', quantity: '1 karung', estimated_price: 145000, actual_price: null, status: 'LOW_STOCK', bought: false, bought_at: null, notes: 'Pandan wangi / Ramos', created_by_name: 'Calvin' }
  ],
  expenses: [
    { id: 'e1', title: 'Belanja Mingguan Sayur & Buah', amount: 350000, date: '2026-09-01', category: 'Belanja Bulanan', description: 'Sayuran segar, buah apel fuji, telur omega (Superindo)', receipt_url: 'https://images.unsplash.com/photo-1554415707-9e49017aed81?w=400', recorded_by_name: 'Calvin' },
    { id: 'e2', title: 'Beras Ramos 10kg', amount: 145000, date: '2026-09-01', category: 'Kebutuhan Dapur', description: 'Beras Ramos Super Pandan Wangi 10kg', receipt_url: null, recorded_by_name: 'Siti Aminah' },
    { id: 'e3', title: 'Air Galon Aqua (3 Galon)', amount: 60000, date: '2026-09-02', category: 'Kebutuhan Dapur', description: 'Refill 3 galon Aqua di agen resmi', receipt_url: null, recorded_by_name: 'Siti Aminah' },
    { id: 'e4', title: 'Gas Elpiji 12kg Bright Gas', amount: 220000, date: '2026-09-02', category: 'Tagihan & Utilitas', description: 'Tabung Bright Gas 12kg diantar ke rumah', receipt_url: null, recorded_by_name: 'Calvin' },
    { id: 'e5', title: 'Bensin Honda CR-V Shell V-Power', amount: 475000, date: '2026-09-03', category: 'Transportasi & Bensin', description: 'Isi full tank 32.5 liter di SPBU Gatot Subroto', receipt_url: 'https://images.unsplash.com/photo-1554415707-9e49017aed81?w=400', recorded_by_name: 'Calvin' }
  ],
  activities: [
    { 
      id: 'act1', 
      title: 'Les Matematika Kumon Nathan', 
      time: '15:00 - 16:30', 
      date: 'Hari Ini', 
      start_datetime: '2026-09-04 15:00:00', 
      end_datetime: '2026-09-04 16:30:00', 
      location: 'Kumon Ruko Tebet Square', 
      tag: 'Les & Kursus', 
      activity_type: 'COURSE_LES', 
      reminder_minutes_before: 30, 
      notes: 'Antar jam 14.45, selesai jam 16.30',
      is_recurring: true,
      is_master: true,
      recurrence_group_id: 'rec_kumon_nathan',
      recurrence_summary: 'Setiap Rabu & Jumat',
      recurrence_rule: 'WEEKLY:3,5',
      created_by_name: 'Siti Aminah'
    },
    { 
      id: 'act1_b', 
      title: 'Les Matematika Kumon Nathan', 
      time: '15:00 - 16:30', 
      date: '9 Sep', 
      start_datetime: '2026-09-09 15:00:00', 
      end_datetime: '2026-09-09 16:30:00', 
      location: 'Kumon Ruko Tebet Square', 
      tag: 'Les & Kursus', 
      activity_type: 'COURSE_LES', 
      reminder_minutes_before: 30, 
      notes: 'Antar jam 14.45, selesai jam 16.30',
      is_recurring: true,
      is_master: false,
      recurrence_group_id: 'rec_kumon_nathan',
      recurrence_summary: 'Setiap Rabu & Jumat',
      recurrence_rule: 'WEEKLY:3,5',
      created_by_name: 'Siti Aminah'
    },
    { 
      id: 'act2', 
      title: 'Resepsi Pernikahan Dimas & Sarah', 
      time: '19:00 - 22:00', 
      date: '14 Sep', 
      start_datetime: '2026-09-14 19:00:00', 
      end_datetime: '2026-09-14 22:00:00', 
      location: 'Hotel Mulia Senayan', 
      tag: 'Undangan', 
      activity_type: 'INVITATION', 
      reminder_minutes_before: 60, 
      notes: 'Dress code: Batik formal',
      created_by_name: 'Calvin'
    },
    { 
      id: 'act3', 
      title: 'Liburan Keluarga Akhir Pekan', 
      time: '08:00', 
      date: '26 Sep', 
      start_datetime: '2026-09-26 08:00:00', 
      end_datetime: '2026-09-28 17:00:00', 
      location: 'Bandung', 
      tag: 'Liburan', 
      activity_type: 'VACATION', 
      reminder_minutes_before: 1440, 
      notes: 'Reservasi villa sudah lunas',
      created_by_name: 'Calvin'
    },
    { 
      id: 'act4', 
      title: 'Workshop Coding Robotik Nathan', 
      time: '10:00 - 12:00', 
      date: '10 Okt', 
      start_datetime: '2026-10-10 10:00:00', 
      end_datetime: '2026-10-10 12:00:00', 
      location: 'Kuningan City Mall', 
      tag: 'Les & Kursus', 
      activity_type: 'COURSE_LES', 
      reminder_minutes_before: 30, 
      notes: 'Bawa laptop & charger',
      created_by_name: 'Siti Aminah'
    }
  ],
  maintenanceSchedules: [
    { id: 'sch-ac-01', asset_id: 'a1', title: 'Cuci AC Rutin 3 Bulan', frequency_type: 'MONTHS', frequency_value: 3, frequency_months: 3, frequency_km: null, next_due_date: '2026-09-13', next_due_odometer: null, is_active: true },
    { id: 'sch-crv-02', asset_id: 'a2', title: 'Ganti Oli & Filter Berkala', frequency_type: 'WHICHEVER_FIRST', frequency_value: 6, frequency_months: 6, frequency_km: 10000, next_due_date: '2026-10-15', next_due_odometer: 54700, is_active: true }
  ],
  maintenanceLogs: [
    { id: 'log-ac-01', asset_id: 'a1', performed_date: '2026-06-13', service_title: 'Cuci indoor & outdoor AC berkala, bersihkan filter debu', cost: 120000, vendor_name: 'Mitra AC Sejuk Abadi', vendor_phone: '0812-9988-7711', current_odometer: null, notes: 'Freon masih bagus 75 psi, teknisi ramah' },
    { id: 'log-crv-01', asset_id: 'a2', performed_date: '2026-03-10', service_title: 'Ganti Oli Mesin Honda E-Pro Gold 0W-20 + Filter Oli + Rotasi Ban', cost: 1450000, vendor_name: 'Bengkel Resmi Honda Pondok Indah', vendor_phone: '021-7654321', current_odometer: 35200, notes: 'Kondisi kampas rem masih 80%, ganti filter AC kabin' }
  ]
};

export default function App() {
  const { t, i18n } = useTranslation();

  // --- AUTHENTICATION STATE & INITIAL EXPIRATION CHECK ---
  const [currentUser, setCurrentUser] = useState(() => {
    const token = safeGet('homehub_token', null);
    if (token && isJwtExpired(token)) {
      safeSet('homehub_token', null);
      safeSetJSON('homehub_user', null);
      safeSet('homehub_active_household_id', null);
      safeSetJSON('homehub_households', null);
      return null;
    }
    return safeGetJSON('homehub_user', null);
  });

  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(() => {
    const token = safeGet('homehub_token', null);
    if (token && isJwtExpired(token)) {
      return i18n.language === 'id' 
        ? 'Sesi login Anda telah berakhir demi keamanan. Silakan masuk kembali.' 
        : 'Your login session has expired for security. Please sign in again.';
    }
    return null;
  });

  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Household & Quota State
  const [households, setHouseholds] = useState(() => {
    const raw = safeGetJSON('homehub_households', [
      { id: 'tebet_free', name: 'Rumah Tebet (Utama)', tier: 'FREE', role: 'OWNER' },
      { id: 'villa_pro', name: 'Villa Puncak', tier: 'PRO', role: 'OWNER' }
    ]);
    return Array.isArray(raw)
      ? raw.map(h => ({ ...h, tier: h.tier || h.subscription_tier || 'FREE' }))
      : raw;
  });
  const [activeHouseholdId, setActiveHouseholdId] = useState(() => {
    return safeGet('homehub_active_household_id', 'tebet_free');
  });

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isAddHouseholdModalOpen, setIsAddHouseholdModalOpen] = useState(false);
  const [isEditHouseholdModalOpen, setIsEditHouseholdModalOpen] = useState(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);
  const [householdMembers, setHouseholdMembers] = useState(() => {
    const isDemo = isDemoHousehold(activeHouseholdId);
    return safeGetJSON(
      `homehub_members_${activeHouseholdId}`,
      isDemo
        ? [
            { id: 'mem_1', name: 'Budi Santoso', email: 'budi.santoso@example.com', role: 'OWNER' },
            { id: 'mem_2', name: 'Siti Aminah', email: 'siti.aminah@example.com', role: 'ADMIN' },
            { id: 'mem_3', name: 'Nathan Santoso', email: 'nathan@example.com', role: 'MEMBER' },
            { id: 'mem_4', name: 'Mbak Sri', email: 'sri.art@example.com', role: 'HELPER' },
          ]
        : [{ id: 'mem_owner', name: 'Owner', email: '', role: 'OWNER' }]
    );
  });
  const [modalType, setModalType] = useState(null); // 'activity' fallback
  const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState(null);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState(null);
  const [selectedAssetForInvoice, setSelectedAssetForInvoice] = useState(null);
  const [selectedAssetForService, setSelectedAssetForService] = useState(null);

  const [maintenanceSchedules, setMaintenanceSchedules] = useState(() => {
    const isDemo = isDemoHousehold(activeHouseholdId);
    return safeGetJSON(`homehub_maintenance_schedules_${activeHouseholdId}`, isDemo ? DEMO_SAMPLE_DATA.maintenanceSchedules : []);
  });

  const [maintenanceLogs, setMaintenanceLogs] = useState(() => {
    const isDemo = isDemoHousehold(activeHouseholdId);
    return safeGetJSON(`homehub_maintenance_logs_${activeHouseholdId}`, isDemo ? DEMO_SAMPLE_DATA.maintenanceLogs : []);
  });

  const [isAddGroceryModalOpen, setIsAddGroceryModalOpen] = useState(false);
  const [groceryToEdit, setGroceryToEdit] = useState(null);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState(null);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [recurringDeleteTarget, setRecurringDeleteTarget] = useState(null);
  const [recurringEditPromptTarget, setRecurringEditPromptTarget] = useState(null);
  const [isEditingMasterSeries, setIsEditingMasterSeries] = useState(false);
  const [activityViewMode, setActivityViewMode] = useState('ALL_SESSIONS'); // 'ALL_SESSIONS' | 'MASTER_SCHEDULES'
  const { limits: featureLimits, freeLimits, proLimits } = useFeatureLimits(api);
  const [quotaExceededInfo, setQuotaExceededInfo] = useState(null);

  // --- MODULE DATA STATE (Clean Slate for Real Users, Demo data for Demo Users) ---
  const [bills, setBills] = useState(() => {
    const isDemo = isDemoHousehold(activeHouseholdId);
    return safeGetJSON(`homehub_bills_${activeHouseholdId}`, isDemo ? DEMO_SAMPLE_DATA.bills : []);
  });

  const [assets, setAssets] = useState(() => {
    const isDemo = isDemoHousehold(activeHouseholdId);
    return safeGetJSON(`homehub_assets_${activeHouseholdId}`, isDemo ? DEMO_SAMPLE_DATA.assets : []);
  });

  const [groceries, setGroceries] = useState(() => {
    const isDemo = isDemoHousehold(activeHouseholdId);
    return safeGetJSON(`homehub_groceries_${activeHouseholdId}`, isDemo ? DEMO_SAMPLE_DATA.groceries : []);
  });
  const [groceryFilter, setGroceryFilter] = useState('ALL'); // 'ALL' | 'UNBOUGHT' | 'BOUGHT'
  const [selectedGroceryMonth, setSelectedGroceryMonth] = useState('2026-09');
  const [itemToChecklist, setItemToChecklist] = useState(null);

  const [expenses, setExpenses] = useState(() => {
    const isDemo = isDemoHousehold(activeHouseholdId);
    return safeGetJSON(`homehub_expenses_${activeHouseholdId}`, isDemo ? DEMO_SAMPLE_DATA.expenses : []);
  });

  const [activities, setActivities] = useState(() => {
    const isDemo = isDemoHousehold(activeHouseholdId);
    return safeGetJSON(`homehub_activities_${activeHouseholdId}`, isDemo ? DEMO_SAMPLE_DATA.activities : []);
  });
  const [activityMonthFilter, setActivityMonthFilter] = useState('2026-09');

  // Active household object & tier with absolute fallback guarantee
  const currentHousehold = (households && households.find(h => h.id === activeHouseholdId)) 
    || households?.[0] 
    || { id: 'tebet_free', name: 'Rumah Tebet (Utama)', tier: 'FREE', role: 'OWNER' };
  const isPro = currentHousehold?.tier === 'PRO' || currentHousehold?.subscription_tier === 'PRO';

  // --- CALCULATIONS FOR SHOPPING ESTIMATE DASHBOARD ---
  const unboughtGroceries = groceries.filter(g => !g.bought);
  const allBoughtGroceries = groceries.filter(g => g.bought);

  // Filter bought items for the selected month (e.g. '2026-09')
  const boughtGroceriesInSelectedMonth = groceries.filter(g => {
    if (!g.bought) return false;
    if (!g.bought_at) return true; // fallback if date not set
    return g.bought_at.startsWith(selectedGroceryMonth);
  });

  const unpaidBills = useMemo(() => bills.filter(b => b.status === 'UNPAID'), [bills]);
  const unpaidBillsCount = unpaidBills.length;
  const totalUnpaidBillsAmount = useMemo(() => unpaidBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0), [unpaidBills]);
  const earliestUnpaidBill = useMemo(() => {
    if (unpaidBills.length === 0) return null;
    return [...unpaidBills].sort((a, b) => (a.due || '').localeCompare(b.due || ''))[0];
  }, [unpaidBills]);
  const activeAssetsCount = assets.filter(a => a.status === 'ACTIVE').length;
  const activeWarrantiesCount = useMemo(() => {
    return assets.filter(a => ['ACTIVE', 'EXPIRING_SOON'].includes(getWarrantyStatus(a.warranty || a.warranty_expiry_date).status)).length;
  }, [assets]);

  const upcomingServiceInfo = useMemo(() => {
    if (!Array.isArray(assets) || assets.length === 0 || !Array.isArray(maintenanceSchedules) || maintenanceSchedules.length === 0) {
      return null;
    }
    let nearestUpcoming = null;
    let minRemainingKm = Infinity;

    for (const ast of assets) {
      const up = getAssetUpcomingSchedule(ast, maintenanceSchedules, i18n.language);
      if (up && (up.nextService || up.nextOdo || up.remainingKm !== null)) {
        if (up.remainingKm !== null && up.remainingKm < minRemainingKm) {
          minRemainingKm = up.remainingKm;
          nearestUpcoming = {
            assetName: ast.name,
            label: up.remainingKm <= 0 
              ? (i18n.language === 'id' ? 'Servis Lewat!' : 'Service Overdue!')
              : (i18n.language === 'id' ? `Servis sisa ${up.remainingKm.toLocaleString('id-ID')} KM` : `Service in ${up.remainingKm.toLocaleString('en-US')} KM`),
            isUrgent: up.remainingKm <= 500
          };
        } else if (!nearestUpcoming && up.nextService) {
          nearestUpcoming = {
            assetName: ast.name,
            label: `${i18n.language === 'id' ? 'Servis' : 'Service'} ${up.nextService}`,
            isUrgent: false
          };
        }
      }
    }
    return nearestUpcoming;
  }, [assets, maintenanceSchedules, i18n.language]);

  // Card 1: Estimasi dana yang masih diperlukan (seluruh barang yang belum terbeli)
  const estimatedPendingBudget = unboughtGroceries.reduce(
    (sum, item) => sum + (item.estimated_price || 0),
    0
  );

  // Card 2: Realisasi belanja aktual bulan ini (menggunakan actual_price jika ada, atau fallback estimated_price)
  const realizedBudget = boughtGroceriesInSelectedMonth.reduce(
    (sum, item) => sum + (item.actual_price !== null && item.actual_price !== undefined ? item.actual_price : (item.estimated_price || 0)),
    0
  );

  // Card 3: Total Komitmen Budget Bulan Ini
  const totalBudgetPlan = estimatedPendingBudget + realizedBudget;

  // Perhitungan selisih estimasi vs realisasi bulan ini (hemat / over budget)
  const estimatedOfBoughtInMonth = boughtGroceriesInSelectedMonth.reduce(
    (sum, item) => sum + (item.estimated_price || 0),
    0
  );
  const monthlySavings = estimatedOfBoughtInMonth - realizedBudget;

  const outOfStockCount = unboughtGroceries.filter(g => g.status === 'OUT_OF_STOCK').length;
  const lowStockCount = unboughtGroceries.filter(g => g.status === 'LOW_STOCK').length;
  const shoppingProgress = groceries.length > 0 
    ? Math.round((allBoughtGroceries.length / groceries.length) * 100) 
    : 0;

  const filteredGroceries = groceries.filter(item => {
    if (groceryFilter === 'UNBOUGHT') return !item.bought;
    if (groceryFilter === 'BOUGHT') {
      return item.bought && (item.bought_at ? item.bought_at.startsWith(selectedGroceryMonth) : true);
    }
    // ALL: tampilkan semua unbought + barang terbeli khusus bulan yang dipilih
    if (item.bought) {
      return item.bought_at ? item.bought_at.startsWith(selectedGroceryMonth) : true;
    }
    return true;
  });

  // Expense calculations (filtered for current active month: 2026-09)
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const totalExpenseThisMonth = expenses
    .filter(e => {
      const d = e.date || e.expense_date || '';
      return d.startsWith(currentMonthKey) || d.startsWith('2026-09');
    })
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const [budgetCeiling, setBudgetCeiling] = useState(() => {
    const saved = localStorage.getItem(`homehub_budget_ceiling_${activeHouseholdId}`);
    return saved ? Number(saved) : 10000000;
  });
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);

  useEffect(() => {
    // Sync dynamic feature limits from backend
    syncFeatureLimits(api).catch(() => {});

    const saved = localStorage.getItem(`homehub_budget_ceiling_${activeHouseholdId}`);
    if (saved) {
      setBudgetCeiling(Number(saved));
    }
    // Fetch persisted budget from backend
    api.get('/finance/budget?month=2026-09')
      .then(res => {
        if (res?.data?.limit_amount) {
          const num = Number(res.data.limit_amount);
          setBudgetCeiling(num);
          localStorage.setItem(`homehub_budget_ceiling_${activeHouseholdId}`, num);
        }
      })
      .catch(() => {});
  }, [activeHouseholdId]);

  const handleUpdateBudgetCeiling = async (newAmount) => {
    setBudgetCeiling(newAmount);
    localStorage.setItem(`homehub_budget_ceiling_${activeHouseholdId}`, newAmount);
    try {
      await api.post('/finance/budget', {
        period_month: '2026-09',
        limit_amount: newAmount
      });
    } catch (err) {
      console.warn('Backend budget sync fallback to local storage:', err);
    }
  };

  const remainingBudgetThisMonth = Math.max(0, budgetCeiling - totalExpenseThisMonth);
  const expensePercentageUsed = budgetCeiling > 0 ? Math.min(100, Math.round((totalExpenseThisMonth / budgetCeiling) * 100)) : 0;

  // Activity Month Filter calculations
  const availableActivityMonths = [
    { value: '2026-08', labelId: 'Agustus 2026', labelEn: 'August 2026' },
    { value: '2026-09', labelId: 'September 2026', labelEn: 'September 2026', isCurrent: true },
    { value: '2026-10', labelId: 'Oktober 2026', labelEn: 'October 2026' },
    { value: '2026-11', labelId: 'November 2026', labelEn: 'November 2026' },
    { value: '2026-12', labelId: 'Desember 2026', labelEn: 'December 2026' },
    { value: '2027-01', labelId: 'Januari 2027', labelEn: 'January 2027' }
  ];

  const filteredActivities = activities
    .filter(act => {
      if (activityMonthFilter === 'ALL') return true;
      const dt = act.start_datetime || act.date || '';
      if (dt.startsWith(activityMonthFilter)) return true;
      if (activityMonthFilter === '2026-09') {
        const lower = (String(dt) + ' ' + String(act.date || '')).toLowerCase();
        if (lower.includes('sep') || lower.includes('hari ini') || lower.includes('today')) return true;
      }
      if (activityMonthFilter === '2026-10') {
        const lower = (String(dt) + ' ' + String(act.date || '')).toLowerCase();
        if (lower.includes('okt') || lower.includes('oct')) return true;
      }
      if (activityMonthFilter === '2026-11') {
        const lower = (String(dt) + ' ' + String(act.date || '')).toLowerCase();
        if (lower.includes('nov')) return true;
      }
      if (activityMonthFilter === '2026-12') {
        const lower = (String(dt) + ' ' + String(act.date || '')).toLowerCase();
        if (lower.includes('des') || lower.includes('dec')) return true;
      }
      if (activityMonthFilter === '2027-01') {
        const lower = (String(dt) + ' ' + String(act.date || '')).toLowerCase();
        if (lower.includes('jan')) return true;
      }
      return false;
    })
    .sort((a, b) => {
      const timeA = new Date(a.start_datetime || 0).getTime();
      const timeB = new Date(b.start_datetime || 0).getTime();
      return timeA - timeB;
    });

  // Master Activities: For the "⭐ Master Jadwal Rutin" tab
  // Displays one card per recurring series (the master event, or first instance of recurrence_group_id)
  const masterActivities = useMemo(() => {
    const seenGroups = new Set();
    const masters = [];

    for (const act of activities) {
      if (act.recurrence_group_id) {
        if (!seenGroups.has(act.recurrence_group_id)) {
          seenGroups.add(act.recurrence_group_id);
          const seriesSessions = activities.filter(a => a.recurrence_group_id === act.recurrence_group_id);
          const trueMaster = seriesSessions.find(s => s.is_master) || act;
          masters.push({
            ...trueMaster,
            total_series_count: seriesSessions.length
          });
        }
      } else if (act.is_recurring) {
        masters.push({
          ...act,
          total_series_count: 1
        });
      }
    }
    return masters.sort((a, b) => new Date(a.start_datetime || 0).getTime() - new Date(b.start_datetime || 0).getTime());
  }, [activities]);

  // Data Loader for Active Household
  const loadHouseholdData = (hhId, isNewRegister = false) => {
    if (!hhId) return;

    if (isNewRegister) {
      // 100% BLANK data for newly registered user / new household
      setBills([]);
      setAssets([]);
      setGroceries([]);
      setExpenses([]);
      setActivities([]);
      setMaintenanceSchedules([]);
      setMaintenanceLogs([]);
      setBudgetCeiling(10000000);
      const initialMember = [{
        id: 'mem_owner',
        name: currentUser?.name || 'Owner',
        email: currentUser?.email || '',
        role: 'OWNER',
        joined_at: new Date().toISOString(),
      }];
      setHouseholdMembers(initialMember);
      safeSetJSON(`homehub_bills_${hhId}`, []);
      safeSetJSON(`homehub_assets_${hhId}`, []);
      safeSetJSON(`homehub_groceries_${hhId}`, []);
      safeSetJSON(`homehub_expenses_${hhId}`, []);
      safeSetJSON(`homehub_activities_${hhId}`, []);
      safeSetJSON(`homehub_maintenance_schedules_${hhId}`, []);
      safeSetJSON(`homehub_maintenance_logs_${hhId}`, []);
      safeSetJSON(`homehub_members_${hhId}`, initialMember);
      return;
    }

    const isDemo = isDemoHousehold(hhId);
    setBills(safeGetJSON(`homehub_bills_${hhId}`, isDemo ? DEMO_SAMPLE_DATA.bills : []));
    setAssets(safeGetJSON(`homehub_assets_${hhId}`, isDemo ? DEMO_SAMPLE_DATA.assets : []));
    setGroceries(safeGetJSON(`homehub_groceries_${hhId}`, isDemo ? DEMO_SAMPLE_DATA.groceries : []));
    setExpenses(safeGetJSON(`homehub_expenses_${hhId}`, isDemo ? DEMO_SAMPLE_DATA.expenses : []));
    setActivities(safeGetJSON(`homehub_activities_${hhId}`, isDemo ? DEMO_SAMPLE_DATA.activities : []));
    setMaintenanceSchedules(safeGetJSON(`homehub_maintenance_schedules_${hhId}`, isDemo ? DEMO_SAMPLE_DATA.maintenanceSchedules : []));
    setMaintenanceLogs(safeGetJSON(`homehub_maintenance_logs_${hhId}`, isDemo ? DEMO_SAMPLE_DATA.maintenanceLogs : []));

    const defaultMembers = isDemo
      ? (hhId === 'villa_pro'
          ? [
              { id: 'mem_v1', name: currentUser?.name || 'Budi Santoso', email: currentUser?.email || 'budi.santoso@example.com', role: 'OWNER' },
              { id: 'mem_v2', name: 'Pak Joko', email: 'joko.villa@example.com', role: 'ADMIN' },
            ]
          : [
              { id: 'mem_1', name: currentUser?.name || 'Budi Santoso', email: currentUser?.email || 'budi.santoso@example.com', role: 'OWNER' },
              { id: 'mem_2', name: 'Siti Aminah', email: 'siti.aminah@example.com', role: 'ADMIN' },
              { id: 'mem_3', name: 'Nathan Santoso', email: 'nathan@example.com', role: 'MEMBER' },
              { id: 'mem_4', name: 'Mbak Sri', email: 'sri.art@example.com', role: 'HELPER' },
            ])
      : [{ id: 'mem_owner', name: currentUser?.name || 'Owner', email: currentUser?.email || '', role: 'OWNER' }];
    setHouseholdMembers(safeGetJSON(`homehub_members_${hhId}`, defaultMembers));

    // Fetch from backend API if logged in with real token
    const token = localStorage.getItem('homehub_token');
    if (token && !token.startsWith('demo_')) {
      api.get(`/auth/households/${hhId}/members`).then(res => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data) && data.length > 0) {
          setHouseholdMembers(data);
          safeSetJSON(`homehub_members_${hhId}`, data);
        }
      }).catch(() => {});
      api.get('/assets').then(res => {
        if (Array.isArray(res.data)) {
          setAssets(res.data);
          safeSetJSON(`homehub_assets_${hhId}`, res.data);
        }
      }).catch(() => {});

      api.get('/utilities/bills').then(res => {
        if (Array.isArray(res.data)) {
          setBills(res.data);
          safeSetJSON(`homehub_bills_${hhId}`, res.data);
        }
      }).catch(() => {});

      api.get('/groceries').then(res => {
        if (Array.isArray(res.data)) {
          setGroceries(res.data);
          safeSetJSON(`homehub_groceries_${hhId}`, res.data);
        }
      }).catch(() => {});

      api.get('/finance').then(res => {
        if (Array.isArray(res.data)) {
          setExpenses(res.data);
          safeSetJSON(`homehub_expenses_${hhId}`, res.data);
        }
      }).catch(() => {});

      api.get('/activities').then(res => {
        if (Array.isArray(res.data)) {
          setActivities(res.data);
          safeSetJSON(`homehub_activities_${hhId}`, res.data);
        }
      }).catch(() => {});
    }
  };

  // Synchronize state changes to active household storage
  useEffect(() => {
    if (activeHouseholdId) {
      safeSetJSON(`homehub_bills_${activeHouseholdId}`, bills);
    }
  }, [bills, activeHouseholdId]);

  useEffect(() => {
    if (activeHouseholdId) {
      safeSetJSON(`homehub_assets_${activeHouseholdId}`, assets);
    }
  }, [assets, activeHouseholdId]);

  useEffect(() => {
    if (activeHouseholdId) {
      safeSetJSON(`homehub_groceries_${activeHouseholdId}`, groceries);
    }
  }, [groceries, activeHouseholdId]);

  useEffect(() => {
    if (activeHouseholdId) {
      safeSetJSON(`homehub_expenses_${activeHouseholdId}`, expenses);
    }
  }, [expenses, activeHouseholdId]);

  useEffect(() => {
    if (activeHouseholdId) {
      safeSetJSON(`homehub_activities_${activeHouseholdId}`, activities);
    }
  }, [activities, activeHouseholdId]);

  useEffect(() => {
    if (activeHouseholdId) {
      safeSetJSON(`homehub_maintenance_schedules_${activeHouseholdId}`, maintenanceSchedules);
    }
  }, [maintenanceSchedules, activeHouseholdId]);

  useEffect(() => {
    if (activeHouseholdId) {
      safeSetJSON(`homehub_maintenance_logs_${activeHouseholdId}`, maintenanceLogs);
    }
  }, [maintenanceLogs, activeHouseholdId]);

  // Broadcast initial user state for admin visibility without continuous overhead
  useEffect(() => {
    broadcastLiveUserState({
      user: currentUser,
      households,
      activeHouseholdId
    });
  }, [currentUser?.id, activeHouseholdId]);

  // Listens reactively for administrative actions (e.g. BackOffice Manual PRO Activation, Downgrade, Suspend)
  useEffect(() => {
    const cleanup = listenForAdminSyncActions((adminAction) => {
      console.log('⚡ Admin BackOffice Sync Event received in Web App:', adminAction);

      if (adminAction.action === 'ACTIVATE_PRO' && adminAction.householdId) {
        setHouseholds(prev => prev.map(h => {
          if (h.id === adminAction.householdId) {
            return {
              ...h,
              tier: 'PRO',
              subscription_tier: 'PRO',
              subscription_status: 'ACTIVE',
              pro_valid_until: adminAction.validUntil || '2027-01-15T10:00:00Z'
            };
          }
          return h;
        }));

        const storedHhs = safeGetJSON('homehub_households', []);
        if (Array.isArray(storedHhs)) {
          const updated = storedHhs.map(h => 
            h.id === adminAction.householdId 
              ? { ...h, tier: 'PRO', subscription_tier: 'PRO', subscription_status: 'ACTIVE', pro_valid_until: adminAction.validUntil || '2027-01-15T10:00:00Z' } 
              : h
          );
          safeSetJSON('homehub_households', updated);
        }
      } else if (adminAction.action === 'DOWNGRADE' && adminAction.householdId) {
        setHouseholds(prev => prev.map(h => {
          if (h.id === adminAction.householdId) {
            return {
              ...h,
              tier: 'FREE',
              subscription_tier: 'FREE',
              subscription_status: 'ACTIVE',
              pro_valid_until: null
            };
          }
          return h;
        }));

        const storedHhs = safeGetJSON('homehub_households', []);
        if (Array.isArray(storedHhs)) {
          const updated = storedHhs.map(h => 
            h.id === adminAction.householdId 
              ? { ...h, tier: 'FREE', subscription_tier: 'FREE', subscription_status: 'ACTIVE', pro_valid_until: null } 
              : h
          );
          safeSetJSON('homehub_households', updated);
        }
      } else if (adminAction.action === 'SUSPEND_USER') {
        if (currentUser && (currentUser.id === adminAction.userId || currentUser.email === adminAction.userId)) {
          const updatedUser = { ...(currentUser || {}), status: 'SUSPENDED' };
          setCurrentUser(updatedUser);
          safeSetJSON('homehub_user', updatedUser);
        }
      } else if (adminAction.action === 'ACTIVATE_USER') {
        if (currentUser && (currentUser.id === adminAction.userId || currentUser.email === adminAction.userId)) {
          const updatedUser = { ...(currentUser || {}), status: 'ACTIVE' };
          setCurrentUser(updatedUser);
          safeSetJSON('homehub_user', updatedUser);
        }
      }
    });

    return cleanup;
  }, [currentUser]);

  // Session Expired Event Listener (triggered by api.js 401 interceptor)
  useEffect(() => {
    const handleSessionExpired = (e) => {
      console.warn('Session expired event received in App.jsx');
      safeSet('homehub_token', null);
      safeSetJSON('homehub_user', null);
      safeSet('homehub_active_household_id', null);
      safeSetJSON('homehub_households', null);
      setCurrentUser(null);
      setAuthView('login');
      setIsProfileMenuOpen(false);
      setSessionExpiredMessage(
        e.detail?.message || (i18n.language === 'id' ? 'Sesi login Anda telah berakhir demi keamanan. Silakan masuk kembali.' : 'Your login session has expired for security. Please sign in again.')
      );
    };

    window.addEventListener('homehub:session_expired', handleSessionExpired);
    return () => window.removeEventListener('homehub:session_expired', handleSessionExpired);
  }, [i18n.language]);


  // Auth callbacks
  const handleLoginSuccess = (user, activeHh, allHhs, isNewRegistration = false) => {
    setSessionExpiredMessage(null);
    setCurrentUser(user);
    if (user) {
      safeSetJSON('homehub_user', user);
    }
    if (allHhs && allHhs.length > 0) {
      const normalizedHhs = allHhs.map(h => ({
        ...h,
        tier: h.tier || h.subscription_tier || 'FREE',
      }));
      setHouseholds(normalizedHhs);
      safeSetJSON('homehub_households', normalizedHhs);
    }
    if (activeHh) {
      setActiveHouseholdId(activeHh.id);
      safeSet('homehub_active_household_id', activeHh.id);
      loadHouseholdData(activeHh.id, isNewRegistration);
    }
  };

  const handleLogout = () => {
    safeSet('homehub_token', null);
    safeSetJSON('homehub_user', null);
    safeSet('homehub_active_household_id', null);
    safeSetJSON('homehub_households', null);
    setCurrentUser(null);
    setAuthView('login');
    setIsProfileMenuOpen(false);
  };

  const handleHouseholdChange = (val) => {
    if (val === 'add_new') {
      const maxHh = freeLimits?.MAX_HOUSEHOLDS ?? 1;
      if (!isPro && households.length >= maxHh) {
        setQuotaExceededInfo({
          title: 'Batas Kuota Rumah Tercapai',
          featureName: 'Kepemilikan Rumah / Properti',
          current: households.length,
          max: maxHh,
          unit: 'rumah'
        });
        return;
      }
      setIsAddHouseholdModalOpen(true);
      return;
    }
    setActiveHouseholdId(val);
    safeSet('homehub_active_household_id', val);
    loadHouseholdData(val, false);
  };

  const handleSaveHousehold = (newHh) => {
    const updated = [...households, newHh];
    setHouseholds(updated);
    setActiveHouseholdId(newHh.id);
    safeSetJSON('homehub_households', updated);
    safeSet('homehub_active_household_id', newHh.id);
    loadHouseholdData(newHh.id, true);
    alert(i18n.language === 'id' ? `Rumah "${newHh.name}" berhasil ditambahkan!` : `Household "${newHh.name}" added successfully!`);
  };

  const handleUpdateHousehold = async ({ id, name, address }) => {
    const trimmedName = name.trim();

    // 1. Update state & localStorage reactively
    setHouseholds(prev => {
      const updated = prev.map(h =>
        h.id === id
          ? {
              ...h,
              name: trimmedName,
              ...(address !== undefined ? { address } : {}),
            }
          : h
      );
      safeSetJSON('homehub_households', updated);
      return updated;
    });

    // 2. Call backend API if user is authenticated and not demo ID
    const token = localStorage.getItem('homehub_token');
    if (token && !isDemoHousehold(id)) {
      try {
        await api.put(`/auth/households/${id}`, {
          name: trimmedName,
          address: address || null,
        });
      } catch (err) {
        console.warn('Backend household update warning:', err);
      }
    }
  };

  const handleToggleGroceryClick = (item) => {
    if (item.bought) {
      // Jika sudah terbeli, uncheck langsung dan reset harga realisasi
      setGroceries(prev => prev.map(g => 
        g.id === item.id ? { ...g, bought: false, actual_price: null, bought_at: null } : g
      ));
    } else {
      // Jika belum terbeli, buka modal konfirmasi untuk input harga realisasi faktual
      setItemToChecklist(item);
    }
  };

  const handleConfirmChecklist = (itemId, actualPrice, boughtDate, boughtByName) => {
    setGroceries(prev => prev.map(g => 
      g.id === itemId 
        ? { 
            ...g, 
            bought: true, 
            actual_price: actualPrice, 
            bought_at: boughtDate,
            bought_by_name: boughtByName || currentUser?.name || 'Calvin'
          }
        : g
    ));
    setItemToChecklist(null);
  };

  const handlePrevGroceryMonth = () => {
    const [y, m] = selectedGroceryMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const pad = (n) => String(n).padStart(2, '0');
    setSelectedGroceryMonth(`${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}`);
  };

  const handleNextGroceryMonth = () => {
    const [y, m] = selectedGroceryMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const pad = (n) => String(n).padStart(2, '0');
    setSelectedGroceryMonth(`${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}`);
  };

  const handleCurrentGroceryMonth = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    setSelectedGroceryMonth(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`);
  };

  const formatGroceryMonthDisplay = (monthKey, lang = 'id') => {
    const [y, m] = monthKey.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    const monthNamesId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const names = lang === 'id' ? monthNamesId : monthNamesEn;
    return `${names[date.getMonth()]} ${date.getFullYear()}`;
  };

  const payBill = (id) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, status: 'PAID' } : b));
    alert('Pembayaran berhasil dicatat! Status tagihan kini Lunas.');
  };

  const handleAddClick = (type) => {
    if (type === 'bill') {
      const maxBills = freeLimits?.MAX_BILLS ?? 3;
      if (!isPro && bills.length >= maxBills) {
        setQuotaExceededInfo({
          title: 'Batas Kuota Tagihan Tercapai',
          featureName: 'Akun Tagihan Utilitas',
          current: bills.length,
          max: maxBills,
          unit: 'tagihan'
        });
        return;
      }
      setBillToEdit(null);
      setIsAddBillModalOpen(true);
      return;
    }
    if (type === 'asset') {
      const maxAssets = freeLimits?.MAX_ASSETS ?? 3;
      if (!isPro && assets.length >= maxAssets) {
        setQuotaExceededInfo({
          title: 'Batas Kuota Aset Tercapai',
          featureName: 'Inventaris & Kendaraan',
          current: assets.length,
          max: maxAssets,
          unit: 'aset'
        });
        return;
      }
      setAssetToEdit(null);
      setIsAddAssetModalOpen(true);
      return;
    }
    if (type === 'grocery') {
      const maxPantry = freeLimits?.MAX_PANTRY_ITEMS ?? 10;
      if (!isPro && groceries.length >= maxPantry) {
        setQuotaExceededInfo({
          title: 'Batas Kuota Belanja Tercapai',
          featureName: 'Daftar Kebutuhan Belanja',
          current: groceries.length,
          max: maxPantry,
          unit: 'item'
        });
        return;
      }
      setGroceryToEdit(null);
      setIsAddGroceryModalOpen(true);
      return;
    }
    if (type === 'expense') {
      const maxExpenses = freeLimits?.MAX_EXPENSES_PER_MONTH ?? 15;
      if (!isPro && expenses.length >= maxExpenses) {
        setQuotaExceededInfo({
          title: 'Batas Kuota Catatan Pengeluaran Tercapai',
          featureName: 'Pencatatan Keuangan',
          current: expenses.length,
          max: maxExpenses,
          unit: 'catatan / bulan'
        });
        return;
      }
      setIsAddExpenseModalOpen(true);
      return;
    }
    if (type === 'activity') {
      setActivityToEdit(null);
      setIsAddActivityModalOpen(true);
      return;
    }
    setModalType(type);
  };

  const handleSaveActivity = async (activityPayload, isEditing = false, isMasterEdit = false) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const tagMap = {
      COURSE_LES: i18n.language === 'id' ? 'Les & Kursus' : 'Course',
      VACATION: i18n.language === 'id' ? 'Liburan' : 'Vacation',
      BIZTRIP: i18n.language === 'id' ? 'Dinas / Bisnis' : 'Business Trip',
      INVITATION: i18n.language === 'id' ? 'Undangan' : 'Invitation',
      BIRTHDAY: i18n.language === 'id' ? 'Ulang Tahun' : 'Birthday',
      ROUTINE: i18n.language === 'id' ? 'Rutin / Olahraga' : 'Routine',
      OTHER: i18n.language === 'id' ? 'Lainnya' : 'Other'
    };

    const formatSingleActivity = (rawAct) => {
      const startDateObj = new Date(rawAct.start_datetime);
      const isValidDate = !isNaN(startDateObj.getTime());
      const todayStr = new Date().toISOString().slice(0, 10);
      const startDayStr = (rawAct.start_datetime || '').slice(0, 10);
      const isToday = todayStr === startDayStr;

      const dateFormatted = isToday 
        ? (i18n.language === 'id' ? 'Hari Ini' : 'Today')
        : (isValidDate ? `${startDateObj.getDate()} ${monthNames[startDateObj.getMonth()]}` : 'Agenda');

      const startTimeStr = isValidDate 
        ? `${String(startDateObj.getHours()).padStart(2, '0')}:${String(startDateObj.getMinutes()).padStart(2, '0')}`
        : '10:00';

      let timeFormatted = startTimeStr;
      if (rawAct.end_datetime) {
        const endDateObj = new Date(rawAct.end_datetime);
        if (!isNaN(endDateObj.getTime())) {
          const endTimeStr = `${String(endDateObj.getHours()).padStart(2, '0')}:${String(endDateObj.getMinutes()).padStart(2, '0')}`;
          timeFormatted = `${startTimeStr} - ${endTimeStr}`;
        }
      }

      return {
        id: rawAct.id || ('act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
        ...rawAct,
        date: dateFormatted,
        time: timeFormatted,
        tag: tagMap[rawAct.activity_type] || getActivityCategoryTheme(rawAct.activity_type).name || 'Aktivitas'
      };
    };

    // Bulk creation when recurring occurrences are provided
    if (activityPayload.recurring_occurrences && activityPayload.recurring_occurrences.length > 0) {
      const formattedOccurrences = activityPayload.recurring_occurrences.map(occ => formatSingleActivity(occ));
      try {
        await api.post('/activities', { ...activityPayload, activities: formattedOccurrences }).catch(() => {});
      } catch (e) {
        console.warn('API call failed, proceeding with client-side state update');
      }

      setActivities(prev => {
        const updated = [...formattedOccurrences, ...prev];
        return updated.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
      });
      setIsEditingMasterSeries(false);
      return;
    }

    // Master series cascade edit
    if (isEditing && (isMasterEdit || isEditingMasterSeries) && activityToEdit?.id) {
      try {
        await api.put(`/activities/${activityToEdit.id}?update_series=true`, activityPayload).catch(() => {});
      } catch (e) {
        console.warn('API call failed, proceeding with client-side state update');
      }

      const targetGroupId = activityToEdit.recurrence_group_id || activityPayload.recurrence_group_id;
      setActivities(prev => prev.map(a => {
        if (targetGroupId && a.recurrence_group_id === targetGroupId) {
          return {
            ...a,
            title: activityPayload.title !== undefined ? activityPayload.title : a.title,
            activity_type: activityPayload.activity_type !== undefined ? activityPayload.activity_type : a.activity_type,
            location: activityPayload.location !== undefined ? activityPayload.location : a.location,
            reminder_minutes_before: activityPayload.reminder_minutes_before !== undefined ? activityPayload.reminder_minutes_before : a.reminder_minutes_before,
            notes: activityPayload.notes !== undefined ? activityPayload.notes : a.notes,
            tag: tagMap[activityPayload.activity_type] || a.tag
          };
        }
        if (a.id === activityToEdit.id) {
          return formatSingleActivity({ ...a, ...activityPayload });
        }
        return a;
      }));

      setIsEditingMasterSeries(false);
      setActivityToEdit(null);
      return;
    }

    try {
      if (isEditing && activityToEdit?.id) {
        await api.put(`/activities/${activityToEdit.id}`, activityPayload).catch(() => {});
      } else {
        await api.post('/activities', activityPayload).catch(() => {});
      }
    } catch (e) {
      console.warn('API call failed, proceeding with client-side state update');
    }

    const newActivityItem = formatSingleActivity({
      id: isEditing && activityToEdit?.id ? activityToEdit.id : 'act_' + Date.now(),
      ...activityPayload
    });

    if (isEditing) {
      setActivities(prev => prev.map(a => a.id === newActivityItem.id ? newActivityItem : a));
    } else {
      setActivities(prev => {
        const updated = [newActivityItem, ...prev];
        return updated.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
      });
    }
    setIsEditingMasterSeries(false);
    setActivityToEdit(null);
  };

  const handleDeleteActivity = async (target) => {
    // If target has recurrence_group_id, prompt for single vs series deletion
    const actObj = typeof target === 'object' ? target : activities.find(a => a.id === target);
    if (actObj && actObj.recurrence_group_id) {
      setRecurringDeleteTarget(actObj);
      return;
    }

    const id = actObj ? actObj.id : target;
    if (!window.confirm(i18n.language === 'id' ? 'Hapus agenda aktivitas ini?' : 'Delete this activity?')) return;
    try {
      await api.delete(`/activities/${id}`).catch(() => {});
    } catch (_) {}
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const confirmDeleteRecurringSingle = async () => {
    if (!recurringDeleteTarget) return;
    try {
      await api.delete(`/activities/${recurringDeleteTarget.id}`).catch(() => {});
    } catch (_) {}
    setActivities(prev => prev.filter(a => a.id !== recurringDeleteTarget.id));
    setRecurringDeleteTarget(null);
  };

  const confirmDeleteRecurringSeries = async () => {
    if (!recurringDeleteTarget) return;
    try {
      await api.delete(`/activities/${recurringDeleteTarget.id}?all_recurring=true`).catch(() => {});
    } catch (_) {}
    setActivities(prev => prev.filter(a => a.recurrence_group_id !== recurringDeleteTarget.recurrence_group_id));
    setRecurringDeleteTarget(null);
  };

  // Handle Master Series Direct Delete
  const handleDeleteMasterSeries = async (masterAct) => {
    const confirmMsg = i18n.language === 'id'
      ? `Hapus Master Jadwal "${masterAct.title}" beserta seluruh rangkaian (${masterAct.total_series_count || 1}) sesinya?`
      : `Delete Master Schedule "${masterAct.title}" and all (${masterAct.total_series_count || 1}) recurring sessions?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/activities/${masterAct.id}?all_recurring=true`).catch(() => {});
    } catch (_) {}

    if (masterAct.recurrence_group_id) {
      setActivities(prev => prev.filter(a => a.recurrence_group_id !== masterAct.recurrence_group_id));
    } else {
      setActivities(prev => prev.filter(a => a.id !== masterAct.id));
    }
  };

  // Triggered when user clicks Edit button on an activity card
  const handleInitiateEditActivity = (act) => {
    if (act.recurrence_group_id) {
      setRecurringEditPromptTarget(act);
    } else {
      setIsEditingMasterSeries(false);
      setActivityToEdit(act);
      setIsAddActivityModalOpen(true);
    }
  };

  const handleEditSingleFromPrompt = () => {
    if (!recurringEditPromptTarget) return;
    const target = recurringEditPromptTarget;
    setRecurringEditPromptTarget(null);
    setIsEditingMasterSeries(false);
    setActivityToEdit(target);
    setIsAddActivityModalOpen(true);
  };

  const handleEditMasterFromPrompt = (customTarget) => {
    const target = customTarget || recurringEditPromptTarget;
    if (!target) return;
    setRecurringEditPromptTarget(null);
    setIsEditingMasterSeries(true);
    const seriesMaster = activities.find(a => a.recurrence_group_id === target.recurrence_group_id && a.is_master) || target;
    setActivityToEdit(seriesMaster);
    setIsAddActivityModalOpen(true);
  };

  const handleSaveExpense = async (expenseData) => {
    try {
      await api.post('/finance', expenseData).catch(() => {});
    } catch (e) {
      console.warn('API call failed, proceeding with client-side state update');
    }

    const newEntry = {
      id: 'e_' + Date.now(),
      title: expenseData.title,
      amount: expenseData.amount,
      date: expenseData.expense_date,
      category: expenseData.category,
      description: expenseData.description,
      receipt_url: expenseData.receipt_url,
      source_type: expenseData.source_type || 'MANUAL',
      recorded_by_name: expenseData.recorded_by_name || currentUser?.name || 'Calvin',
      user_id: expenseData.user_id || currentUser?.id || 'usr-001'
    };
    setExpenses(prev => [newEntry, ...prev]);
    alert(`Pengeluaran "${expenseData.title}" sebesar Rp ${expenseData.amount.toLocaleString('id-ID')} berhasil dicatat!`);
  };

  const handleExportReport = () => {
    const isExportAllowed = isPro || Boolean(freeLimits?.ALLOW_EXPORT_REPORT);
    if (!isExportAllowed) {
      setQuotaExceededInfo({
        title: 'Fitur Ekspor Laporan Dinonaktifkan',
        featureName: 'Ekspor Laporan (Excel & PDF)',
        current: 0,
        max: 0,
        unit: 'akses',
        customMessage: 'Fitur Ekspor Laporan Excel/CSV dikunci untuk akun Standar (FREE) oleh Admin. Tingkatkan ke HomeHub PRO untuk menikmati unduh spreadsheet tak terbatas.'
      });
      return;
    }

    try {
      const headers = ['ID', 'Judul', 'Kategori', 'Nominal', 'Tanggal', 'Dicatat Oleh', 'Tipe'];
      const rows = expenses.map(e => [
        e.id,
        `"${(e.title || '').replace(/"/g, '""')}"`,
        `"${(e.category || '').replace(/"/g, '""')}"`,
        e.amount || 0,
        e.date || e.expense_date || '',
        `"${(e.recorded_by_name || '').replace(/"/g, '""')}"`,
        e.source_type || 'MANUAL'
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `laporan_pengeluaran_${activeHouseholdId}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Gagal mengekspor laporan: ' + e.message);
    }
  };

  const handleEditGrocery = (item) => {
    setGroceryToEdit(item);
    setIsAddGroceryModalOpen(true);
  };

  const handleSaveGrocery = (savedItem, isEdit) => {
    if (isEdit) {
      setGroceries(prev => prev.map(g => g.id === savedItem.id ? savedItem : g));
      alert(`Catatan "${savedItem.name}" berhasil diperbarui!`);
    } else {
      setGroceries(prev => [savedItem, ...prev]);
      alert(`"${savedItem.name}" berhasil ditambahkan ke daftar belanja!`);
    }
    setGroceryToEdit(null);
  };

  const handleEditAsset = (ast) => {
    setAssetToEdit(ast);
    setIsAddAssetModalOpen(true);
  };

  const handleSaveAsset = (savedAsset, isEdit) => {
    if (isEdit) {
      setAssets(prev => prev.map(a => a.id === savedAsset.id ? savedAsset : a));
      alert(`Data aset "${savedAsset.name}" berhasil diperbarui!`);
    } else {
      setAssets(prev => [savedAsset, ...prev]);
      alert(`Aset "${savedAsset.name}" berhasil ditambahkan ke inventaris rumah!`);
    }
    setAssetToEdit(null);
  };

  const handleDeleteAsset = async (assetId, assetName) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus "${assetName}"?\n\nSesuai prinsip konsistensi data, aset ini TIDAK DIHAPUS PERMANEN dari database, melainkan statusnya diubah menjadi 'DISPOSED' (diarsipkan).`
    );
    if (!confirmed) return;

    try {
      // Soft-delete API call to backend (updates status = 'DISPOSED' in MySQL)
      await api.delete(`/assets/${assetId}`).catch(() => {});
    } catch (e) {
      console.warn('API call failed, proceeding with client-side soft-delete state update');
    }

    // Soft delete in frontend state: filter out from active assets list
    setAssets(prev => prev.filter(a => a.id !== assetId));
    alert(`Aset "${assetName}" telah berhasil dihapus dari daftar (status di database diubah menjadi DISPOSED).`);
  };

  const handleSaveSchedule = async (newSchedule) => {
    try {
      await api.post(`/assets/${newSchedule.asset_id}/schedules`, newSchedule).catch(() => {});
    } catch (e) {
      console.warn('API save schedule failed, proceeding client-side');
    }

    setMaintenanceSchedules(prev => {
      const updated = [newSchedule, ...prev.filter(s => s.id !== newSchedule.id)];
      const upcoming = getAssetUpcomingSchedule({ id: newSchedule.asset_id }, updated, i18n.language);
      setAssets(assetsPrev => assetsPrev.map(ast => {
        if (ast.id === newSchedule.asset_id) {
          return {
            ...ast,
            nextService: upcoming.nextService,
            nextOdo: upcoming.nextOdo
          };
        }
        return ast;
      }));
      setSelectedAssetForService(sel => {
        if (sel && sel.id === newSchedule.asset_id) {
          return {
            ...sel,
            nextService: upcoming.nextService,
            nextOdo: upcoming.nextOdo
          };
        }
        return sel;
      });
      return updated;
    });

    alert(i18n.language === 'id' ? `Jadwal pemeliharaan "${newSchedule.title}" berhasil disimpan!` : `Maintenance schedule "${newSchedule.title}" saved!`);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    const targetSchedule = maintenanceSchedules.find(s => s.id === scheduleId);
    const assetId = targetSchedule?.asset_id;

    if (assetId) {
      try {
        await api.delete(`/assets/${assetId}/schedules/${scheduleId}`).catch(() => {});
      } catch (e) {
        console.warn('API delete schedule failed, proceeding client-side');
      }
    }

    setMaintenanceSchedules(prev => {
      const updated = prev.filter(s => s.id !== scheduleId);
      if (assetId) {
        const upcoming = getAssetUpcomingSchedule({ id: assetId }, updated, i18n.language);
        setAssets(assetsPrev => assetsPrev.map(ast => {
          if (ast.id === assetId) {
            return {
              ...ast,
              nextService: upcoming.nextService,
              nextOdo: upcoming.nextOdo
            };
          }
          return ast;
        }));
        setSelectedAssetForService(sel => {
          if (sel && sel.id === assetId) {
            return {
              ...sel,
              nextService: upcoming.nextService,
              nextOdo: upcoming.nextOdo
            };
          }
          return sel;
        });
      }
      return updated;
    });
  };

  const handleSaveServiceLog = (newLog, syncToFinance) => {
    setMaintenanceLogs(prev => [newLog, ...prev]);

    // If vehicle and has current odometer, update asset's odo
    const targetAsset = assets.find(a => a.id === newLog.asset_id);
    if (targetAsset) {
      if (targetAsset.type === 'VEHICLE' && newLog.current_odometer) {
        setAssets(prev => prev.map(a => a.id === targetAsset.id ? { ...a, odo: newLog.current_odometer } : a));
      }
    }

    // Advance matching schedules if any
    setMaintenanceSchedules(prev => {
      const updated = prev.map(sch => {
        if (sch.asset_id === newLog.asset_id && sch.title.toLowerCase().includes(newLog.service_title.toLowerCase().slice(0, 5))) {
          if (sch.frequency_type === 'WHICHEVER_FIRST') {
            let nextDateStr = sch.next_due_date;
            if (newLog.performed_date && sch.frequency_months) {
              const d = new Date(newLog.performed_date);
              d.setMonth(d.getMonth() + Number(sch.frequency_months));
              nextDateStr = d.toISOString().split('T')[0];
            }
            const nextOdoVal = (newLog.current_odometer && sch.frequency_km)
              ? newLog.current_odometer + Number(sch.frequency_km)
              : sch.next_due_odometer;

            return { ...sch, next_due_date: nextDateStr, next_due_odometer: nextOdoVal };
          } else if (sch.frequency_type === 'MONTHS' && newLog.performed_date) {
            const d = new Date(newLog.performed_date);
            d.setMonth(d.getMonth() + Number(sch.frequency_value));
            const nextDateStr = d.toISOString().split('T')[0];
            return { ...sch, next_due_date: nextDateStr };
          } else if (sch.frequency_type === 'ODOMETER' && newLog.current_odometer) {
            return { ...sch, next_due_odometer: newLog.current_odometer + Number(sch.frequency_value) };
          }
        }
        return sch;
      });

      // Recalculate upcoming schedule for this asset
      const upcoming = getAssetUpcomingSchedule({ id: newLog.asset_id }, updated, i18n.language);
      setAssets(assetsPrev => assetsPrev.map(ast => {
        if (ast.id === newLog.asset_id) {
          return {
            ...ast,
            nextService: upcoming.nextService,
            nextOdo: upcoming.nextOdo
          };
        }
        return ast;
      }));
      setSelectedAssetForService(sel => {
        if (sel && sel.id === newLog.asset_id) {
          return {
            ...sel,
            nextService: upcoming.nextService,
            nextOdo: upcoming.nextOdo
          };
        }
        return sel;
      });

      return updated;
    });

    // Auto sync to finance expenses if requested and cost > 0
    if (syncToFinance && newLog.cost > 0) {
      const assetName = targetAsset ? targetAsset.name : 'Aset Rumah';
      const isVehicle = targetAsset?.type === 'VEHICLE';
      const newExpense = {
        id: 'exp_maint_' + Date.now(),
        title: `Servis: ${newLog.service_title} (${assetName})`,
        amount: Number(newLog.cost),
        date: newLog.performed_date,
        category: isVehicle ? 'Transportasi & Bensin' : 'Tagihan & Utilitas',
        description: `Pengerjaan servis oleh ${newLog.vendor_name || 'Teknisi'}${newLog.vendor_phone ? ` (${newLog.vendor_phone})` : ''}. ${newLog.notes ? `Catatan: ${newLog.notes}` : ''}`,
        receipt_url: null
      };
      setExpenses(prev => [newExpense, ...prev]);
    }

    alert(i18n.language === 'id' 
      ? `Log servis berhasil dicatat!${syncToFinance && newLog.cost > 0 ? ' (Tercatat otomatis di Pengeluaran)' : ''}` 
      : `Service log successfully recorded!${syncToFinance && newLog.cost > 0 ? ' (Auto-synced to Expenses)' : ''}`
    );
  };

  const handleDeleteServiceLog = (logId) => {
    setMaintenanceLogs(prev => prev.filter(l => l.id !== logId));
  };

  const handleEditBill = (bill) => {
    setBillToEdit(bill);
    setIsAddBillModalOpen(true);
  };

  const handleSaveBill = async (savedBill, isEdit) => {
    try {
      await api.post('/utilities', {
        category_code: savedBill.category_code,
        provider_name: savedBill.provider_name,
        customer_number: savedBill.customer_number,
        account_name: savedBill.account_name,
        default_due_day: savedBill.default_due_day
      }).catch(() => {});
    } catch (e) {
      console.warn('API call failed, proceeding with client-side state update');
    }

    if (isEdit) {
      setBills(prev => prev.map(b => b.id === savedBill.id ? savedBill : b));
      alert(i18n.language === 'id' ? `Akun tagihan "${savedBill.name}" berhasil diperbarui!` : `Bill account "${savedBill.name}" updated successfully!`);
    } else {
      setBills(prev => [savedBill, ...prev]);
      alert(i18n.language === 'id' ? `Akun tagihan "${savedBill.name}" berhasil didaftarkan!` : `Bill account "${savedBill.name}" registered successfully!`);
    }
    setBillToEdit(null);
  };

  const handleDeleteBill = (billId, billName) => {
    if (window.confirm(i18n.language === 'id' ? `Hapus akun tagihan "${billName}"?` : `Delete bill account "${billName}"?`)) {
      setBills(prev => prev.filter(b => b.id !== billId));
    }
  };

  // =========================================================================
  // IF NOT AUTHENTICATED -> SHOW LOGIN OR REGISTER PAGE
  // =========================================================================
  if (!currentUser) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onRegisterSuccess={handleLoginSuccess}
          onSwitchToLogin={() => {
            setSessionExpiredMessage(null);
            setAuthView('login');
          }}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => {
          setSessionExpiredMessage(null);
          setAuthView('register');
        }}
        sessionExpiredMessage={sessionExpiredMessage}
      />
    );
  }

  // =========================================================================
  // AUTHENTICATED USER -> MAIN DASHBOARD APPLICATION
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-indigo-500/20">
              🏠
            </div>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 text-xl tracking-tight">
              HomeHub
            </span>
          </div>

          {/* Multi-Household Selector & Edit Name Button */}
          <div className="relative flex items-center gap-1.5">
            <select
              value={activeHouseholdId}
              onChange={(e) => handleHouseholdChange(e.target.value)}
              className="bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/80 rounded-full px-3.5 py-1.5 text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition max-w-[210px] truncate"
            >
              {households.map(h => {
                const tier = h.tier || h.subscription_tier || 'FREE';
                return (
                  <option key={h.id} value={h.id}>
                    {tier === 'PRO' ? '🏖️' : '🏡'} {h.name} ({tier})
                  </option>
                );
              })}
              <option value="add_new">{t('common.add_household_pro')}</option>
            </select>

            <button
              type="button"
              onClick={() => setIsEditHouseholdModalOpen(true)}
              className="p-1.5 rounded-full hover:bg-indigo-100 text-indigo-700 hover:text-indigo-950 border border-indigo-200/80 transition cursor-pointer bg-indigo-50/70 shadow-xs flex items-center justify-center shrink-0"
              title={t('household.edit_title', 'Ubah Nama Rumah')}
              aria-label="Edit Household Name"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsManageMembersModalOpen(true)}
              className="p-1.5 rounded-full hover:bg-indigo-100 text-indigo-700 hover:text-indigo-950 border border-indigo-200/80 transition cursor-pointer bg-indigo-50/70 shadow-xs flex items-center justify-center shrink-0"
              title={t('members.title', 'Kelola Anggota Rumah')}
              aria-label="Manage Household Members"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Controls: Language & Glowing Pro Button & Profile Avatar */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 rounded-full p-0.5 text-xs font-bold text-slate-600 border border-slate-200">
            <button
              onClick={() => i18n.changeLanguage('id')}
              className={`px-3 py-1 rounded-full transition ${i18n.language === 'id' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-800'}`}
            >
              ID
            </button>
            <button
              onClick={() => i18n.changeLanguage('en')}
              className={`px-3 py-1 rounded-full transition ${i18n.language === 'en' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-800'}`}
            >
              EN
            </button>
          </div>

          {/* Upgrade Pro Badge */}
          <button
            onClick={() => setIsProModalOpen(true)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-black flex items-center gap-1.5 shadow-md transition transform hover:scale-105 cursor-pointer ${
              isPro
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-amber-500/25'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{isPro ? t('menu.pro_active') : t('menu.upgrade_pro')}</span>
          </button>

          {/* User Profile Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2.5 z-40 animate-scaleUp">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                      {currentHousehold.role === 'OWNER' ? t('common.role_owner') : (currentHousehold.role || t('common.role_owner'))}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                      isPro ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isPro ? t('menu.pro_plan') : t('menu.free_plan')}
                    </span>
                  </div>
                </div>

                <div className="px-2 py-1.5 space-y-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsEditHouseholdModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{t('household.edit_title', 'Ubah Nama Rumah')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsManageMembersModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{t('members.title', 'Kelola Anggota Rumah')}</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sleek Deep-Navy Sidebar */}
        <aside className="w-64 bg-[#0c1322] text-slate-300 p-4 flex flex-col justify-between hidden md:flex shadow-xl">
          <nav className="space-y-1.5 text-sm font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition text-left cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="truncate">{t('menu.dashboard')}</span>
            </button>

            <button
              onClick={() => setActiveTab('utilities')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition text-left cursor-pointer ${
                activeTab === 'utilities'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="truncate">{t('menu.utilities')}</span>
              {unpaidBillsCount > 0 && (
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 border transition ${
                  activeTab === 'utilities'
                    ? 'bg-red-500 text-white border-red-400/60 shadow-xs'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {unpaidBillsCount} Due
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('assets')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition text-left cursor-pointer ${
                activeTab === 'assets'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Snowflake className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="truncate">{t('menu.assets')}</span>
              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 border transition ${
                activeTab === 'assets'
                  ? 'bg-emerald-500 text-white border-emerald-400/60 shadow-xs'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {activeAssetsCount}/{assets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('groceries')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition text-left cursor-pointer ${
                activeTab === 'groceries'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShoppingCart className="w-5 h-5 text-orange-400 shrink-0" />
              <span className="truncate">{t('menu.groceries')}</span>
              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 border transition ${
                activeTab === 'groceries'
                  ? 'bg-orange-500 text-white border-orange-400/60 shadow-xs'
                  : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
              }`}>
                {unboughtGroceries.length} item
              </span>
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition text-left cursor-pointer ${
                activeTab === 'finance'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Wallet className="w-5 h-5 text-purple-400 shrink-0" />
              <span className="truncate">{t('menu.finance')}</span>
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition text-left cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-5 h-5 text-pink-400 shrink-0" />
              <span className="truncate">{t('menu.activity')}</span>
            </button>
          </nav>

          {/* Pro Promo Box / Active Pro Card */}
          {isPro ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/90 via-teal-950/80 to-slate-900 border border-emerald-500/40 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-emerald-400">
                <span className="flex items-center gap-1.5">⭐ {t('menu.pro_active_banner_title')}</span>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded font-black">{t('dashboard.unlimited_badge')}</span>
              </div>
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                {t('menu.pro_active_banner_desc')}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/90 via-purple-950/80 to-slate-900 border border-indigo-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-amber-400">
                <span>⭐ {t('menu.pro_promo_banner_title')}</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">{t('menu.pro_promo_discount')}</span>
              </div>
              <p className="text-[11px] text-indigo-200 leading-relaxed">
                {t('menu.pro_promo_banner_desc')}
              </p>
              <button
                onClick={() => setIsProModalOpen(true)}
                className="w-full py-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                {t('menu.see_pro_plan')}
              </button>
            </div>
          )}
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-8 space-y-6">
          
          {/* VIEW 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {t('dashboard.title')}
                  </h1>
                  <p className="text-xs text-slate-500">
                    {t('dashboard.subtitle')} • {currentHousehold.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleAddClick('grocery')}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('dashboard.shopping_title')}
                  </button>
                  <button 
                    onClick={() => handleAddClick('expense')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('dashboard.quick_action_add_expense')}
                  </button>
                  <button 
                    onClick={() => setIsManageMembersModalOpen(true)}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-600" /> {t('members.title', 'Kelola Anggota')}
                  </button>
                </div>
              </div>

              {/* 4 Hero Cards (Clickable Navigation Shortcuts) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Tagihan Utilitas Shortcut -> tab: utilities */}
                <div 
                  onClick={() => setActiveTab('utilities')}
                  className="group relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  title="Tagihan Utilitas"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">{t('dashboard.bills_title')}</span>
                    <span className="text-2xl">⚡</span>
                  </div>
                  <p className="text-3xl font-black mt-3 tracking-tight">
                    Rp {totalUnpaidBillsAmount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-blue-100 font-medium mt-1 truncate">
                    {bills.length === 0
                      ? (i18n.language === 'id' ? 'Belum ada akun tagihan terdaftar' : 'No bills registered')
                      : unpaidBills.length === 0
                        ? (i18n.language === 'id' ? 'Semua tagihan lunas ✨' : 'All bills are paid ✨')
                        : `${earliestUnpaidBill?.name || earliestUnpaidBill?.provider_name || 'Tagihan'} • ${earliestUnpaidBill?.due ? (i18n.language === 'id' ? `Jatuh tempo ${earliestUnpaidBill.due}` : `Due ${earliestUnpaidBill.due}`) : t('dashboard.due_in_days')}`
                    }
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    {earliestUnpaidBill ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          payBill(earliestUnpaidBill.id);
                        }}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-xs font-black py-2 rounded-xl shadow-md transition cursor-pointer text-center"
                      >
                        {t('dashboard.pay_now')}
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddClick('bill');
                        }}
                        className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs font-black py-2 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> {t('utilities.add_bill_btn')}
                      </button>
                    )}
                    <span className="text-[11px] font-bold text-blue-200 group-hover:text-white group-hover:translate-x-1 transition flex items-center gap-1 shrink-0">
                      {t('dashboard.manage_bills')}
                    </span>
                  </div>
                </div>

                {/* 2. Aset & Garansi Shortcut -> tab: assets */}
                <div 
                  onClick={() => setActiveTab('assets')}
                  className="group relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  title="Aset & Garansi"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">{t('dashboard.assets_title')}</span>
                    <span className="text-2xl">❄️</span>
                  </div>
                  <p className="text-3xl font-black mt-3 tracking-tight">{assets.length} {t('menu.assets')}</p>
                  <p className="text-xs text-emerald-100 font-medium mt-1 truncate">
                    {assets.length === 0
                      ? (i18n.language === 'id' ? 'Belum ada aset terdaftar' : 'No assets registered yet')
                      : assets.slice(0, 2).map(a => a.name.split(' ').slice(0, 2).join(' ')).join(' & ')
                    }
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {assets.length === 0 ? (
                        <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-lg">
                          {i18n.language === 'id' ? 'Belum ada data garansi' : 'No warranty data'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-lg">
                          {activeWarrantiesCount} {t('dashboard.garansi_aktif')}
                        </span>
                      )}

                      {/* Only show upcoming service bullet if an actual schedule exists */}
                      {upcomingServiceInfo && (
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                          upcomingServiceInfo.isUrgent
                            ? 'bg-amber-400 text-slate-950 animate-pulse'
                            : 'bg-white/20 text-white'
                        }`}>
                          🚗 {upcomingServiceInfo.label}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-emerald-100 group-hover:text-white group-hover:translate-x-1 transition flex items-center gap-1 shrink-0">
                      {t('dashboard.view_assets')}
                    </span>
                  </div>
                </div>

                {/* 3. Daftar Belanja Shortcut -> tab: groceries */}
                <div 
                  onClick={() => setActiveTab('groceries')}
                  className="group relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  title="Daftar Belanja"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">{t('dashboard.groceries_title')}</span>
                    <span className="text-2xl">🛒</span>
                  </div>
                  <p className="text-3xl font-black mt-3 tracking-tight">{unboughtGroceries.length} {t('menu.groceries')}</p>
                  <p className="text-xs text-amber-100 font-medium mt-1 truncate">
                    {unboughtGroceries.length > 0 
                      ? unboughtGroceries.slice(0, 3).map(g => g.name).join(', ') 
                      : (i18n.language === 'id' ? 'Semua kebutuhan sudah terbeli' : 'All groceries purchased')}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <span className="text-[10px] font-bold bg-red-600 text-white px-2.5 py-1 rounded-lg">
                        {outOfStockCount > 0 ? `${outOfStockCount} ${t('dashboard.status_out_of_stock')}` : t('dashboard.stock_safe')}
                      </span>
                      <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-lg">
                        {lowStockCount > 0 ? `${lowStockCount} ${t('dashboard.status_low_stock')}` : t('dashboard.stock_fulfilled')}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-100 group-hover:text-white group-hover:translate-x-1 transition flex items-center gap-1 shrink-0">
                      {t('dashboard.open_groceries')}
                    </span>
                  </div>
                </div>

                {/* 4. Pengeluaran SEP Shortcut -> tab: finance */}
                <div 
                  onClick={() => setActiveTab('finance')}
                  className="group relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-indigo-800 text-white shadow-lg shadow-purple-600/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  title="Finansial"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">{t('dashboard.expenses_title')}</span>
                    <span className="text-2xl">📈</span>
                  </div>
                  <p className="text-3xl font-black mt-3 tracking-tight">
                    Rp {totalExpenseThisMonth.toLocaleString('id-ID')}
                  </p>
                  {isPro ? (
                    <div className="mt-3.5 flex items-center justify-between bg-white/15 backdrop-blur-xs border border-white/20 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{t('dashboard.pro_active_unlimited')}</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-md shadow-xs">
                        {t('dashboard.unlimited_badge')}
                      </span>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-purple-200 font-medium mt-1">
                        {expenses.length} {t('dashboard.entries_used')}
                      </p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsProModalOpen(true);
                        }}
                        className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
                      >
                        {t('dashboard.unlock_unlimited')}
                      </button>
                    </>
                  )}
                  <div className="mt-3 flex items-center justify-end">
                    <span className="text-[11px] font-bold text-purple-200 group-hover:text-white group-hover:translate-x-1 transition inline-flex items-center gap-1">
                      {t('dashboard.view_finance')}
                    </span>
                  </div>
                </div>

              </div>

              {/* MONTHLY EXPENSE COMPARISON CHART */}
              <MonthlyExpenseChart expenses={expenses} budgetLimit={budgetCeiling} onEditBudget={() => setIsEditBudgetOpen(true)} isDemo={isDemoHousehold(activeHouseholdId)} />

              {/* Quick Priority Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">❄️</span>
                      <span>{t('dashboard.assets_title')}</span>
                    </h3>
                    <button onClick={() => setActiveTab('assets')} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
                      {t('dashboard.open_assets_page')}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {assets.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs font-semibold">{i18n.language === 'id' ? 'Belum ada aset terdaftar di rumah ini.' : 'No assets registered for this home.'}</p>
                        <button
                          onClick={() => handleAddClick('asset')}
                          className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> {t('assets.add_asset_btn')}
                        </button>
                      </div>
                    ) : (
                      assets.slice(0, 2).map((ast) => {
                        const wInfo = getWarrantyStatus(ast.warranty || ast.warranty_expiry_date, i18n.language);
                        const wDate = formatWarrantyDisplay(ast.warranty || ast.warranty_expiry_date, i18n.language);
                        const isElectronic = ast.type === 'ELECTRONIC';
                        const upcoming = getAssetUpcomingSchedule(ast, maintenanceSchedules, i18n.language);

                        return (
                          <div key={ast.id} className="p-4 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200 flex items-center justify-between transition">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-lg ${
                                isElectronic ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {isElectronic ? '💨' : '🚗'}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-slate-900">{ast.name}</h4>
                                <p className="text-xs text-slate-500">
                                  {ast.plate ? `${t('assets.plate_label')}: ${ast.plate}` : (ast.room || 'Kamar Utama')}
                                  {(ast.warranty || ast.warranty_expiry_date) && (
                                    <>
                                      {' • '}
                                      <span className={wInfo.status === 'EXPIRED' ? 'text-rose-600 font-bold' : ''}>
                                        {wInfo.label} s/d {wDate}
                                      </span>
                                    </>
                                  )}
                                  {ast.odo && ` • Odometer ${ast.odo.toLocaleString()} KM`}
                                </p>
                              </div>
                            </div>
                            {upcoming.dashboardBadge ? (
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${upcoming.dashboardBadge.badgeClass}`}>
                                {upcoming.dashboardBadge.label}
                              </span>
                            ) : (
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${wInfo.badgeClass}`}>
                                {wInfo.label}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">🛒</span>
                      <span>{t('dashboard.shopping_title')}</span>
                    </h3>
                    <button onClick={() => setActiveTab('groceries')} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
                      {t('dashboard.open_groceries_page')}
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {groceries.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs font-semibold">{i18n.language === 'id' ? 'Daftar belanja masih kosong.' : 'Shopping list is empty.'}</p>
                        <button
                          onClick={() => handleAddClick('grocery')}
                          className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> {t('groceries.add_item_btn', 'Tambah Item Belanja')}
                        </button>
                      </div>
                    ) : (
                      groceries.slice(0, 3).map((item) => (
                        <label key={item.id} className="flex items-center gap-3.5 p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 cursor-pointer transition">
                          <input
                            type="checkbox"
                            checked={item.bought}
                            onChange={() => toggleBought(item.id)}
                            className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-bold truncate block ${item.bought ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.name}</span>
                            <p className="text-xs text-slate-500">{t('dashboard.category_label')}: {getLocalizedCategoryName(item.category, 'grocery', i18n.language)}</p>
                          </div>
                          {item.bought ? (
                            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-lg">{t('dashboard.status_bought')}</span>
                          ) : item.status === 'OUT_OF_STOCK' ? (
                            <span className="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-lg">{t('dashboard.status_out_of_stock')}</span>
                          ) : (
                            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-lg">{t('dashboard.status_low_stock')}</span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Multi-Member Household Collaboration Widget */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-1.5 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> {t('members.card_title', 'Anggota Keluarga & Pengelola')}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        currentHousehold.tier === 'PRO' ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {householdMembers.length} {t('members.active_members', 'Anggota')}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white tracking-tight">
                      {currentHousehold.name}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {t('members.card_desc', 'Kelola siapa saja yang memiliki akses ke data rumah ini (tagihan, belanjaan dapur, aset, dan keuangan).')}
                    </p>
                  </div>

                  {/* Members Avatars preview & Action button */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex -space-x-2 overflow-hidden py-1">
                      {householdMembers.slice(0, 5).map((m, idx) => {
                        const colors = [
                          'bg-amber-500', 'bg-indigo-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600'
                        ];
                        const initials = m.name ? m.name.substring(0, 2).toUpperCase() : 'U';
                        return (
                          <div
                            key={m.id || idx}
                            className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-white text-xs font-bold ring-2 ring-slate-900 shadow-sm ${colors[idx % colors.length]}`}
                            title={`${m.name} (${m.role})`}
                          >
                            {initials}
                          </div>
                        );
                      })}
                      {householdMembers.length > 5 && (
                        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 text-slate-300 text-xs font-bold ring-2 ring-slate-900">
                          +{householdMembers.length - 5}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsManageMembersModalOpen(true)}
                      className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{t('members.manage_btn', 'Kelola Anggota')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: UTILITIES */}
          {activeTab === 'utilities' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('utilities.title')}</h1>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      isPro 
                        ? 'bg-amber-400/20 text-amber-800 border-amber-400/40' 
                        : bills.length >= (freeLimits?.MAX_BILLS ?? 3)
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {isPro ? '⭐ PRO UNLIMITED' : `Kapasitas: ${bills.length} / ${freeLimits?.MAX_BILLS ?? 3} Tagihan`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{t('utilities.subtitle')}</p>
                </div>
                <button 
                  onClick={() => handleAddClick('bill')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> {t('utilities.add_bill_btn')}
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
                {bills.map((bill) => (
                  <div key={bill.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                        bill.category_color ? (CATEGORY_COLOR_STYLES[bill.category_color]?.iconBg || 'bg-slate-100 text-slate-700') :
                        getCategoryStyle(bill.category || bill.category_code).iconBg
                      }`}>
                        {bill.category_icon || getCategoryIcon(bill.category || bill.category_code)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{bill.name || bill.account_name || 'Tagihan'}</h4>
                          {bill.provider_name && (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                              {bill.provider_name}
                            </span>
                          )}
                          <span className="text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">
                            {i18n.language === 'en' ? (bill.category_name_en || getCategoryName(bill.category || bill.category_code, null, 'en')) : (bill.category_name || getCategoryName(bill.category || bill.category_code, null, 'id'))}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{t('utilities.no_account')}: {bill.account || bill.customer_number || '-'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t('utilities.due_date')}: {bill.due || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        <p className="text-base font-black text-slate-900">Rp {(Number(bill.amount) || 0).toLocaleString('id-ID')}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          bill.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {bill.status === 'PAID' ? t('utilities.status_paid') : t('utilities.status_unpaid')}
                        </span>
                      </div>
                      {bill.status === 'UNPAID' ? (
                        <button
                          onClick={() => payBill(bill.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
                        >
                          {t('utilities.pay_now_btn')}
                        </button>
                      ) : (
                        <button 
                          onClick={() => alert(t('utilities.receipt_saved_alert'))}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> {t('utilities.receipt_btn')}
                        </button>
                      )}
                      <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                        <button
                          onClick={() => handleEditBill(bill)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                          title={t('utilities.edit_bill')}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBill(bill.id, bill.name)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                          title={t('utilities.delete_bill')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 3: ASSETS */}
          {activeTab === 'assets' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('assets.title')}</h1>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      isPro 
                        ? 'bg-amber-400/20 text-amber-800 border-amber-400/40' 
                        : assets.length >= (freeLimits?.MAX_ASSETS ?? 3)
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isPro ? '⭐ PRO UNLIMITED' : `Kapasitas: ${assets.length} / ${freeLimits?.MAX_ASSETS ?? 3} Aset`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{t('assets.subtitle')}</p>
                </div>
                <button 
                  onClick={() => handleAddClick('asset')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> {t('assets.add_asset_btn')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {assets.map((ast) => {
                  const warrantyInfo = getWarrantyStatus(ast.warranty || ast.warranty_expiry_date, i18n.language);
                  const formattedWarrantyDate = formatWarrantyDisplay(ast.warranty || ast.warranty_expiry_date, i18n.language);
                  const upcoming = getAssetUpcomingSchedule(ast, maintenanceSchedules, i18n.language);

                  return (
                    <div key={ast.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1.5 shadow-2xs">
                          <span>{getAssetTypeIcon(ast.type)}</span>
                          <span>{getLocalizedCategoryName(ast.type, 'asset', i18n.language) || ast.type_name || (ast.type === 'ELECTRONIC' ? t('assets.type_electronic') : ast.type === 'VEHICLE' ? t('assets.type_vehicle') : ast.type)}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          {/* Dynamic Real-Time Warranty Status Badge */}
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 shadow-2xs ${warrantyInfo.badgeClass}`}>
                            {warrantyInfo.status === 'ACTIVE' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                            {warrantyInfo.status === 'EXPIRING_SOON' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                            {warrantyInfo.status === 'EXPIRED' && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                            <span>{warrantyInfo.label}</span>
                          </span>

                          <button
                            onClick={() => handleEditAsset(ast)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title={t('assets.edit_tooltip')}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(ast.id, ast.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title={t('assets.delete_tooltip')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900">{ast.name}</h3>
                        <p className="text-xs text-slate-500">
                          {ast.brand && ast.brand !== '-' ? `${ast.brand} • ` : ''}
                          {ast.type === 'VEHICLE'
                            ? `${ast.plate ? `${t('assets.plate_label')}: ${ast.plate} • ` : ''}${t('assets.odometer_label')}: ${(ast.odo !== undefined && ast.odo !== null) ? `${Number(ast.odo).toLocaleString('id-ID')} KM` : '-'}`
                            : `${t('assets.location_label')}: ${ast.room || '-'}`}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1.5 text-xs text-slate-600">
                        {ast.purchase_price && Number(ast.purchase_price) > 0 ? (
                          <div className="flex justify-between">
                            <span>{t('assets.purchase_price')}:</span>
                            <span className="font-bold text-emerald-700">Rp {Number(ast.purchase_price).toLocaleString('id-ID')}</span>
                          </div>
                        ) : null}
                        {(ast.warranty || ast.warranty_expiry_date) && (
                          <div className="flex justify-between">
                            <span>{t('assets.warranty_period')}:</span>
                            <span className={`font-bold ${warrantyInfo.status === 'EXPIRED' ? 'text-rose-600 line-through' : 'text-slate-800'}`}>
                              {t('assets.until')} {formattedWarrantyDate}
                            </span>
                          </div>
                        )}
                        {upcoming.nextService && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">{t('assets.next_service')}:</span>
                            <span className="font-bold text-amber-600 text-right">
                              {upcoming.scheduleTitle ? `${upcoming.scheduleTitle} • ${upcoming.nextService}` : upcoming.nextService}
                            </span>
                          </div>
                        )}
                        {upcoming.nextOdo && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">{t('assets.next_oil_service')}:</span>
                            <span className="font-bold text-amber-600 text-right">
                              {upcoming.odoScheduleTitle ? `${upcoming.odoScheduleTitle} • ` : ''}
                              {upcoming.nextOdo.toLocaleString('id-ID')} KM{upcoming.remainingKmLabel ? ` (${upcoming.remainingKmLabel})` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={() => setSelectedAssetForInvoice(ast)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{t('assets.view_invoice_btn')}</span>
                      </button>
                      <button 
                        onClick={() => setSelectedAssetForService(ast)} 
                        className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>{t('assets.service_history_btn')}</span>
                      </button>
                    </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 4: GROCERIES */}
          {activeTab === 'groceries' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('groceries.title')}</h1>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      isPro 
                        ? 'bg-amber-400/20 text-amber-800 border-amber-400/40' 
                        : groceries.length >= (freeLimits?.MAX_PANTRY_ITEMS ?? 10)
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {isPro ? '⭐ PRO UNLIMITED' : `Kapasitas: ${groceries.length} / ${freeLimits?.MAX_PANTRY_ITEMS ?? 10} Item`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{t('groceries.subtitle')}</p>
                </div>
                <button 
                  onClick={() => handleAddClick('grocery')}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> {t('groceries.add_grocery_btn')}
                </button>
              </div>

              {/* DASHBOARD ESTIMASI BELANJA (BUDGET SUMMARY WIDGET) */}
              <div className="bg-gradient-to-br from-slate-900 via-[#0f172a] to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl font-bold">
                      🛒
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black tracking-tight text-white">{t('groceries.widget_title')}</h2>
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          {t('groceries.calculator_badge')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{t('groceries.widget_sub')}</p>
                    </div>
                  </div>

                  {/* Month Selector & Progress */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Month Navigator */}
                    <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-xl px-1.5 py-1 gap-1">
                      <button
                        onClick={handlePrevGroceryMonth}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition cursor-pointer"
                        title="Bulan Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-extrabold text-white tracking-tight min-w-[110px] text-center">
                        {formatGroceryMonthDisplay(selectedGroceryMonth, i18n.language)}
                      </span>
                      <button
                        onClick={handleNextGroceryMonth}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition cursor-pointer"
                        title="Bulan Berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {selectedGroceryMonth !== currentMonthKey && (
                      <button
                        onClick={handleCurrentGroceryMonth}
                        className="text-[11px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-xl transition cursor-pointer"
                      >
                        {t('groceries.current_month_btn')}
                      </button>
                    )}

                    <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700 text-xs font-bold text-amber-400">
                      <span>{boughtGroceriesInSelectedMonth.length} / {groceries.length} {t('groceries.purchased_count')} ({shoppingProgress}%)</span>
                    </div>
                  </div>
                </div>

                {/* 3 Metric Cards inside Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 my-2">
                  
                  {/* Card 1: Estimasi Budget Perlu Dibeli */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/5 border border-amber-500/30 space-y-3 shadow-xs transition hover:border-amber-500/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">{t('groceries.card_needed_title')}</span>
                      <span className="text-lg">💵</span>
                    </div>
                    <div className="py-1">
                      <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Rp {estimatedPendingBudget.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <p className="text-xs text-amber-200/80 font-medium">
                      {unboughtGroceries.length} {t('groceries.card_needed_sub')}
                    </p>
                  </div>

                  {/* Card 2: Sudah Dibelanjakan (Realisasi Bulan Terpilih) */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/5 border border-emerald-500/30 space-y-3 shadow-xs transition hover:border-emerald-500/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">{t('groceries.card_realized_title')}</span>
                      <span className="text-lg">✅</span>
                    </div>
                    <div className="py-1">
                      <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Rp {realizedBudget.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <p className="text-xs text-emerald-200/80 font-medium">
                      {boughtGroceriesInSelectedMonth.length} {t('groceries.card_realized_sub')} ({formatGroceryMonthDisplay(selectedGroceryMonth, i18n.language)})
                    </p>
                  </div>

                  {/* Card 3: Total Rencana Budget Keseluruhan & Live Difference */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/5 border border-indigo-500/30 space-y-3 shadow-xs transition hover:border-indigo-500/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{t('groceries.card_total_title')}</span>
                      <span className="text-lg">📊</span>
                    </div>
                    <div className="py-1">
                      <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Rp {totalBudgetPlan.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {monthlySavings > 0 ? (
                        <span className="text-[10px] font-extrabold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          {t('groceries.budget_saved', { amount: monthlySavings.toLocaleString('id-ID') })}
                        </span>
                      ) : monthlySavings < 0 ? (
                        <span className="text-[10px] font-extrabold bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {t('groceries.budget_over', { amount: Math.abs(monthlySavings).toLocaleString('id-ID') })}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">
                          {t('groceries.budget_on_track')}
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Progress Bar */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{t('groceries.completeness_label')}</span>
                    <span className="font-bold text-white">{shoppingProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${shoppingProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Filter Tabs & Shopping Items List */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setGroceryFilter('ALL')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        groceryFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t('groceries.filter_all')} ({groceries.length})
                    </button>
                    <button
                      onClick={() => setGroceryFilter('UNBOUGHT')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        groceryFilter === 'UNBOUGHT'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {t('groceries.filter_unbought')} ({unboughtGroceries.length})
                    </button>
                    <button
                      onClick={() => setGroceryFilter('BOUGHT')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        groceryFilter === 'BOUGHT'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      {t('groceries.filter_bought')} ({boughtGroceriesInSelectedMonth.length})
                    </button>
                  </div>

                  <span className="text-xs text-slate-400 font-medium">
                    {t('groceries.checklist_hint')}
                  </span>
                </div>

                <div className="space-y-3">
                  {filteredGroceries.map((item) => (
                    <div key={item.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition ${
                      item.bought ? 'bg-slate-50/70 border-slate-200/80 opacity-90' : 'bg-white hover:bg-amber-50/30 border-slate-200 shadow-xs'
                    }`}>
                      <input
                        type="checkbox"
                        checked={item.bought}
                        onChange={() => handleToggleGroceryClick(item)}
                        className="w-6 h-6 rounded-lg text-amber-500 focus:ring-amber-400 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-bold ${item.bought ? 'line-through text-slate-400' : 'text-slate-900'}`}>{item.name}</span>
                          {item.quantity && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-800">
                              {item.quantity}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t('dashboard.category_label')}: <span className="font-semibold text-slate-700">{getGroceryCategoryIcon(item.category)} {getLocalizedCategoryName(item.category, 'grocery', i18n.language)}</span>
                          {item.notes ? ` • "${item.notes}"` : ''}
                        </p>
                        {(item.created_by_name || (item.bought && item.bought_by_name)) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {item.created_by_name && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                📝 Dicatat: {item.created_by_name}
                              </span>
                            )}
                            {item.bought && item.bought_by_name && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ✓ Dibeli: {item.bought_by_name}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Harga: Estimasi vs Realisasi */}
                      <div className="text-right">
                        {item.bought ? (
                          <div>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{t('groceries.actual_price')}</p>
                            <p className="text-sm font-black text-emerald-700">
                              Rp {(item.actual_price !== null && item.actual_price !== undefined ? item.actual_price : item.estimated_price || 0).toLocaleString('id-ID')}
                            </p>
                            {item.estimated_price > 0 && (
                              <p className="text-[10px] text-slate-400 line-through">
                                Est: Rp {item.estimated_price.toLocaleString('id-ID')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('groceries.est_price')}</p>
                            <p className="text-sm font-black text-slate-700">
                              {item.estimated_price > 0 
                                ? `Rp ${item.estimated_price.toLocaleString('id-ID')}` 
                                : 'Rp 0'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.bought ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{t('dashboard.status_bought')}</span>
                            </span>
                            <button
                              onClick={() => setItemToChecklist(item)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title={t('groceries.edit_actual_price')}
                            >
                              <DollarSign className="w-4 h-4 text-emerald-600" />
                            </button>
                          </div>
                        ) : item.status === 'OUT_OF_STOCK' ? (
                          <span className="text-xs bg-red-100 text-red-800 font-bold px-3 py-1 rounded-lg">{t('dashboard.status_out_of_stock')}</span>
                        ) : (
                          <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-lg">{t('dashboard.status_low_stock')}</span>
                        )}
                        <button 
                          onClick={() => handleEditGrocery(item)} 
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setGroceries(prev => prev.filter(g => g.id !== item.id))} 
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredGroceries.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      {t('groceries.empty_state')}
                    </div>
                  )}
                </div>

                {/* Optional Helper Banner: Upload Receipt to Expenses Module */}
                <div className="mt-4 bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-slate-50 border border-indigo-100/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/20">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{t('groceries.upload_receipt_shortcut')}</h4>
                      <p className="text-[11px] text-slate-500">{t('groceries.upload_receipt_sub')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleAddClick('expense');
                    }}
                    className="whitespace-nowrap px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-4 h-4 text-indigo-600" />
                    <span>{t('groceries.upload_receipt_shortcut')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: FINANCE */}
          {activeTab === 'finance' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('finance.title')}</h1>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      isPro 
                        ? 'bg-amber-400/20 text-amber-800 border-amber-400/40' 
                        : expenses.length >= (freeLimits?.MAX_EXPENSES_PER_MONTH ?? 15)
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {isPro ? '⭐ PRO UNLIMITED' : `Kapasitas: ${expenses.length} / ${freeLimits?.MAX_EXPENSES_PER_MONTH ?? 15} Catatan`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{t('finance.subtitle')}</p>
                </div>
                <button 
                  onClick={() => handleAddClick('expense')}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> {t('finance.add_expense_btn')}
                </button>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-500 uppercase">{t('finance.card_total_month')}</p>
                  <p className="text-2xl font-black text-slate-900 mt-2">
                    Rp {totalExpenseThisMonth.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    {expensePercentageUsed}% {t('finance.of_budget_ceiling')}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative group">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 uppercase">{t('finance.budget_target')}</p>
                    <button
                      type="button"
                      onClick={() => setIsEditBudgetOpen(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                      title={t('finance.edit_budget_btn') || 'Ubah Plafon'}
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{t('common.edit')}</span>
                    </button>
                  </div>
                  <p className="text-2xl font-black text-indigo-600 mt-2">
                    Rp {budgetCeiling.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {t('finance.remaining_budget')}: Rp {remainingBudgetThisMonth.toLocaleString('id-ID')}
                  </p>
                </div>
                {isPro ? (
                  <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white p-5 rounded-3xl border border-indigo-700/60 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">{t('finance.license_status')}</p>
                      <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                        ⭐ PRO
                      </span>
                    </div>
                    <p className="text-2xl font-black text-amber-300 mt-2">
                      {t('dashboard.unlimited_badge')}
                    </p>
                    <p className="text-xs text-emerald-300 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{t('finance.pro_active_hint')}</span>
                    </p>
                  </div>
                ) : (
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase">{t('finance.free_entry_limit')}</p>
                    <p className="text-2xl font-black text-amber-600 mt-2">
                      {expenses.length} / {getFreeLimit('MAX_EXPENSES_PER_MONTH')} {t('finance.used')}
                    </p>
                    <p className="text-xs text-amber-700 font-medium mt-1">
                      {t('finance.upgrade_pro_hint')}
                    </p>
                  </div>
                )}
              </div>

              {/* MONTHLY EXPENSE COMPARISON CHART */}
              <MonthlyExpenseChart expenses={expenses} budgetLimit={budgetCeiling} onEditBudget={() => setIsEditBudgetOpen(true)} isDemo={isDemoHousehold(activeHouseholdId)} />

              {/* EXPENSE HISTORY LIST */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                    {t('finance.history_title')} ({expenses.length})
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportReport}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ekspor CSV</span>
                    </button>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      {t('finance.sorted_by')}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg shrink-0 mt-0.5">
                          {getExpenseCategoryIcon(exp.category)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{exp.title}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              {getLocalizedCategoryName(exp.category, 'expense', i18n.language)}
                            </span>
                            {exp.receipt_url && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                🧾 {t('finance.receipt_attached')}
                              </span>
                            )}
                          </div>
                          {exp.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {exp.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <span className="text-[11px] text-slate-400">
                              📅 {exp.date} • Dicatat via {exp.source_type || 'MANUAL'}
                            </span>
                            {(exp.recorded_by_name || exp.user_name) && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                                👤 Oleh: {exp.recorded_by_name || exp.user_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <p className="text-sm font-black text-rose-600">
                          - Rp {exp.amount.toLocaleString('id-ID')}
                        </p>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Hapus catatan pengeluaran "${exp.title}"?`)) {
                              setExpenses(prev => prev.filter(e => e.id !== exp.id));
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      {t('finance.empty_state')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('activity.title')}</h1>
                  <p className="text-xs text-slate-500">{t('activity.subtitle')}</p>
                </div>
                <button 
                  onClick={() => handleAddClick('activity')}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {t('activity.add_activity_btn')}
                </button>
              </div>

              {/* View Mode Toggle: All Sessions vs Master Schedules */}
              <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
                <button
                  type="button"
                  onClick={() => setActivityViewMode('ALL_SESSIONS')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                    activityViewMode === 'ALL_SESSIONS'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t('activity.view_all_sessions')}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activityViewMode === 'ALL_SESSIONS' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {filteredActivities.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivityViewMode('MASTER_SCHEDULES')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                    activityViewMode === 'MASTER_SCHEDULES'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{t('activity.view_master_schedules')}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activityViewMode === 'MASTER_SCHEDULES' ? 'bg-purple-900 text-purple-100' : 'bg-purple-200/70 text-purple-800'
                  }`}>
                    {masterActivities.length}
                  </span>
                </button>
              </div>

              {/* TAB 1: ALL SESSIONS CALENDAR VIEW */}
              {activityViewMode === 'ALL_SESSIONS' && (
                <div className="space-y-6">
                  {/* Activity Month Filter Bar */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{t('activity.filter_month_label')}</span>
                      
                      {/* Select Dropdown */}
                      <select
                        value={activityMonthFilter}
                        onChange={(e) => setActivityMonthFilter(e.target.value)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 transition cursor-pointer"
                      >
                        <option value="ALL">🗓️ {t('activity.filter_all_months')}</option>
                        {availableActivityMonths.map((m) => (
                          <option key={m.value} value={m.value}>
                            {i18n.language === 'id' ? m.labelId : m.labelEn} {m.isCurrent ? (i18n.language === 'id' ? '(Bulan Ini)' : '(Current)') : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quick Toggle Shortcuts */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActivityMonthFilter('2026-09')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                          activityMonthFilter === '2026-09'
                            ? 'bg-pink-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{t('activity.filter_this_month')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivityMonthFilter('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          activityMonthFilter === 'ALL'
                            ? 'bg-pink-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{t('activity.filter_all_months')}</span>
                      </button>
                      <span className="text-[11px] font-semibold text-slate-400 ml-1 border-l border-slate-200 pl-2">
                        {filteredActivities.length} {t('activity.active_count')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredActivities.map((act) => {
                      const theme = getActivityTheme(act);
                      const timeParts = (act.time || '').split(/\s*-\s*|\s*s\/d\s*/i);
                      const startTime = timeParts[0] || '';
                      const endTime = timeParts[1] || '';
                      const isToday = (act.date || '').toLowerCase().includes('hari ini') || (act.date || '').toLowerCase().includes('today');

                      return (
                        <div 
                          key={act.id} 
                          className={`bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition group flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden ${theme.hoverBorder}`}
                        >
                          {/* Accent indicator stripe on the left edge */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-full ${theme.accentBorder}`} />

                          <div className="flex items-start sm:items-center gap-4 sm:gap-5 pl-1.5 flex-1 min-w-0">
                            {/* Time & Date Block */}
                            <div className={`min-w-[125px] sm:min-w-[140px] px-3.5 py-3 rounded-2xl border text-center shrink-0 shadow-xs ${theme.timeBlockBg}`}>
                              <span className={`inline-block px-2.5 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider mb-1 shadow-xs ${
                                isToday ? theme.dateBadgeBg : 'bg-slate-800 text-white'
                              }`}>
                                {act.date}
                              </span>
                              {endTime ? (
                                <div className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center justify-center gap-1 whitespace-nowrap">
                                  <span>{startTime}</span>
                                  <span className="text-slate-400 font-bold">–</span>
                                  <span>{endTime}</span>
                                </div>
                              ) : (
                                <div className="text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                                  {startTime}
                                </div>
                              )}
                              <span className="text-[10px] font-bold text-slate-400 block mt-0.5 flex items-center justify-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>WIB</span>
                              </span>
                            </div>

                            {/* Middle Content */}
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {act.is_master && (
                                  <span className="text-[10px] bg-amber-50 text-amber-900 font-black px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 shadow-xs">
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
                                    <span>{t('activity.master_badge')}</span>
                                  </span>
                                )}
                                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${theme.badgeBg}`}>
                                  <span>{theme.icon}</span>
                                  <span>{getLocalizedCategoryName(act.activity_type || act.tag, 'activity', i18n.language) || act.tag || (i18n.language === 'en' ? 'Activity' : 'Aktivitas')}</span>
                                </span>
                                {(act.is_recurring || act.recurrence_group_id) && (
                                  <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1 shadow-xs">
                                    <Repeat className="w-3 h-3 text-purple-600 shrink-0" />
                                    <span>{act.recurrence_summary || t('activity.recurring_badge')}</span>
                                  </span>
                                )}
                                {act.reminder_minutes_before !== undefined && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                                    <Bell className="w-3 h-3 text-slate-500 shrink-0" />
                                    <span>
                                      {act.reminder_minutes_before === 0 
                                        ? (i18n.language === 'id' ? 'Saat Acara' : 'At Event') 
                                        : `Reminder ${act.reminder_minutes_before} mnt`}
                                    </span>
                                  </span>
                                )}
                                {act.created_by_name && (
                                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                                    👤 {act.created_by_name}
                                  </span>
                                )}
                              </div>

                              <h4 className="font-black text-base sm:text-lg text-slate-900 tracking-tight group-hover:text-indigo-600 transition leading-snug">
                                {act.title}
                              </h4>

                              {act.location && (
                                <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span>{act.location}</span>
                                </p>
                              )}

                              {act.notes && (
                                <div className={`text-xs rounded-xl px-3 py-1.5 border inline-flex items-start gap-2 mt-1 max-w-full ${theme.noteBg}`}>
                                  <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
                                  <span className="font-medium italic break-words">"{act.notes}"</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons Box */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
                            <button
                              type="button"
                              onClick={() => handleInitiateEditActivity(act)}
                              className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 transition cursor-pointer shadow-xs bg-white"
                              title={t('common.edit') || 'Edit'}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(act)}
                              className="p-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 transition cursor-pointer shadow-xs bg-white"
                              title={t('common.delete') || 'Hapus'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Empty State when no activities in selected month */}
                    {filteredActivities.length === 0 && (
                      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3 shadow-xs">
                        <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center text-2xl mx-auto shadow-xs">
                          📅
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {t('activity.empty_month_title')}
                        </h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          {t('activity.empty_month_desc')}
                        </p>
                        <div className="pt-2 flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddClick('activity')}
                            className="inline-flex items-center gap-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('activity.add_activity_btn')}</span>
                          </button>
                          {activityMonthFilter !== 'ALL' && (
                            <button
                              type="button"
                              onClick={() => setActivityMonthFilter('ALL')}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                            >
                              {t('activity.filter_all_months')}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: MASTER RECURRING SCHEDULES VIEW */}
              {activityViewMode === 'MASTER_SCHEDULES' && (
                <div className="space-y-4">
                  <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 text-xs text-purple-900 flex items-start gap-3">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900">{t('activity.view_master_schedules')}</h4>
                      <p className="text-slate-600 mt-0.5">{t('activity.master_card_sub')}</p>
                    </div>
                  </div>

                  {masterActivities.map((master) => {
                    const theme = getActivityTheme(master);
                    const timeParts = (master.time || '').split(/\s*-\s*|\s*s\/d\s*/i);
                    const startTime = timeParts[0] || '';
                    const endTime = timeParts[1] || '';

                    return (
                      <div 
                        key={master.id}
                        className="bg-white rounded-3xl border-2 border-purple-200/90 hover:border-purple-400 p-5 shadow-sm hover:shadow-md transition group flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden"
                      >
                        {/* Accent indicator stripe on the left edge */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-full bg-gradient-to-b from-purple-500 to-indigo-600" />

                        <div className="flex items-start sm:items-center gap-4 sm:gap-5 pl-1.5 flex-1 min-w-0">
                          {/* Time & Recurrence Icon Block */}
                          <div className="min-w-[125px] sm:min-w-[140px] px-3.5 py-3 rounded-2xl border border-purple-200 bg-purple-50/50 text-center shrink-0 shadow-xs">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider mb-1 shadow-xs bg-purple-800 text-white">
                              <Repeat className="w-3 h-3" />
                              <span>Rutin</span>
                            </span>
                            {endTime ? (
                              <div className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center justify-center gap-1 whitespace-nowrap">
                                <span>{startTime}</span>
                                <span className="text-slate-400 font-bold">–</span>
                                <span>{endTime}</span>
                              </div>
                            ) : (
                              <div className="text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                                {startTime}
                              </div>
                            )}
                            <span className="text-[10px] font-bold text-purple-600 block mt-0.5">
                              {master.recurrence_type === 'DAILY' ? 'Harian' : master.recurrence_type === 'MONTHLY' ? 'Bulanan' : 'Mingguan'}
                            </span>
                          </div>

                          {/* Middle Content */}
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] bg-amber-50 text-amber-900 font-black px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 shadow-xs">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
                                <span>{t('activity.master_badge')}</span>
                              </span>
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${theme.badgeBg}`}>
                                <span>{theme.icon}</span>
                                <span>{master.tag || 'Aktivitas'}</span>
                              </span>
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1 shadow-xs">
                                <Repeat className="w-3 h-3 text-indigo-600 shrink-0" />
                                <span>{master.total_series_count} {t('activity.master_series_count')}</span>
                              </span>
                            </div>

                            <h4 className="font-black text-base sm:text-lg text-slate-900 tracking-tight group-hover:text-purple-700 transition leading-snug">
                              {master.title}
                            </h4>

                            {master.recurrence_summary && (
                              <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                                <Repeat className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                <span>{master.recurrence_summary}</span>
                              </p>
                            )}

                            {master.location && (
                              <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>{master.location}</span>
                              </p>
                            )}

                            {master.notes && (
                              <div className={`text-xs rounded-xl px-3 py-1.5 border inline-flex items-start gap-2 mt-1 max-w-full ${theme.noteBg}`}>
                                <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
                                <span className="font-medium italic break-words">"{master.notes}"</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Master Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
                          <button
                            type="button"
                            onClick={() => handleEditMasterFromPrompt(master)}
                            className="px-3.5 py-2 rounded-xl text-purple-700 hover:text-white bg-purple-50 hover:bg-purple-700 border border-purple-200 transition cursor-pointer shadow-xs font-bold text-xs flex items-center gap-1.5"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>{t('activity.edit_master_btn')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMasterSeries(master)}
                            className="px-3.5 py-2 rounded-xl text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 transition cursor-pointer shadow-xs font-bold text-xs flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t('activity.delete_master_btn')}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {masterActivities.length === 0 && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3 shadow-xs">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl mx-auto shadow-xs">
                        ⭐
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {t('activity.master_empty_title')}
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        {t('activity.master_empty_desc')}
                      </p>
                      <div className="pt-2 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleAddClick('activity')}
                          className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('activity.add_activity_btn')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Sleek Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c1322]/95 backdrop-blur-md border-t border-slate-800/90 px-1 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-blue-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{t('menu.dashboard')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('utilities')}
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'utilities'
              ? 'text-amber-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{t('menu.utilities')}</span>
          {unpaidBillsCount > 0 && (
            <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse ring-2 ring-[#0c1322]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assets')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'assets'
              ? 'text-emerald-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Snowflake className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{t('menu.assets')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('groceries')}
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'groceries'
              ? 'text-orange-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{t('menu.groceries')}</span>
          {unboughtGroceries.length > 0 && (
            <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-[#0c1322]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('finance')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'finance'
              ? 'text-purple-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{t('menu.finance')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'activity'
              ? 'text-pink-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{t('menu.activity')}</span>
        </button>
      </nav>

      {/* UPGRADE PRO & PAYMENT MODAL */}
      <PaymentModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        household={currentHousehold}
        user={currentUser}
        onUpgradeSuccess={(updatedHh, order) => {
          setHouseholds(prev => prev.map(h => 
            h.id === activeHouseholdId 
              ? { ...h, tier: 'PRO', subscription_tier: 'PRO', subscription_status: 'ACTIVE' } 
              : h
          ));
          if (currentHousehold) {
            currentHousehold.tier = 'PRO';
            currentHousehold.subscription_tier = 'PRO';
          }
          // Record payment order to sync bridge
          if (order) {
            recordUserPaymentOrder({
              ...order,
              household_id: activeHouseholdId,
              household_name: currentHousehold?.name || 'Rumah',
              user_name: currentUser?.name || 'Calvin Tantio',
              user_email: currentUser?.email || 'calvin@homehub.app',
            });
          }
          // Update persistent storage so user stays PRO on page reload
          try {
            const rawStored = localStorage.getItem('homehub_households');
            if (rawStored) {
              const list = JSON.parse(rawStored);
              const updated = list.map(h => 
                h.id === activeHouseholdId 
                  ? { ...h, tier: 'PRO', subscription_tier: 'PRO', subscription_status: 'ACTIVE' } 
                  : h
              );
              localStorage.setItem('homehub_households', JSON.stringify(updated));
            }
          } catch (e) {
            // ignore
          }
        }}
      />

      {/* QUOTA EXCEEDED MODAL (DYNAMIC LIMITS GUARD) */}
      <QuotaExceededModal
        isOpen={Boolean(quotaExceededInfo)}
        onClose={() => setQuotaExceededInfo(null)}
        onUpgrade={() => {
          setQuotaExceededInfo(null);
          setIsProModalOpen(true);
        }}
        quotaInfo={quotaExceededInfo || {}}
      />

      {/* ADD ITEM MODAL */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">
                {t('modals.quick_add_title')} {modalType === 'grocery' ? t('modals.type_grocery') : modalType === 'expense' ? t('modals.type_expense') : modalType === 'bill' ? t('modals.type_bill') : modalType === 'asset' ? t('modals.type_asset') : t('modals.type_activity')}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xl cursor-pointer">&times;</button>
            </div>
            <input
              id="new-item-input"
              type="text"
              placeholder={t('modals.input_placeholder')}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => {
                const val = document.getElementById('new-item-input').value;
                if (!val) return;
                if (modalType === 'grocery') {
                  const maxPantry = freeLimits?.MAX_PANTRY_ITEMS ?? 10;
                  if (!isPro && groceries.length >= maxPantry) {
                    setModalType(null);
                    setQuotaExceededInfo({
                      title: 'Batas Kuota Belanja Tercapai',
                      featureName: 'Daftar Kebutuhan Belanja',
                      current: groceries.length,
                      max: maxPantry,
                      unit: 'item'
                    });
                    return;
                  }
                  setGroceries(prev => [{ id: Date.now(), name: val, category: 'Bumbu Masak', status: 'OUT_OF_STOCK', bought: false }, ...prev]);
                } else if (modalType === 'expense') {
                  const maxExpenses = freeLimits?.MAX_EXPENSES_PER_MONTH ?? 15;
                  if (!isPro && expenses.length >= maxExpenses) {
                    setModalType(null);
                    setQuotaExceededInfo({
                      title: 'Batas Kuota Catatan Pengeluaran Tercapai',
                      featureName: 'Pencatatan Keuangan',
                      current: expenses.length,
                      max: maxExpenses,
                      unit: 'catatan / bulan'
                    });
                    return;
                  }
                  setExpenses(prev => [{ id: Date.now().toString(), title: val, amount: 50000, date: '2026-09-03', category: 'Lainnya' }, ...prev]);
                } else if (modalType === 'asset') {
                  const maxAssets = freeLimits?.MAX_ASSETS ?? 3;
                  if (!isPro && assets.length >= maxAssets) {
                    setModalType(null);
                    setQuotaExceededInfo({
                      title: 'Batas Kuota Aset Tercapai',
                      featureName: 'Inventaris & Kendaraan',
                      current: assets.length,
                      max: maxAssets,
                      unit: 'aset'
                    });
                    return;
                  }
                  setAssets(prev => [{ id: Date.now().toString(), name: val, type: 'ELECTRONIC', category: 'Lainnya', room: 'Ruang Tamu', warranty: '2027-09-01', status: 'ACTIVE' }, ...prev]);
                } else if (modalType === 'bill') {
                  const maxBills = freeLimits?.MAX_BILLS ?? 3;
                  if (!isPro && bills.length >= maxBills) {
                    setModalType(null);
                    setQuotaExceededInfo({
                      title: 'Batas Kuota Tagihan Tercapai',
                      featureName: 'Akun Tagihan Utilitas',
                      current: bills.length,
                      max: maxBills,
                      unit: 'tagihan'
                    });
                    return;
                  }
                  setBills(prev => [{ id: Date.now().toString(), name: val, account: '12345678', amount: 150000, due: '2026-09-25', status: 'UNPAID', category: 'OTHER' }, ...prev]);
                } else if (modalType === 'activity') {
                  setActivities(prev => [{ id: Date.now().toString(), title: val, time: '10:00', date: 'Besok', location: 'Rumah', tag: 'Aktivitas' }, ...prev]);
                }
                setModalType(null);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
            >
              {t('modals.save_data')}
            </button>
          </div>
        </div>
      )}

      {/* DEDICATED COMPREHENSIVE ADD / EDIT UTILITY BILL MODAL */}
      {isAddBillModalOpen && (
        <ModalErrorBoundary name="AddBillModal" title={t('utilities.modal_title_add') || 'Tagihan Utilitas'} onClose={() => setIsAddBillModalOpen(false)}>
          <AddBillModal
            isOpen={isAddBillModalOpen}
            onClose={() => {
              setIsAddBillModalOpen(false);
              setBillToEdit(null);
            }}
            onSaveBill={handleSaveBill}
            billToEdit={billToEdit}
          />
        </ModalErrorBoundary>
      )}

      {/* DEDICATED COMPREHENSIVE ADD / EDIT ASSET MODAL */}
      {isAddAssetModalOpen && (
        <ModalErrorBoundary name="AddAssetModal" title={t('assets.add_asset_btn') || 'Aset & Kendaraan'} onClose={() => setIsAddAssetModalOpen(false)}>
          <AddAssetModal
            isOpen={isAddAssetModalOpen}
            onClose={() => {
              setIsAddAssetModalOpen(false);
              setAssetToEdit(null);
            }}
            onSaveAsset={handleSaveAsset}
            assetToEdit={assetToEdit}
          />
        </ModalErrorBoundary>
      )}

      {/* INVOICE & PROOF OF PURCHASE VIEWER MODAL */}
      {selectedAssetForInvoice && (
        <ModalErrorBoundary name="InvoiceViewerModal" title="Invoice" onClose={() => setSelectedAssetForInvoice(null)}>
          <InvoiceViewerModal
            asset={selectedAssetForInvoice}
            onClose={() => setSelectedAssetForInvoice(null)}
          />
        </ModalErrorBoundary>
      )}

      {/* ASSET MAINTENANCE SCHEDULE & SERVICE LOG MODAL */}
      {selectedAssetForService && (
        <ModalErrorBoundary name="AssetServiceModal" title={t('services.title') || 'Riwayat Servis'} onClose={() => setSelectedAssetForService(null)}>
          <AssetServiceModal
            isOpen={Boolean(selectedAssetForService)}
            asset={selectedAssetForService}
            onClose={() => setSelectedAssetForService(null)}
            schedules={maintenanceSchedules}
            logs={maintenanceLogs}
            onSaveSchedule={handleSaveSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onSaveLog={handleSaveServiceLog}
            onDeleteLog={handleDeleteServiceLog}
          />
        </ModalErrorBoundary>
      )}

      {/* DEDICATED COMPREHENSIVE ADD / EDIT GROCERY MODAL */}
      {isAddGroceryModalOpen && (
        <ModalErrorBoundary name="AddGroceryModal" title={t('groceries.add_grocery_btn') || 'Daftar Belanja'} onClose={() => setIsAddGroceryModalOpen(false)}>
          <AddGroceryModal
            isOpen={isAddGroceryModalOpen}
            onClose={() => {
              setIsAddGroceryModalOpen(false);
              setGroceryToEdit(null);
            }}
            onSaveItem={handleSaveGrocery}
            itemToEdit={groceryToEdit}
            members={householdMembers}
            currentUser={currentUser}
          />
        </ModalErrorBoundary>
      )}

      {/* CHECKLIST BOUGHT REALIZED PRICE CONFIRMATION MODAL */}
      {itemToChecklist && (
        <ModalErrorBoundary name="ChecklistBoughtModal" title={t('groceries.checklist_modal_title') || 'Realisasi Belanja'} onClose={() => setItemToChecklist(null)}>
          <ChecklistBoughtModal
            isOpen={Boolean(itemToChecklist)}
            item={itemToChecklist}
            onClose={() => setItemToChecklist(null)}
            onConfirm={handleConfirmChecklist}
            members={householdMembers}
            currentUser={currentUser}
          />
        </ModalErrorBoundary>
      )}

      {/* DEDICATED COMPREHENSIVE ADD EXPENSE MODAL WITH SMART OCR */}
      {isAddExpenseModalOpen && (
        <ModalErrorBoundary name="AddExpenseModal" title="Catat Pengeluaran" onClose={() => setIsAddExpenseModalOpen(false)}>
          <AddExpenseModal
            isOpen={isAddExpenseModalOpen}
            onClose={() => setIsAddExpenseModalOpen(false)}
            onSaveExpense={handleSaveExpense}
            members={householdMembers}
            currentUser={currentUser}
            isPro={isPro}
            onUpgradePro={() => setIsProModalOpen(true)}
          />
        </ModalErrorBoundary>
      )}

      {/* DEDICATED ADD HOUSEHOLD MODAL */}
      {isAddHouseholdModalOpen && (
        <ModalErrorBoundary name="AddHouseholdModal" title="Tambah Rumah" onClose={() => setIsAddHouseholdModalOpen(false)}>
          <AddHouseholdModal
            isOpen={isAddHouseholdModalOpen}
            onClose={() => setIsAddHouseholdModalOpen(false)}
            onSaveHousehold={handleSaveHousehold}
            isPro={isPro}
          />
        </ModalErrorBoundary>
      )}

      {/* DEDICATED EDIT HOUSEHOLD MODAL */}
      {isEditHouseholdModalOpen && (
        <ModalErrorBoundary name="EditHouseholdModal" title="Ubah Nama Rumah" onClose={() => setIsEditHouseholdModalOpen(false)}>
          <EditHouseholdModal
            isOpen={isEditHouseholdModalOpen}
            onClose={() => setIsEditHouseholdModalOpen(false)}
            household={currentHousehold}
            onSaveHousehold={handleUpdateHousehold}
          />
        </ModalErrorBoundary>
      )}

      {/* DEDICATED MANAGE MEMBERS MODAL */}
      {isManageMembersModalOpen && (
        <ModalErrorBoundary name="ManageMembersModal" title="Kelola Anggota Rumah" onClose={() => setIsManageMembersModalOpen(false)}>
          <ManageMembersModal
            isOpen={isManageMembersModalOpen}
            onClose={() => setIsManageMembersModalOpen(false)}
            household={currentHousehold}
            currentUser={currentUser}
            onMembersUpdated={(mems) => setHouseholdMembers(mems)}
          />
        </ModalErrorBoundary>
      )}

      {/* DEDICATED COMPREHENSIVE ADD / EDIT ACTIVITY MODAL */}
      {isAddActivityModalOpen && (
        <ModalErrorBoundary name="AddActivityModal" title={t('activity.modal_title_add') || 'Agenda Aktivitas'} onClose={() => setIsAddActivityModalOpen(false)}>
          <AddActivityModal
            isOpen={isAddActivityModalOpen}
            onClose={() => {
              setIsAddActivityModalOpen(false);
              setActivityToEdit(null);
              setIsEditingMasterSeries(false);
            }}
            onSaveActivity={handleSaveActivity}
            activityToEdit={activityToEdit}
            isEditingMaster={isEditingMasterSeries}
            members={householdMembers}
            currentUser={currentUser}
          />
        </ModalErrorBoundary>
      )}

      {/* RECURRING ACTIVITY EDIT PROMPT MODAL */}
      {recurringEditPromptTarget && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {t('activity.edit_prompt_title')}
                </h4>
                <p className="text-xs text-slate-500">
                  {recurringEditPromptTarget.title} ({recurringEditPromptTarget.date})
                </p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('activity.edit_prompt_desc')}
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleEditSingleFromPrompt}
                className="w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition cursor-pointer group"
              >
                <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-700">
                  {t('activity.edit_single_option')}
                </div>
                <div className="text-[11px] text-slate-500">
                  {t('activity.edit_single_desc')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleEditMasterFromPrompt(recurringEditPromptTarget)}
                className="w-full text-left p-3.5 rounded-2xl border-2 border-purple-200 bg-purple-50/40 hover:bg-purple-100/70 hover:border-purple-400 transition cursor-pointer group"
              >
                <div className="font-black text-xs text-purple-900 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>{t('activity.edit_master_option')}</span>
                </div>
                <div className="text-[11px] text-purple-700 mt-0.5">
                  {t('activity.edit_master_desc')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRecurringEditPromptTarget(null)}
                className="w-full py-2 text-slate-400 hover:text-slate-600 font-semibold text-xs transition cursor-pointer text-center"
              >
                {t('common.cancel') || 'Batal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECURRING ACTIVITY DELETE CONFIRMATION MODAL */}
      {recurringDeleteTarget && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {t('activity.delete_prompt_title')}
                </h4>
                <p className="text-xs text-slate-500">
                  {recurringDeleteTarget.title} ({recurringDeleteTarget.date})
                </p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              {i18n.language === 'id' 
                ? 'Agenda ini merupakan bagian dari jadwal berulang. Apakah Anda ingin menghapus hanya sesi tanggal ini, atau menghapus seluruh rangkaian jadwal berulang?'
                : 'This event is part of a recurring schedule. Would you like to delete only this session, or all sessions in the recurring series?'}
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={confirmDeleteRecurringSingle}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition cursor-pointer text-center"
              >
                {t('activity.delete_single_btn')}
              </button>
              <button
                type="button"
                onClick={confirmDeleteRecurringSeries}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer text-center"
              >
                {t('activity.delete_series_btn')}
              </button>
              <button
                type="button"
                onClick={() => setRecurringDeleteTarget(null)}
                className="w-full py-2 text-slate-400 hover:text-slate-600 font-semibold text-xs transition cursor-pointer text-center"
              >
                {t('activity.delete_cancel_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BUDGET CEILING MODAL */}
      {isEditBudgetOpen && (
        <ModalErrorBoundary name="EditBudgetModal" title={t('finance.edit_budget_title') || 'Target Plafon Anggaran'} onClose={() => setIsEditBudgetOpen(false)}>
          <EditBudgetModal
            isOpen={isEditBudgetOpen}
            onClose={() => setIsEditBudgetOpen(false)}
            currentBudget={budgetCeiling}
            totalSpent={totalExpenseThisMonth}
            onSave={handleUpdateBudgetCeiling}
          />
        </ModalErrorBoundary>
      )}

    </div>
  );
}
