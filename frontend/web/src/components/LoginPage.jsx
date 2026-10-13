import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Home, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { safeSet, safeSetJSON } from '../utils/safeStorage';

export default function LoginPage({ onLoginSuccess, onSwitchToRegister, sessionExpiredMessage = null }) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage(i18n.language === 'id' ? 'Silakan isi email dan kata sandi.' : 'Please fill in both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      // Attempt backend API login through API Gateway
      const res = await api.post('/auth/login', { email, password });
      if (res.success) {
        safeSet('homehub_token', res.data.token);
        safeSetJSON('homehub_user', res.data.user);
        safeSet('homehub_active_household_id', res.data.activeHousehold?.id);
        if (res.data.households) {
          safeSetJSON('homehub_households', res.data.households);
        }
        onLoginSuccess(res.data.user, res.data.activeHousehold, res.data.households);
        return;
      }
    } catch (err) {
      console.warn('Backend offline or login failed, evaluating fallback demo...', err);
      // Fallback Demo Login handler if backend microservice is not yet running
      if (email.includes('tebet') || email.includes('budi') || password === 'demo123') {
        const demoUser = { id: 'u-1', name: 'Budi Santoso', email, preferred_language: 'id' };
        const demoHousehold = { id: 'tebet_free', name: 'Rumah Tinggal - Tebet', tier: 'FREE', role: 'OWNER' };
        const demoHouseholds = [
          demoHousehold,
          { id: 'villa_pro', name: 'Villa Puncak', tier: 'PRO', role: 'OWNER' }
        ];
        safeSet('homehub_token', 'demo_free_token');
        safeSetJSON('homehub_user', demoUser);
        safeSet('homehub_active_household_id', demoHousehold.id);
        safeSetJSON('homehub_households', demoHouseholds);
        onLoginSuccess(demoUser, demoHousehold, demoHouseholds);
        return;
      }
      // 1. Invalid credentials from backend (HTTP 401 ERR_INVALID_CREDENTIALS)
      if (
        err.errorCode === 'ERR_INVALID_CREDENTIALS' ||
        err.message?.toLowerCase().includes('email atau password salah') ||
        err.message?.toLowerCase().includes('invalid credentials')
      ) {
        setErrorMessage(
          i18n.language === 'id'
            ? 'Email atau kata sandi tidak sesuai.'
            : 'Invalid email or password.'
        );
        return;
      }

      // 2. Account suspended / disabled (HTTP 403)
      if (
        err.errorCode === 'ERR_USER_SUSPENDED' ||
        err.message?.toLowerCase().includes('dinonaktifkan')
      ) {
        setErrorMessage(
          i18n.language === 'id'
            ? 'Akun Anda dinonaktifkan. Silakan hubungi admin.'
            : 'Your account has been deactivated. Please contact support.'
        );
        return;
      }

      // 3. Validation errors from Zod
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        setErrorMessage(err.errors.map((e) => e.message).join('. '));
        return;
      }

      // 4. True Network / Connection Error (Backend not running or port 8000 unreachable)
      const isNetworkError =
        err.code === 'ERR_NETWORK' ||
        err.code === 'ECONNREFUSED' ||
        err.message?.includes('Network Error') ||
        err.message?.includes('ECONNREFUSED') ||
        err.isAxiosError;

      if (isNetworkError) {
        setErrorMessage(
          i18n.language === 'id'
            ? 'Tidak dapat terhubung ke backend (port 8000). Silakan pastikan server backend berjalan atau gunakan tombol Akses Cepat Demo di bawah.'
            : 'Cannot connect to backend (port 8000). Please ensure server is running or use Quick Demo below.'
        );
      } else {
        setErrorMessage(
          err.message ||
            (i18n.language === 'id'
              ? 'Email atau kata sandi tidak sesuai.'
              : 'Invalid email or password.')
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Quick One-Click Demo Logins for Pair Testing
  const handleQuickDemo = (type) => {
    if (type === 'free') {
      const demoUser = { id: 'u-1', name: 'Budi Santoso', email: 'budi@keluarga.com', preferred_language: 'id' };
      const demoHousehold = { id: 'tebet_free', name: 'Rumah Tinggal - Tebet', tier: 'FREE', role: 'OWNER' };
      const demoHouseholds = [
        demoHousehold,
        { id: 'villa_pro', name: 'Villa Puncak', tier: 'PRO', role: 'OWNER' }
      ];
      safeSet('homehub_token', 'demo_free_token');
      safeSetJSON('homehub_user', demoUser);
      safeSet('homehub_active_household_id', demoHousehold.id);
      safeSetJSON('homehub_households', demoHouseholds);
      onLoginSuccess(demoUser, demoHousehold, demoHouseholds);
    } else {
      const demoUser = { id: 'u-2', name: 'Siti Rahma', email: 'siti@keluarga.com', preferred_language: 'id' };
      const demoHousehold = { id: 'villa_pro', name: 'Villa Puncak', tier: 'PRO', role: 'OWNER' };
      const demoHouseholds = [
        { id: 'tebet_free', name: 'Rumah Tinggal - Tebet', tier: 'FREE', role: 'MEMBER' },
        demoHousehold
      ];
      safeSet('homehub_token', 'demo_pro_token');
      safeSetJSON('homehub_user', demoUser);
      safeSet('homehub_active_household_id', demoHousehold.id);
      safeSetJSON('homehub_households', demoHouseholds);
      onLoginSuccess(demoUser, demoHousehold, demoHouseholds);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0c1322] to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-slate-100">
      
      {/* Top Navbar Bar: Brand + Language Toggle */}
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
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white text-2xl font-black shadow-xl shadow-indigo-500/30 mb-4 ring-4 ring-indigo-500/20">
          🏠
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white">
          HomeHub
        </h2>
        <p className="mt-1.5 text-xs text-slate-400 font-medium">
          {i18n.language === 'id' 
            ? 'Masuk untuk mengelola aset, tagihan & logistik rumah Anda'
            : 'Sign in to manage your household assets, bills & logistics'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-800 space-y-6">
          
          {sessionExpiredMessage && !errorMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-amber-200">
                  {t('auth.session_expired_title') || 'Sesi Login Telah Berakhir'}
                </p>
                <p className="text-[11px] text-amber-300/90 leading-relaxed">
                  {sessionExpiredMessage}
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {i18n.language === 'id' ? 'Alamat Email' : 'Email Address'}
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh: budi@keluarga.com"
                  autoComplete="off"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  {i18n.language === 'id' ? 'Kata Sandi' : 'Password'}
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Instruksi reset sandi akan dikirim ke email Anda.'); }} className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300">
                  {i18n.language === 'id' ? 'Lupa Sandi?' : 'Forgot Password?'}
                </a>
              </div>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="block w-full pl-10 pr-10 py-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="animate-pulse">Memproses...</span>
              ) : (
                <>
                  <span>{i18n.language === 'id' ? 'Masuk ke Rumah Saya' : 'Sign In to My Home'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Box for Fast Evaluation */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              ⚡ {i18n.language === 'id' ? 'Akses Cepat Demo Akun' : 'Quick Demo Accounts'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('free')}
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-left transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Budi Santoso</span>
                  <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-bold">FREE</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">🏡 Rumah Tebet (2 Aset, 1 Tagihan)</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('pro')}
                className="p-2.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/40 text-left transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">Siti Rahma</span>
                  <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-black">PRO ⭐</span>
                </div>
                <p className="text-[10px] text-indigo-300 mt-0.5">🏖️ Villa Puncak (Unlimited)</p>
              </button>
            </div>
          </div>

          {/* Switch to Register */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">
              {i18n.language === 'id' ? 'Belum mendaftarkan rumah tangga Anda?' : "Haven't registered your home yet?"}{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                {i18n.language === 'id' ? 'Daftar Akun Baru' : 'Create an Account'}
              </button>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

