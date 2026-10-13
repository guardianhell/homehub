import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  colorClass = 'from-emerald-600 to-teal-700',
  badgeText,
  badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
      {/* Background glow decoration */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-tr from-transparent via-slate-800/40 to-slate-700/20 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition duration-500" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl font-black text-white tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${colorClass} flex items-center justify-center text-white shadow-md shadow-emerald-500/10 shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">
          {subtext}
        </span>
        {badgeText && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
