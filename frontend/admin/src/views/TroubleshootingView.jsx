import React, { useState } from 'react';
import { 
  Wrench, 
  Sparkles, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  LifeBuoy, 
  ArrowRight,
  Clock,
  PhoneCall,
  Calendar
} from 'lucide-react';
import { hasPermission } from '../utils/rbac';

export default function TroubleshootingView({ 
  members, 
  tenants, 
  onOpenActivatePro, 
  onSelectMember, 
  onSelectTenant, 
  onToggleUserStatus, 
  currentRole 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  const canActivatePro = hasPermission(currentRole.id, 'activate_pro_manual');
  const canEditMembers = hasPermission(currentRole.id, 'edit_members');

  // Search member or tenant for diagnosis
  const matchedUsers = (members || []).filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.phone && m.phone.includes(searchQuery))
  );

  const matchedTenants = (tenants || []).filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.owner_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showNotification = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" />
              Pusat Kendali & Troubleshooting Pelanggan
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Helpdesk & Support Center
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Alat investigasi cepat kendala aktivasi paket PRO, pembukaan blokir akun, serta verifikasi keluhan transaksi pelanggan.
          </p>
        </div>

        {canActivatePro && (
          <button
            onClick={() => onOpenActivatePro(null)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Form Bypass PRO Manual</span>
          </button>
        )}
      </div>

      {/* Quick Lookup & Diagnostic Tool */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-md space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Alat Diagnostik Cepat Akun Pelanggan</h3>
        </div>
        <p className="text-xs text-slate-400">
          Masukkan email, nama pemilik, atau nomor HP pelanggan yang komplain pembayaran/kendala akses untuk memuat profil lengkapnya:
        </p>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari user: contohnya calvin@homehub.app, rina, atau 0812..."
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Results preview */}
        {searchQuery.trim().length > 1 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-300">Hasil Pencarian Anggota:</h4>
            {matchedUsers.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
                Tidak ada user dengan kata kunci "{searchQuery}"
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchedUsers.map(user => {
                  const isPro = user.highest_tier === 'PRO';
                  const isSuspended = user.status === 'SUSPENDED';

                  return (
                    <div key={user.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 transition flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-white text-xs">{user.name}</div>
                            <div className="text-[11px] text-slate-400">{user.email} • {user.phone}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isPro ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-700 text-slate-300 border-slate-600'
                          }`}>
                            {user.highest_tier}
                          </span>
                        </div>

                        <div className="mt-2 text-[11px] space-y-0.5">
                          <div className="text-slate-400">
                            Status Akun: <strong className={isSuspended ? 'text-rose-400' : 'text-emerald-400'}>{user.status}</strong>
                          </div>
                          <div className="text-slate-400">
                            Masa Aktif: <strong className="text-slate-200">{user.pro_valid_until ? new Date(user.pro_valid_until).toLocaleDateString('id-ID') : 'FREE'}</strong>
                          </div>
                          <div className="text-slate-400">
                            Rumah Terhubung: <strong className="text-slate-200">{user.households.length} unit</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => onSelectMember(user)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex-1 text-center transition cursor-pointer"
                        >
                          Buka Profil
                        </button>

                        {canActivatePro && (
                          <button
                            onClick={() => {
                              const primaryTenant = tenants.find(t => t.owner_id === user.id) || tenants[0];
                              onOpenActivatePro(primaryTenant);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex-1 text-center transition cursor-pointer"
                          >
                            Aktivasi PRO
                          </button>
                        )}

                        {canEditMembers && isSuspended && (
                          <button
                            onClick={() => {
                              onToggleUserStatus(user.id, 'ACTIVE');
                              showNotification(`Akun ${user.name} berhasil dipulihkan!`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
                          >
                            Unsuspend
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Troubleshooting Playbooks & FAQ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Playbook 1 */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="text-xs font-bold text-white">Kasus: Pelanggan Sudah Transfer Tapi Tetap FREE</h4>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Terkadang webhook dari payment gateway (Midtrans/Xendit) terlambat atau nasabah menggunakan transfer manual via teller/ATM tanpa kode unik.
          </p>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <span className="font-semibold text-amber-400 block">Solusi Helpdesk:</span>
            <span>1. Minta bukti struk / mutasi bank pelanggan.</span>
            <br />
            <span>2. Buka menu <strong>"Aktivasi PRO Manual"</strong> di atas.</span>
            <br />
            <span>3. Masukkan nomor referensi transfer dan pilih durasi 12 bulan. Sistem akan langsung meng-upgrade akun secara instan tanpa menunggu callback.</span>
          </div>
        </div>

        {/* Playbook 2 */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="text-xs font-bold text-white">Kasus: Batas Kuota Anggota Keluarga Tercapai</h4>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Paket Free memiliki batas maksimal 5 anggota per rumah. Jika pemilik rumah ingin menambahkan ART, supir, atau anak lainnya, sistem memblokir penambahan.
          </p>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <span className="font-semibold text-blue-400 block">Solusi CS / Helpdesk:</span>
            <span>1. Jelaskan manfaat paket <strong>PRO Edition</strong> (Unlimited anggota, multi-rumah, ekspor PDF).</span>
            <br />
            <span>2. Berikan instruksi upgrade via aplikasi web/mobile atau bantu proses aktivasi melalui tautan pembayaran khusus.</span>
          </div>
        </div>

        {/* Playbook 3 */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="text-xs font-bold text-white">Kasus: Akun Terkunci / Ditangguhkan (Suspended)</h4>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Sistem keamanan otomatis menangguhkan akun jika terdeteksi percobaan brute-force login atau pendaftaran bot berulang.
          </p>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <span className="font-semibold text-rose-400 block">Solusi Verifikasi Identitas:</span>
            <span>1. Lakukan verifikasi identitas (nama & nomor HP via SMS OTP / WA).</span>
            <br />
            <span>2. Klik tombol <strong>"Pulihkan Akun"</strong> pada kartu profil user untuk mengembalikan akses login ke ACTIVE.</span>
          </div>
        </div>

        {/* Playbook 4 */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              4
            </div>
            <h4 className="text-xs font-bold text-white">Kasus: Permintaan Pembatalan / Refund Langganan</h4>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Pengguna tidak sengaja berlangganan dua kali atau meminta refund dalam periode garansi 7 hari pertama.
          </p>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <span className="font-semibold text-emerald-400 block">Solusi Finance & Superadmin:</span>
            <span>1. Buka menu <strong>"Tenant / Rumah"</strong>.</span>
            <br />
            <span>2. Klik tombol <strong>"Downgrade ke FREE"</strong> untuk membatalkan paket PRO dan mengembalikan status ke Free secara aman. Tindakan akan tercatat pada Audit Log.</span>
          </div>
        </div>
      </div>

    </div>
  );
}
