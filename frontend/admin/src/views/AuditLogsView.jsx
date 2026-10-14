import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  UserX, 
  UserCheck, 
  RefreshCw,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Tag
} from 'lucide-react';
import { hasPermission } from '../utils/rbac';
import { adminData } from '../services/adminData';

export default function AuditLogsView({ auditLogs, currentRole, searchTerm = '' }) {
  const [searchQuery, setSearchQuery] = useState(searchTerm);

  useEffect(() => {
    if (searchTerm !== undefined) {
      setSearchQuery(searchTerm);
    }
  }, [searchTerm]);
  const [filterAction, setFilterAction] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // Paginated state
  const [logsData, setLogsData] = useState({
    items: Array.isArray(auditLogs) ? auditLogs.slice(0, 10) : [],
    pagination: {
      total: Array.isArray(auditLogs) ? auditLogs.length : 0,
      page: 1,
      limit: 10,
      totalPages: Math.ceil((auditLogs?.length || 0) / 10) || 1,
      hasNextPage: false,
      hasPrevPage: false
    }
  });

  const canExport = hasPermission(currentRole.id, 'export_data');

  // Load paginated data from backend API with fallback
  const loadLogs = async (page = currentPage, limit = pageSize, search = searchQuery, action = filterAction) => {
    setIsLoading(true);
    try {
      const res = await adminData.fetchAuditLogsPaginated({
        page,
        limit,
        search,
        action
      });
      if (res && res.pagination) {
        setLogsData(res);
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when page, page size, or filter changes
  useEffect(() => {
    loadLogs(currentPage, pageSize, searchQuery, filterAction);
  }, [currentPage, pageSize, filterAction]);

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadLogs(1, pageSize, searchQuery, filterAction);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const items = logsData.items || [];
  const pagination = logsData.pagination || {};
  const totalLogs = pagination.total || 0;
  const totalPages = pagination.totalPages || 1;

  const getActionBadge = (action) => {
    if (action.includes('ACTIVATE_PRO')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <Sparkles className="w-3 h-3" />
          Aktivasi PRO Manual
        </span>
      );
    }
    if (action.includes('SUSPEND_USER')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <UserX className="w-3 h-3" />
          Penangguhan Akun
        </span>
      );
    }
    if (action.includes('ACTIVATE_USER')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <UserCheck className="w-3 h-3" />
          Pemulihan Akun
        </span>
      );
    }
    if (action.includes('DOWNGRADE')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600">
          <RefreshCw className="w-3 h-3" />
          Downgrade ke FREE
        </span>
      );
    }
    if (action.includes('VOUCHER')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          <Tag className="w-3 h-3" />
          Voucher Promo
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
        {action}
      </span>
    );
  };

  const handleExportCSV = () => {
    if (!canExport) {
      alert('Akses Dibatasi: Role Anda tidak memiliki izin ekspor.');
      return;
    }
    const sanitizeCSV = (val) => {
      if (val == null) return '""';
      let str = String(val);
      if (/^[=+\-@\t\r]/.test(str)) str = "'" + str;
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = ['Waktu', 'Nama Admin', 'Role Admin', 'Tindakan', 'Target ID', 'Target', 'Rincian & Alasan'];
    const rows = items.map(l => [
      sanitizeCSV(l.timestamp),
      sanitizeCSV(l.admin_name),
      sanitizeCSV(l.admin_role),
      sanitizeCSV(l.action),
      sanitizeCSV(l.target_id),
      sanitizeCSV(l.target_name),
      sanitizeCSV(l.details)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `homehub_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPageNumbers = (current, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Rekam Jejak Aktivitas Operasional (Audit Trail)
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Compliance & Security
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Setiap aksi sensitif (aktivasi manual, perubahan status, generate voucher, pembatalan paket) tercatat permanen di database dengan API paginated.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => loadLogs()}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Segarkan Data Log"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span>Segarkan</span>
          </button>

          {canExport && (
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Ekspor CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama petugas admin, objek sasaran, atau rincian tindakan..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-700 text-xs overflow-x-auto">
            {[
              { id: 'ALL', label: 'Semua Aksi' },
              { id: 'ACTIVATE', label: 'Aktivasi PRO' },
              { id: 'SUSPEND', label: 'Suspend / Blokir' },
              { id: 'DOWNGRADE', label: 'Downgrade' },
              { id: 'VOUCHER', label: 'Voucher Promo' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFilterAction(f.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                  filterAction === f.id ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 font-bold">Waktu & Tanggal</th>
                <th className="px-4 py-3 font-bold">Petugas Admin (Actor)</th>
                <th className="px-4 py-3 font-bold">Jenis Tindakan</th>
                <th className="px-4 py-3 font-bold">Objek Sasaran</th>
                <th className="px-4 py-3 font-bold">Rincian & Justifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 text-indigo-400 animate-spin" />
                    <p className="font-semibold text-xs">Memuat halaman data audit log dari database...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <Clock className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold text-slate-400">Tidak ada catatan audit yang cocok</p>
                  </td>
                </tr>
              ) : (
                items.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                  const formattedTime = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={log.id} className="hover:bg-slate-700/40 transition">
                      {/* Timestamp */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-white text-xs">{formattedDate}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formattedTime} WIB</span>
                        </div>
                      </td>

                      {/* Admin Actor */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-200 text-xs">{log.admin_name}</div>
                        <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700 mt-1">
                          Role: {log.admin_role}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Target */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white text-xs">{log.target_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {log.target_id}</div>
                      </td>

                      {/* Details */}
                      <td className="px-4 py-3.5">
                        <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded-xl border border-slate-700/60">
                          {log.details}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Controls */}
        <div className="p-4 border-t border-slate-700/80 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          
          {/* Left: Record summary */}
          <div className="flex items-center gap-1.5">
            <span>Menampilkan</span>
            <span className="font-bold text-white">
              {totalLogs === 0 ? 0 : (currentPage - 1) * pageSize + 1} – {Math.min(currentPage * pageSize, totalLogs)}
            </span>
            <span>dari</span>
            <span className="font-bold text-white">{totalLogs}</span>
            <span>catatan audit</span>
          </div>

          {/* Center: Pagination Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {getPageNumbers(currentPage, totalPages).map((p, idx) => (
                p === '...' ? (
                  <span key={`dots-${idx}`} className="px-1.5 text-slate-500">...</span>
                ) : (
                  <button
                    key={`page-${p}`}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                      currentPage === p
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                )
              ))}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Items per page selector */}
          <div className="flex items-center gap-2">
            <span>Baris per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

        </div>
      </div>

    </div>
  );
}
