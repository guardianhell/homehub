import React from 'react';
import { 
  X, 
  Home, 
  User, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  ArrowDownCircle,
  FileText
} from 'lucide-react';
import { hasPermission } from '../utils/rbac';

export default function TenantDetailModal({ 
  isOpen, 
  onClose, 
  tenant, 
  onOpenActivatePro, 
  onDowngrade,
  currentRole 
}) {
  if (!isOpen || !tenant) return null;

  const canActivatePro = hasPermission(currentRole.id, 'activate_pro_manual');
  const canDowngrade = hasPermission(currentRole.id, 'downgrade_pro');
  const isPro = tenant.subscription_tier === 'PRO';

  let expiryStatusText = 'Paket Free (Standar)';
  let expiryColor = 'text-slate-400';

  if (isPro && tenant.pro_valid_until) {
    const expiry = new Date(tenant.pro_valid_until);
    const now = new Date();
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (diff > 0) {
      expiryStatusText = `Aktif s/d ${expiry.toLocaleDateString('id-ID')} (${diff} hari lagi)`;
      expiryColor = 'text-emerald-400 font-bold';
    } else {
      expiryStatusText = `Kedaluwarsa pada ${expiry.toLocaleDateString('id-ID')}`;
      expiryColor = 'text-rose-400 font-bold';
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg ${
              isPro 
                ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-amber-500/20' 
                : 'bg-slate-800 text-slate-300'
            }`}>
              🏠
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  {tenant.name}
                </h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  isPro 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {tenant.subscription_tier}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                ID: {tenant.id}
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

        {/* Properti & Owner Info */}
        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{tenant.address || 'Alamat belum diatur'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 pt-2 border-t border-slate-800/80">
              <User className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Pemilik: <strong className="text-slate-200">{tenant.owner_name}</strong> ({tenant.owner_email})</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl">
              <p className="text-[10px] text-slate-400">Anggota</p>
              <p className="text-sm font-black text-white mt-0.5">{tenant.active_members_count || 1} org</p>
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl">
              <p className="text-[10px] text-slate-400">Tagihan</p>
              <p className="text-sm font-black text-white mt-0.5">{tenant.bills_count || 0} akun</p>
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl">
              <p className="text-[10px] text-slate-400">Aset Rumah</p>
              <p className="text-sm font-black text-white mt-0.5">{tenant.assets_count || 0} unit</p>
            </div>
          </div>

          {/* Subscription Validity Section */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Masa Aktif Paket PRO</span>
              </span>
              <span className={`text-[11px] ${expiryColor}`}>
                {expiryStatusText}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Dibuat pada: {new Date(tenant.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2.5">
          {isPro && canDowngrade ? (
            <button
              onClick={() => {
                if (window.confirm(`Yakin ingin menurunkan paket rumah "${tenant.name}" menjadi FREE?`)) {
                  onDowngrade(tenant.id);
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 transition cursor-pointer flex items-center gap-1.5"
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Downgrade ke Free</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            {canActivatePro && (
              <button
                onClick={() => {
                  onClose();
                  onOpenActivatePro(tenant);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isPro ? 'Perpanjang PRO' : 'Aktifkan PRO'}</span>
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
