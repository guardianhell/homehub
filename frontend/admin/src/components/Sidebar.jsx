import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Home, 
  Wrench, 
  ShieldCheck, 
  History, 
  ChevronRight,
  Sparkles,
  ExternalLink,
  Ticket,
  Sliders,
  X,
  Zap,
  Layers
} from 'lucide-react';
import { hasPermission } from '../utils/rbac';

export default function Sidebar({ activeTab, onSelectTab, currentRole, isOpen, onClose }) {
  const menuItems = [
    {
      id: 'overview',
      label: 'Dashboard Utama',
      icon: LayoutDashboard,
      description: 'Ringkasan & KPI Eksekutif',
      requiredPerm: 'view_overview',
    },
    {
      id: 'members',
      label: 'Anggota & Pengguna',
      icon: Users,
      description: 'Total member & profil membership',
      requiredPerm: 'view_members',
      badge: 'Utama'
    },
    {
      id: 'subscriptions',
      label: 'Langganan & PRO',
      icon: CreditCard,
      description: 'Member berbayar, MRR & transaksi',
      requiredPerm: 'view_overview', // accessible by all, restricted views inside
    },
    {
      id: 'vouchers',
      label: 'Cetak & Kelola Voucher',
      icon: Ticket,
      description: 'Voucher diskon kuota & klaim',
      requiredPerm: 'view_vouchers',
      badge: 'Promo'
    },
    {
      id: 'limits',
      label: 'Limit & Kuota Fitur',
      icon: Sliders,
      description: 'Konfigurasi batasan Free & PRO',
      requiredPerm: 'view_overview',
      badge: 'Kontrol'
    },
    {
      id: 'categories',
      label: 'Master Kategori Data',
      icon: Layers,
      description: 'Utilitas, Aset, Belanja, Biaya & Agenda',
      requiredPerm: 'view_overview',
      badge: 'Fleksibel'
    },
    {
      id: 'tenants',
      label: 'Tenant & Rumah',
      icon: Home,
      description: 'Properti & rumah yang dikelola',
      requiredPerm: 'view_tenants',
    },
    {
      id: 'troubleshooting',
      label: 'Troubleshooting & Akses',
      icon: Wrench,
      description: 'Aktivasi PRO & pemulihan akun',
      requiredPerm: 'view_members',
      badge: 'Solusi'
    },
    {
      id: 'rbac',
      label: 'Hak Akses & Role (RBAC)',
      icon: ShieldCheck,
      description: 'Matriks izin staf & level akses',
      requiredPerm: 'view_overview',
    },
    {
      id: 'audit_logs',
      label: 'Audit Trail & Log',
      icon: History,
      description: 'Riwayat aktivitas backoffice',
      requiredPerm: 'view_overview',
    }
  ];

  const handleTabClick = (tabId) => {
    onSelectTab(tabId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Slide-Over Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 transition-opacity" 
        />
      )}

      {/* Sidebar / Mobile Drawer Container */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${!isOpen ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Brand Header & Mobile Close Button */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-indigo-600 flex items-center justify-center text-xl font-black shadow-lg shadow-emerald-500/20 text-white">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-sm tracking-tight text-white">HomeHub</h1>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                BackOffice & Operations
              </p>
            </div>
          </div>

          {/* Close Button on Mobile Drawer */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              aria-label="Tutup Menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Modul Kontrol
          </div>
          {menuItems.map((item) => {
            const isAllowed = hasPermission(currentRole.id, item.requiredPerm);
            if (!isAllowed) return null;

            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'categories' && activeTab === 'utility_categories');

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all text-xs font-semibold cursor-pointer group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                <div className="truncate">
                  <div className="truncate flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition ${isActive ? 'opacity-100 text-white' : 'text-slate-500'}`} />
            </button>
          );
        })}
      </nav>

      {/* User Portal Link */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <a 
          href={import.meta.env.VITE_WEB_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5173` : 'http://localhost:5173')} 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-bold transition group"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🏠</span>
            <span>Buka Web Tenant</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </a>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
          HomeHub System v1.2.0 • Pro Edition
        </p>
      </div>
    </aside>
    </>
  );
}
