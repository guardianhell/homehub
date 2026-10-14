import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Sparkles, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  Download, 
  ShieldAlert, 
  ArrowUpRight,
  User,
  Home,
  Tag,
  Clock
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { hasPermission } from '../utils/rbac';

export default function SubscriptionsView({ 
  subscriptions, 
  stats, 
  onOpenActivatePro, 
  currentRole,
  searchTerm = ''
}) {
  const [searchQuery, setSearchQuery] = useState(searchTerm);

  React.useEffect(() => {
    if (searchTerm !== undefined) {
      setSearchQuery(searchTerm);
    }
  }, [searchTerm]);
  const [filterPlan, setFilterPlan] = useState('ALL'); // ALL, PRO_YEARLY, PRO_MONTHLY
  const [filterType, setFilterType] = useState('ALL'); // ALL, GATEWAY, MANUAL
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const canViewFinance = hasPermission(currentRole.id, 'view_finance');
  const canActivatePro = hasPermission(currentRole.id, 'activate_pro_manual');
  const canExport = hasPermission(currentRole.id, 'export_data');

  // Filtered transactions
  const filteredSubs = useMemo(() => {
    return (subscriptions || []).filter(sub => {
      // Search
      const matchSearch = 
        sub.household_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.payment_gateway_ref && sub.payment_gateway_ref.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      // Plan Filter
      if (filterPlan !== 'ALL' && sub.plan_type !== filterPlan) return false;

      // Type Filter
      if (filterType === 'GATEWAY' && sub.is_manual_activation) return false;
      if (filterType === 'MANUAL' && !sub.is_manual_activation) return false;

      return true;
    });
  }, [subscriptions, searchQuery, filterPlan, filterType]);

  // Breakdown statistics
  const yearlyCount = (subscriptions || []).filter(s => s.plan_type === 'PRO_YEARLY').length;
  const monthlyCount = (subscriptions || []).filter(s => s.plan_type === 'PRO_MONTHLY').length;
  const manualCount = (subscriptions || []).filter(s => s.is_manual_activation).length;

  const formatRupiah = (val) => {
    if (!val && val !== 0) return 'Rp 0';
    return `Rp ${Number(val).toLocaleString('id-ID')}`;
  };

  const handleExportCSV = () => {
    if (!canExport) {
      alert('Akses Dibatasi: Role Anda tidak memiliki izin ekspor data.');
      return;
    }
    const headers = ['ID Transaksi', 'Rumah/Tenant', 'Nama Pengguna', 'Email', 'Paket', 'Nominal', 'Metode Pembayaran', 'Status', 'Mulai', 'Berakhir', 'Aktivasi Manual'];
    const rows = filteredSubs.map(s => [
      s.id,
      `"${s.household_name}"`,
      `"${s.user_name}"`,
      s.user_email,
      s.plan_type,
      s.amount,
      s.payment_method,
      s.status,
      s.started_at ? s.started_at.slice(0, 10) : '-',
      s.expires_at ? s.expires_at.slice(0, 10) : '-',
      s.is_manual_activation ? 'Ya' : 'Otomatis'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `homehub_subscriptions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              Kelola Membership & Transaksi Berbayar (PRO)
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Fitur 2: Member Berbayar
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pantau pertumbuhan member PRO, Monthly Recurring Revenue (MRR), verifikasi pembayaran, dan riwayat transaksi langganan.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {canExport && (
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Unduh laporan transaksi CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Ekspor CSV</span>
            </button>
          )}

          {canActivatePro && (
            <button
              onClick={() => onOpenActivatePro(null)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Aktivasi PRO Manual</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Member PRO */}
        <StatCard
          title="Total Member Berbayar (PRO)"
          value={stats.proMembers}
          subtext={`Dari ${stats.totalMembers} total user (${stats.conversionRate}% konversi)`}
          icon={Sparkles}
          colorClass="from-amber-500 to-orange-600"
          badgeText="Active PRO"
          badgeColor="bg-amber-500/20 text-amber-300 border-amber-500/30"
        />

        {/* Metric 2: Estimated MRR */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Monthly Recurring Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {canViewFinance ? (
              <>
                <div className="text-2xl font-black text-white">{formatRupiah(stats.mrr)}</div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <span>Estimasi pendapatan rutin per bulan</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-slate-400 flex items-center gap-1.5 py-1">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Akses Terbatas</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Role {currentRole.label} tidak berizin finansial
                </div>
              </>
            )}
          </div>
        </div>

        {/* Metric 3: Total Revenue */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Akumulasi Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {canViewFinance ? (
              <>
                <div className="text-2xl font-black text-white">{formatRupiah(stats.totalRevenue)}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Total seluruh transaksi langganan sukses
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-slate-400 flex items-center gap-1.5 py-1">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Akses Terbatas</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Hanya SUPERADMIN & FINANCE
                </div>
              </>
            )}
          </div>
        </div>

        {/* Metric 4: Paket Distribution */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Komposisi Paket Langganan</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
              {subscriptions.length} Transaksi
            </span>
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                PRO Tahunan (12 Bln)
              </span>
              <span className="font-bold text-white">{yearlyCount} unit</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                PRO Bulanan (1 Bln)
              </span>
              <span className="font-bold text-white">{monthlyCount} unit</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-700 text-slate-400">
              <span>Bypass / Manual Support:</span>
              <span className="font-semibold text-amber-400">{manualCount} transaksi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi berdasarkan nama rumah, pemilik, email, atau reference ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
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

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Plan Filter */}
            <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setFilterPlan('ALL')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filterPlan === 'ALL' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Semua Paket
              </button>
              <button
                onClick={() => setFilterPlan('PRO_YEARLY')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filterPlan === 'PRO_YEARLY' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Tahunan
              </button>
              <button
                onClick={() => setFilterPlan('PRO_MONTHLY')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filterPlan === 'PRO_MONTHLY' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Bulanan
              </button>
            </div>

            {/* Source Filter */}
            <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filterType === 'ALL' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Semua Sumber
              </button>
              <button
                onClick={() => setFilterType('GATEWAY')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filterType === 'GATEWAY' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Payment Gateway
              </button>
              <button
                onClick={() => setFilterType('MANUAL')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filterType === 'MANUAL' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Aktivasi Manual
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/50">
          <span>Menampilkan <strong className="text-white">{filteredSubs.length}</strong> dari {subscriptions.length} total transaksi langganan</span>
          <span>Harga Paket: <strong>PRO Rp 49.000 / bln</strong> atau <strong>Rp 470.000 / thn</strong></span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 font-bold">Rumah / Tenant & Pemilik</th>
                <th className="px-4 py-3 font-bold">Paket & Durasi</th>
                <th className="px-4 py-3 font-bold">Nominal Pembayaran</th>
                <th className="px-4 py-3 font-bold">Metode / Reference ID</th>
                <th className="px-4 py-3 font-bold">Masa Berlaku</th>
                <th className="px-4 py-3 font-bold">Status & Sumber</th>
                <th className="px-4 py-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold text-slate-400">Tidak ada transaksi langganan yang cocok</p>
                    <p className="text-[11px] text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  const isYearly = sub.plan_type === 'PRO_YEARLY';
                  const startDate = sub.started_at ? new Date(sub.started_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
                  const endDate = sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-700/40 transition">
                      {/* Household & Owner */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30 font-bold mt-0.5">
                            <Home className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{sub.household_name}</div>
                            <div className="text-[11px] text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3 text-slate-500" />
                              <span>{sub.user_name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">{sub.user_email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Plan Type */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                          isYearly 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          <Sparkles className="w-3 h-3" />
                          {isYearly ? 'PRO Tahunan (12 Bln)' : 'PRO Bulanan (1 Bln)'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5">
                        {canViewFinance ? (
                          <div className="font-bold text-white text-xs">
                            {formatRupiah(sub.amount)}
                            {isYearly && (
                              <span className="block text-[10px] text-emerald-400 font-normal">
                                Hemat 20% vs bulanan
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">Rp ••••••••</span>
                        )}
                      </td>

                      {/* Payment Method / Ref */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-200 text-xs">
                          {sub.payment_method.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Ref: {sub.payment_gateway_ref || sub.id}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-3.5">
                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-500">Mulai:</span> {startDate}
                        </div>
                        <div className="text-[11px] font-bold text-amber-300">
                          <span className="text-slate-500 font-normal">S/d:</span> {endDate}
                        </div>
                      </td>

                      {/* Status & Manual tag */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            {sub.status}
                          </span>

                          {sub.is_manual_activation ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Support Bypass ({sub.activated_by || 'Admin'})
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400">
                              Automated Gateway
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedInvoice(sub)}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Receipt className="w-3 h-3 text-amber-400" />
                          <span>Kwitansi</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal Simulation */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative">
            <div className="text-center pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-500/30">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">BUKTI RESMI LANGGANAN PRO</h3>
              <p className="text-[11px] text-slate-400">HomeHub SuperApp Management System</p>
              <div className="text-[10px] font-mono text-slate-500 mt-1">Invoice #{selectedInvoice.id}</div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Nama Tenant/Rumah:</span>
                <span className="font-bold text-white">{selectedInvoice.household_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Pemilik Akun:</span>
                <span className="font-bold text-white">{selectedInvoice.user_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-300">{selectedInvoice.user_email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Paket Langganan:</span>
                <span className="font-bold text-amber-400">
                  {selectedInvoice.plan_type === 'PRO_YEARLY' ? 'PRO Edition Tahunan (12 Bulan)' : 'PRO Edition Bulanan (1 Bulan)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Metode Pembayaran:</span>
                <span className="text-white">{selectedInvoice.payment_method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Reference Transaksi:</span>
                <span className="font-mono text-slate-300">{selectedInvoice.payment_gateway_ref || selectedInvoice.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Masa Berlaku S/d:</span>
                <span className="font-bold text-emerald-400">
                  {selectedInvoice.expires_at ? new Date(selectedInvoice.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </span>
              </div>
              {selectedInvoice.notes && (
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
                  <span className="text-slate-400 block font-semibold mb-0.5">Catatan Admin / Troubleshooting:</span>
                  {selectedInvoice.notes}
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-300 font-bold">Total Pembayaran:</span>
                <span className="text-base font-black text-white">
                  {canViewFinance ? formatRupiah(selectedInvoice.amount) : 'Rp ••••••••'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Tutup Kwitansi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
