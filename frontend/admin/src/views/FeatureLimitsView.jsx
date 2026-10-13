import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  Save, 
  Info, 
  Users, 
  Home, 
  Receipt, 
  Car, 
  ShoppingCart, 
  Wallet, 
  FileSpreadsheet, 
  ScanLine,
  Lock,
  Layers,
  Infinity as InfinityIcon
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { hasPermission } from '../utils/rbac';
import { DEFAULT_FEATURE_LIMITS } from '../services/adminData';

const RESOURCE_CONFIGS = [
  {
    key: 'MAX_MEMBERS',
    label: 'Maksimal Anggota Keluarga per Rumah',
    desc: 'Batas jumlah user (Owner, Admin, Member, Helper) yang dapat bergabung dalam 1 rumah tangga.',
    unit: 'Orang / Rumah',
    icon: Users,
    color: 'from-blue-500 to-indigo-600',
    min: 1,
    max: 100
  },
  {
    key: 'MAX_HOUSEHOLDS',
    label: 'Maksimal Properti / Rumah Dikelola',
    desc: 'Batas jumlah rumah atau tenant yang dapat dibuat dan dimiliki oleh satu akun user.',
    unit: 'Rumah / User',
    icon: Home,
    color: 'from-amber-500 to-orange-600',
    min: 1,
    max: 50
  },
  {
    key: 'MAX_BILLS',
    label: 'Maksimal Akun Tagihan & Utilitas Rutin',
    desc: 'Batas pendaftaran akun utilitas bulanan seperti Listrik PLN, Air PDAM, Internet Wifi, dan IPL.',
    unit: 'Akun Tagihan',
    icon: Receipt,
    color: 'from-cyan-500 to-blue-600',
    min: 1,
    max: 100
  },
  {
    key: 'MAX_ASSETS',
    label: 'Maksimal Inventaris & Kendaraan',
    desc: 'Batas inventaris barang berharga, kartu garansi elektronik, dan armada kendaraan.',
    unit: 'Unit Aset',
    icon: Car,
    color: 'from-emerald-500 to-teal-600',
    min: 1,
    max: 100
  },
  {
    key: 'MAX_PANTRY_ITEMS',
    label: 'Maksimal Daftar Kebutuhan Belanja / Dapur',
    desc: 'Batas item kebutuhan dapur dan belanja bulanan yang aktif tercatat di checklist.',
    unit: 'Item Belanja',
    icon: ShoppingCart,
    color: 'from-purple-500 to-pink-600',
    min: 1,
    max: 200
  },
  {
    key: 'MAX_EXPENSES_PER_MONTH',
    label: 'Maksimal Catatan Pengeluaran per Bulan',
    desc: 'Batas frekuensi transaksi pencatatan arus kas keluar yang dapat diinput dalam satu bulan kalender.',
    unit: 'Catatan / Bulan',
    icon: Wallet,
    color: 'from-rose-500 to-pink-600',
    min: 1,
    max: 500
  }
];

const FEATURE_FLAGS = [
  {
    key: 'ALLOW_EXPORT_REPORT',
    label: 'Ekspor Laporan Finansial (Excel & PDF)',
    desc: 'Memberikan akses bagi pengguna untuk mengunduh rekap pengeluaran bulanan dan grafik ke file spreadsheet/dokumen.',
    icon: FileSpreadsheet,
    color: 'text-emerald-400'
  },
  {
    key: 'ALLOW_AI_OCR',
    label: 'AI OCR Scan Struk & Nota Belanja',
    desc: 'Fitur pemindaian foto nota fisik secara otomatis menggunakan Machine Learning OCR untuk pencatatan instan.',
    icon: ScanLine,
    color: 'text-indigo-400'
  }
];

