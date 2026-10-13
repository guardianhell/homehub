import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Users, 
  CreditCard, 
  Wrench,
  Sparkles
} from 'lucide-react';
import { ADMIN_ROLES } from '../utils/rbac';

export default function RoleSwitcherModal({ 
  isOpen, 
  onClose, 
  currentRole, 
  onSelectRole 
}) {
  if (!isOpen) return null;

  const permissionsList = [
    { key: 'view_members', label: 'Melihat Data Anggota' },
    { key: 'edit_members', label: 'Tangguhkan / Aktifkan User' },
    { key: 'view_tenants', label: 'Melihat Data Rumah / Tenant' },
    { key: 'activate_pro_manual', label: 'Aktivasi PRO Manual (Bypass)' },
    { key: 'downgrade_pro', label: 'Downgrade / Refund PRO' },
    { key: 'view_finance', label: 'Melihat Omset & Finansial' },
    { key: 'manage_rbac', label: 'Kelola Hak Akses Staf' },
    { key: 'view_audit_logs', label: 'Melihat Audit Trail' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 animate-scaleUp max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-500/20">
              🛡️
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>Pilih Level Akses Role (RBAC Simulation)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pilih peran untuk menguji batasan dan izin operasional dashboard admin
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

        {/* Roles Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(ADMIN_ROLES).map((role) => {
            const isSelected = currentRole.id === role.id;
            return (
              <button
                key={role.id}
                onClick={() => {
                  onSelectRole(role.id);
                  onClose();
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{role.icon}</span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                        <Check className="w-3 h-3" /> Aktif
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-white tracking-tight">
                    {role.label}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-semibold">Terapkan Role</span>
                  <span className="text-emerald-400 font-bold group-hover:underline">Pilih →</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Permissions Matrix Comparison Table */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Matriks Hak Akses Antar Peran
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto text-[11px]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold text-[10px] uppercase">
                  <th className="p-3">Fitur & Tindakan</th>
                  <th className="p-3 text-center">Super Admin</th>
                  <th className="p-3 text-center">Help Desk</th>
                  <th className="p-3 text-center">Finance</th>
                  <th className="p-3 text-center">Marketing</th>
                  <th className="p-3 text-center">Contact Center</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {permissionsList.map((p) => (
                  <tr key={p.key} className="hover:bg-slate-900/30 transition">
                    <td className="p-3 text-slate-300 font-semibold">{p.label}</td>
                    <td className="p-3 text-center">
                      {ADMIN_ROLES.SUPERADMIN.permissions[p.key] ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="p-3 text-center">
                      {ADMIN_ROLES.HELPDESK.permissions[p.key] ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="p-3 text-center">
                      {ADMIN_ROLES.FINANCE.permissions[p.key] ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="p-3 text-center">
                      {ADMIN_ROLES.MARKETING.permissions[p.key] ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="p-3 text-center">
                      {ADMIN_ROLES.CONTACT_CENTER.permissions[p.key] ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
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
