import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  ShoppingCart,
  CheckCircle2,
  Tag,
  Package,
  AlertTriangle,
  FileText,
  Trash2
} from 'lucide-react';
import { useGroceryCategories, getCategoryDisplayName } from '../utils/masterCategoriesHelper';

export default function AddGroceryModal({ isOpen, onClose, onSaveItem, itemToEdit = null, members = [], currentUser = null }) {
  const { t, i18n } = useTranslation();
  const { activeCategories: groceryCategories } = useGroceryCategories();

  const defaultAuthor = currentUser?.name || (members && members.length > 0 ? members[0].name : 'Calvin');
  const defaultCategory = groceryCategories[0]?.name || 'Bumbu Masak';

  const [formData, setFormData] = useState({
    name: '',
    category: defaultCategory,
    quantity: '',
    stock_status: 'OUT_OF_STOCK',
    estimated_price: '',
    notes: '',
    created_by_name: defaultAuthor
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const curAuthor = currentUser?.name || (members && members.length > 0 ? members[0].name : 'Calvin');
    if (itemToEdit) {
      setFormData({
        name: itemToEdit.name || '',
        category: itemToEdit.category || 'Bumbu Masak',
        quantity: itemToEdit.quantity || '',
        stock_status: itemToEdit.stock_status || (itemToEdit.status || 'OUT_OF_STOCK'),
        estimated_price: itemToEdit.estimated_price ? itemToEdit.estimated_price.toString() : '',
        notes: itemToEdit.notes || '',
        created_by_name: itemToEdit.created_by_name || curAuthor
      });
    } else {
      setFormData({
        name: '',
        category: 'Bumbu Masak',
        quantity: '1 pcs',
        stock_status: 'OUT_OF_STOCK',
        estimated_price: '',
        notes: '',
        created_by_name: curAuthor
      });
    }
    setErrorMsg('');
  }, [itemToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg(i18n.language === 'id' ? 'Nama barang tidak boleh kosong.' : 'Item name cannot be empty.');
      return;
    }

    const itemPayload = {
      id: itemToEdit ? itemToEdit.id : Date.now(),
      name: formData.name.trim(),
      category: formData.category,
      quantity: formData.quantity.trim() || '1 pcs',
      status: formData.stock_status,
      stock_status: formData.stock_status,
      estimated_price: formData.estimated_price ? parseInt(formData.estimated_price, 10) : 0,
      notes: formData.notes.trim(),
      bought: itemToEdit ? itemToEdit.bought : false,
      created_by_name: formData.created_by_name || defaultAuthor,
      bought_by_name: itemToEdit ? itemToEdit.bought_by_name : null
    };

    onSaveItem(itemPayload, Boolean(itemToEdit));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 space-y-5 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-amber-500/20">
              🛒
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {itemToEdit 
                  ? (i18n.language === 'id' ? 'Edit Catatan Belanja' : 'Edit Shopping Item') 
                  : (i18n.language === 'id' ? 'Tambah ke Daftar Belanja' : 'Add to Shopping List')}
              </h2>
              <p className="text-[11px] text-slate-500">
                {itemToEdit 
                  ? (i18n.language === 'id' ? 'Perbarui takaran, kategori, atau status stok' : 'Update quantity, category, or stock status') 
                  : (i18n.language === 'id' ? 'Catat kebutuhan dapur yang perlu dibeli' : 'Record kitchen supplies that need to be purchased')}
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Nama Barang / Bahan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {i18n.language === 'id' ? 'Nama Barang / Bahan' : 'Item / Ingredient Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={i18n.language === 'id' ? 'misal: Minyak Goreng SunCo 2L, Garam Halus Refill' : 'e.g. Cooking Oil 2L, Table Salt Refill'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              required
            />
          </div>

          {/* Kategori & Jumlah / Takaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {i18n.language === 'id' ? 'Kategori Bahan' : 'Category'}
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition cursor-pointer"
              >
                {groceryCategories.map((cat) => (
                  <option key={cat.code || cat.name} value={cat.name}>
                    {cat.icon} {getCategoryDisplayName(cat, i18n.language)}
                  </option>
                ))}
              </select>

              {/* Quick item suggestions for selected category */}
              {(() => {
                const currentCat = groceryCategories.find(c => c.name === formData.category || c.code === formData.category);
                const itemSug = currentCat?.item_suggestions || currentCat?.metadata?.item_suggestions || [];
                if (!itemSug || itemSug.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {itemSug.slice(0, 4).map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, name: sug }))}
                        className="text-[10px] bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-600 px-2 py-0.5 rounded-md transition cursor-pointer"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {i18n.language === 'id' ? 'Jumlah / Takaran' : 'Quantity'}
              </label>
              <input
                type="text"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder={i18n.language === 'id' ? 'misal: 2 botol, 1 kg, 3 pcs' : 'e.g. 2 bottles, 1 kg, 3 pcs'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>
          </div>

          {/* Estimasi Harga Satuan */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">
                {i18n.language === 'id' ? 'Estimasi Harga per Unit (Rp)' : 'Estimated Price per Unit (Rp)'}
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                {i18n.language === 'id' ? 'Opsional, untuk kalkulasi budget' : 'Optional, for budget estimation'}
              </span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                name="estimated_price"
                value={formData.estimated_price}
                onChange={handleChange}
                placeholder="misal: 36000"
                min="0"
                step="500"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>
          </div>

          {/* Status Ketersediaan Stok */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {i18n.language === 'id' ? 'Kondisi Stok Saat Ini' : 'Current Stock Condition'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  formData.stock_status === 'OUT_OF_STOCK'
                    ? 'bg-red-50 border-red-300 text-red-700 font-bold ring-2 ring-red-400/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="stock_status"
                  value="OUT_OF_STOCK"
                  checked={formData.stock_status === 'OUT_OF_STOCK'}
                  onChange={handleChange}
                  className="hidden"
                />
                <span className="text-base mb-0.5">🚨</span>
                <span className="text-[11px] leading-tight">{i18n.language === 'id' ? 'Habis Total' : 'Out of Stock'}</span>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  formData.stock_status === 'LOW_STOCK'
                    ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold ring-2 ring-amber-400/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="stock_status"
                  value="LOW_STOCK"
                  checked={formData.stock_status === 'LOW_STOCK'}
                  onChange={handleChange}
                  className="hidden"
                />
                <span className="text-base mb-0.5">⚠️</span>
                <span className="text-[11px] leading-tight">{i18n.language === 'id' ? 'Sisa Sedikit' : 'Low Stock'}</span>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  formData.stock_status === 'IN_STOCK'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold ring-2 ring-emerald-400/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="stock_status"
                  value="IN_STOCK"
                  checked={formData.stock_status === 'IN_STOCK'}
                  onChange={handleChange}
                  className="hidden"
                />
                <span className="text-base mb-0.5">✅</span>
                <span className="text-[11px] leading-tight">{i18n.language === 'id' ? 'Masih Ada' : 'In Stock'}</span>
              </label>
            </div>
          </div>

          {/* Dicatat / Diminta Oleh */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>{i18n.language === 'id' ? 'Dicatat / Diminta Oleh' : 'Requested / Added By'}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {i18n.language === 'id' ? 'Anggota keluarga yang mencatat kebutuhan' : 'Family member requesting this item'}
              </span>
            </label>
            <select
              name="created_by_name"
              value={formData.created_by_name}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition cursor-pointer font-medium"
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

          {/* Catatan Tambahan (Notes) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {i18n.language === 'id' ? 'Catatan Belanja / Merek Spesifik' : 'Shopping Notes / Specific Brand'}
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder={i18n.language === 'id' ? 'misal: Cari merek SunCo botol 2L, jangan yang refill' : 'e.g. Brand XYZ 2L bottle, avoid refill pack'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition resize-none"
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold shadow-md shadow-amber-500/20 transition transform active:scale-98 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{itemToEdit ? (i18n.language === 'id' ? 'Simpan Perubahan' : 'Save Changes') : (i18n.language === 'id' ? 'Simpan ke Daftar Belanja' : 'Save to Shopping List')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