export default function FeatureLimitsView({ 
  currentRole, 
  currentLimits, 
  onSaveLimits,
  onResetLimits 
}) {
  const canManageLimits = hasPermission(currentRole.id, 'manage_limits');

  // Form State
  const [formData, setFormData] = useState(() => {
    const base = currentLimits || DEFAULT_FEATURE_LIMITS;
    return JSON.parse(JSON.stringify(base));
  });

  const [notification, setNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync when currentLimits changes from parent
  useEffect(() => {
    if (currentLimits) {
      setFormData(JSON.parse(JSON.stringify(currentLimits)));
    }
  }, [currentLimits]);

  // Handle Free Tier Resource Limit Change
  const handleFreeChange = (key, val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    setFormData(prev => ({
      ...prev,
      FREE: {
        ...prev.FREE,
        [key]: num
      }
    }));
  };

  // Handle Pro Tier Unlimited Toggle
  const handleProUnlimitedToggle = (key, isUnlimited) => {
    setFormData(prev => ({
      ...prev,
      PRO: {
        ...prev.PRO,
        [key]: isUnlimited ? Infinity : (prev.FREE[key] ? prev.FREE[key] * 5 : 50)
      }
    }));
  };

  // Handle Pro Tier Numeric Change
  const handleProNumericChange = (key, val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    setFormData(prev => ({
      ...prev,
      PRO: {
        ...prev.PRO,
        [key]: num
      }
    }));
  };

  // Handle Feature Flag Toggle
  const handleToggleFlag = (tier, key) => {
    setFormData(prev => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [key]: !prev[tier][key]
      }
    }));
  };

  // Handle Save
  const handleSave = async () => {
    if (!canManageLimits) {
      setNotification({
        type: 'error',
        message: 'Akses ditolak. Anda tidak memiliki izin untuk mengubah konfigurasi limit.'
      });
      return;
    }

    setIsSaving(true);
    try {
      if (onSaveLimits) {
        await onSaveLimits(formData);
      }
      setNotification({
        type: 'success',
        message: 'Konfigurasi batasan fitur Free & PRO berhasil disimpan dan disinkronkan ke server!'
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Gagal menyimpan konfigurasi: ${err.message}`
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Handle Reset
  const handleReset = async () => {
    if (!canManageLimits) return;
    if (window.confirm('Apakah Anda yakin ingin mengembalikan seluruh batasan fitur ke pengaturan default pabrik?')) {
      setIsSaving(true);
      try {
        if (onResetLimits) {
          await onResetLimits();
        }
        setFormData(JSON.parse(JSON.stringify(DEFAULT_FEATURE_LIMITS)));
        setNotification({
          type: 'success',
          message: 'Konfigurasi batasan fitur telah dikembalikan ke nilai default!'
        });
      } catch (err) {
        setNotification({
          type: 'error',
          message: `Gagal mengembalikan default: ${err.message}`
        });
      } finally {
        setIsSaving(false);
        setTimeout(() => setNotification(null), 5000);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              Kontrol Limit & Kuota Fitur (Free vs PRO)
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Dynamic Config Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Atur batas kuota numerik dan hak akses fitur secara dinamis untuk akun Free dan PRO tanpa perlu redeploy aplikasi.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {canManageLimits && (
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Default</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || !canManageLimits}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 ${
              canManageLimits
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan Limit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
            : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Read-Only Notice if not Superadmin */}
      {!canManageLimits && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Mode Hanya Baca: Anda login sebagai <strong>{currentRole.label}</strong>. Hanya peran <strong>Super Admin</strong> yang memiliki otorisasi untuk mengubah konfigurasi limit dan kuota sistem.
          </span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Fitur Terkendali"
          value="8 Item"
          subtitle="6 Kuota Sumber Daya + 2 Fitur"
          icon={Layers}
          color="indigo"
        />
        <StatCard 
          title="Kebijakan Free Tier"
          value="Kapasitas Terbatas"
          subtitle="Mendorong konversi ke paket PRO"
          icon={ShieldCheck}
          color="amber"
        />
        <StatCard 
          title="Kebijakan PRO Tier"
          value="Bebas Kuota (Unlimited)"
          subtitle="Akses premium tanpa pembatasan"
          icon={Sparkles}
          color="emerald"
        />
        <StatCard 
          title="Sinkronisasi Arsitektur"
          value="Realtime Microservices"
          subtitle="Shared Guard di Auth, Asset, & Utility"
          icon={CheckCircle2}
          color="blue"
        />
      </div>

      {/* SECTION 1: BATASAN SUMBER DAYA (RESOURCE QUOTAS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              Batasan Kuota Sumber Daya (Resource Quotas)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Atur angka batas maksimal untuk setiap fitur bagi pengguna berlisensi Free dan PRO.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700/60 self-start sm:self-auto">
            Unit: Dinamis per Item
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {RESOURCE_CONFIGS.map((cfg) => {
            const Icon = cfg.icon;
            const freeVal = formData.FREE[cfg.key] ?? 1;
            const proVal = formData.PRO[cfg.key];
            const isProUnlimited = proVal === Infinity || proVal === null || proVal === 'Infinity';

            return (
              <div 
                key={cfg.key}
                className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700/80 transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Info & Description */}
                  <div className="flex items-start gap-3.5 max-w-xl">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.color} text-white flex items-center justify-center shrink-0 shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{cfg.label}</h4>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/60">
                          {cfg.unit}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {cfg.desc}
                      </p>
                    </div>
                  </div>

                  {/* Right: Inputs for Free & PRO */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
                    
                    {/* Free Tier Setting */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Paket FREE
                        </span>
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                          Maksimal
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={cfg.min}
                          max={cfg.max}
                          value={freeVal}
                          disabled={!canManageLimits}
                          onChange={(e) => handleFreeChange(cfg.key, e.target.value)}
                          className="w-24 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm font-black text-amber-300 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="text-xs text-slate-400 font-medium">
                          {cfg.unit.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Pro Tier Setting */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                          ⭐ Paket PRO
                        </span>
                        <label className="flex items-center gap-1.5 text-[11px] text-emerald-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isProUnlimited}
                            disabled={!canManageLimits}
                            onChange={(e) => handleProUnlimitedToggle(cfg.key, e.target.checked)}
                            className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="font-bold">Unlimited</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        {isProUnlimited ? (
                          <div className="w-full px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                            <InfinityIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Tanpa Batas Kuota</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={cfg.min}
                              max={9999}
                              value={proVal}
                              disabled={!canManageLimits}
                              onChange={(e) => handleProNumericChange(cfg.key, e.target.value)}
                              className="w-24 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm font-black text-emerald-300 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="text-xs text-slate-400 font-medium">
                              {cfg.unit.split(' ')[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: HAK AKSES & FITUR EKSTRA (FEATURE FLAGS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Hak Akses & Fitur Ekstra (Feature Toggles)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nyalakan atau matikan akses fitur lanjutan secara independen untuk paket Free dan PRO.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700/60 self-start sm:self-auto">
            Tipe: Sakelar Biner (On / Off)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURE_FLAGS.map((flag) => {
            const Icon = flag.icon;
            const freeEnabled = Boolean(formData.FREE[flag.key]);
            const proEnabled = Boolean(formData.PRO[flag.key]);

            return (
              <div 
                key={flag.key}
                className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-white shrink-0">
                      <Icon className={`w-5 h-5 ${flag.color}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{flag.label}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                        {flag.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
                  
                  {/* Free Toggle */}
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800/80 px-3 py-2 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400">
                      Paket FREE
                    </span>
                    <button
                      type="button"
                      disabled={!canManageLimits}
                      onClick={() => handleToggleFlag('FREE', flag.key)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed ${
                        freeEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          freeEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Pro Toggle */}
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800/80 px-3 py-2 rounded-xl">
                    <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                      ⭐ PRO
                    </span>
                    <button
                      type="button"
                      disabled={!canManageLimits}
                      onClick={() => handleToggleFlag('PRO', flag.key)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed ${
                        proEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          proEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ARCHITECTURE & AUDIT INFO CARD */}
      <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-indigo-300">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>Mekanisme Penegakan Kuota Terdistribusi</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          Setiap perubahan kuota yang Anda simpan di sini akan langsung disimpan ke persistent disk (`feature-limits.json`) pada server, serta dipropagasikan ke middleware <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">quotaGuard.js</code> di downstream microservices (<span className="text-white">asset-service, utility-service, grocery-service, finance-service, auth-service</span>). Aplikasi client web dan mobile akan secara otomatis menyesuaikan tampilan kapasitas tanpa memerlukan restart server.
        </p>
      </div>

    </div>
  );
}
