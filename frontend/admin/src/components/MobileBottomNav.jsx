import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  Sliders, 
  Menu 
} from 'lucide-react';

export default function MobileBottomNav({ 
  activeTab, 
  onSelectTab, 
  onToggleMenu 
}) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-1.5 py-1.5 flex items-center justify-around shadow-2xl">
      <button
        type="button"
        onClick={() => onSelectTab('overview')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
          activeTab === 'overview'
            ? 'text-emerald-400 font-extrabold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Ringkasan</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('members')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
          activeTab === 'members'
            ? 'text-emerald-400 font-extrabold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Anggota</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('vouchers')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
          activeTab === 'vouchers'
            ? 'text-emerald-400 font-extrabold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Ticket className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Voucher</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('limits')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
          activeTab === 'limits'
            ? 'text-emerald-400 font-extrabold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Sliders className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Limit</span>
      </button>

      <button
        type="button"
        onClick={onToggleMenu}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition cursor-pointer"
        title="Buka Menu Lengkap"
      >
        <Menu className="w-5 h-5 mb-0.5 text-indigo-400" />
        <span className="text-[10px] tracking-tight">Lainnya</span>
      </button>
    </nav>
  );
}
