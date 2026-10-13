import React from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Home, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles,
  Clock,
  CheckCircle2,
  Ban
} from 'lucide-react';
import { hasPermission } from '../utils/rbac';

export default function MemberDetailModal({ 
  isOpen, 
  onClose, 
  member, 
  onToggleStatus, 
  onOpenActivatePro,
  currentRole 
}) {
  if (!isOpen || !member) return null;

  const canEditMembers = hasPermission(currentRole.id, 'edit_members');
  const canActivatePro = hasPermission(currentRole.id, 'activate_pro_manual');

  // Calculate membership expiry status
  const isPro = member.highest_tier === 'PRO';
  let expiryInfo = { text: 'Paket Gratis (Tanpa Batas Waktu)', color: 'text-slate-400', isExpired: false };

  if (isPro && member.pro_valid_until) {
    const expiryDate = new Date(member.pro_valid_until);
    const now = new Date();
    const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      expiryInfo = {
        text: `Aktif s/d ${expiryDate.toLocaleDateString('id-ID')} (${diffDays} hari tersisa)`,
        color: 'text-emerald-400 font-bold',
        isExpired: false
      };
    } else {
      expiryInfo = {
        text: `Kedaluwarsa pada ${expiryDate.toLocaleDateString('id-ID')} (${Math.abs(diffDays)} hari lalu)`,
        color: 'text-rose-400 font-bold',
        isExpired: true
      };
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 animate-scaleUp max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-lg font-black text-white shadow-lg shadow-emerald-500/10">
              {member.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  {member.name}
                </h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  member.status === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {member.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                ID: {member.id}
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

        {/* Membership Lifecycle Card (Feature 4 requirement) */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Status Membership</span>
            </span>
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
              isPro 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {isPro ? '💎 HOMEHUB PRO' : 'FREE EDITION'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Mulai Menjadi Member:</p>
              <p className="font-bold text-slate-200 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{new Date(member.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Masa Berlaku Berakhir:</p>
              <p className={`mt-0.5 text-[11px] ${expiryInfo.color}`}>
                {expiryInfo.text}
              </p>
            </div>
          </div>
        </div>

        {/* Contact & Personal Details */}
        <div className="space-y-2 text-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Informasi Kontak & Akun
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500">Email Terdaftar</p>
                <p className="font-semibold text-slate-200 truncate">{member.email}</p>
              </div>
            </div>
            <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500">Nomor Telepon</p>
                <p className="font-semibold text-slate-200 truncate">{member.phone || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Households (Tenants) */}
        <div className="space-y-2 text-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Rumah / Properti Yang Dikelola ({member.households?.length || 0})
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {member.households && member.households.map((h) => (
              <div key={h.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-200">{h.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{h.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    h.tier === 'PRO' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {h.tier}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {h.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Troubleshooting & Operational Action Buttons */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          {canEditMembers ? (
            <button
              onClick={() => onToggleStatus(member.id, member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                member.status === 'ACTIVE'
                  ? 'border-rose-500/40 text-rose-300 hover:bg-rose-500/10'
                  : 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{member.status === 'ACTIVE' ? 'Tangguhkan Akun' : 'Buka Penangguhan (Aktifkan)'}</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 italic">
              Status akun dikunci oleh izin {currentRole.label}
            </div>
          )}

          <div className="flex items-center gap-2">
            {canActivatePro && (
              <button
                onClick={() => {
                  onClose();
                  onOpenActivatePro(member.households?.[0] || null);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Aktivasi PRO</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
