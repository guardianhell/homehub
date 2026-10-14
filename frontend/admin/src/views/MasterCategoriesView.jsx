import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Car, 
  ShoppingCart, 
  DollarSign, 
  Calendar, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Power, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  Sparkles, 
  Layers, 
  Info,
  Clock,
  Shield,
  Check
} from 'lucide-react';
import { hasPermission } from '../utils/rbac';
import { MODULE_CATEGORY_REGISTRY } from '../services/adminData';
import { autoTranslateCategory } from '../utils/categoryTranslator';

const MODULE_TABS = [
  { id: 'utility', label: 'Utilitas & Tagihan', icon: Zap, color: 'text-amber-400', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'asset', label: 'Tipe & Kategori Aset', icon: Car, color: 'text-blue-400', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'grocery', label: 'Kategori Belanjaan', icon: ShoppingCart, color: 'text-emerald-400', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'expense', label: 'Kategori Pengeluaran', icon: DollarSign, color: 'text-cyan-400', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { id: 'activity', label: 'Kategori Agenda', icon: Calendar, color: 'text-purple-400', badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
];

const PRESET_ICONS = {
  utility: ['⚡', '💧', '🌐', '🏢', '🔥', '📺', '🗑️', '🏛️', '🛡️', '📡', '💡', '🚗', '📱', '🔒', '📦', '🏥', '🧹', '🚿', '❄️', '🛢️', '📄', '🧾', '⛽', '📻'],
  asset: ['❄️', '🚗', '🛋️', '🏡', '💎', '📦', '💻', '📺', '🏍️', '🚲', '🛴', '🍳', '📱', '📷', '🎧', '⌚', '🔧', '🖨️', '🚜', '⛵', 'Drone', '🛡️', '🎹', '🛏️'],
  grocery: ['🧂', '🌾', '🥦', '🥩', '🧼', '🥛', '🍪', '📦', '🍎', '🥕', '🐟', '🍗', '🥚', '🍞', '🧀', '🧃', '☕', '🧻', '🧴', '🥫', '🍫', '🧊', '🍼', '🐾'],
  expense: ['🛒', '🍳', '⚡', '🚗', '🔧', '📚', '💊', '☕', '📈', '🤲', '📦', '🎓', '🏖️', '✈️', '🎟️', '💻', '👔', '💳', '🎁', '🏦', '🏠', '⛽', '🏥', '🧾'],
  activity: ['🎓', '🌴', '💼', '✉️', '🎂', '⚡', '🩺', '👥', '📌', '🏋️', '🚴', '🎬', '⚽', '🎨', '✈️', '🕌', '⛪', '🏖️', '🍽️', '🧹', '🚗', '📚', '📅', '⏰']
};

const COLOR_THEMES = [
  { id: 'amber', label: 'Amber (Kuning)', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', previewBg: 'bg-amber-100 text-amber-700' },
  { id: 'blue', label: 'Blue (Biru)', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30', previewBg: 'bg-blue-100 text-blue-700' },
  { id: 'purple', label: 'Purple (Ungu)', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30', previewBg: 'bg-purple-100 text-purple-700' },
  { id: 'emerald', label: 'Emerald (Hijau)', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', previewBg: 'bg-emerald-100 text-emerald-700' },
  { id: 'orange', label: 'Orange (Oranye)', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30', previewBg: 'bg-orange-100 text-orange-700' },
  { id: 'rose', label: 'Rose (Merah Muda)', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30', previewBg: 'bg-rose-100 text-rose-700' },
  { id: 'cyan', label: 'Cyan (Toska)', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', previewBg: 'bg-cyan-100 text-cyan-700' },
  { id: 'slate', label: 'Slate (Abu Netral)', bg: 'bg-slate-700/40 text-slate-300 border-slate-600', previewBg: 'bg-slate-100 text-slate-700' },
];

export default function MasterCategoriesView({
  defaultTab = 'utility',
  categoriesByModule = {},
  onGetCategories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onToggleStatus,
  currentRole
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formIcon, setFormIcon] = useState('⚡');
  const [formIconUrl, setFormIconUrl] = useState('');
  const [formColor, setFormColor] = useState('blue');
  const [formCustomExtra, setFormCustomExtra] = useState(''); // providers / subcategories / item_suggestions
  const [formBudget, setFormBudget] = useState('');
  const [formReminder, setFormReminder] = useState('30');
  const [formError, setFormError] = useState('');

  const canManage = hasPermission(currentRole?.id, 'manage_categories') || currentRole?.id === 'SUPERADMIN';

  const currentRegistry = MODULE_CATEGORY_REGISTRY[activeTab] || MODULE_CATEGORY_REGISTRY.utility;
  const currentList = categoriesByModule[activeTab] || (onGetCategories ? onGetCategories(activeTab) : []);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return currentList.filter(cat => {
      const matchSearch = 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.name_en && cat.name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
        cat.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [currentList, searchTerm]);

  // Metrics
  const totalCategories = currentList.length;
  const activeCount = currentList.filter(c => c.is_active).length;
  const defaultCount = currentList.filter(c => c.is_default).length;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchTerm('');
    setIsModalOpen(false);
  };

  const handleOpenCreate = () => {
    const reg = MODULE_CATEGORY_REGISTRY[activeTab];
    setCategoryToEdit(null);
    setFormName('');
    setFormNameEn('');
    setFormCode('');
    setFormIcon(reg?.defaultIcon || '⚡');
    setFormIconUrl('');
    setFormColor('blue');
    setFormCustomExtra('');
    setFormBudget('');
    setFormReminder('30');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setCategoryToEdit(cat);
    setFormName(cat.name);
    setFormNameEn(cat.name_en || cat.metadata?.name_en || '');
    setFormCode(cat.code);
    setFormIcon(cat.icon || '⚡');
    setFormIconUrl(cat.icon_url || '');
    setFormColor(cat.color || 'blue');
    
    // Extract module extra field
    if (activeTab === 'utility') {
      setFormCustomExtra(Array.isArray(cat.providers) ? cat.providers.join(', ') : '');
    } else if (activeTab === 'asset') {
      const subs = cat.subcategories || cat.metadata?.subcategories || [];
      setFormCustomExtra(Array.isArray(subs) ? subs.join(', ') : '');
    } else if (activeTab === 'grocery') {
      const items = cat.item_suggestions || cat.metadata?.item_suggestions || [];
      setFormCustomExtra(Array.isArray(items) ? items.join(', ') : '');
    } else if (activeTab === 'expense') {
      const b = cat.budget || cat.metadata?.budget || '';
      setFormBudget(b ? b.toString() : '');
    } else if (activeTab === 'activity') {
      const rem = cat.reminder || cat.metadata?.reminder || 30;
      setFormReminder(rem.toString());
    }

    setFormError('');
    setIsModalOpen(true);
  };

  const handleNameChange = (val) => {
    setFormName(val);
    if (!categoryToEdit) {
      const auto = val.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');
      setFormCode(auto);
    }
  };

  const handleAutoTranslate = async (overrideText = null) => {
    const source = (overrideText !== null ? overrideText : formName).trim();
    if (!source) return;
    setIsTranslating(true);
    try {
      const translated = await autoTranslateCategory(source);
      if (translated) {
        setFormNameEn(translated);
      }
    } catch (err) {
      console.warn('Auto translation warning:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleNameBlur = () => {
    if (formName.trim() && !formNameEn.trim()) {
      handleAutoTranslate(formName);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama kategori wajib diisi.');
      return;
    }

    const payload = {
      name: formName.trim(),
      name_en: formNameEn.trim() || null,
      code: formCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      icon: formIcon.trim() || currentRegistry.defaultIcon,
      icon_url: formIconUrl.trim() || null,
      color: formColor
    };

    // Parse module-specific extra fields
    const extrasArray = formCustomExtra ? formCustomExtra.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (activeTab === 'utility') {
      payload.providers = extrasArray;
    } else if (activeTab === 'asset') {
      payload.subcategories = extrasArray;
    } else if (activeTab === 'grocery') {
      payload.item_suggestions = extrasArray;
    } else if (activeTab === 'expense') {
      payload.budget = parseInt(formBudget, 10) || 0;
    } else if (activeTab === 'activity') {
      payload.reminder = parseInt(formReminder, 10) || 30;
    }

    try {
      if (categoryToEdit) {
        await onUpdateCategory(activeTab, categoryToEdit.id, payload);
      } else {
        await onCreateCategory(activeTab, payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan kategori.');
    }
  };

  const activeColorTheme = COLOR_THEMES.find(c => c.id === formColor) || COLOR_THEMES[0];
  const presetsForTab = PRESET_ICONS[activeTab] || PRESET_ICONS.utility;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-indigo-500/20">
              🏷️
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Master Data & Kategori
                <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Semua Dinamis
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Kelola kategori untuk Utilitas, Aset, Belanjaan, Pengeluaran, dan Agenda secara dinamis tanpa batasan hardcoded.
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-900/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori {currentRegistry.name.split(' ')[0]}
          </button>
        )}
      </div>

      {/* Module Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {MODULE_TABS.map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-md ring-2 ring-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.color}`} />
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 font-mono text-slate-400">
                {(categoriesByModule[tab.id] || []).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* KPI Cards for Selected Module */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">Total Kategori</p>
            <p className="text-2xl font-black text-white mt-1">{totalCategories}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Modul {currentRegistry.name}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-lg">
            {currentRegistry.icon}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">Kategori Aktif di User</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</p>
            <p className="text-[10px] text-emerald-500/80 mt-0.5">Tampil di aplikasi mobile & web</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">Kategori Bawaan Sistem</p>
            <p className="text-2xl font-black text-indigo-400 mt-1">{defaultCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Kategori standar terproteksi</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder={`Cari kategori ${currentRegistry.name.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 self-end sm:self-auto font-mono">
          <span>Menampilkan {filteredCategories.length} dari {totalCategories} kategori</span>
        </div>
      </div>

      {/* Category Cards Grid */}
      {filteredCategories.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-3">
          <div className="text-4xl">{currentRegistry.icon}</div>
          <p className="text-sm font-bold text-slate-400">Tidak ada kategori yang cocok</p>
          <p className="text-xs max-w-sm mx-auto">
            {searchTerm ? `Tidak ditemukan hasil pencarian untuk "${searchTerm}".` : 'Belum ada kategori yang terdaftar untuk modul ini.'}
          </p>
          {canManage && (
            <button
              onClick={handleOpenCreate}
              className="mt-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer"
            >
              + Tambah Kategori Baru
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const colorTheme = COLOR_THEMES.find(c => c.id === cat.color) || COLOR_THEMES[0];
            const isDefault = Boolean(cat.is_default);
            const isActive = Boolean(cat.is_active);

            // Extract module specific items
            let extraItems = [];
            let extraLabel = '';
            if (activeTab === 'utility') {
              extraItems = cat.providers || [];
              extraLabel = 'Saran Provider';
            } else if (activeTab === 'asset') {
              extraItems = cat.subcategories || cat.metadata?.subcategories || [];
              extraLabel = 'Subkategori';
            } else if (activeTab === 'grocery') {
              extraItems = cat.item_suggestions || cat.metadata?.item_suggestions || [];
              extraLabel = 'Item Populer';
            } else if (activeTab === 'expense') {
              const b = cat.budget || cat.metadata?.budget;
              extraLabel = b ? `Estimasi: Rp ${Number(b).toLocaleString('id-ID')}` : '';
            } else if (activeTab === 'activity') {
              const rem = cat.reminder || cat.metadata?.reminder || 30;
              extraLabel = `Pengingat: ${rem >= 60 ? (rem / 60) + ' jam' : rem + ' menit'}`;
            }

            return (
              <div 
                key={cat.id || cat.code}
                className={`bg-slate-900 border rounded-3xl p-5 transition flex flex-col justify-between gap-4 ${
                  isActive ? 'border-slate-800 hover:border-slate-700' : 'border-slate-900 opacity-60 bg-slate-950/60'
                }`}
              >
                <div>
                  {/* Top Bar: Icon, Name, and Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold border ${colorTheme.bg}`}>
                        {cat.icon_url ? (
                          <img src={cat.icon_url} alt={cat.name} className="w-7 h-7 object-contain" />
                        ) : (
                          <span>{cat.icon || currentRegistry.defaultIcon}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-white tracking-tight leading-tight">
                          {cat.name}
                        </h3>
                        {cat.name_en && (
                          <p className="text-[11px] text-slate-400 font-medium italic mt-0.5 flex items-center gap-1">
                            <span>🇬🇧</span>
                            <span>{cat.name_en}</span>
                          </p>
                        )}
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {cat.code}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isActive ? (
                        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                          Nonaktif
                        </span>
                      )}
                      {isDefault && (
                        <span className="text-[9px] font-medium text-slate-500 font-mono">
                          Bawaan Sistem
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Module Specific Tags / Badges */}
                  {extraItems.length > 0 && (
                    <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800/80">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{extraLabel}</p>
                      <div className="flex flex-wrap gap-1">
                        {extraItems.slice(0, 3).map((item, i) => (
                          <span key={i} className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-lg truncate max-w-[130px]">
                            {item}
                          </span>
                        ))}
                        {extraItems.length > 3 && (
                          <span className="text-[10px] bg-slate-950 text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded-lg">
                            +{extraItems.length - 3} lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {extraLabel && extraItems.length === 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80">
                      <span className="text-[10px] font-bold bg-slate-950 text-indigo-400 border border-indigo-900/40 px-2.5 py-1 rounded-lg inline-block">
                        {extraLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {canManage && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                    <button
                      onClick={() => onToggleStatus(activeTab, cat.id)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      {isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                        title="Edit Kategori"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {!isDefault && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus kategori "${cat.name}" secara permanen?`)) {
                              onDeleteCategory(activeTab, cat.id);
                            }
                          }}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl my-8 space-y-5 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-lg">
                  {currentRegistry.icon}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {categoryToEdit ? `Edit Kategori ${currentRegistry.name}` : `Tambah Kategori ${currentRegistry.name} Baru`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Konfigurasi logo, kode, tema warna, dan opsi bawaan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Row 1: Bilingual Category Names */}
              <div className="space-y-3 p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/80">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-300 flex items-center gap-1.5">
                      <span>🇮🇩 Nama Kategori (Bahasa Indonesia)</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Bahasa Utama</span>
                  </div>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="misal: Furnitur Ruang Tamu, Alat Dapur"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-semibold transition"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-300 flex items-center gap-1.5">
                      <span>🇬🇧 Nama Kategori (English)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAutoTranslate()}
                      disabled={isTranslating || !formName.trim()}
                      className="text-[10px] font-bold px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg transition flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                      title="Terjemahkan otomatis dari nama Bahasa Indonesia"
                    >
                      <Sparkles className={`w-3 h-3 ${isTranslating ? 'animate-spin' : ''}`} />
                      <span>{isTranslating ? 'Menerjemahkan...' : '⚡ Auto-Translate'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    placeholder="e.g. Living Room Furniture, Kitchen Tools"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-indigo-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    💡 Ditampilkan otomatis saat pengguna memilih bahasa English di web / aplikasi.
                  </p>
                </div>
              </div>

              {/* Unique Code */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Kode Unik Sistem <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'))}
                  placeholder="misal: LIVING_ROOM_FURNITURE"
                  disabled={Boolean(categoryToEdit)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
                  required
                />
              </div>

              {/* Row 2: Emoji Picker (Preset & Custom) */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  Pilih Logo / Ikon (Emoji) <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 p-2 bg-slate-950 rounded-2xl border border-slate-800 max-h-28 overflow-y-auto custom-scroll mb-2">
                  {presetsForTab.map((emoji, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormIcon(emoji)}
                      className={`p-1.5 rounded-xl text-lg flex items-center justify-center transition cursor-pointer ${
                        formIcon === emoji
                          ? 'bg-indigo-600 text-white shadow-md scale-110'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Ikon Terpilih:</span>
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-14 text-center bg-slate-950 border border-slate-800 rounded-xl py-1 text-lg font-bold text-white focus:outline-none focus:border-indigo-500"
                    placeholder="⚡"
                  />
                  <span className="text-[11px] text-slate-500">Ketik karakter emoji atau simbol apa pun</span>
                </div>
              </div>

              {/* Row 3: Color Theme Selector */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  Tema Warna Badge
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                  {COLOR_THEMES.map((theme) => {
                    const isSelected = formColor === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setFormColor(theme.id)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border-indigo-500 text-white font-bold ring-2 ring-indigo-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${theme.bg}`}></span>
                        <span className="text-[10px] truncate">{theme.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 4: Module-Specific Configuration */}
              {activeTab === 'utility' && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Saran Penyedia Layanan / Vendor (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={formCustomExtra}
                    onChange={(e) => setFormCustomExtra(e.target.value)}
                    placeholder="misal: PLN Pascabayar, PLN Prabayar (Token)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Opsi ini akan otomatis muncul sebagai tombol saran cepat saat pengguna membuat tagihan baru.
                  </p>
                </div>
              )}

              {activeTab === 'asset' && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Saran Subkategori Aset (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={formCustomExtra}
                    onChange={(e) => setFormCustomExtra(e.target.value)}
                    placeholder="misal: AC, Kulkas, Smart TV, Mesin Cuci"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Daftar subkategori rekomendasi untuk mempermudah anggota keluarga saat mendaftarkan barang.
                  </p>
                </div>
              )}

              {activeTab === 'grocery' && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Saran Item Belanjaan Populer (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={formCustomExtra}
                    onChange={(e) => setFormCustomExtra(e.target.value)}
                    placeholder="misal: Bawang Merah, Bawang Putih, Garam Dapur, Minyak Goreng"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              )}

              {activeTab === 'expense' && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Estimasi / Rekomendasi Budget Bulanan (Rp)
                  </label>
                  <input
                    type="number"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    placeholder="misal: 1500000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              )}

              {activeTab === 'activity' && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Waktu Pengingat Default (Menit Sebelum Acara)
                  </label>
                  <select
                    value={formReminder}
                    onChange={(e) => setFormReminder(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="15">15 Menit Sebelumnya</option>
                    <option value="30">30 Menit Sebelumnya</option>
                    <option value="60">1 Jam Sebelumnya</option>
                    <option value="120">2 Jam Sebelumnya</option>
                    <option value="1440">1 Hari Sebelumnya (24 Jam)</option>
                  </select>
                </div>
              )}

              {/* Live Preview Card */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border ${activeColorTheme.bg}`}>
                    {formIcon || currentRegistry.defaultIcon}
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-white">{formName || 'Nama Kategori'}</p>
                    <p className="text-[10px] font-mono text-slate-400">{formCode || 'KODE_KATEGORI'}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Live Preview
                </span>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition shadow-lg shadow-emerald-900/30"
                >
                  {categoryToEdit ? 'Simpan Perubahan' : 'Buat Kategori'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
