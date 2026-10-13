import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Target,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { formatThousands, parseThousands } from '../utils/numberFormatHelper';

const PRESET_BUDGETS = [
  { label: '5 Jt', value: 5000000 },
  { label: '7.5 Jt', value: 7500000 },
  { label: '10 Jt', value: 10000000 },
  { label: '15 Jt', value: 15000000 },
  { label: '20 Jt', value: 20000000 },
  { label: '25 Jt', value: 25000000 }
];

export default function EditBudgetModal({
  isOpen,
  onClose,
  currentBudget = 10000000,
  totalSpent = 0,
  onSave
}) {
  const { t, i18n } = useTranslation();
  const inputRef = useRef(null);

  const [budgetStr, setBudgetStr] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBudgetStr(currentBudget > 0 ? currentBudget.toString() : '');
      setErrorMsg('');
      setIsSaving(false);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, currentBudget]);

  if (!isOpen) return null;

  const parsedBudget = parseThousands(budgetStr) || 0;
  const remainingBudget = Math.max(0, parsedBudget - totalSpent);
  const isOverBudget = parsedBudget > 0 && totalSpent > parsedBudget;
  const percentageUsed = parsedBudget > 0 ? Math.round((totalSpent / parsedBudget) * 100) : 0;

  const handlePresetClick = (val) => {
    setBudgetStr(val.toString());
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parsedBudget <= 0) {
      setErrorMsg(
        i18n.language === 'id'
          ? 'Nominal target plafon anggaran harus lebih dari 0.'
          : 'Budget ceiling amount must be greater than 0.'
      );
      return;
    }

    try {
      setIsSaving(true);
      if (onSave) {
        await onSave(parsedBudget);
      }
      onClose();
    } catch (err) {
      console.error('Save budget ceiling error:', err);
      setErrorMsg(
        err?.message ||
          (i18n.language === 'id'
            ? 'Gagal menyimpan perubahan anggaran.'
            : 'Failed to update budget ceiling.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {t('finance.edit_budget_title')}
              </h2>
              <p className="text-[11px] text-slate-500">
                {t('finance.edit_budget_sub')}
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
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>{t('finance.budget_amount_label')} *</span>
              <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {i18n.language === 'id' ? 'Acuan Bulanan' : 'Monthly Benchmark'}
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                ref={inputRef}
                type="text"
                value={formatThousands(budgetStr)}
                onChange={(e) => {
                  const rawVal = e.target.value.replace(/\D/g, '');
                  setBudgetStr(rawVal);
                  setErrorMsg('');
                }}
                placeholder="10.000.000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-base font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                required
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {t('finance.budget_presets')}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_BUDGETS.map((preset) => {
                const isSelected = parsedBudget === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handlePresetClick(preset.value)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Rp {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Impact Preview */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                {t('finance.card_total_month')}:
              </span>
              <span className="font-extrabold text-slate-700">
                Rp {totalSpent.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                {t('finance.remaining_budget')}:
              </span>
              <span
                className={`font-black ${
                  isOverBudget ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                Rp {remainingBudget.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                {i18n.language === 'id' ? 'Beban Terpakai' : 'Usage Ratio'}:
              </span>
              <span
                className={`font-black px-2 py-0.5 rounded-full text-[11px] ${
                  isOverBudget
                    ? 'bg-rose-100 text-rose-700'
                    : percentageUsed > 80
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {percentageUsed}% {t('finance.of_budget_ceiling')}
              </span>
            </div>

            {isOverBudget && (
              <div className="mt-2 text-[11px] text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200 flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {i18n.language === 'id'
                    ? 'Target baru lebih kecil dari pengeluaran bulan ini. Grafik akan menandai over-budget.'
                    : 'New ceiling is lower than this month expenses. Chart will flag over-budget.'}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

