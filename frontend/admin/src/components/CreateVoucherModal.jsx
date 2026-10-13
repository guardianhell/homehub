import React, { useState } from 'react';
import { 
  X, 
  Ticket, 
  Sparkles, 
  Calendar, 
  Users, 
  Percent, 
  DollarSign, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';

export default function CreateVoucherModal({ 
  isOpen, 
  onClose, 
  onConfirmCreate, 
  currentAdminName = 'Super Admin', 
  currentAdminRole = 'SUPERADMIN' 
}) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE'); // PERCENTAGE or FIXED_AMOUNT
  const [discountValue, setDiscountValue] = useState(25);
  const [targetPlan, setTargetPlan] = useState('ALL'); // ALL, PRO_YEARLY, PRO_MONTHLY
  const [maxQuota, setMaxQuota] = useState(20);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Helper to generate a random catchy voucher code
  const handleGenerateCode = () => {
    const prefixes = ['PROMO', 'HOMEHUB', 'DISKON', 'BERKAH', 'VIP', 'HEMAT'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const val = discountType === 'PERCENTAGE' ? `${discountValue}` : 'POTONGAN';
    const randChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    setCode(`${prefix}${val}-${randChars}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Harap masukkan atau generate kode voucher.');
      return;
    }

    const valNum = Number(discountValue);
    if (!discountValue || isNaN(valNum)) {
      setErrorMsg('Harap masukkan nilai diskon yang valid.');
      return;
    }

    if (discountType === 'PERCENTAGE') {
      if (valNum < 1 || valNum > 100) {
        setErrorMsg('Diskon persentase harus berada di rentang 1% hingga 100%.');
        return;
      }
    } else {
      if (valNum <= 0) {
        setErrorMsg('Nominal diskon tidak boleh Rp 0 atau bernilai negatif.');
        return;
      }
      if (valNum > 10000000) {
        setErrorMsg('Nominal diskon maksimal adalah Rp 10.000.000 (10 juta rupiah).');
        return;
      }
    }

    if (!maxQuota || Number(maxQuota) <= 0) {
      setErrorMsg('Kuota cetak harus minimal 1 pengguna.');
      return;
    }

    setIsSubmitting(true);
    try {
      onConfirmCreate({
        code: cleanCode,
        discountType,
        discountValue: Number(discountValue),
        targetPlan,
        maxQuota: Number(maxQuota),
        validUntil: new Date(validUntil + 'T23:59:59Z').toISOString(),
        description: description.trim() || `Diskon ${discountType === 'PERCENTAGE' ? `${discountValue}%` : `Rp ${Number(discountValue).toLocaleString('id-ID')}`}`,
        adminName: currentAdminName,
        adminRole: currentAdminRole
      });
      // Reset form
      setCode('');
      setDescription('');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal membuat voucher.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Generate Voucher Diskon Membership</h3>
              <p className="text-xs text-slate-400">Terbitkan kupon promo untuk satu kode multi-user</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Voucher Code Input & Generator */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Kode Voucher <span className="text-amber-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Contoh: PROMO50-LEBARAN"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm tracking-wider uppercase focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600"
                required
              />
              <button
                type="button"
                onClick={handleGenerateCode}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                title="Generate kode acak otomatis"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Auto-Code</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Satu kode voucher ini nantinya dapat dipakai dan diklaim oleh beberapa pengguna sesuai kuota cetak.
            </p>
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Jenis Diskon
              </label>
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('PERCENTAGE');
                    if (Number(discountValue) > 100) setDiscountValue(50);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                    discountType === 'PERCENTAGE'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Percent className="w-3 h-3" />
                  <span>Persen (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('FIXED_AMOUNT');
                    setDiscountValue(100000);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                    discountType === 'FIXED_AMOUNT'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3 h-3" />
                  <span>Nominal (Rp)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Besar Potongan <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={discountType === 'PERCENTAGE' ? 100 : 10000000}
                  step={discountType === 'PERCENTAGE' ? 1 : 1000}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'PERCENTAGE' ? '1 - 100' : 'Maks. Rp 10.000.000'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-amber-500 transition"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {discountType === 'PERCENTAGE' ? '%' : 'IDR'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick preset badges & currency preview */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400">Pilihan Cepat:</span>
              {discountType === 'PERCENTAGE' ? (
                [10, 20, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountValue(pct)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                      Number(discountValue) === pct
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {pct === 100 ? '100% (Gratis)' : `${pct}%`}
                  </button>
                ))
              ) : (
                [
                  { label: '50rb', val: 50000 },
                  { label: '100rb', val: 100000 },
                  { label: '250rb', val: 250000 },
                  { label: '500rb', val: 500000 },
                  { label: '1 Juta', val: 1000000 },
                  { label: '10 Juta', val: 10000000 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setDiscountValue(item.val)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                      Number(discountValue) === item.val
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))
              )}
            </div>
            {discountType === 'FIXED_AMOUNT' && Number(discountValue) > 0 && (
              <span className="text-[11px] font-mono font-bold text-amber-400">
                Rp {Number(discountValue).toLocaleString('id-ID')}
              </span>
            )}
          </div>

          {/* Quota Cetak & Target Plan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Kuota Cetak (Batas Klaim) <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={maxQuota}
                  onChange={(e) => setMaxQuota(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-amber-500 transition"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  User
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Kuota berkurang tiap diklaim.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Berlaku Untuk Paket
              </label>
              <select
                value={targetPlan}
                onChange={(e) => setTargetPlan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500 transition cursor-pointer"
              >
                <option value="ALL">Semua Paket PRO (Tahunan & Bulanan)</option>
                <option value="PRO_YEARLY">Khusus PRO Tahunan (Rp 470rb)</option>
                <option value="PRO_MONTHLY">Khusus PRO Bulanan (Rp 49rb)</option>
              </select>
            </div>
          </div>

          {/* Valid Until Date */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Masa Berlaku Voucher (Expired Date) <span className="text-amber-400">*</span>
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500 transition cursor-pointer"
              required
            />
          </div>

          {/* Description & Campaign */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Deskripsi Promo & Catatan Kampanye
            </label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Promo kemitraan properti developer atau promo flash sale akhir tahun..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition resize-none"
            />
          </div>

          {/* Admin Identity Badge */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Pencatat (Generated By):</span>
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{currentAdminName} ({currentAdminRole})</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Memproses...' : 'Terbitkan Voucher'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
