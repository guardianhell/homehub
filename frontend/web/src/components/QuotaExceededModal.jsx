import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Crown, 
  Sparkles, 
  ArrowRight, 
  Check, 
  AlertTriangle,
  Sliders,
  ShieldAlert
} from 'lucide-react';

export default function QuotaExceededModal({ 
  isOpen, 
  onClose, 
  onUpgrade, 
  quotaInfo = {} 
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const {
    title = 'Batas Kuota Paket Free Tercapai',
    featureName = 'Fitur',
    current = 0,
    max = 0,
    unit = 'Item',
    customMessage
  } = quotaInfo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Background */}
        <div className="p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-3 shadow-lg">
            <Crown className="w-6 h-6" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
              Limit Tercapai
            </span>
            <span className="text-[10px] font-bold text-slate-300">
              Admin Policy
            </span>
          </div>

          <h3 className="text-lg font-black mt-1 text-white">
            {title}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Kapasitas {featureName} pada paket Free telah mencapai batas yang diatur oleh Admin.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          
          {/* Quota Meter */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">{featureName} Digunakan:</span>
              <span className="text-rose-600 font-black">
                {current} / {max} {unit} (100% Penuh)
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full w-full" />
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {customMessage || (
              <>
                Sesuai konfigurasi terbaru di <strong>Admin Dashboard</strong>, akun berlisensi <strong>Standar (FREE)</strong> dibatasi maksimal <strong>{max} {unit}</strong>.
              </>
            )}
          </p>

          {/* Benefits List */}
          <div className="space-y-2 pt-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Keuntungan Upgrade ke PRO:
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                <span><strong>Bebas Kuota (Unlimited)</strong> untuk seluruh fitur rumah</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                <span>Multi-user kolaborasi keluarga tanpa batas anggota</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                <span>Ekspor laporan Excel / PDF & AI OCR Scan Struk</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 space-y-2">
            <button
              onClick={() => {
                onClose();
                if (onUpgrade) onUpgrade();
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-2xl text-xs transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Upgrade ke PRO Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
            >
              Nanti Saja
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
