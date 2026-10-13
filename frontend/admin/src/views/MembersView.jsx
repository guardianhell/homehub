import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Ban, 
  Eye, 
  ShieldAlert,
  ArrowUpDown,
  MoreVertical
} from 'lucide-react';
import { hasPermission } from '../utils/rbac';

export default function MembersView({ 
  members = [], 
  onSelectMember, 
  onToggleStatus, 
  onOpenActivatePro,
  currentRole 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL'); // ALL | PRO | FREE
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | SUSPENDED

  const canEditMembers = hasPermission(currentRole.id, 'edit_members');
  const canActivatePro = hasPermission(currentRole.id, 'activate_pro_manual');

  // Filtered members list
  const filtered = members.filter((m) => {
    const matchSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.phone && m.phone.includes(searchTerm));
    
    const matchTier = tierFilter === 'ALL' || m.highest_tier === tierFilter;
    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;

    return matchSearch && matchTier && matchStatus;
  });

  const totalMembers = members.length;
  const proMembers = members.filter(m => m.highest_tier === 'PRO').length;
  const freeMembers = totalMembers - proMembers;
  const suspendedMembers = members.filter(m => m.status === 'SUSPENDED').length;

  return (
    <div className="space-y-5">
      
      {/* Top Header Summary Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Manajemen Anggota & Status Membership</span>
          </h2>
          <p className="text-xs text-slate-400">
            Total {totalMembers} akun terdaftar • {proMembers} Berbayar (PRO) • {freeMembers} Gratis • {suspendedMembers} Ditangguhkan
          </p>
        </div>

        {canActivatePro && (
          <button
            onClick={() => onOpenActivatePro(null)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aktivasi PRO Manual</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, email, no. HP..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-medium"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Tier filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setTierFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                tierFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Paket
            </button>
            <button
              onClick={() => setTierFilter('PRO')}
              className={`px-3 py-1 rounded-lg transition ${
                tierFilter === 'PRO' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              💎 PRO ({proMembers})
            </button>
            <button
              onClick={() => setTierFilter('FREE')}
              className={`px-3 py-1 rounded-lg transition ${
                tierFilter === 'FREE' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              FREE ({freeMembers})
            </button>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium"
          >
            <option value="ALL">Status: Semua</option>
            <option value="ACTIVE">Status: Aktif</option>
            <option value="SUSPENDED">Status: Ditangguhkan</option>
          </select>
        </div>

      </div>

      {/* Main Members Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <th className="p-4">Anggota / Profil</th>
                <th className="p-4">Mulai Menjadi Member</th>
                <th className="p-4">Status Akun</th>
                <th className="p-4">Paket & Masa Berlaku</th>
                <th className="p-4">Rumah Dikelola</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium">
              {filtered.map((member) => {
                const isPro = member.highest_tier === 'PRO';
                let expiryBadge = null;

                if (isPro && member.pro_valid_until) {
                  const expiry = new Date(member.pro_valid_until);
                  const now = new Date();
                  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

                  if (diffDays > 0) {
                    expiryBadge = (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        <span>{diffDays} hari tersisa (s/d {expiry.toLocaleDateString('id-ID')})</span>
                      </span>
                    );
                  } else {
                    expiryBadge = (
                      <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-rose-500" />
                        <span>Kedaluwarsa ({expiry.toLocaleDateString('id-ID')})</span>
                      </span>
                    );
                  }
                }

                return (
                  <tr 
                    key={member.id} 
                    className="hover:bg-slate-800/40 transition group cursor-pointer"
                    onClick={() => onSelectMember(member)}
                  >
                    {/* User info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs shrink-0 shadow-xs">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white group-hover:text-emerald-400 transition truncate">
                            {member.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {member.email} {member.phone ? `• ${member.phone}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Member since (kapan mulai menjadi member) */}
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{new Date(member.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>

                    {/* Status aktif atau tidak */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        member.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {member.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Ban className="w-3 h-3 text-rose-400" />}
                        <span>{member.status}</span>
                      </span>
                    </td>

                    {/* Membership & Berakhir kapan */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        isPro 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {isPro ? '💎 PRO' : 'FREE'}
                      </span>
                      {expiryBadge ? expiryBadge : (
                        <p className="text-[10px] text-slate-500 mt-0.5">Tanpa kedaluwarsa</p>
                      )}
                    </td>

                    {/* Households managed */}
                    <td className="p-4 text-slate-300">
                      <span className="font-semibold text-slate-200">
                        {member.households?.length || 1} properti
                      </span>
                      <p className="text-[10px] text-slate-500 truncate max-w-[150px]">
                        {member.households?.[0]?.name || 'Rumah Utama'}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectMember(member)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>

                        {canActivatePro && (
                          <button
                            onClick={() => onOpenActivatePro(member.households?.[0] || null)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                            title="Aktivasi PRO"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Aktivasi</span>
                          </button>
                        )}

                        {canEditMembers && (
                          <button
                            onClick={() => onToggleStatus(member.id, member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              member.status === 'ACTIVE'
                                ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                : 'text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={member.status === 'ACTIVE' ? 'Tangguhkan Akun' : 'Buka Penangguhan Akun'}
                          >
                            {member.status === 'ACTIVE' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              Tidak ada anggota yang cocok dengan filter pencarian "{searchTerm}".
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
