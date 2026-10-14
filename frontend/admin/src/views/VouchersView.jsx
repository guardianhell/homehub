import React, { useState, useMemo } from 'react';
import { 
  Ticket, 
  Sparkles, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  Users, 
  Calendar, 
  Printer, 
  Percent, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp,
  Clock,
  Download
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { hasPermission } from '../utils/rbac';

export default function VouchersView({ 
  vouchers = [], 
  members = [], 
  tenants = [], 
  onOpenCreateVoucher, 
  onSelectVoucher, 
  onToggleStatus, 
  currentRole,
  searchTerm = ''
}) {
  const [searchQuery, setSearchQuery] = useState(searchTerm);

  React.useEffect(() => {
    if (searchTerm !== undefined) {
      setSearchQuery(searchTerm);
    }
  }, [searchTerm]);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, EXHAUSTED, EXPIRED
  const [copiedCode, setCopiedCode] = useState('');

  const canManageVouchers = hasPermission(currentRole.id, 'manage_vouchers');
  const canExport = hasPermission(currentRole.id, 'export_data');

  // Filtered Vouchers
  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      // Search
      const matchSearch = 
        v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.generated_by_name && v.generated_by_name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      // Status Filter
      if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;

      return true;
    });
  }, [vouchers, searchQuery, statusFilter]);

  // Aggregate Metrics
  const totalVouchers = vouchers.length;
  const totalQuotaPrinted = vouchers.reduce((acc, curr) => acc + (Number(curr.max_quota) || 0), 0);
  const totalClaimed = vouchers.reduce((acc, curr) => acc + (Number(curr.claimed_count) || 0), 0);
  const claimRate = totalQuotaPrinted > 0 ? ((totalClaimed / totalQuotaPrinted) * 100).toFixed(1) : 0;
  const remainingQuota = Math.max(0, totalQuotaPrinted - totalClaimed);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleExportCSV = () => {
    if (!canExport) {
      alert('Akses Dibatasi: Role Anda tidak memiliki izin ekspor.');
      return;
    }
    const headers = ['Kode Voucher', 'Diskon', 'Paket Berlaku', 'Kuota Dicetak', 'Total Diklaim', 'Sisa Kuota', 'Status', 'Berlaku Sampai', 'Dibuat Oleh', 'Tanggal Terbit'];
    const rows = filteredVouchers.map(v => [
      v.code,
      v.discount_type === 'PERCENTAGE' ? `${v.discount_value}%` : `Rp ${v.discount_value}`,
      v.target_plan,
      v.max_quota,
      v.claimed_count,
      v.max_quota - v.claimed_count,
      v.status,
      v.valid_until.slice(0, 10),
      `"${v.generated_by_name} (${v.generated_by_role})"`,
      v.created_at.slice(0, 10)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `homehub_vouchers_${new Date().toISOString().slice(0, 10)}.csv`);
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
              <Ticket className="w-5 h-5 text-amber-400" />
              Cetak & Manajemen Voucher Diskon Membership
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Promo & Kupon
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Terbitkan kode kupon diskon satu kode untuk multi-user, atur kuota pemakaian, pantau sisa kuota, dan lacak siapa saja user yang telah mengklaim.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {canExport && (
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Ekspor CSV</span>
            </button>
          )}

          {canManageVouchers && (
            <button
              onClick={onOpenCreateVoucher}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Cetak Voucher Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Vouchers */}
        <StatCard
          title="Total Program Voucher"
          value={totalVouchers}
          subtext="Seluruh kupon diskon yang diterbitkan"
          icon={Ticket}
          colorClass="from-amber-500 to-orange-600"
          badgeText="Promo Campaign"
          badgeColor="bg-amber-500/20 text-amber-300 border-amber-500/30"
        />

        {/* Metric 2: Total Quota Printed */}
        <StatCard
          title="Total Kuota Dicetak"
          value={totalQuotaPrinted}
          subtext="Kapasitas maksimum klaim pengguna"
          icon={Users}
          colorClass="from-blue-600 to-indigo-600"
          badgeText="Target Reach"
          badgeColor="bg-blue-500/20 text-blue-300 border-blue-500/30"
        />

        {/* Metric 3: Total Claims */}
        <StatCard
          title="Voucher Berhasil Diklaim"
          value={totalClaimed}
          subtext={`Tingkat serapan klaim ${claimRate}%`}
          icon={TrendingUp}
          colorClass="from-emerald-600 to-teal-600"
          badgeText="Redemptions"
          badgeColor="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
        />

        {/* Metric 4: Sisa Kuota Tersedia */}
        <StatCard
          title="Sisa Kuota Belum Diklaim"
          value={remainingQuota}
          subtext="Kupon yang masih bisa dipakai user"
          icon={Clock}
          colorClass="from-purple-600 to-indigo-600"
          badgeText="Remaining"
          badgeColor="bg-purple-500/20 text-purple-300 border-purple-500/30"
        />
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari voucher berdasarkan kode, deskripsi promo, atau nama pembuat admin..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition font-medium"
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
          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${statusFilter === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Semua ({vouchers.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Aktif
            </button>
            <button
              onClick={() => setStatusFilter('EXHAUSTED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${statusFilter === 'EXHAUSTED' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Kuota Habis
            </button>
            <button
              onClick={() => setStatusFilter('EXPIRED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${statusFilter === 'EXPIRED' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Kedaluwarsa
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/50">
          <span>Menampilkan <strong className="text-white">{filteredVouchers.length}</strong> dari {vouchers.length} voucher</span>
          <span>Sistem tracking otomatis merekam nama staf pembuat, waktu cetak, dan daftar user yang mengklaim.</span>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 font-bold">Kode Voucher & Promo</th>
                <th className="px-4 py-3 font-bold">Besar Diskon</th>
                <th className="px-4 py-3 font-bold">Penggunaan Kuota Klaim</th>
                <th className="px-4 py-3 font-bold">Diterbitkan Oleh & Tanggal</th>
                <th className="px-4 py-3 font-bold">Masa Berlaku</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    <Ticket className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold text-slate-400">Tidak ada voucher yang cocok</p>
                    <p className="text-[11px] text-slate-500 mt-1">Coba ubah kata kunci atau buat voucher baru di tombol atas.</p>
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => {
                  const isPercentage = v.discount_type === 'PERCENTAGE';
                  const remaining = Math.max(0, v.max_quota - v.claimed_count);
                  const percentClaimed = Math.round((v.claimed_count / v.max_quota) * 100);
                  const isCopied = copiedCode === v.code;

                  return (
                    <tr key={v.id} className="hover:bg-slate-700/40 transition">
                      
                      {/* Code & Description */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30 font-bold mt-0.5">
                            <Ticket className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-amber-400 text-sm tracking-wider">{v.code}</span>
                              <button
                                onClick={() => handleCopy(v.code)}
                                className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition cursor-pointer"
                                title="Salin kode voucher"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-300 font-medium mt-0.5 line-clamp-1 max-w-xs">
                              {v.description}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              Paket: <strong>{v.target_plan === 'ALL' ? 'Semua PRO' : v.target_plan}</strong>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {isPercentage ? `${v.discount_value}% OFF` : `Rp ${Number(v.discount_value).toLocaleString('id-ID')}`}
                        </span>
                      </td>

                      {/* Quota Meter */}
                      <td className="px-4 py-3.5">
                        <div className="w-40 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-white">{v.claimed_count} / {v.max_quota} klaim</span>
                            <span className="text-slate-400 text-[10px]">{percentClaimed}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentClaimed >= 100 ? 'bg-rose-500' : percentClaimed > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percentClaimed}%` }}
                            ></div>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Sisa: <strong className="text-slate-200">{remaining} user</strong>
                          </div>
                        </div>
                      </td>

                      {/* Generated By */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-white text-xs flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                          <span>{v.generated_by_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Role: <span className="font-semibold text-purple-300">{v.generated_by_role}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(v.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>

                      {/* Valid Until */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-slate-300 font-medium text-xs">
                          {new Date(v.valid_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Pukul 23:59 WIB
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          v.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : v.status === 'EXHAUSTED'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          {v.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3" />}
                          {v.status === 'EXHAUSTED' && <AlertCircle className="w-3 h-3" />}
                          {v.status === 'EXPIRED' && <Clock className="w-3 h-3" />}
                          <span>{v.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectVoucher(v)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                            title="Buka rincian & daftar user yang klaim"
                          >
                            <span>Detail & Klaim ({v.claimed_count})</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => onSelectVoucher(v)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition cursor-pointer"
                            title="Cetak voucher slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
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
