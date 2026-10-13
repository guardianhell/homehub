import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Check, 
  X, 
  Sparkles, 
  Key, 
  UserCheck, 
  Info, 
  Lock,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { ADMIN_ROLES } from '../utils/rbac';

export default function RbacView({ currentRole, onSelectRole }) {
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' or 'staff'

  // Admin staff directory (internal company staff)
  const staffList = [
    {
      id: 'staff-01',
      name: 'Bramantyo Superadmin',
      email: 'bram@homehub.app',
      roleId: 'SUPERADMIN',
      department: 'Technology & Core Operations',
      last_active: 'Baru saja',
      avatarColor: 'bg-rose-500'
    },
    {
      id: 'staff-02',
      name: 'Dimas Wicaksono',
      email: 'dimas.support@homehub.app',
      roleId: 'HELPDESK',
      department: 'Customer Success & Technical Support',
      last_active: '15 menit lalu',
      avatarColor: 'bg-amber-500'
    },
    {
      id: 'staff-03',
      name: 'Clarissa Natalia',
      email: 'clarissa.finance@homehub.app',
      roleId: 'FINANCE',
      department: 'Finance, Billing & Accounting',
      last_active: '1 jam lalu',
      avatarColor: 'bg-emerald-500'
    },
    {
      id: 'staff-04',
      name: 'Reza Pratama',
      email: 'reza.marketing@homehub.app',
      roleId: 'MARKETING',
      department: 'Growth Marketing & Acquisition',
      last_active: '3 jam lalu',
      avatarColor: 'bg-purple-500'
    },
    {
      id: 'staff-05',
      name: 'Anisa Putri',
      email: 'anisa.cs@homehub.app',
      roleId: 'CONTACT_CENTER',
      department: 'Frontline Customer Care (24/7)',
      last_active: '5 menit lalu',
      avatarColor: 'bg-blue-500'
    }
  ];

  // RBAC Permission Definitions
  const permissionCategories = [
    {
      category: 'Modul Pelanggan & Keanggotaan',
      permissions: [
        { key: 'view_overview', label: 'Melihat Ringkasan Eksekutif (Overview)', desc: 'Melihat statistik ringkas total anggota dan rumah' },
        { key: 'view_members', label: 'Melihat Direktori Member', desc: 'Mencari dan melihat data pengguna' },
        { key: 'edit_members', label: 'Kelola Status Akun Member', desc: 'Menangguhkan (Suspend) atau memulihkan (Unsuspend) akun pelanggan' },
      ]
    },
    {
      category: 'Modul Tenant & Properti Rumah',
      permissions: [
        { key: 'view_tenants', label: 'Melihat Direktori Tenant / Rumah', desc: 'Melihat daftar properti dan kuota pemakaian fitur' },
        { key: 'edit_tenants', label: 'Mengubah Konfigurasi Properti', desc: 'Mengedit data nama dan alamat properti pelanggan' },
      ]
    },
    {
      category: 'Billing & Aktivasi Berbayar (PRO)',
      permissions: [
        { key: 'activate_pro_manual', label: 'Aktivasi PRO Manual (Troubleshooting)', desc: 'Bypass pembayaran saat kendala transfer bank atau aktivasi darurat' },
        { key: 'downgrade_pro', label: 'Batalkan / Downgrade ke Free', desc: 'Menurunkan paket dari PRO ke FREE (refund/pembatalan)' },
        { key: 'view_finance', label: 'Melihat Omset / Keuangan (MRR)', desc: 'Melihat nilai omset bulanan, estimasi MRR, dan invoice finansial' },
      ]
    },
    {
      category: 'Promo Voucher & Kupon Diskon',
      permissions: [
        { key: 'view_vouchers', label: 'Melihat Direktori & Kuota Voucher', desc: 'Melihat status kode kupon, sisa kuota, dan daftar user yang mengklaim' },
        { key: 'manage_vouchers', label: 'Cetak & Terbitkan Voucher Baru', desc: 'Generate kode voucher baru, menentukan batas kuota, dan cetak slip kupon' },
      ]
    },
    {
      category: 'Tata Kelola & Keamanan Sistem',
      permissions: [
        { key: 'manage_limits', label: 'Konfigurasi Limit & Kuota Fitur', desc: 'Mengatur batas numerik Free dan PRO untuk kuota anggota, tagihan, aset, dsb.' },
        { key: 'export_data', label: 'Ekspor Data CSV', desc: 'Mengunduh rekap spreadsheet ke format CSV lokal' },
        { key: 'view_analytics', label: 'Akses Analitik Pertumbuhan', desc: 'Melihat rasio konversi paket dan demografi' },
        { key: 'manage_rbac', label: 'Kelola Hak Akses Staff (RBAC)', desc: 'Menambah staff dan mengatur peran admin lain' },
        { key: 'view_audit_logs', label: 'Melihat Rekam Jejak (Audit Trail)', desc: 'Melihat log siapa yang melakukan aktivasi manual atau suspend' },
      ]
    }
  ];

  const roleList = Object.values(ADMIN_ROLES);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              Role-Based Access Control (RBAC) Matrix
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Fitur 5: Multi-Level Hak Akses
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pengaturan izin bertingkat untuk Superadmin, Help Desk, Finance, Marketing, dan Contact Center guna menjaga integritas data pelanggan.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs self-start sm:self-center">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'matrix' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Matriks Izin Role
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'staff' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Direktori Staff Admin ({staffList.length})
          </button>
        </div>
      </div>

      {/* Role Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {roleList.map((role) => {
          const isCurrent = currentRole.id === role.id;
          return (
            <div
              key={role.id}
              onClick={() => onSelectRole(role)}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                isCurrent 
                  ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500' 
                  : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{role.icon}</span>
                  {isCurrent ? (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500 text-white">
                      Aktif Sekarang
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium text-slate-500 hover:text-purple-400">
                      Klik Uji Coba
                    </span>
                  )}
                </div>
                <div className="font-bold text-white text-xs">{role.label}</div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                  {role.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Total Izin:</span>
                <span className="font-bold text-slate-200">
                  {Object.values(role.permissions).filter(Boolean).length} / {Object.keys(role.permissions).length}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Matrix Tab */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-900/60 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white">Perbandingan Matriks Hak Akses (Granular Permissions)</h3>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Diizinkan
              </span>
              <span className="flex items-center gap-1">
                <X className="w-3.5 h-3.5 text-rose-400" /> Dibatasi
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-bold w-1/3">Kategori & Modul Fitur</th>
                  <th className="px-3 py-3 font-bold text-center">Super Admin</th>
                  <th className="px-3 py-3 font-bold text-center">Help Desk</th>
                  <th className="px-3 py-3 font-bold text-center">Finance</th>
                  <th className="px-3 py-3 font-bold text-center">Marketing</th>
                  <th className="px-3 py-3 font-bold text-center">Contact Center</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {permissionCategories.map((group, gIdx) => (
                  <React.Fragment key={gIdx}>
                    {/* Category Header */}
                    <tr className="bg-slate-900/40">
                      <td colSpan="6" className="px-4 py-2 text-[11px] font-bold text-purple-300">
                        📁 {group.category}
                      </td>
                    </tr>
                    {/* Individual Permissions */}
                    {group.permissions.map((perm) => (
                      <tr key={perm.key} className="hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white text-xs">{perm.label}</div>
                          <div className="text-[10px] text-slate-400">{perm.desc}</div>
                        </td>

                        {/* Roles columns */}
                        {roleList.map((r) => {
                          const isAllowed = Boolean(r.permissions[perm.key]);
                          return (
                            <td key={r.id} className="px-3 py-3 text-center">
                              {isAllowed ? (
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10 text-rose-400/50 border border-rose-500/20 mx-auto">
                                  <X className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Directory Tab */}
      {activeTab === 'staff' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-900/60 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white">Daftar Akun Staff Internal Backoffice</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Petugas internal yang memiliki kredensial login ke Admin Portal</p>
            </div>
            <button
              onClick={() => alert('Fitur tambah staff internal baru siap diintegrasikan dengan SSO / Corporate LDAP.')}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer"
            >
              + Tambah Staff Admin
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-bold">Nama Petugas Admin</th>
                  <th className="px-4 py-3 font-bold">Departemen</th>
                  <th className="px-4 py-3 font-bold">Tingkat Peran (Role)</th>
                  <th className="px-4 py-3 font-bold">Aktivitas Terakhir</th>
                  <th className="px-4 py-3 font-bold text-right">Uji Coba Peran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {staffList.map((staff) => {
                  const roleObj = ADMIN_ROLES[staff.roleId];
                  const isCurrentRole = currentRole.id === staff.roleId;

                  return (
                    <tr key={staff.id} className="hover:bg-slate-700/40 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${staff.avatarColor} text-white font-bold flex items-center justify-center text-xs shadow-sm`}>
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{staff.name}</div>
                            <div className="text-[11px] text-slate-400">{staff.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-300 font-medium text-xs">
                        {staff.department}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${roleObj.badgeColor}`}>
                          <span>{roleObj.icon}</span>
                          <span>{roleObj.label}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 text-xs">
                        {staff.last_active}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => onSelectRole(roleObj)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            isCurrentRole 
                              ? 'bg-purple-600 text-white font-bold' 
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                          }`}
                        >
                          {isCurrentRole ? 'Peran Sedang Aktif' : `Beralih ke ${roleObj.label}`}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
