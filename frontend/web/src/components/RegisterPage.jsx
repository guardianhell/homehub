import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Lock, Phone, Home, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { safeSet, safeSetJSON } from '../utils/safeStorage';

export default function RegisterPage({ onRegisterSuccess, onSwitchToLogin }) {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    household_name: 'Rumah Utama Keluarga',
    preferred_language: 'id'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOfflineError, setIsOfflineError] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleDemoFallback = () => {
    const newUser = {
      id: `u-${Date.now()}`,
      name: formData.name.trim() || (i18n.language === 'id' ? 'Pengguna Baru' : 'New User'),
      email: formData.email.trim() || 'user@keluarga.com',
      preferred_language: i18n.language
    };
    const newHousehold = {
      id: `hh-${Date.now()}`,
      name: formData.household_name.trim() || (i18n.language === 'id' ? 'Rumah Baru' : 'New Household'),
      tier: 'FREE',
      role: 'OWNER'
    };
    safeSet('homehub_token', `token_${Date.now()}`);
    safeSetJSON('homehub_user', newUser);
    safeSet('homehub_active_household_id', newHousehold.id);
    safeSetJSON('homehub_households', [newHousehold]);
    onRegisterSuccess(newUser, newHousehold, [newHousehold], true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsOfflineError(false);

    // 1. Client-side Form Validation
    const nameTrimmed = formData.name.trim();
    if (nameTrimmed.length < 2) {
      setErrorMessage(i18n.language === 'id' ? 'Nama lengkap minimal 2 karakter.' : 'Full name must be at least 2 characters.');
      return;
    }

    const emailTrimmed = formData.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setErrorMessage(i18n.language === 'id' ? 'Format alamat email tidak valid.' : 'Invalid email address format.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage(i18n.language === 'id' ? 'Kata sandi minimal 6 karakter.' : 'Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setErrorMessage(i18n.language === 'id' ? 'Konfirmasi kata sandi tidak cocok.' : 'Password confirmation does not match.');
      return;
    }

    const householdTrimmed = formData.household_name.trim();
    if (householdTrimmed.length < 2) {
      setErrorMessage(i18n.language === 'id' ? 'Nama rumah tangga minimal 2 karakter.' : 'Household name must be at least 2 characters.');
      return;
    }

    setIsLoading(true);
    try {
      // Send real registration payload to API Gateway /auth/register
      const res = await api.post('/auth/register', {
        name: nameTrimmed,
        email: emailTrimmed,
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        household_name: householdTrimmed,
        preferred_language: i18n.language
      });

      if (res.success && res.data) {
        safeSet('homehub_token', res.data.token);
        safeSetJSON('homehub_user', res.data.user);
        safeSet('homehub_active_household_id', res.data.activeHousehold?.id);
        const householdsList = res.data.households || [res.data.activeHousehold];
        safeSetJSON('homehub_households', householdsList);

        alert(i18n.language === 'id' 
          ? `Pendaftaran berhasil! Akun "${res.data.user.name}" dan rumah tangga "${res.data.activeHousehold.name}" telah tersimpan di database.` 
          : `Registration successful! Account "${res.data.user.name}" saved to database.`
        );
        onRegisterSuccess(res.data.user, res.data.activeHousehold, householdsList, true);
        return;
      } else {
        throw new Error(res.message || 'Pendaftaran gagal diproses oleh server.');
      }
    } catch (err) {
      console.error('Backend registration error:', err);

      // Handle backend validation errors from Zod
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const detailMsg = err.errors.map(e => e.message).join('. ');
        setErrorMessage(detailMsg);
      } else if (err.errorCode === 'ERR_EMAIL_EXISTS' || (err.message && err.message.toLowerCase().includes('email sudah terdaftar'))) {
        setErrorMessage(i18n.language === 'id' 
          ? 'Email ini sudah terdaftar. Silakan gunakan email lain atau login.' 
          : 'This email is already registered. Please sign in or use a different email.'
        );
      } else if (
        err.errorCode === 'ERR_DATABASE_UNAVAILABLE' ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('AggregateError') ||
        err.message?.includes('Database MySQL') ||
        err.code === 'ERR_NETWORK' ||
        (err.isAxiosError && !err.response) ||
        err.message?.includes('Network Error')
      ) {
        setIsOfflineError(true);
        setErrorMessage(i18n.language === 'id'
          ? 'MySQL database belum aktif atau koneksi ditolak (ECONNREFUSED). Silakan jalankan "npm run db:up" di terminal, atau klik tautan di bawah untuk mendaftar akun baru secara langsung.'
          : 'MySQL database is not active or connection refused (ECONNREFUSED). Please run "npm run db:up" in terminal, or click below to register standalone.'
        );
      } else {
        setErrorMessage(err.message || (i18n.language === 'id' ? 'Gagal mendaftarkan akun. Silakan coba lagi.' : 'Failed to register account. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0c1322] to-indigo-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans antialiased text-slate-100">
      
      {/* Top Language Toggle */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <div className="flex items-center bg-slate-800/80 backdrop-blur-md rounded-full p-0.5 text-xs font-bold text-slate-400 border border-slate-700">
          <button
            onClick={() => i18n.changeLanguage('id')}
            className={`px-3 py-1 rounded-full transition ${i18n.language === 'id' ? 'bg-indigo-600 text-white shadow-xs' : 'hover:text-white'}`}
          >
            ID
          </button>
          <button
            onClick={() => i18n.changeLanguage('en')}
            className={`px-3 py-1 rounded-full transition ${i18n.language === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'hover:text-white'}`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white text-2xl font-black shadow-xl shadow-indigo-500/30 mb-3 ring-4 ring-indigo-500/20">
          🏠
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {i18n.language === 'id' ? 'Daftar Akun Keluarga' : 'Register Family Account'}
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          {i18n.language === 'id' 
            ? 'Mulai kelola rumah tangga Anda secara rapi, aman, dan terpadu' 
            : 'Start managing your household safely and seamlessly'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl py-7 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-800 space-y-5">
          
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
              {isOfflineError && (
                <div className="pt-2.5 border-t border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-300">
                    💡 <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300 font-mono">npm run db:up</code> {i18n.language === 'id' ? 'untuk menyalakan MySQL' : 'to start MySQL'}
                  </span>
                  <button
                    type="button"
                    onClick={handleDemoFallback}
                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer text-left sm:text-right"
                  >
                    {i18n.language === 'id' ? 'Lanjut Pendaftaran (Mode Bersih Mandiri)' : 'Continue Registration (Standalone Clean)'}
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {i18n.language === 'id' ? 'Nama Lengkap Anda' : 'Full Name'} *
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="contoh: Calvin Hendry"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {i18n.language === 'id' ? 'Alamat Email' : 'Email Address'} *
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contoh: calvin@keluarga.com"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {i18n.language === 'id' ? 'Kata Sandi (Minimal 6 Karakter)' : 'Password (Min 6 Characters)'} *
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {i18n.language === 'id' ? 'Ulangi Kata Sandi' : 'Confirm Password'} *
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Ketik ulang kata sandi"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {i18n.language === 'id' ? 'No. WhatsApp / Telepon (Opsional)' : 'Phone / WhatsApp (Optional)'}
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="contoh: 08123456789"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Initial Household Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {i18n.language === 'id' ? 'Nama Rumah Pertama' : 'First Household Name'} *
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Home className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="household_name"
                  value={formData.household_name}
                  onChange={handleChange}
                  placeholder="misal: Rumah Cemara Indah"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                  minLength={2}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {i18n.language === 'id' ? 'Anda otomatis menjadi Kepala Keluarga (Owner).' : 'You will be set as the Family Owner.'}
              </p>
            </div>

            {/* Free Plan Inclusions Card */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Paket FREE Otomatis Aktif</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Termasuk kuota 2 aset, 1 tagihan rutin, 3 catatan belanja, dan 5 pengeluaran bulanan tanpa batas waktu.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="animate-pulse">Menghubungkan ke Database...</span>
              ) : (
                <>
                  <span>{i18n.language === 'id' ? 'Buat Akun & Simpan ke Database' : 'Create Account & Save to Database'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="text-center pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-400">
              {i18n.language === 'id' ? 'Sudah memiliki akun?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                {i18n.language === 'id' ? 'Masuk di Sini' : 'Sign In'}
              </button>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

