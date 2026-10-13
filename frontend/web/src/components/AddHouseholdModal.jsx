import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Home, CheckCircle2, AlertCircle } from 'lucide-react';

const ICONS = ['🏡', '🏖️', '🏢', '🏪', '🏰', '⛰️'];

export default function AddHouseholdModal({ isOpen, onClose, onSaveHousehold, isPro = true }) {
  const { t, i18n } = useTranslation();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏡');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg(i18n.language === 'id' ? 'Nama rumah atau properti wajib diisi.' : 'Household name is required.');
      return;
    }

    const newHousehold = {
      id: 'hh_' + Date.now(),
      name: `${icon} ${name.trim()}`,
      tier: isPro ? 'PRO' : 'FREE',
      role: 'OWNER',
      address: address.trim() || undefined
    };

    onSaveHousehold(newHousehold);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 space-y-5 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-indigo-500/20">
              🏠
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {i18n.language === 'id' ? 'Tambah Rumah Baru' : 'Add New Household'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {i18n.language === 'id' ? 'Kelola beberapa rumah tinggal & villa dalam satu akun' : 'Manage multiple households & villas in one account'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Household Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {i18n.language === 'id' ? 'Nama Rumah / Properti' : 'Household / Property Name'} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {ICONS.map((ic) => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={i18n.language === 'id' ? 'misal: Villa Puncak Indah, Apartemen Sudirman' : 'e.g. Hilltop Villa, City Apartment'}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
            </div>
          </div>

          {/* Optional Short Address */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {i18n.language === 'id' ? 'Alamat Singkat / Lokasi (Opsional)' : 'Short Address / Location (Optional)'}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={i18n.language === 'id' ? 'misal: Jl. Raya Puncak KM 82, Bogor' : 'e.g. 123 Pine St, City'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>


          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold shadow-md shadow-indigo-600/20 transition transform active:scale-98 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{i18n.language === 'id' ? 'Simpan Rumah Baru' : 'Save Household'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

