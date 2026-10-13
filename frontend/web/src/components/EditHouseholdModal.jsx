import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Pencil, CheckCircle2, AlertCircle, Home } from 'lucide-react';

const ICONS = ['🏡', '🏖️', '🏢', '🏪', '🏰', '⛰️'];

// Helper to separate leading emoji icon and household name
function parseHouseholdName(rawName) {
  if (!rawName) return { icon: '🏡', cleanName: '' };
  const trimmed = rawName.trim();
  for (const ic of ICONS) {
    if (trimmed.startsWith(ic)) {
      return {
        icon: ic,
        cleanName: trimmed.slice(ic.length).trim(),
      };
    }
  }
  return { icon: '🏡', cleanName: trimmed };
}

export default function EditHouseholdModal({
  isOpen,
  onClose,
  household,
  onSaveHousehold,
}) {
  const { t, i18n } = useTranslation();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏡');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && household) {
      const parsed = parseHouseholdName(household.name || '');
      setIcon(parsed.icon);
      setName(parsed.cleanName);
      setAddress(household.address || '');
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, household]);

  if (!isOpen || !household) return null;

  const currentTier = household.tier || household.subscription_tier || 'FREE';
  const isPro = currentTier === 'PRO';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setErrorMsg(
        t('household.error_empty', 'Nama rumah tidak boleh kosong (minimal 2 karakter).')
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const fullName = `${icon} ${trimmedName}`;
      await onSaveHousehold({
        id: household.id,
        name: fullName,
        address: address.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to update household:', err);
      setErrorMsg(
        err?.message ||
          t('household.error_update', 'Gagal memperbarui informasi rumah tangga.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 space-y-5 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-indigo-500/20">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {t('household.edit_title', 'Ubah Nama Rumah')}
              </h2>
              <p className="text-[11px] text-slate-500">
                {t('household.edit_subtitle', 'Sesuaikan nama rumah tinggal atau properti Anda')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Household Name & Icon */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {t('household.name_label', 'Nama Rumah / Properti')} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                disabled={isSubmitting}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {ICONS.map((ic) => (
                  <option key={ic} value={ic}>
                    {ic}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('household.name_placeholder', 'misal: Rumah Utama Keluarga')}
                disabled={isSubmitting}
                autoFocus
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
            </div>
          </div>

          {/* Optional Short Address */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {t('household.address_label', 'Alamat Singkat / Lokasi (Opsional)')}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('household.address_placeholder', 'misal: Jl. Tebet Barat Dalam No. 12, Jakarta')}
              disabled={isSubmitting}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Current Tier Info */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-indigo-900">
                  {isPro ? 'HomeHub PRO Active ⭐' : 'Paket Standar (FREE)'}
                </p>
                <p className="text-[10px] text-indigo-600">
                  ID Rumah: <span className="font-mono">{household.id}</span>
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
              isPro ? 'bg-amber-400 text-amber-950 font-black' : 'bg-indigo-600 text-white'
            }`}>
              {currentTier}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              {t('common.cancel', 'Batal')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold shadow-md shadow-indigo-600/20 transition transform active:scale-98 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (i18n.language === 'id' ? 'Menyimpan...' : 'Saving...')
                  : t('household.save_btn', 'Simpan Perubahan')}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

