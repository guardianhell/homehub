import React from 'react';
import { 
  Users, 
  CreditCard, 
  Home, 
  TrendingUp, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Ticket
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { hasPermission } from '../utils/rbac';

export default function OverviewView({ 
  stats, 
  members, 
  tenants, 
  onSelectMember, 
  onSelectTenant, 
  onOpenActivatePro,
  onNavigate,
  currentRole 
}) {
  const canViewFinance = hasPermission(currentRole.id, 'view_finance');
  const canActivatePro = hasPermission(currentRole.id, 'activate_pro_manual');

  return (
    <div className="space-y-6">
      
      {/* Role Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg border border-emerald-500/30">
            {currentRole.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-white">Mode Akses Aktif: {currentRole.label}</h3>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${currentRole.badgeColor}`}>
                RBAC Level
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {currentRole.description}
            </p>
          </div>
        </div>

        {canActivatePro && (
          <button
            onClick={() => onOpenActivatePro(null)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-center"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Aktivasi PRO Manual</span>
          </button>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Members */}
        <StatCard
          title="Total Member Terdaftar"
          value={stats.totalMembers}
          subtext={`${stats.activeMembers} aktif • ${stats.suspendedMembers} ditangguhkan`}
          icon={Users}
          colorClass="from-blue-600 to-indigo-600"
          badgeText="User Directory"
          badgeColor="bg-blue-500/20 text-blue-300 border-blue-500/30"
        />

        {/* Metric 2: Member Berbayar / PRO */}
        <StatCard
          title="Member Berbayar (PRO)"
          value={stats.proMembers}
          subtext={`Konversi ${stats.conversionRate}% dari total user`}
          icon={Sparkles}
          colorClass="from-amber-500 to-orange-600"
          badgeText="PRO Edition"
          badgeColor="bg-amber-500/20 text-amber-300 border-amber-500/30"
        />

        {/* Metric 3: Total Tenant / Rumah Dikelola */}
        <StatCard
          title="Tenant / Rumah Dikelola"
          value={stats.totalTenants}
          subtext={`${stats.proTenants} Paket PRO • ${stats.freeTenants} Paket Free`}
          icon={Home}
          colorClass="from-emerald-600 to-teal-600"
          badgeText="Multi-Property"
          badgeColor="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
        />

        {/* Metric 4: Finansial / MRR */}
        <StatCard
          title="Monthly Recurring Revenue"
          value={canViewFinance ? `Rp ${(stats.mrr).toLocaleString('id-ID')}` : 'Rp ••••••••'}
          subtext={canViewFinance ? `Total omset: Rp ${(stats.totalRevenue).toLocaleString('id-ID')}` : 'Data sensitif disamarkan'}
          icon={CreditCard}
          colorClass="from-purple-600 to-pink-600"
          badgeText={canViewFinance ? 'Billing' : 'Restricted'}
          badgeColor={canViewFinance ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}
        />
      </div>

      {/* Two Column Grid: Recent PRO Members & Recent Tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Member Berbayar Terbaru & Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                <span>💎 Member PRO & Status Langganan</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Informasi keanggotaan aktif & tanggal berakhir
              </p>
            </div>
            <button
              onClick={() => onNavigate('members')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              <span>Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {members.filter(m => m.highest_tier === 'PRO').slice(0, 4).map((m) => {
              const expiry = m.pro_valid_until ? new Date(m.pro_valid_until) : null;
              const now = new Date();
              const diffDays = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;

              return (
                <div 
                  key={m.id}
                  onClick={() => onSelectMember(m)}
                  className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-xl transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xs font-black text-white shadow-xs">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                        {m.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {m.email} • {m.households?.length || 1} properti
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      PRO ACTIVE
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{diffDays ? `${diffDays} hari tersisa` : 'Aktif'}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Tenant / Rumah Terdaftar Terbaru */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                <span>🏘️ Tenant & Rumah Yang Dikelola</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pengawasan properti, owner, dan alokasi kuota
              </p>
            </div>
            <button
              onClick={() => onNavigate('tenants')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              <span>Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {tenants.slice(0, 4).map((t) => (
              <div 
                key={t.id}
                onClick={() => onSelectTenant(t)}
                className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-xl transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-sm shadow-xs">
                    🏠
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                      {t.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Pemilik: <span className="text-slate-300 font-semibold">{t.owner_name}</span> • {t.active_members_count} anggota
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    t.subscription_tier === 'PRO'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {t.subscription_tier}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {new Date(t.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Voucher Campaign Promo Quick Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-white">Program Voucher & Kupon Diskon Membership</h4>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Fitur Baru
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cetak kode voucher diskon multi-user dengan kuota klaim terkontrol, batas waktu kedaluwarsa, dan pelacakan daftar pengguna.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('vouchers')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-center shrink-0 shadow-md shadow-amber-500/10"
        >
          <span>Kelola Voucher</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
