import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileText, Download, CheckCircle2, Shield, Calendar, DollarSign, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { getWarrantyStatus, formatWarrantyDisplay } from '../utils/warrantyHelper';

export default function InvoiceViewerModal({ asset, onClose }) {
  const { t, i18n } = useTranslation();
  if (!asset) return null;

  const warrantyDateRaw = asset.warranty || asset.warranty_expiry_date;
  const warrantyInfo = getWarrantyStatus(warrantyDateRaw, i18n.language);
  const formattedWarrantyDate = formatWarrantyDisplay(warrantyDateRaw, i18n.language);

  return (
    <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
              🧾
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">{t('modals.invoice_title')}</h3>
              <p className="text-xs text-slate-500">{t('modals.invoice_subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary Card */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
            <span className="text-slate-500">{t('menu.assets')}:</span>
            <span className="font-extrabold text-slate-900">{asset.name}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">{t('modals.brand_model')}:</span>
            <span className="font-bold text-slate-800">{asset.brand || '-'} {asset.model_type ? `(${asset.model_type})` : ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">{t('modals.serial_plate')}:</span>
            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              {asset.plate || asset.serial_or_plate_number || '-'}
            </span>
          </div>

          {asset.type === 'VEHICLE' && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500">{t('services.current_odometer_input')}:</span>
              <span className="font-bold text-slate-800">
                {(asset.odo !== undefined && asset.odo !== null)
                  ? `${Number(asset.odo).toLocaleString('id-ID')} KM`
                  : (asset.current_odometer ? `${Number(asset.current_odometer).toLocaleString('id-ID')} KM` : '-')}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-slate-500">{t('modals.purchase_date')}:</span>
            <span className="font-bold text-slate-800">{asset.purchase_date || '-'}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">{t('assets.purchase_price')}:</span>
            <span className="font-black text-emerald-700 text-sm">
              {asset.purchase_price ? `Rp ${Number(asset.purchase_price).toLocaleString('id-ID')}` : '-'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
            <span className="text-slate-500">{t('modals.warranty_expiry')}:</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${warrantyInfo.status === 'EXPIRED' ? 'text-rose-600 line-through' : 'text-slate-800'}`}>
                {warrantyDateRaw ? `${t('assets.until')} ${formattedWarrantyDate}` : '-'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${warrantyInfo.badgeClass}`}>
                {warrantyInfo.status === 'ACTIVE' && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                {warrantyInfo.status === 'EXPIRING_SOON' && <Clock className="w-3 h-3 text-amber-600" />}
                {warrantyInfo.status === 'EXPIRED' && <AlertCircle className="w-3 h-3 text-rose-500" />}
                <span>{warrantyInfo.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Attached Document Display */}
        {(asset.invoice_name || asset.invoice_url) ? (
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-950">
                  {asset.invoice_name || 'Faktur_Pembelian.pdf'}
                </p>
                <p className="text-[10px] text-indigo-600 font-medium">{t('modals.stored_in_cloud')}</p>
              </div>
            </div>
            <button
              onClick={() => alert(i18n.language === 'id' ? 'Mengunduh dokumen faktur invoice asli...' : 'Downloading original invoice document...')}
              className="p-2 text-indigo-700 hover:bg-indigo-100 rounded-xl transition cursor-pointer"
              title={t('modals.download_invoice')}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center gap-3 text-slate-400">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">
                {t('services.no_invoice_file')}
              </p>
              <p className="text-[10px] text-slate-400">
                {i18n.language === 'id' ? 'Anda dapat mengunggahnya kapan saja melalui tombol edit aset' : 'You can attach one anytime via Edit Asset'}
              </p>
            </div>
          </div>
        )}

        {/* Action Close */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-2xl transition cursor-pointer"
          >
            {t('modals.close_preview')}
          </button>
        </div>

      </div>
    </div>
  );
}

