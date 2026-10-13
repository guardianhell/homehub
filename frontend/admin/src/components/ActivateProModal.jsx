import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  CreditCard, 
  Calendar, 
  FileText,
  Clock
} from 'lucide-react';

export default function ActivateProModal({ 
  isOpen, 
  onClose, 
  tenants = [], 
  selectedTenant = null, 
  onConfirmActivation,
  currentAdminName = 'Admin BackOffice',
  currentAdminRole = 'HELPDESK'
}) {
  const [targetHouseholdId, setTargetHouseholdId] = useState(() => {
    return selectedTenant ? selectedTenant.id : (tenants[0]?.id || '');
  });
  const [durationMonths, setDurationMonths] = useState(12);
  const [planType, setPlanType] = useState('PRO_YEARLY');
  const [reason, setReason] = useState('Verifikasi Transfer Manual Rekening BCA');
  const [paymentRef, setPaymentRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentTenantObj = tenants.find(t => t.id === targetHouseholdId) || selectedTenant;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!targetHouseholdId) {
      setErrorMsg('Pilih rumah / tenant yang akan diaktifkan.');
      return;
    }

    setIsSubmitting(true);
    try {
      onConfirmActivation({
        householdId: targetHouseholdId,
        durationMonths: Number(durationMonths),
        planType,
        reason: reason.trim() || 'Aktivasi Manual BackOffice',
        paymentRef: paymentRef.trim() || `TRF-MANUAL-${Date.now().toString().slice(-6)}`,
        adminName: currentAdminName,
        adminRole: currentAdminRole
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal melakukan aktivasi PRO.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-amber-500/20">
              ⚡
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>Aktivasi PRO Manual (Troubleshooting)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Aktivasi hak akses berbayar & bypass mekanisme gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Target Tenant Selector */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Pilih Tenant / Rumah Sasaran <span className="text-rose-500">*</span>
            </label>
            <select
              value={targetHouseholdId}
              onChange={(e) => setTargetHouseholdId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  🏠 {t.name} — Pemilik: {t.owner_name} ({t.subscription_tier})
                </option>
              ))}
            </select>
            {currentTenantObj && (
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <span>Status Saat Ini:</span>
                <span className={`font-bold ${currentTenantObj.subscription_tier === 'PRO' ? 'text-amber-400' : 'text-slate-300'}`}>
                  {currentTenantObj.subscription_tier}
                </span>
                {currentTenantObj.pro_valid_until && (
                  <span>(Berlaku s/d {new Date(currentTenantObj.pro_valid_until).toLocaleDateString('id-ID')})</span>
                )}
              </p>
            )}
          </div>

          {/* Durasi & Paket */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Pilihan Durasi Masa Aktif
              </label>
              <select
                value={durationMonths}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDurationMonths(val);
                  setPlanType(val >= 12 ? 'PRO_YEARLY' : 'PRO_MONTHLY');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
              >
                <option value={1}>1 Bulan (Trial / Bulanan)</option>
                <option value={3}>3 Bulan (Kuartal)</option>
                <option value={6}>6 Bulan (Semester)</option>
                <option value={12}>12 Bulan (1 Tahun Penuh)</option>
                <option value={24}>24 Bulan (2 Tahun Promo)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Tipe Paket
              </label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
              >
                <option value="PRO_YEARLY">PRO Tahunan (Rp 470.000)</option>
                <option value="PRO_MONTHLY">PRO Bulanan (Rp 49.000)</option>
              </select>
            </div>
          </div>

          {/* Nomor Bukti Transfer / Referensi */}
          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span>Nomor Referensi Pembayaran / Resi</span>
              <span className="text-[10px] text-slate-400 font-normal">Wajib untuk audit keuangan</span>
            </label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="misal: BCA-TRF-9821873 / MANUAL-KASIR-01"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          {/* Alasan Aktivasi Manual */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Alasan Aktivasi Manual / Catatan Troubleshooting
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="misal: Pelanggan transfer langsung ke rekening PT HomeHub Indonesia, telah diverifikasi mutasi bank."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-sans"
            />
          </div>

          {/* Petugas Pelaksana */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400">Petugas Yang Mengeksekusi:</p>
              <p className="text-xs font-bold text-slate-200">{currentAdminName}</p>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {currentAdminRole}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi & Aktifkan PRO'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
