import React, { useState } from 'react';
import { 
  X, 
  Ticket, 
  Copy, 
  Check, 
  Printer, 
  Users, 
  Calendar, 
  Percent, 
  Sparkles, 
  Clock, 
  Home, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Send
} from 'lucide-react';
import { hasPermission } from '../utils/rbac';

export default function VoucherDetailModal({ 
  isOpen, 
  onClose, 
  voucher, 
  members = [], 
  tenants = [], 
  onClaimVoucher, 
  onToggleStatus, 
  currentRole 
}) {
  const [copied, setCopied] = useState(false);
  const [isSimulatingClaim, setIsSimulatingClaim] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState('');
  const [claimPlan, setClaimPlan] = useState('PRO_YEARLY');
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');

  if (!isOpen || !voucher) return null;

  const canManageVouchers = hasPermission(currentRole.id, 'manage_vouchers');
  const isPercentage = voucher.discount_type === 'PERCENTAGE';
  const remainingQuota = Math.max(0, voucher.max_quota - voucher.claimed_count);
  const quotaPercent = Math.min(100, Math.round((voucher.claimed_count / voucher.max_quota) * 100));

  const handleCopyCode = () => {
    navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSimulateClaim = (e) => {
    e.preventDefault();
    setClaimError('');
    setClaimSuccess('');

    if (!selectedUserId) {
      setClaimError('Pilih pengguna yang akan mengklaim voucher.');
      return;
    }

    const member = members.find(m => m.id === selectedUserId);
    if (!member) {
      setClaimError('Data anggota tidak valid.');
      return;
    }

    const household = tenants.find(t => t.id === selectedHouseholdId) || tenants.find(t => t.owner_id === member.id) || tenants[0];

    try {
      onClaimVoucher({
        voucherCode: voucher.code,
        userId: member.id,
        userName: member.name,
        userEmail: member.email,
        householdId: household ? household.id : null,
        householdName: household ? household.name : 'Rumah Keluarga',
        appliedPlan: claimPlan,
        adminName: currentRole.label,
        adminRole: currentRole.id
      });
      setClaimSuccess(`Voucher ${voucher.code} berhasil diklaim untuk ${member.name}! Kuota berkurang.`);
      setSelectedUserId('');
    } catch (err) {
      setClaimError(err.message || 'Gagal klaim voucher.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Detail Voucher Diskon</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  voucher.status === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : voucher.status === 'EXHAUSTED'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {voucher.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">ID: {voucher.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Cetak voucher fisik / PDF"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Cetak Slip</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Printable Voucher Ticket Card */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-slate-950 shadow-xl overflow-hidden border-2 border-dashed border-amber-300/60 print:m-0 print:border-black">
            
            {/* Cutout notches */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900"></div>
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900/80">
                  <span>🛡️ HomeHub Pro Membership</span>
                  <span>•</span>
                  <span>Official Voucher</span>
                </div>
                <div className="text-3xl font-black text-slate-950 mt-1 tracking-tight">
                  {isPercentage ? `${voucher.discount_value}% OFF` : `POTONGAN Rp ${Number(voucher.discount_value).toLocaleString('id-ID')}`}
                </div>
                <p className="text-xs font-semibold text-slate-900/90 mt-1 max-w-sm">
                  {voucher.description}
                </p>
              </div>

              {/* Code Box */}
              <div className="bg-slate-950 text-white p-3.5 rounded-xl text-center border border-amber-400/30 flex flex-col items-center justify-center min-w-[170px] shadow-md">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">KODE KUPON PROMO</span>
                <span className="text-lg font-mono font-black text-white tracking-widest my-1">{voucher.code}</span>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] flex items-center gap-1 transition cursor-pointer w-full justify-center"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-800" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>
            </div>

            {/* Ticket Footer */}
            <div className="mt-4 pt-3 border-t border-slate-900/20 flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-900">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Berlaku s/d: {new Date(voucher.valid_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </span>
              <span>Paket: {voucher.target_plan === 'ALL' ? 'Semua PRO' : voucher.target_plan}</span>
              <span>Multi-User Kuota: {voucher.max_quota} Pengguna</span>
            </div>
          </div>

          {/* Quota & Generation Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Quota Progress */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Penggunaan Kuota Klaim:</span>
                <span className="font-mono font-bold text-amber-400">
                  {voucher.claimed_count} / {voucher.max_quota} Klaim
                </span>
              </div>
              
              {/* Bar */}
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    quotaPercent >= 100 
                      ? 'bg-rose-500' 
                      : quotaPercent > 70 
                      ? 'bg-amber-500' 
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${quotaPercent}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Sisa Kuota: <strong className="text-white">{remainingQuota} user</strong></span>
                <span>Terpakai: <strong className="text-white">{quotaPercent}%</strong></span>
              </div>
            </div>

            {/* Metadata Tracking */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Dibuat Oleh:</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  {voucher.generated_by_name} ({voucher.generated_by_role})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tanggal Terbit:</span>
                <span className="text-slate-200">
                  {new Date(voucher.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status Voucher:</span>
                <button
                  disabled={!canManageVouchers}
                  onClick={() => {
                    const newStatus = voucher.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
                    onToggleStatus(voucher.id, newStatus);
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                    voucher.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-emerald-500/20 hover:text-emerald-300'
                  }`}
                  title={canManageVouchers ? "Klik untuk mengubah status aktif" : "Hanya role tertentu"}
                >
                  {voucher.status === 'ACTIVE' ? '🟢 Aktif (Klik Nonaktifkan)' : '⚪ Nonaktif (Klik Aktifkan)'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Simulation of Claim */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-black text-white">Uji Coba / Simulasi Klaim Voucher</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulatingClaim(!isSimulatingClaim)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline"
              >
                {isSimulatingClaim ? 'Sembunyikan Form' : 'Buka Form Simulasi Klaim'}
              </button>
            </div>

            {claimError && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{claimError}</span>
              </div>
            )}

            {claimSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{claimSuccess}</span>
              </div>
            )}

            {isSimulatingClaim && (
              <form onSubmit={handleSimulateClaim} className="space-y-3 pt-2">
                <p className="text-[11px] text-slate-400">
                  Uji coba klaim kode voucher ini dengan memilih member terdaftar. Kuota akan otomatis berkurang dan tercatat pada tabel klaim di bawah:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {/* Member dropdown */}
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                    required
                  >
                    <option value="">-- Pilih Member --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>

                  {/* Plan */}
                  <select
                    value={claimPlan}
                    onChange={(e) => setClaimPlan(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    <option value="PRO_YEARLY">PRO Tahunan (Rp 470rb)</option>
                    <option value="PRO_MONTHLY">PRO Bulanan (Rp 49rb)</option>
                  </select>

                  <button
                    type="submit"
                    disabled={voucher.status !== 'ACTIVE' || remainingQuota <= 0}
                    className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Klaim Sekarang</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Claim History Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Daftar User yang Telah Mengklaim Voucher Ini ({voucher.claims?.length || 0})</span>
              </h4>
              <span className="text-[10px] text-slate-400">
                Laporan Klaim Real-Time
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">Nama & Email Pengguna</th>
                      <th className="px-4 py-2.5 font-bold">Rumah / Tenant</th>
                      <th className="px-4 py-2.5 font-bold">Paket</th>
                      <th className="px-4 py-2.5 font-bold">Nominal Diskon</th>
                      <th className="px-4 py-2.5 font-bold">Waktu Klaim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {!voucher.claims || voucher.claims.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                          <Ticket className="w-8 h-8 mx-auto mb-1 text-slate-600" />
                          <p className="font-semibold text-slate-400">Belum ada user yang mengklaim voucher ini</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Bagikan kode "{voucher.code}" ke calon pengguna.</p>
                        </td>
                      </tr>
                    ) : (
                      voucher.claims.map((claim) => (
                        <tr key={claim.id} className="hover:bg-slate-900/50 transition">
                          <td className="px-4 py-3">
                            <div className="font-bold text-white">{claim.user_name}</div>
                            <div className="text-[10px] text-slate-400">{claim.user_email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-300 font-medium flex items-center gap-1">
                              <Home className="w-3 h-3 text-slate-500" />
                              <span>{claim.household_name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                              {claim.applied_plan}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-emerald-400">
                              -Rp {Number(claim.discount_amount || 0).toLocaleString('id-ID')}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Bayar: Rp {Number(claim.final_price || 0).toLocaleString('id-ID')}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-[11px]">
                            {new Date(claim.claimed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            <span className="block text-[10px] text-slate-500">
                              {new Date(claim.claimed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
