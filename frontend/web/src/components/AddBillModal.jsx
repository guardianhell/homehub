import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Calendar,
  DollarSign,
  Hash,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  useUtilityCategories,
  CATEGORY_COLOR_STYLES,
  getCategoryDisplayName
} from '../utils/utilityCategoriesHelper';

export default function AddBillModal({ isOpen, onClose, onSaveBill, billToEdit = null }) {
  const { t, i18n } = useTranslation();
  const { categories } = useUtilityCategories();

  // Active categories only
  const activeCategories = (categories && categories.length > 0)
    ? categories.filter(c => c.is_active !== false)
    : [];

  const defaultCategoryCode = activeCategories[0]?.code || 'ELECTRICITY';
  const defaultProvider = activeCategories[0]?.providers?.[0] || 'PLN Pascabayar';

  const [formData, setFormData] = useState({
    category_code: defaultCategoryCode,
    account_name: '',
    provider_name: defaultProvider,
    customer_number: '',
    default_due_day: 20,
    amount: '',
    billing_period: new Date().toISOString().slice(0, 7), // 'YYYY-MM'
    notes: ''
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Format currency numbers with dots as thousand separator
  const formatCurrencySeparator = (val) => {
    if (!val) return '';
    const cleanNum = val.toString().replace(/\D/g, '');
    if (!cleanNum) return '';
    return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Populate form if editing
  useEffect(() => {
    if (billToEdit) {
      setFormData({
        category_code: billToEdit.category || billToEdit.category_code || defaultCategoryCode,
        account_name: billToEdit.name || billToEdit.account_name || '',
        provider_name: billToEdit.provider_name || (billToEdit.name ? billToEdit.name.split(' - ')[0] : defaultProvider),
        customer_number: billToEdit.account || billToEdit.customer_number || '',
        default_due_day: billToEdit.default_due_day || (billToEdit.due ? (parseInt(billToEdit.due.split('-')?.[2], 10) || 20) : 20),
        amount: billToEdit.amount ? formatCurrencySeparator(billToEdit.amount) : '',
        billing_period: billToEdit.billing_period || new Date().toISOString().slice(0, 7),
        notes: billToEdit.notes || ''
      });
    } else {
      setFormData({
        category_code: defaultCategoryCode,
        account_name: '',
        provider_name: defaultProvider,
        customer_number: '',
        default_due_day: 20,
        amount: '',
        billing_period: new Date().toISOString().slice(0, 7),
        notes: ''
      });
    }
    setErrorMsg('');
  }, [billToEdit, isOpen, activeCategories.length]);

  const handleCategoryChange = (code) => {
    const matchedCategory = activeCategories.find(c => c.code.toUpperCase() === (code || '').toUpperCase());
    const matchedProvider = matchedCategory?.providers?.[0] || '';
    setFormData(prev => ({
      ...prev,
      category_code: code,
      provider_name: matchedProvider || prev.provider_name
    }));
  };

  const handleAmountChange = (e) => {
    const rawVal = String(e?.target?.value || '').replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      amount: formatCurrencySeparator(rawVal)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');

    try {
      const accName = (formData.account_name || '').trim();
      const provName = (formData.provider_name || '').trim();
      const custNo = (formData.customer_number || '').trim();

      if (!accName) {
        setErrorMsg(i18n.language === 'id' ? 'Nama akun tagihan wajib diisi.' : 'Account name is required.');
        return;
      }

      if (!provName) {
        setErrorMsg(i18n.language === 'id' ? 'Nama penyedia layanan / vendor wajib diisi.' : 'Provider name is required.');
        return;
      }

      if (!custNo) {
        setErrorMsg(i18n.language === 'id' ? 'Nomor pelanggan / ID meter wajib diisi.' : 'Customer / meter number is required.');
        return;
      }

      const cleanAmount = parseInt(String(formData.amount || '').replace(/\D/g, ''), 10) || 0;
      if (cleanAmount <= 0) {
        setErrorMsg(i18n.language === 'id' ? 'Nominal tagihan harus lebih besar dari 0.' : 'Bill amount must be greater than 0.');
        return;
      }

      const dueDay = parseInt(formData.default_due_day, 10) || 20;
      const dueDayPadded = String(dueDay).padStart(2, '0');
      const period = formData.billing_period || new Date().toISOString().slice(0, 7);
      const dueDate = `${period}-${dueDayPadded}`;

      const chosenCat = activeCategories.find(c => c.code.toUpperCase() === (formData.category_code || '').toUpperCase());
      const savedBill = {
        id: billToEdit ? billToEdit.id : 'b_' + Date.now(),
        name: accName,
        account_name: accName,
        provider_name: provName,
        category: formData.category_code || defaultCategoryCode,
        category_code: formData.category_code || defaultCategoryCode,
        category_name: chosenCat?.name || formData.category_code,
        category_name_en: chosenCat?.name_en || chosenCat?.name || formData.category_code,
        category_icon: chosenCat?.icon || '📄',
        category_color: chosenCat?.color || 'blue',
        account: custNo,
        customer_number: custNo,
        default_due_day: dueDay,
        amount: cleanAmount,
        due: dueDate,
        billing_period: period,
        status: billToEdit?.status || 'UNPAID',
        notes: (formData.notes || '').trim()
      };

      onSaveBill(savedBill, Boolean(billToEdit));
      onClose();
    } catch (err) {
      console.error('[AddBillModal handleSubmit error]:', err);
      setErrorMsg(err.message || 'Gagal menyimpan akun tagihan.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-5 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-indigo-500/20">
              ⚡
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {billToEdit ? t('utilities.modal_title_edit') : t('utilities.modal_title_add')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('utilities.modal_subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl transition cursor-pointer"
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
          
          {/* 1. Category Code Selector (Dynamic from Admin) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold text-slate-700">
                {t('utilities.category_label')} <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                {activeCategories.length} {i18n.language === 'id' ? 'kategori tersedia' : 'categories available'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {activeCategories.map((cat) => {
                const isSelected = formData.category_code === cat.code;
                const styleConfig = CATEGORY_COLOR_STYLES[cat.color] || CATEGORY_COLOR_STYLES.blue;
                return (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => handleCategoryChange(cat.code)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base ${styleConfig.iconBg}`}>
                      {cat.icon_url ? (
                        <img src={cat.icon_url} alt={cat.name} className="w-5 h-5 object-contain" />
                      ) : (
                        <span>{cat.icon || '📄'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] leading-tight font-bold block truncate">{getCategoryDisplayName(cat, i18n.language)}</span>
                      <span className="text-[9px] text-slate-400 font-mono uppercase block">{cat.code}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Nama Akun Tagihan & Provider Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {t('utilities.account_name_label')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="account_name"
                value={formData.account_name}
                onChange={handleChange}
                placeholder={t('utilities.account_name_placeholder')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {t('utilities.provider_label')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="provider_name"
                value={formData.provider_name}
                onChange={handleChange}
                placeholder={t('utilities.provider_placeholder')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
              
              {/* Quick provider suggestions */}
              {(() => {
                const currentCat = activeCategories.find(c => c.code.toUpperCase() === (formData.category_code || '').toUpperCase());
                const providers = currentCat?.providers || [];
                if (!providers || providers.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {providers.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, provider_name: sug }))}
                        className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 px-2 py-0.5 rounded-md transition cursor-pointer"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 3. Nomor Pelanggan / ID Meter & Tanggal Jatuh Tempo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {t('utilities.customer_no_label')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  name="customer_number"
                  value={formData.customer_number}
                  onChange={handleChange}
                  placeholder={t('utilities.customer_no_placeholder')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">
                  {t('utilities.due_day_label')}
                </label>
                <span className="text-[10px] text-slate-400">1 - 31</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                </span>
                <select
                  name="default_due_day"
                  value={formData.default_due_day}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {i18n.language === 'id' ? `Tiap Tanggal ${day}` : `Every Day ${day}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 4. Nominal Tagihan Bulan Ini (Rp) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">
                {t('utilities.amount_label')} <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-indigo-600 font-medium">
                {formData.amount ? `Rp ${formData.amount}` : ''}
              </span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                name="amount"
                value={formData.amount}
                onChange={handleAmountChange}
                placeholder={t('utilities.amount_placeholder')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition tracking-wide"
                required
              />
            </div>
          </div>

          {/* 5. Catatan Tambahan (Notes) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {t('utilities.notes_label')}
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder={t('utilities.notes_placeholder')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold shadow-md shadow-indigo-600/20 transition transform active:scale-98 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{billToEdit ? t('utilities.save_changes_btn') : t('utilities.save_account_btn')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
