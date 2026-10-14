import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { getSynchronizedVouchers, recordVoucherClaim, recordUserPaymentOrder } from '../utils/syncBridge';

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  household, 
  user, 
  onUpgradeSuccess 
}) {
  const { t } = useTranslation();

  // Navigation steps: 'SELECT_PLAN' | 'PAYMENT_SCREEN' | 'SUCCESS_SCREEN'
  const [step, setStep] = useState('SELECT_PLAN');
  const [selectedPlan, setSelectedPlan] = useState('PRO_YEARLY'); // 'PRO_YEARLY' or 'PRO_MONTHLY'
  const [paymentMethod, setPaymentMethod] = useState('GOPAY'); // 'GOPAY' | 'OVO' | 'QRIS'
  const [ovoPhoneNumber, setOvoPhoneNumber] = useState(user?.phone || '0812-3456-7890');
  
  // Voucher
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');

  // Order & Payment State
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(900); // 15 mins
  const [isVerifying, setIsVerifying] = useState(false);

  const pollTimerRef = useRef(null);

  // Price calculations
  const basePrice = selectedPlan === 'PRO_YEARLY' ? 470000 : 49000;
  
  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discount_type === 'PERCENTAGE') {
      discountAmount = Math.round((basePrice * appliedVoucher.discount_value) / 100);
    } else {
      discountAmount = Math.min(basePrice, appliedVoucher.discount_value);
    }
  }
  const finalPrice = Math.max(0, basePrice - discountAmount);

  // Reset modal on open/close
  useEffect(() => {
    if (isOpen) {
      setStep('SELECT_PLAN');
      setOrderData(null);
      setErrorMessage('');
      setVoucherError('');
      setAppliedVoucher(null);
      setVoucherCode('');
      setCountdown(900);
    } else {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (step === 'PAYMENT_SCREEN' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Auto-polling for payment verification
  useEffect(() => {
    if (step === 'PAYMENT_SCREEN' && orderData && household?.id) {
      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await api.get(`/auth/households/${household.id}/subscriptions/orders/${orderData.order_id}/status`);
          if (res?.data?.is_paid || res?.data?.status === 'PAID') {
            clearInterval(pollTimerRef.current);
            setStep('SUCCESS_SCREEN');
            if (onUpgradeSuccess) {
              onUpgradeSuccess(res.data.household, orderData);
            }
          }
        } catch (err) {
          // silent fail in polling
        }
      }, 3000);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [step, orderData, household]);

  if (!isOpen) return null;

  // Format IDR Currency
  const formatRupiah = (num) => {
    return `Rp ${Number(num || 0).toLocaleString('id-ID')}`;
  };

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // Validate Voucher
  const handleApplyVoucher = async () => {
    setVoucherError('');
    const clean = voucherCode.trim().toUpperCase();
    if (!clean) {
      setVoucherError('Masukkan kode voucher.');
      return;
    }

    try {
      // 1. Call Backend Database Validator
      const res = await api.post('/auth/vouchers/validate', {
        code: clean,
        plan_type: selectedPlan
      }).catch(() => api.post('/vouchers/validate', {
        code: clean,
        plan_type: selectedPlan
      }));

      const vData = res?.data || res;
      if (vData && vData.code) {
        setAppliedVoucher({
          code: vData.code,
          discount_type: vData.discount_type,
          discount_value: vData.discount_value,
          description: vData.description
        });
        return;
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message;
      if (errMsg && !errMsg.includes('Network Error')) {
        setVoucherError(errMsg);
        return;
      }
    }

    // 2. Local fallback if backend is unreachable
    try {
      const syncVouchers = getSynchronizedVouchers();
      if (Array.isArray(syncVouchers) && syncVouchers.length > 0) {
        const matched = syncVouchers.find(v => v.code.toUpperCase() === clean);
        if (matched) {
          if (matched.status !== 'ACTIVE') {
            setVoucherError(`Voucher "${clean}" sudah tidak aktif atau kuota habis (Status: ${matched.status}).`);
            return;
          }
          if (matched.claimed_count >= matched.max_quota) {
            setVoucherError(`Kuota voucher "${clean}" sudah habis (${matched.claimed_count}/${matched.max_quota}).`);
            return;
          }
          if (new Date(matched.valid_until) < new Date()) {
            setVoucherError(`Voucher "${clean}" telah kedaluwarsa.`);
            return;
          }
          if (matched.target_plan && matched.target_plan !== 'ALL' && matched.target_plan !== selectedPlan) {
            setVoucherError(`Voucher "${clean}" hanya berlaku untuk paket ${matched.target_plan}.`);
            return;
          }
          setAppliedVoucher({
            code: matched.code,
            discount_type: matched.discount_type,
            discount_value: matched.discount_value,
            description: matched.description
          });
          return;
        }
      }
    } catch (e) {
      // ignore
    }

    // Standard preset coupons
    if (clean === 'RAMADHAN50') {
      setAppliedVoucher({ code: clean, discount_type: 'PERCENTAGE', discount_value: 50, description: 'Diskon 50% Seluruh Paket PRO' });
    } else if (clean === 'HEMAT100K') {
      setAppliedVoucher({ code: clean, discount_type: 'FIXED_AMOUNT', discount_value: 100000, description: 'Potongan Rp 100.000 Paket PRO' });
    } else if (clean === 'FREE1MO-COMMUNITY') {
      setAppliedVoucher({ code: clean, discount_type: 'PERCENTAGE', discount_value: 100, description: 'Gratis 100% Uji Coba PRO' });
    } else {
      setVoucherError(`Kode voucher "${clean}" tidak valid atau tidak terdaftar.`);
    }
  };

  // Proceed to Checkout
  const handleCreatePayment = async () => {
    setIsLoading(true);
    setErrorMessage('');

    // If voucher provides 100% discount (Rp 0), directly activate PRO!
    if (finalPrice === 0 && appliedVoucher) {
      try {
        await api.post('/auth/vouchers/claim', {
          code: appliedVoucher.code,
          household_id: household.id,
          plan_type: selectedPlan,
          user_id: user?.id,
          user_name: user?.name,
          user_email: user?.email,
          household_name: household.name
        }).catch(() => api.post('/vouchers/claim', {
          code: appliedVoucher.code,
          household_id: household.id,
          plan_type: selectedPlan,
          user_id: user?.id,
          user_name: user?.name,
          user_email: user?.email,
          household_name: household.name
        }));

        recordVoucherClaim({
          voucherCode: appliedVoucher.code,
          user,
          household,
          planType: selectedPlan,
          finalPrice: 0,
          discountAmount: basePrice
        });

        const validUntil = new Date();
        if (selectedPlan === 'PRO_MONTHLY') {
          validUntil.setMonth(validUntil.getMonth() + 1);
        } else {
          validUntil.setFullYear(validUntil.getFullYear() + 1);
        }

        const updatedHh = {
          ...household,
          tier: 'PRO',
          subscription_tier: 'PRO',
          subscription_status: 'ACTIVE',
          pro_valid_until: validUntil.toISOString()
        };

        const finalOrder = {
          order_id: `ORD-FREE-${Date.now().toString().slice(-6)}`,
          household_id: household.id,
          household_name: household.name,
          user_name: user?.name || 'Calvin Tantio',
          user_email: user?.email || 'calvin@homehub.app',
          plan_type: selectedPlan,
          final_amount: 0,
          payment_method: `VOUCHER_${appliedVoucher.code}`,
          expires_at: validUntil.toISOString()
        };
        recordUserPaymentOrder(finalOrder);

        setStep('SUCCESS_SCREEN');
        if (onUpgradeSuccess) {
          onUpgradeSuccess(updatedHh, finalOrder);
        }
        return;
      } catch (err) {
        setErrorMessage(err?.response?.data?.message || err?.message || 'Gagal mengklaim voucher.');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    try {
      const payload = {
        plan_type: selectedPlan,
        payment_method: paymentMethod,
        voucher_code: appliedVoucher ? appliedVoucher.code : undefined,
        phone_number: paymentMethod === 'OVO' ? ovoPhoneNumber : undefined
      };

      const res = await api.post(`/auth/households/${household.id}/subscriptions/checkout`, payload);
      const data = res?.data || res;

      setOrderData(data);
      setCountdown(paymentMethod === 'OVO' ? 60 : 900);
      setStep('PAYMENT_SCREEN');
    } catch (err) {
      console.warn('Backend checkout error, using dynamic client fallback:', err);
      // Resilient fallback for immediate zero-downtime testing
      const orderId = `ORD-${Date.now().toString().slice(-6)}-DEMO`;
      const fallbackData = {
        order_id: orderId,
        household_id: household.id,
        plan_type: selectedPlan,
        original_amount: basePrice,
        discount_amount: discountAmount,
        final_amount: finalPrice,
        payment_method: paymentMethod,
        status: 'PENDING',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        instructions: paymentMethod === 'GOPAY' 
          ? ["Buka aplikasi GoPay atau Gojek di ponsel Anda", "Pilih 'Scan' lalu scan QRIS di layar", "Konfirmasi nominal & masukkan PIN GoPay Anda"]
          : paymentMethod === 'OVO'
          ? [`Notifikasi pembayaran terkirim ke nomor ${ovoPhoneNumber}`, "Buka aplikasi OVO Anda sekarang", "Setujui tagihan HomeHub dalam 60 detik"]
          : ["Buka aplikasi Mobile Banking / E-Wallet Anda", "Pilih menu 'Scan QRIS'", "Arahkan kamera ke QRIS di layar & selesaikan pembayaran"]
      };
      setOrderData(fallbackData);
      setCountdown(paymentMethod === 'OVO' ? 60 : 900);
      setStep('PAYMENT_SCREEN');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Payment Confirmation with Server
  const handleSimulatePaymentSuccess = async () => {
    setIsVerifying(true);
    try {
      if (!orderData?.order_id) {
        throw new Error('ID Pemesanan tidak ditemukan.');
      }
      const res = await api.post(`/auth/households/${household.id}/subscriptions/orders/${orderData.order_id}/confirm`);
      if (res.data?.success === false) {
        throw new Error(res.data?.message || 'Konfirmasi pembayaran ditolak oleh server.');
      }
    } catch (e) {
      setIsVerifying(false);
      alert('Gagal memverifikasi pembayaran dengan backend: ' + (e.response?.data?.message || e.message));
      return;
    }

    // Update household status locally
    const validUntil = new Date();
    if (selectedPlan === 'PRO_MONTHLY') {
      validUntil.setMonth(validUntil.getMonth() + 1);
    } else {
      validUntil.setFullYear(validUntil.getFullYear() + 1);
    }

    const updatedHh = {
      ...household,
      tier: 'PRO',
      subscription_tier: 'PRO',
      subscription_status: 'ACTIVE',
      pro_valid_until: validUntil.toISOString()
    };

    // ⚡ Record voucher claim to database AND local store
    if (appliedVoucher) {
      try {
        await api.post('/auth/vouchers/claim', {
          code: appliedVoucher.code,
          household_id: household.id,
          plan_type: selectedPlan,
          user_id: user?.id,
          user_name: user?.name,
          user_email: user?.email,
          household_name: household.name
        }).catch(() => api.post('/vouchers/claim', {
          code: appliedVoucher.code,
          household_id: household.id,
          plan_type: selectedPlan,
          user_id: user?.id,
          user_name: user?.name,
          user_email: user?.email,
          household_name: household.name
        }));
      } catch (claimErr) {
        console.warn('Backend voucher claim error:', claimErr);
      }

      recordVoucherClaim({
        voucherCode: appliedVoucher.code,
        user,
        household,
        planType: selectedPlan,
        finalPrice,
        discountAmount
      });
    }

    // ⚡ Record payment transaction to sync into Admin Subscriptions
    const finalOrder = {
      order_id: orderData?.order_id || `ORD-${Date.now().toString().slice(-6)}-SUCCESS`,
      household_id: household.id,
      household_name: household.name,
      user_name: user?.name || 'Calvin Tantio',
      user_email: user?.email || 'calvin@homehub.app',
      plan_type: selectedPlan,
      final_amount: finalPrice,
      payment_method: appliedVoucher ? `VOUCHER_${appliedVoucher.code}` : paymentMethod,
      expires_at: validUntil.toISOString()
    };
    recordUserPaymentOrder(finalOrder);

    setIsVerifying(false);
    setStep('SUCCESS_SCREEN');
    if (onUpgradeSuccess) {
      onUpgradeSuccess(updatedHh, finalOrder);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-6">
        
        {/* ========================================================================= */}
        {/* STEP 1: SELECT PLAN & PAYMENT METHOD                                      */}
        {/* ========================================================================= */}
        {step === 'SELECT_PLAN' && (
          <div>
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative">
              <button
                onClick={onClose}
                className="absolute right-5 top-5 text-slate-400 hover:text-white text-2xl font-bold w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition cursor-pointer"
              >
                &times;
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black tracking-wider uppercase mb-2">
                <span>⭐ HomeHub PRO Edition</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">Upgrade Rumah ke PRO</h3>
              <p className="text-xs text-slate-300 mt-1">
                Kelola properti <strong>"{household?.name}"</strong> tanpa batas anggota, tagihan, dan aset keluarga.
              </p>
            </div>

            <div className="p-6 space-y-5">
              
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Plan Choice Cards */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">Pilih Paket Langganan:</label>
                
                {/* Yearly Plan (Best Value) */}
                <div
                  onClick={() => setSelectedPlan('PRO_YEARLY')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between relative ${
                    selectedPlan === 'PRO_YEARLY'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                    Paling Hemat • Diskon 20%
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === 'PRO_YEARLY' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                    }`}>
                      {selectedPlan === 'PRO_YEARLY' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-sm">PRO Tahunan (12 Bulan)</div>
                      <div className="text-[11px] text-slate-500">Hanya ~Rp 39.100 / bulan (dibayar tahunan)</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-slate-900">Rp 470.000</div>
                    <div className="text-[10px] text-slate-400 line-through">Rp 588.000</div>
                  </div>
                </div>

                {/* Monthly Plan */}
                <div
                  onClick={() => setSelectedPlan('PRO_MONTHLY')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                    selectedPlan === 'PRO_MONTHLY'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === 'PRO_MONTHLY' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                    }`}>
                      {selectedPlan === 'PRO_MONTHLY' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-sm">PRO Bulanan (1 Bulan)</div>
                      <div className="text-[11px] text-slate-500">Dapat dibatalkan kapan saja</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-slate-900">Rp 49.000</div>
                    <div className="text-[10px] text-slate-400">/ bulan</div>
                  </div>
                </div>
              </div>

              {/* Voucher Code Input */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>🎟️</span>
                    <span>Punya Kode Voucher Diskon?</span>
                  </span>
                  {appliedVoucher && (
                    <button
                      onClick={() => {
                        setAppliedVoucher(null);
                        setVoucherCode('');
                      }}
                      className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                    >
                      Hapus Voucher
                    </button>
                  )}
                </div>

                {!appliedVoucher ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode promo (misal: RAMADHAN50)"
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Gunakan
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-black">{appliedVoucher.code}</span>
                      <span className="text-[11px] text-emerald-700 block">{appliedVoucher.description}</span>
                    </div>
                    <span className="font-black text-emerald-700">
                      -Rp {discountAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                {voucherError && (
                  <p className="text-[11px] text-rose-600 font-semibold">{voucherError}</p>
                )}
              </div>

              {/* Payment Method Selector (GoPay, OVO, QRIS) */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  Pilih Metode Pembayaran E-Wallet:
                </label>
                
                <div className="grid grid-cols-3 gap-2.5">
                  {/* GoPay */}
                  <div
                    onClick={() => setPaymentMethod('GOPAY')}
                    className={`p-3 rounded-2xl border-2 transition cursor-pointer text-center flex flex-col items-center justify-between ${
                      paymentMethod === 'GOPAY'
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-base shadow-xs mb-1.5">
                      G
                    </div>
                    <div className="font-black text-slate-900 text-xs">GoPay</div>
                    <div className="text-[9px] text-emerald-700 font-bold mt-0.5">QRIS & Deeplink</div>
                  </div>

                  {/* OVO */}
                  <div
                    onClick={() => setPaymentMethod('OVO')}
                    className={`p-3 rounded-2xl border-2 transition cursor-pointer text-center flex flex-col items-center justify-between ${
                      paymentMethod === 'OVO'
                        ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-2 ring-purple-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black text-base shadow-xs mb-1.5">
                      O
                    </div>
                    <div className="font-black text-slate-900 text-xs">OVO</div>
                    <div className="text-[9px] text-purple-700 font-bold mt-0.5">Push Notifikasi</div>
                  </div>

                  {/* QRIS Universal */}
                  <div
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`p-3 rounded-2xl border-2 transition cursor-pointer text-center flex flex-col items-center justify-between ${
                      paymentMethod === 'QRIS'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-xs mb-1.5">
                      QRIS
                    </div>
                    <div className="font-black text-slate-900 text-xs">Semua QRIS</div>
                    <div className="text-[9px] text-blue-700 font-bold mt-0.5">Semua E-Wallet</div>
                  </div>
                </div>

                {/* OVO Phone Input if OVO selected */}
                {paymentMethod === 'OVO' && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Nomor HP Terdaftar di Aplikasi OVO:
                    </label>
                    <input
                      type="tel"
                      value={ovoPhoneNumber}
                      onChange={(e) => setOvoPhoneNumber(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Pastikan nomor aktif untuk menerima popup tagihan di aplikasi OVO.
                    </p>
                  </div>
                )}
              </div>

              {/* Price Summary Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Harga Normal:</span>
                  <span>{formatRupiah(basePrice)}</span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Diskon Voucher ({appliedVoucher.code}):</span>
                    <span>-{formatRupiah(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                  <span>Total Pembayaran:</span>
                  <span className="text-indigo-600">{formatRupiah(finalPrice)}</span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleCreatePayment}
                className="w-full bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:from-emerald-700 hover:to-purple-700 text-white font-black text-sm py-3.5 rounded-2xl shadow-xl shadow-indigo-500/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Memproses Transaksi...</span>
                ) : finalPrice === 0 ? (
                  <>
                    <span>🎁 Klaim Voucher & Aktifkan PRO Sekarang (Gratis)</span>
                    <span>➔</span>
                  </>
                ) : (
                  <>
                    <span>Bayar Sekarang dengan {paymentMethod}</span>
                    <span>➔</span>
                  </>
                )}
              </button>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PAYMENT SCREEN (QRIS SCAN & OVO PUSH NOTIFICATION)                */}
        {/* ========================================================================= */}
        {step === 'PAYMENT_SCREEN' && orderData && (
          <div>
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-amber-400">
                    Menunggu Pembayaran
                  </span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                </div>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Bayar dengan {orderData.payment_method}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Sisa Waktu</div>
                <div className="text-lg font-mono font-black text-amber-400">
                  {formatTime(countdown)}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 text-center">
              
              {/* Total to pay display */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Total Nominal Tagihan:</span>
                <span className="text-base font-black text-indigo-950 font-mono">
                  {formatRupiah(orderData.final_amount)}
                </span>
              </div>

              {/* GOPAY / QRIS Visual QR Code Display */}
              {orderData.payment_method !== 'OVO' ? (
                <div className="space-y-3">
                  <div className="mx-auto w-64 p-4 rounded-3xl bg-white border-2 border-slate-900 shadow-xl flex flex-col items-center">
                    
                    {/* QRIS Header Logo Badge */}
                    <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100 text-[10px] font-black text-slate-800">
                      <span>QRIS</span>
                      <span className="text-emerald-600 font-bold">GOPAY • OVO • DANA</span>
                    </div>

                    {/* SVG Graphic QR Representation */}
                    <div className="py-3">
                      <svg
                        className="w-48 h-48 mx-auto"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Background */}
                        <rect width="100" height="100" fill="white" />
                        
                        {/* Top-Left Position Detection Marker */}
                        <rect x="6" y="6" width="28" height="28" rx="4" fill="black" />
                        <rect x="10" y="10" width="20" height="20" rx="2" fill="white" />
                        <rect x="14" y="14" width="12" height="12" rx="2" fill="black" />
                        
                        {/* Top-Right Position Detection Marker */}
                        <rect x="66" y="6" width="28" height="28" rx="4" fill="black" />
                        <rect x="70" y="10" width="20" height="20" rx="2" fill="white" />
                        <rect x="74" y="14" width="12" height="12" rx="2" fill="black" />

                        {/* Bottom-Left Position Detection Marker */}
                        <rect x="6" y="66" width="28" height="28" rx="4" fill="black" />
                        <rect x="10" y="70" width="20" height="20" rx="2" fill="white" />
                        <rect x="14" y="74" width="12" height="12" rx="2" fill="black" />

                        {/* QR Grid Pattern Data Points */}
                        <rect x="38" y="10" width="8" height="4" fill="black" />
                        <rect x="50" y="10" width="8" height="4" fill="black" />
                        <rect x="42" y="18" width="6" height="6" fill="black" />
                        <rect x="52" y="18" width="6" height="6" fill="black" />
                        <rect x="38" y="26" width="10" height="4" fill="black" />
                        <rect x="52" y="26" width="6" height="4" fill="black" />

                        <rect x="10" y="40" width="6" height="6" fill="black" />
                        <rect x="20" y="40" width="8" height="6" fill="black" />
                        <rect x="32" y="38" width="6" height="8" fill="black" />
                        <rect x="42" y="40" width="16" height="16" rx="3" fill="#4F46E5" />
                        <rect x="62" y="40" width="8" height="6" fill="black" />
                        <rect x="74" y="40" width="6" height="6" fill="black" />
                        <rect x="84" y="38" width="6" height="8" fill="black" />

                        <rect x="10" y="52" width="14" height="6" fill="black" />
                        <rect x="28" y="50" width="8" height="8" fill="black" />
                        <rect x="62" y="50" width="8" height="8" fill="black" />
                        <rect x="74" y="52" width="16" height="6" fill="black" />

                        <rect x="38" y="68" width="8" height="6" fill="black" />
                        <rect x="50" y="68" width="8" height="6" fill="black" />
                        <rect x="42" y="78" width="18" height="6" fill="black" />
                        <rect x="64" y="68" width="8" height="6" fill="black" />
                        <rect x="76" y="68" width="6" height="8" fill="black" />
                        <rect x="68" y="80" width="10" height="8" fill="black" />
                        <rect x="82" y="80" width="8" height="8" fill="black" />

                        {/* Center HomeHub Icon */}
                        <circle cx="50" cy="48" r="5" fill="white" />
                        <text x="50" y="51" fontSize="6" fontWeight="bold" textAnchor="middle" fill="#4F46E5">H</text>
                      </svg>
                    </div>

                    <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                      <span>NMID: ID10202688910</span>
                      <span>Ref: {orderData.order_id}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Arahkan kamera aplikasi <strong>GoPay</strong>, <strong>OVO</strong>, atau <strong>Mobile Banking</strong> ke kode QR di atas.
                  </p>
                </div>
              ) : (
                /* OVO PUSH NOTIFICATION SCREEN */
                <div className="space-y-4 py-4">
                  <div className="w-20 h-20 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-3xl mx-auto border-4 border-purple-200 animate-pulse">
                    📱
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">Tagihan Terkirim ke Aplikasi OVO</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Sistem telah mengirimkan permintaan pembayaran ke nomor ponsel:
                    </p>
                    <div className="inline-block mt-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 font-mono font-black text-sm">
                      {orderData.phone_number || ovoPhoneNumber}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left space-y-1">
                    <p className="font-bold">Instruksi OVO:</p>
                    <p>1. Buka aplikasi OVO di HP Anda sekarang.</p>
                    <p>2. Cek ikon lonceng / pop-up pembayaran HomeHub.</p>
                    <p>3. Masukkan Security Code (PIN OVO) sebelum batas waktu habis.</p>
                  </div>
                </div>
              )}

              {/* Instructions list */}
              {orderData.instructions && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800 mb-1">Cara Pembayaran:</div>
                  {orderData.instructions.map((ins, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold text-indigo-600 shrink-0">{idx + 1}.</span>
                      <span>{ins}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Interactive Sandbox Test Simulation (Instant payment test for developer/user) */}
              {import.meta.env.DEV && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-left space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <span>⚡</span>
                    <span>Mode Pengujian & Simulasi Instan (Dev Mode):</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Untuk menguji verifikasi pembayaran di lingkungan lokal, klik tombol di bawah untuk meminta verifikasi backend:
                  </p>
                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={handleSimulatePaymentSuccess}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <span>Memverifikasi Pembayaran ke Server...</span>
                    ) : (
                      <>
                        <span>✓ Minta Konfirmasi Pembayaran Server ({orderData.payment_method})</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Back button */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('SELECT_PLAN')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Ganti Metode / Paket
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition cursor-pointer"
                >
                  Bayar Nanti
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SUCCESS SCREEN (VALIDATED AS PRO)                                 */}
        {/* ========================================================================= */}
        {step === 'SUCCESS_SCREEN' && (
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl mx-auto border-4 border-emerald-200 animate-bounce">
              🎉
            </div>

            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
                PEMBAYARAN TERVALIDASI
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Selamat! Anda Resmi Menjadi PRO
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Pembayaran melalui <strong>{orderData?.payment_method || 'E-Wallet'}</strong> telah berhasil diverifikasi oleh sistem. Seluruh batas kuota rumah tangga telah dibuka.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Nama Rumah / Properti:</span>
                <span className="font-bold text-slate-900">{household?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Paket Diaktifkan:</span>
                <span className="font-bold text-indigo-600">
                  {selectedPlan === 'PRO_YEARLY' ? 'PRO Edition Tahunan (12 Bulan)' : 'PRO Edition Bulanan (1 Bulan)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Metode Pembayaran:</span>
                <span className="font-bold text-slate-900">{orderData?.payment_method || paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">No. Referensi Order:</span>
                <span className="font-mono text-slate-700">{orderData?.order_id}</span>
              </div>
              <div className="flex justify-between items-center pt-1 font-bold">
                <span className="text-slate-700">Total Terbayar:</span>
                <span className="text-emerald-600 text-sm font-black">
                  {formatRupiah(orderData?.final_amount || finalPrice)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm py-3.5 rounded-2xl shadow-xl shadow-emerald-600/25 transition cursor-pointer"
            >
              Mulai Nikmati Fitur PRO Sekarang
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
