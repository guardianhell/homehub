import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { ADMIN_ROLES } from '../utils/rbac';

export default function AdminLoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Silakan isi email dan kata sandi admin.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await api.post('/admin/login', { email, password });
      if (res.data && res.data.success) {
        const { token, user } = res.data.data;
        const role = ADMIN_ROLES[user?.role] || ADMIN_ROLES.SUPERADMIN;
        localStorage.setItem('homehub_admin_token', token);
        localStorage.setItem('homehub_admin_user', JSON.stringify(user));
        localStorage.setItem('homehub_admin_role_id', role.id);
        onLoginSuccess(token, user, role);
      } else {
        setErrorMessage(res.data?.message || 'Login gagal.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Gagal menghubungi server otentikasi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDevLogin = async () => {
    setEmail('admin@homehub.app');
    setPassword('admin123');
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await api.post('/admin/login', {
        email: 'admin@homehub.app',
        password: 'admin123',
      });
      if (res.data && res.data.success) {
        const { token, user } = res.data.data;
        const role = ADMIN_ROLES[user?.role] || ADMIN_ROLES.SUPERADMIN;
        localStorage.setItem('homehub_admin_token', token);
        localStorage.setItem('homehub_admin_user', JSON.stringify(user));
        localStorage.setItem('homehub_admin_role_id', role.id);
        onLoginSuccess(token, user, role);
      } else {
        setErrorMessage(res.data?.message || 'Login dev gagal.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Koneksi gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-full" />

        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-indigo-600 text-3xl shadow-lg shadow-emerald-500/20 text-white mb-4">
            🛡️
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">HomeHub Admin</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Portal Akses BackOffice & Operasional Sistem
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-xs leading-relaxed animate-in fade-in">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1 font-semibold">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Email Administrator
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@homehub.app"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Memverifikasi Sesi...</span>
            ) : (
              <>
                <span>Masuk ke BackOffice</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Dev helper */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={handleQuickDevLogin}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer flex items-center justify-center gap-1 mx-auto"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Gunakan Kredensial Default (admin@homehub.app)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
