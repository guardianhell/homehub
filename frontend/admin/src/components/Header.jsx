import React from 'react';
import { 
  Shield, 
  RotateCcw, 
  Search, 
  ChevronDown, 
  UserCheck, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Menu
} from 'lucide-react';
import { ADMIN_ROLES } from '../utils/rbac';

export default function Header({ 
  currentRole, 
  onRoleChange, 
  onOpenRoleModal,
  onResetData,
  onRefresh,
  searchTerm,
  onSearchChange,
  pageTitle,
  pageSubtitle,
  onToggleMobileMenu
}) {
  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
      {/* Title & Context & Mobile Hamburger Button */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-800 transition cursor-pointer shrink-0"
            aria-label="Buka Menu Navigasi"
            title="Menu Navigasi"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-sm md:text-base font-black text-white tracking-tight flex items-center gap-2 truncate">
            <span className="truncate">{pageTitle}</span>
          </h2>
          <p className="text-[10px] md:text-[11px] text-slate-400 font-medium truncate hidden sm:block">
            {pageSubtitle}
          </p>
        </div>
      </div>

      {/* Action Controls & RBAC Role Switcher */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari anggota / tenant..."
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-56 transition font-medium"
          />
        </div>

        {/* Interactive Role Switcher Selector */}
        <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 p-1 pl-2.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <span className="text-sm">{currentRole.icon}</span>
            <span className="hidden sm:inline text-[11px] text-slate-400">Mode Role:</span>
          </div>

          <select
            value={currentRole.id}
            onChange={(e) => onRoleChange(e.target.value)}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition"
          >
            {Object.values(ADMIN_ROLES).map((role) => (
              <option key={role.id} value={role.id}>
                {role.icon} {role.label}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenRoleModal}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            title="Lihat Matriks Hak Akses Role"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Data Integrity Status */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-[11px] font-bold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Database Terhubung</span>
        </div>

        {/* Refresh Live Data Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl border border-slate-800 transition cursor-pointer"
            title="Segarkan & Tarik Data Terbaru dari Database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Reset Demo Data Button */}
        <button
          onClick={onResetData}
          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl border border-slate-800 transition cursor-pointer"
          title="Reset Data Percobaan ke Awal"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Admin Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-xs font-black text-white shadow-xs">
            OP
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-200 leading-tight">Admin Ops</p>
            <p className="text-[10px] text-emerald-400 font-semibold">{currentRole.label}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
