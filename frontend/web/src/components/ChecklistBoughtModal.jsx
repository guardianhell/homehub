import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  CheckCircle2,
  Tag,
  DollarSign,
  Calendar,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react';
import { formatThousands, parseThousands } from '../utils/numberFormatHelper';
import { toInputDateFormat } from '../utils/warrantyHelper';

export default function ChecklistBoughtModal({ isOpen, onClose, item, onConfirm, members = [], currentUser = null }) {
  const { t, i18n } = useTranslation();
  const inputRef = useRef(null);

  const [actualPriceStr, setActualPriceStr] = useState('');
  const [boughtDate, setBoughtDate] = useState('');
  const [boughtByName, setBoughtByName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      // Pre-fill with existing actual_price or estimated_price
      const initialPrice = (item.actual_price !== undefined && item.actual_price !== null)
        ? item.actual_price
        : (item.estimated_price || 0);
      setActualPriceStr(initialPrice > 0 ? initialPrice.toString() : '');

      // Pre-fill date with existing bought_at or today
      const initialDate = item.bought_at
        ? toInputDateFormat(item.bought_at)
        : toInputDateFormat(new Date().toISOString());
      setBoughtDate(initialDate);

      // Pre-fill buyer name
      const defaultBuyer = item.bought_by_name || currentUser?.name || (members && members.length > 0 ? members[0].name : 'Calvin');
      setBoughtByName(defaultBuyer);

      setErrorMsg('');

      // Auto-focus input after modal renders
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const estimated = item.estimated_price || 0;
  const parsedActual = parseThousands(actualPriceStr) || 0;
  const priceDiff = parsedActual - estimated;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parsedActual < 0) {
      setErrorMsg(i18n.language === 'id' ? 'Harga realisasi tidak boleh bernilai negatif.' : 'Actual price cannot be negative.');
      return;
    }

    const finalDate = boughtDate || toInputDateFormat(new Date().toISOString());
    const finalBuyer = boughtByName || currentUser?.name || (members && members.length > 0 ? members[0].name : 'Calvin');
    onConfirm(item.id, parsedActual, finalDate, finalBuyer);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 space-y-5 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {t('groceries.checklist_modal_title')}
              </h2>
              <p className="text-[11px] text-slate-500">
                {t('groceries.checklist_modal_sub')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Item Summary Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {item.category || 'Dapur'}
            </span>
            {item.quantity && (
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                {item.quantity}
              </span>
            )}
          </div>
          <p className="text-base font-extrabold text-slate-900 leading-snug">
            {item.name}
          </p>
          {item.notes && (
            <p className="text-xs text-slate-500 italic">
              "{item.notes}"
            </p>
          )}

          {/* Estimasi Awal Comparison Badge */}
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              {t('groceries.est_label')}:
            </span>
            <span className="font-extrabold text-slate-700">
              Rp {estimated.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Input Harga Realisasi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>{t('groceries.actual_price_label')} *</span>
              {/* Dynamic Live Difference Badge */}
              {estimated > 0 && parsedActual > 0 && (
                priceDiff < 0 ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    {t('groceries.saved_amount')} Rp {Math.abs(priceDiff).toLocaleString('id-ID')}
                  </span>
                ) : priceDiff > 0 ? (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{t('groceries.over_budget')} Rp {priceDiff.toLocaleString('id-ID')}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Minus className="w-3 h-3" />
                    {t('groceries.budget_on_track')}
                  </span>
                )
              )}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={formatThousands(actualPriceStr)}
                onChange={(e) => {
                  const clean = parseThousands(e.target.value);
                  setActualPriceStr(clean !== null ? clean.toString() : '');
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="misal: 38.000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                required
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {i18n.language === 'id' 
                ? 'Ketik nominal belanja riil sesuai struk kasir (sudah otomatis terisi harga estimasi awal).'
                : 'Type actual checkout cost from receipt (prefilled with original estimate).'}
            </p>
          </div>

          {/* Input Tanggal Pembelian */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('groceries.bought_date_label')}
            </label>
            <input
              type="date"
              value={boughtDate}
              onChange={(e) => setBoughtDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              required
            />
          </div>

          {/* Input Dibeli Oleh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>{i18n.language === 'id' ? 'Dibeli Oleh (Anggota Keluarga)' : 'Purchased By'}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {i18n.language === 'id' ? 'Pilih siapa yang belanja' : 'Select buyer'}
              </span>
            </label>
            <select
              value={boughtByName}
              onChange={(e) => setBoughtByName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
            >
              {members && members.length > 0 ? (
                members.map((m) => (
                  <option key={m.id || m.name} value={m.name}>
                    👤 {m.name} ({m.role || 'MEMBER'})
                  </option>
                ))
              ) : (
                <option value={currentUser?.name || 'Calvin'}>
                  👤 {currentUser?.name || 'Calvin'} (OWNER)
                </option>
              )}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('groceries.save_and_mark')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

