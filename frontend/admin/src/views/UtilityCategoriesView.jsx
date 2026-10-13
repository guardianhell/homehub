import React, { useState } from 'react';
import { 
  Zap, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Power, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  Building2,
  Sparkles,
  Layers,
  Info
} from 'lucide-react';
import { hasPermission } from '../utils/rbac';
import { autoTranslateCategory } from '../utils/categoryTranslator';

const PRESET_ICONS = [
  '⚡', '💧', '🌐', '🏢', '🔥', '📺', 
  '🗑️', '🏛️', '🛡️', '📡', '💡', '🚗', 
  '📱', '🔒', '📦', '🏥', '🎓', '🏋️', 
  '🧹', '🛒', '🚿', '❄️', '🛢️', '📄'
];

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

export default function UtilityCategoriesView({
  categories = [],
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onToggleStatus,
  currentRole
}) {
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
  const [formProviders, setFormProviders] = useState('');
  const [formError, setFormError] = useState('');

  const canManage = hasPermission(currentRole.id, 'manage_vouchers') || currentRole.id === 'SUPERADMIN';

  // Open modal for new category
  const handleOpenCreate = () => {
    setCategoryToEdit(null);
    setFormName('');
    setFormNameEn('');
    setFormCode('');
    setFormIcon('⚡');
    setFormIconUrl('');
    setFormColor('blue');
    setFormProviders('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (cat) => {
    setCategoryToEdit(cat);
    setFormName(cat.name);
    setFormNameEn(cat.name_en || '');
    setFormCode(cat.code);
    setFormIcon(cat.icon || '⚡');
    setFormIconUrl(cat.icon_url || '');
    setFormColor(cat.color || 'blue');
    setFormProviders(Array.isArray(cat.providers) ? cat.providers.join(', ') : '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleNameChange = (val) => {
    setFormName(val);
    if (!categoryToEdit) {
      // Auto-suggest code if creating new
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

    const finalProviders = formProviders
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    try {
      if (categoryToEdit) {
        await onUpdateCategory(categoryToEdit.id, {
          name: formName.trim(),
          name_en: formNameEn.trim() || null,
          icon: formIcon.trim(),
          icon_url: formIconUrl.trim() || null,
          color: formColor,
          providers: finalProviders,
        });
      } else {
        await onCreateCategory({
          code: formCode.trim() || formName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_'),
          name: formName.trim(),
          name_en: formNameEn.trim() || null,
          icon: formIcon.trim(),
          icon_url: formIconUrl.trim() || null,
          color: formColor,
          providers: finalProviders,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan kategori utilitas.');
    }
  };

  const filteredCategories = categories.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (Array.isArray(c.providers) && c.providers.some(p => p.toLowerCase().includes(q)))
    );
  });

  const activeCount = categories.filter(c => c.is_active).length;
  const customCount = categories.filter(c => !c.is_default).length;

  const getColorConfig = (colorId) => {
    return COLOR_THEMES.find(c => c.id === colorId) || COLOR_THEMES[1];
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Kategori</span>
            <p className="text-xl font-black text-white mt-0.5">{categories.length} Jenis</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-lg border border-blue-500/30">
            📑
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Kategori Aktif</span>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{activeCount} Aktif</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg border border-emerald-500/30">
            ✓
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Kategori Kustom</span>
            <p className="text-xl font-black text-indigo-400 mt-0.5">{customCount} Dibuat Admin</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg border border-indigo-500/30">
            ✨
          </span>
        </div>
      </div>

      {/* Control Bar: Search & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama kategori, kode, atau penyedia..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Kategori Baru</span>
          </button>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const colorCfg = getColorConfig(cat.color);
          const providers = Array.isArray(cat.providers) ? cat.providers : [];

          return (
            <div 
              key={cat.id} 
              className={`p-5 rounded-3xl bg-slate-900 border transition hover:border-slate-700 shadow-sm flex flex-col justify-between space-y-4 ${
                !cat.is_active ? 'opacity-60 border-slate-800' : 'border-slate-800'
              }`}
            >
              {/* Card Header: Icon & Name */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-2xl border ${colorCfg.bg} shadow-inner shrink-0`}>
                    {cat.icon || '⚡'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-black text-white">{cat.name}</h4>
                      {cat.is_default && (
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-extrabold border border-slate-700">
                          Bawaan
                        </span>
                      )}
                    </div>
                    {cat.name_en && (
                      <span className="text-[11px] text-slate-400 font-medium italic block mt-0.5">
                        🇬🇧 {cat.name_en}
                      </span>
                    )}
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-wider">
                      {cat.code}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${
                  cat.is_active 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {cat.is_active ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>

              {/* Providers Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Saran Penyedia:
                </span>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {providers.length > 0 ? (
                    providers.map((p, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-800">
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">Belum ada saran penyedia</span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => onToggleStatus(cat.id)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                    cat.is_active
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                  }`}
                  title={cat.is_active ? 'Nonaktifkan kategori' : 'Aktifkan kategori'}
                >
                  <Power className="w-3 h-3" />
                  <span>{cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Ubah Kategori"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {!cat.is_default && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Yakin ingin menghapus kategori "${cat.name}"?`)) {
                          onDeleteCategory(cat.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      title="Hapus Kategori Kustom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-2">
          <span className="text-3xl">🔍</span>
          <h4 className="text-sm font-bold text-white">Tidak ada kategori ditemukan</h4>
          <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian Anda.</p>
        </div>
      )}

      {/* MODAL TAMBAH / UBAH KATEGORI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-slate-100 space-y-5 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  {categoryToEdit ? 'Ubah Kategori Utilitas' : 'Tambah Kategori Utilitas Baru'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Konfigurasikan nama, logo/ikon, dan penyedia yang dapat dipilih pengguna
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Nama Kategori Bilingual */}
              <div className="space-y-3 p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/80">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <span>🇮🇩 Nama Kategori (Bahasa Indonesia)</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Bahasa Utama</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="Contoh: TV Kabel & Streaming, Retribusi Sampah, PBB"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <span>🇬🇧 Nama Kategori (English)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAutoTranslate()}
                      disabled={isTranslating || !formName.trim()}
                      className="text-[10px] font-bold px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg transition flex items-center gap-1 disabled:opacity-40 cursor-pointer"
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
                    placeholder="e.g. Cable TV & Streaming, Waste Collection, Property Tax"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-emerald-100 placeholder:text-slate-500 outline-none focus:border-emerald-500 font-semibold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    💡 Ditampilkan otomatis saat pengguna memilih bahasa English di web / aplikasi.
                  </p>
                </div>
              </div>

              {/* Kode Kategori */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Kode Unik Kategori <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(categoryToEdit?.is_default)}
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                  placeholder="Contoh: TV_CABLE, TRASH_FEE, PROPERTY_TAX"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-amber-400 font-mono font-bold outline-none focus:border-emerald-500 disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Digunakan sebagai kode referensi sistem database.
                </span>
              </div>

              {/* Logo / Ikon Picker */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Pilih Logo / Ikon Kategori <span className="text-rose-400">*</span>
                </label>
                
                {/* Preset Icons Grid */}
                <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-950 rounded-2xl border border-slate-800 max-h-28 overflow-y-auto mb-2">
                  {PRESET_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormIcon(emoji)}
                      className={`h-9 rounded-xl flex items-center justify-center text-lg transition cursor-pointer ${
                        formIcon === emoji
                          ? 'bg-emerald-500 text-white ring-2 ring-emerald-400 scale-105'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 items-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                    {formIcon || '⚡'}
                  </div>
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="Atau ketik/paste emoji kustom di sini..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Tema Warna Badge */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Warna Tema Badge
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setFormColor(theme.id)}
                      className={`p-2 rounded-xl text-[10px] font-extrabold border transition cursor-pointer text-left truncate flex items-center gap-1.5 ${theme.bg} ${
                        formColor === theme.id ? 'ring-2 ring-white scale-102' : 'opacity-70'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
                      <span className="truncate">{theme.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Saran Provider */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Saran Nama Penyedia / Biller (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={formProviders}
                  onChange={(e) => setFormProviders(e.target.value)}
                  placeholder="Contoh: Transvision, IndiHome TV, First Media, MNC Play"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Akan muncul sebagai opsi cepat saat pengguna menambah tagihan baru.
                </span>
              </div>

              {/* Live Preview Card */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pratinjau Tampilan di Aplikasi Pengguna:
                </span>
                <div className="p-3 bg-white rounded-xl text-slate-900 flex items-center gap-3 shadow-xs">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl ${getColorConfig(formColor).previewBg}`}>
                    {formIcon || '⚡'}
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900">{formName || 'Nama Kategori'}</h5>
                    <p className="text-[10px] text-slate-500 font-mono">Kode: {formCode || 'KODE_KATEGORI'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black shadow-md shadow-emerald-500/20 transition cursor-pointer"
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
