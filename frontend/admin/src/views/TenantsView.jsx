import React, { useState, useMemo } from 'react';
import { 
  Home, 
  Sparkles, 
  Search, 
  Filter, 
  Users, 
  MapPin, 
  Receipt, 
  Package, 
  ShoppingCart, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Download,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { hasPermission } from '../utils/rbac';

export default function TenantsView({ 
  tenants, 
  onSelectTenant, 
  onOpenActivatePro, 
  onDowngradeTenant, 
  currentRole 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('ALL'); // ALL, PRO, FREE

  const canEditTenants = hasPermission(currentRole.id, 'edit_tenants');
  const canActivatePro = hasPermission(currentRole.id, 'activate_pro_manual');
  const canDowngrade = hasPermission(currentRole.id, 'downgrade_pro');
  const canExport = hasPermission(currentRole.id, 'export_data');

  // Filter logic
  const filteredTenants = useMemo(() => {
    return (tenants || []).filter(tenant => {
      // Search
      const matchSearch = 
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tenant.address && tenant.address.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      // Tier filter
      if (filterTier === 'PRO' && tenant.subscription_tier !== 'PRO') return false;
      if (filterTier === 'FREE' && tenant.subscription_tier !== 'FREE') return false;

      return true;
    });
  }, [tenants, searchQuery, filterTier]);

  // Metric counts
  const totalTenants = (tenants || []).length;
  const proTenants = (tenants || []).filter(t => t.subscription_tier === 'PRO').length;
  const freeTenants = totalTenants - proTenants;
  const totalMembersManaged = (tenants || []).reduce((acc, curr) => acc + (curr.active_members_count || 1), 0);

  const handleExportCSV = () => {
    if (!canExport) {
      alert('Akses Dibatasi: Role Anda tidak memiliki izin ekspor data.');
      return;
    }
    const headers = ['ID Rumah', 'Nama Properti/Rumah', 'Nama Pemilik', 'Email Pemilik', 'Alamat', 'Paket Tier', 'Jumlah Anggota', 'Masa Berlaku PRO', 'Tanggal Registrasi'];
    const rows = filteredTenants.map(t => [
      t.id,
      `"${t.name}"`,
      `"${t.owner_name}"`,
      t.owner_email,
      `"${t.address || ''}"`,
      t.subscription_tier,
      t.active_members_count,
      t.pro_valid_until ? t.pro_valid_until.slice(0, 10) : 'Gratis Selamanya',
      t.created_at ? t.created_at.slice(0, 10) : '-'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `homehub_tenants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-400" />
              Direktori Tenant & Properti Rumah Tangga
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Fitur 3: Tenant & Rumah
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pantau seluruh unit rumah tangga yang terdaftar, kuota pemakaian fitur, pemilik resmi, dan kontrol status langganan.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {canExport && (
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Ekspor Tenant CSV</span>
            </button>
          )}

          {canActivatePro && (
            <button
              onClick={() => onOpenActivatePro(null)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Aktivasi PRO Tenant</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Tenants */}
        <StatCard
          title="Total Rumah / Tenant"
          value={totalTenants}
          subtext="Seluruh unit terdaftar di HomeHub"
          icon={Home}
          colorClass="from-emerald-600 to-teal-600"
          badgeText="Active Properties"
          badgeColor="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
        />

        {/* Metric 2: PRO Tenants */}
        <StatCard
          title="Rumah Paket PRO"
          value={proTenants}
          subtext="Multi-anggota & kuota tanpa batas"
          icon={Sparkles}
          colorClass="from-amber-500 to-orange-600"
          badgeText="PRO Edition"
          badgeColor="bg-amber-500/20 text-amber-300 border-amber-500/30"
        />

        {/* Metric 3: FREE Tenants */}
        <StatCard
          title="Rumah Paket FREE"
          value={freeTenants}
          subtext="Paket standar (maksimal 5 anggota)"
          icon={Users}
          colorClass="from-slate-600 to-slate-700"
          badgeText="Free Tier"
          badgeColor="bg-slate-700 text-slate-300 border-slate-600"
        />

        {/* Metric 4: Total Multi-Members */}
        <StatCard
          title="Total Anggota Keluarga Terhubung"
          value={totalMembersManaged}
          subtext={`Rata-rata ${(totalMembersManaged / (totalTenants || 1)).toFixed(1)} anggota / rumah`}
          icon={Users}
          colorClass="from-indigo-600 to-blue-600"
          badgeText="Multi-User"
          badgeColor="bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
        />
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari rumah berdasarkan nama properti, nama pemilik, email, atau alamat..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Tier Filter Tabs */}
          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setFilterTier('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filterTier === 'ALL' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Semua ({totalTenants})
            </button>
            <button
              onClick={() => setFilterTier('PRO')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filterTier === 'PRO' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Paket PRO ({proTenants})
            </button>
            <button
              onClick={() => setFilterTier('FREE')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filterTier === 'FREE' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Paket FREE ({freeTenants})
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/50">
          <span>Menampilkan <strong className="text-white">{filteredTenants.length}</strong> rumah tangga</span>
          <span className="text-slate-400">💡 Tip: Klik tombol <strong>Kelola</strong> untuk melihat rincian kuota dan aset rumah.</span>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 font-bold">Rumah / Tenant & Alamat</th>
                <th className="px-4 py-3 font-bold">Pemilik / Owner</th>
                <th className="px-4 py-3 font-bold">Tier Paket</th>
                <th className="px-4 py-3 font-bold">Pemakaian Fitur</th>
                <th className="px-4 py-3 font-bold">Masa Aktif Paket</th>
                <th className="px-4 py-3 font-bold text-right">Aksi & Troubleshooting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Home className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold text-slate-400">Tidak ada rumah / tenant yang cocok</p>
                    <p className="text-[11px] text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter tier.</p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const isPro = tenant.subscription_tier === 'PRO';
                  
                  // Days remaining calculation
                  let daysRemaining = null;
                  if (tenant.pro_valid_until) {
                    const diffTime = new Date(tenant.pro_valid_until) - new Date();
                    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  }

                  return (
                    <tr key={tenant.id} className="hover:bg-slate-700/40 transition">
                      {/* Name & Address */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border font-bold mt-0.5 ${
                            isPro 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                              : 'bg-slate-700/60 text-slate-300 border-slate-600'
                          }`}>
                            <Home className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{tenant.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 max-w-xs truncate">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{tenant.address || 'Alamat belum diatur'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {tenant.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-200 text-xs">{tenant.owner_name}</div>
                        <div className="text-[11px] text-slate-400">{tenant.owner_email}</div>
                      </td>

                      {/* Tier Badge */}
                      <td className="px-4 py-3.5">
                        {isPro ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            PRO Edition
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300 border border-slate-600">
                            Free Edition
                          </span>
                        )}
                      </td>

                      {/* Resource Usage */}
                      <td className="px-4 py-3.5">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                          <span className="text-slate-300 flex items-center gap-1">
                            <Users className="w-3 h-3 text-blue-400" />
                            <strong>{tenant.active_members_count || 1}</strong> Anggota
                          </span>
                          <span className="text-slate-300 flex items-center gap-1">
                            <Receipt className="w-3 h-3 text-amber-400" />
                            <strong>{tenant.bills_count || 0}</strong> Tagihan
                          </span>
                          <span className="text-slate-300 flex items-center gap-1">
                            <Package className="w-3 h-3 text-purple-400" />
                            <strong>{tenant.assets_count || 0}</strong> Aset
                          </span>
                          <span className="text-slate-300 flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3 text-emerald-400" />
                            <strong>{tenant.groceries_count || 0}</strong> Belanja
                          </span>
                        </div>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-3.5">
                        {isPro ? (
                          <div>
                            <div className="font-bold text-amber-300 text-xs">
                              {new Date(tenant.pro_valid_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {daysRemaining > 0 ? (
                                <span className={daysRemaining <= 14 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                                  Sisa {daysRemaining} hari
                                </span>
                              ) : (
                                <span className="text-rose-400 font-bold">Kedaluwarsa</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">
                            <span>Gratis Selamanya</span>
                            <span className="block text-[10px] text-slate-500">Maks. 5 anggota</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectTenant(tenant)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                            title="Buka rincian rumah tangga"
                          >
                            <span>Kelola</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          {canActivatePro && (
                            <button
                              onClick={() => onOpenActivatePro(tenant)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                              title={isPro ? 'Perpanjang masa aktif PRO' : 'Tingkatkan ke PRO'}
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>{isPro ? 'Perpanjang' : 'Upgrade PRO'}</span>
                            </button>
                          )}

                          {isPro && canDowngrade && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Yakin ingin menurunkan paket "${tenant.name}" menjadi FREE?`)) {
                                  onDowngradeTenant(tenant.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                              title="Downgrade ke FREE"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
