import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Wrench, 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Phone, 
  Gauge, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatWarrantyDisplay } from '../utils/warrantyHelper';
import { formatThousands, parseThousands } from '../utils/numberFormatHelper';
import { getAssetUpcomingSchedule } from '../utils/scheduleHelper';

export default function AssetServiceModal({
  isOpen,
  asset,
  onClose,
  schedules = [],
  logs = [],
  onSaveSchedule,
  onDeleteSchedule,
  onSaveLog,
  onDeleteLog
}) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'schedules'
  const [showLogForm, setShowLogForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  // Form State: Service Log
  const todayStr = new Date().toISOString().split('T')[0];
  const [logFormData, setLogFormData] = useState({
    performed_date: todayStr,
    service_title: '',
    cost: '',
    vendor_name: '',
    vendor_phone: '',
    current_odometer: '',
    notes: '',
    sync_to_finance: true
  });

  // Form State: Schedule
  const isVehicle = asset?.type === 'VEHICLE';
  const currentVehicleOdo = (asset?.odo !== undefined && asset?.odo !== null)
    ? Number(asset.odo)
    : (asset?.current_odometer ? Number(asset.current_odometer) : null);

  const [scheduleFormData, setScheduleFormData] = useState({
    title: '',
    frequency_type: 'MONTHS', // 'WHICHEVER_FIRST' | 'MONTHS' | 'DAYS' | 'ODOMETER'
    frequency_value: 3,
    frequency_months: 3,
    frequency_km: 10000,
    next_due_date: '',
    next_due_odometer: ''
  });

  const [formError, setFormError] = useState('');

  // Auto initialize default schedule when modal opens
  useEffect(() => {
    if (!asset || !isOpen) return;
    const isVeh = asset.type === 'VEHICLE';
    const cOdo = (asset.odo !== undefined && asset.odo !== null)
      ? Number(asset.odo)
      : (asset.current_odometer ? Number(asset.current_odometer) : null);

    const defaultMonths = isVeh ? 6 : 3;
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + defaultMonths);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    setScheduleFormData({
      title: isVeh ? 'Ganti Oli & Filter Mesin Berkala' : 'Cuci AC Rutin 3 Bulan Sekali',
      frequency_type: isVeh ? 'WHICHEVER_FIRST' : 'MONTHS',
      frequency_value: defaultMonths,
      frequency_months: defaultMonths,
      frequency_km: 10000,
      next_due_date: targetDateStr,
      next_due_odometer: cOdo ? (cOdo + 10000).toString() : ''
    });
    setFormError('');
  }, [isOpen, asset]);

  if (!isOpen || !asset) return null;

  const handleFrequencyTypeChange = (newType) => {
    const targetDate = new Date();
    if (newType === 'WHICHEVER_FIRST') {
      targetDate.setMonth(targetDate.getMonth() + 6);
      setScheduleFormData(prev => ({
        ...prev,
        frequency_type: newType,
        frequency_value: 6,
        frequency_months: 6,
        frequency_km: 10000,
        next_due_date: targetDate.toISOString().split('T')[0],
        next_due_odometer: currentVehicleOdo ? (currentVehicleOdo + 10000).toString() : ''
      }));
    } else if (newType === 'MONTHS') {
      targetDate.setMonth(targetDate.getMonth() + 3);
      setScheduleFormData(prev => ({
        ...prev,
        frequency_type: newType,
        frequency_value: 3,
        frequency_months: 3,
        frequency_km: null,
        next_due_date: targetDate.toISOString().split('T')[0],
        next_due_odometer: ''
      }));
    } else if (newType === 'DAYS') {
      targetDate.setDate(targetDate.getDate() + 90);
      setScheduleFormData(prev => ({
        ...prev,
        frequency_type: newType,
        frequency_value: 90,
        frequency_months: null,
        frequency_km: null,
        next_due_date: targetDate.toISOString().split('T')[0],
        next_due_odometer: ''
      }));
    } else if (newType === 'ODOMETER') {
      setScheduleFormData(prev => ({
        ...prev,
        frequency_type: newType,
        frequency_value: 10000,
        frequency_months: null,
        frequency_km: 10000,
        next_due_date: '',
        next_due_odometer: currentVehicleOdo ? (currentVehicleOdo + 10000).toString() : '45000'
      }));
    }
  };

  const handleMonthsChange = (val) => {
    const months = Number(val) || 1;
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + months);
    setScheduleFormData(prev => ({
      ...prev,
      frequency_months: months,
      frequency_value: months,
      next_due_date: targetDate.toISOString().split('T')[0]
    }));
  };

  const handleKmChange = (val) => {
    const km = Number(val) || 1000;
    setScheduleFormData(prev => ({
      ...prev,
      frequency_km: km,
      next_due_odometer: currentVehicleOdo ? (currentVehicleOdo + km).toString() : prev.next_due_odometer
    }));
  };

  // Filter schedules and logs for this asset
  const assetSchedules = schedules.filter(s => s.asset_id === asset.id);
  const assetLogs = logs.filter(l => l.asset_id === asset.id);
  const upcoming = getAssetUpcomingSchedule(asset, schedules, i18n.language);

  // Calculate total spent on this asset
  const totalSpent = assetLogs.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);

  // Common suggestion chips
  const electronicSuggestions = [
    'Cuci Indoor & Outdoor AC',
    'Bersihkan Filter Debu',
    'Tambah / Cek Freon R32',
    'Ganti Kapasitor Fan',
    'Perbaikan Kelistrikan'
  ];

  const vehicleSuggestions = [
    'Ganti Oli Mesin & Filter',
    'Tune Up & Gurah Mesin',
    'Spooring & Balancing',
    'Kuras Minyak Rem & Radiator',
    'Ganti Kanvas Rem Depan'
  ];

  const suggestions = isVehicle ? vehicleSuggestions : electronicSuggestions;

  // Handle Log Submission
  const handleSubmitLog = (e) => {
    e.preventDefault();
    if (!logFormData.service_title.trim()) {
      setFormError(i18n.language === 'id' ? 'Silakan isi rincian servis yang dilakukan' : 'Please specify the services performed');
      return;
    }
    if (!logFormData.performed_date) {
      setFormError(i18n.language === 'id' ? 'Tanggal servis harus diisi' : 'Service date is required');
      return;
    }

    const newLog = {
      id: 'log_' + Date.now(),
      asset_id: asset.id,
      household_id: asset.household_id || 'hh-default',
      performed_date: logFormData.performed_date,
      service_title: logFormData.service_title.trim(),
      cost: Number(logFormData.cost) || 0,
      vendor_name: logFormData.vendor_name.trim() || null,
      vendor_phone: logFormData.vendor_phone.trim() || null,
      current_odometer: isVehicle && logFormData.current_odometer ? Number(logFormData.current_odometer) : null,
      notes: logFormData.notes.trim() || null,
      created_at: new Date().toISOString()
    };

    onSaveLog(newLog, logFormData.sync_to_finance);

    // Reset Form
    setLogFormData({
      performed_date: todayStr,
      service_title: '',
      cost: '',
      vendor_name: '',
      vendor_phone: '',
      current_odometer: '',
      notes: '',
      sync_to_finance: true
    });
    setShowLogForm(false);
    setFormError('');
  };

  // Handle Schedule Submission
  const handleSubmitSchedule = (e) => {
    e.preventDefault();
    if (!scheduleFormData.title.trim()) {
      setFormError(i18n.language === 'id' ? 'Silakan isi nama pemeliharaan berkala' : 'Please specify maintenance schedule title');
      return;
    }

    if (scheduleFormData.frequency_type === 'WHICHEVER_FIRST') {
      if (!scheduleFormData.next_due_date && !scheduleFormData.next_due_odometer) {
        setFormError(i18n.language === 'id' ? 'Isi minimal salah satu target: tanggal atau odometer' : 'Please provide at least target date or odometer');
        return;
      }
    }

    const freqValue = scheduleFormData.frequency_type === 'ODOMETER' 
      ? (Number(scheduleFormData.frequency_km || scheduleFormData.frequency_value) || 10000)
      : (Number(scheduleFormData.frequency_months || scheduleFormData.frequency_value) || 1);

    const newSchedule = {
      id: 'sch_' + Date.now(),
      asset_id: asset.id,
      title: scheduleFormData.title.trim(),
      frequency_type: scheduleFormData.frequency_type,
      frequency_value: freqValue,
      frequency_months: scheduleFormData.frequency_type === 'WHICHEVER_FIRST' ? Number(scheduleFormData.frequency_months || 6) : (scheduleFormData.frequency_type === 'MONTHS' ? freqValue : null),
      frequency_km: scheduleFormData.frequency_type === 'WHICHEVER_FIRST' ? Number(scheduleFormData.frequency_km || 10000) : (scheduleFormData.frequency_type === 'ODOMETER' ? freqValue : null),
      next_due_date: (scheduleFormData.frequency_type !== 'ODOMETER' && scheduleFormData.next_due_date) ? scheduleFormData.next_due_date : null,
      next_due_odometer: (scheduleFormData.frequency_type !== 'MONTHS' && scheduleFormData.next_due_odometer) ? Number(scheduleFormData.next_due_odometer) : null,
      is_active: true,
      created_at: new Date().toISOString()
    };

    onSaveSchedule(newSchedule);

    setShowScheduleForm(false);
    setFormError('');
  };

  // Quick Action: Pre-fill log from schedule
  const handleQuickLogFromSchedule = (sch) => {
    setActiveTab('history');
    setShowLogForm(true);
    setLogFormData(prev => ({
      ...prev,
      service_title: sch.title,
      performed_date: todayStr
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-6 space-y-6 animate-scaleUp max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xs ${
              isVehicle ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {isVehicle ? '🚗' : '💨'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-lg leading-snug">{asset.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isVehicle ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {isVehicle ? t('assets.type_vehicle') : t('assets.type_electronic')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {asset.brand && asset.brand !== '-' ? `${asset.brand} • ` : ''}
                {asset.plate ? `${t('assets.plate_label')}: ${asset.plate}` : (asset.room || 'Kamar Utama')}
                {asset.odo && ` • Odometer ${asset.odo.toLocaleString()} KM`}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5">
            <p className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('services.total_spent')}</span>
            </p>
            <p className="text-lg font-black text-emerald-700 mt-1">
              Rp {totalSpent.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5">
            <p className="text-[11px] font-bold text-indigo-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t('services.total_logs')}</span>
            </p>
            <p className="text-lg font-black text-indigo-900 mt-1">
              {assetLogs.length} <span className="text-xs font-semibold text-indigo-600">kali servis</span>
            </p>
          </div>

          <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-3.5 col-span-2 sm:col-span-1">
            <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('assets.next_service')}</span>
            </p>
            <p className="text-xs font-black text-amber-900 mt-1.5 truncate">
              {upcoming.nextService 
                ? (upcoming.scheduleTitle ? `${upcoming.scheduleTitle} (${upcoming.nextService})` : upcoming.nextService)
                : (upcoming.nextOdo ? `${upcoming.nextOdo.toLocaleString('id-ID')} KM` : '-')}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 -mb-px ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>{t('services.tab_history')}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'history' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {assetLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('schedules')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 -mb-px ${
              activeTab === 'schedules'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('services.tab_schedules')}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'schedules' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {assetSchedules.length}
            </span>
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">

          {/* ================================================================= */}
          {/* TAB 1: RIWAYAT & CATAT SERVIS                                     */}
          {/* ================================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              
              {/* Add New Service Log Button / Toggle */}
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                  {t('services.tab_history')}
                </h4>
                <button
                  onClick={() => {
                    setShowLogForm(!showLogForm);
                    setFormError('');
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    showLogForm 
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {showLogForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{showLogForm ? t('services.close_form') : t('services.add_log_btn')}</span>
                </button>
              </div>

              {/* Service Log Input Form */}
              {showLogForm && (
                <form onSubmit={handleSubmitLog} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-indigo-200 space-y-4 shadow-sm animate-scaleUp">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">✍️</span>
                    <h5 className="font-extrabold text-sm text-slate-900">{t('services.add_log_btn')}</h5>
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Suggestion Chips */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">
                      Rekomendasi Servis:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLogFormData(prev => ({ ...prev, service_title: sug }))}
                          className="text-[10px] font-bold bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 px-2 py-1 rounded-lg transition cursor-pointer"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Performed Date */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('services.performed_date')} *
                      </label>
                      <input
                        type="date"
                        value={logFormData.performed_date}
                        onChange={(e) => setLogFormData({ ...logFormData, performed_date: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                        required
                      />
                    </div>

                    {/* Cost */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('services.cost')} (Rp) *
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-400">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Contoh: 150.000"
                          value={formatThousands(logFormData.cost)}
                          onChange={(e) => setLogFormData({ ...logFormData, cost: parseThousands(e.target.value) ?? '' })}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden text-emerald-700"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service Performed Title / Actions */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('services.service_title')} *
                    </label>
                    <input
                      type="text"
                      placeholder={isVehicle ? t('services.service_title_vehicle_placeholder') : t('services.service_title_placeholder')}
                      value={logFormData.service_title}
                      onChange={(e) => setLogFormData({ ...logFormData, service_title: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Vendor Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('services.vendor_name')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('services.vendor_placeholder')}
                        value={logFormData.vendor_name}
                        onChange={(e) => setLogFormData({ ...logFormData, vendor_name: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>

                    {/* Vendor Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('services.vendor_phone')}
                      </label>
                      <input
                        type="text"
                        placeholder="0812-3456-7890"
                        value={logFormData.vendor_phone}
                        onChange={(e) => setLogFormData({ ...logFormData, vendor_phone: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Odometer for vehicles */}
                  {isVehicle && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>{t('services.current_odometer')}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Angka di speedometer saat pengerjaan</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Contoh: 44.700"
                        value={formatThousands(logFormData.current_odometer)}
                        onChange={(e) => setLogFormData({ ...logFormData, current_odometer: parseThousands(e.target.value) ?? '' })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('services.notes')}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={t('services.notes_placeholder')}
                      value={logFormData.notes}
                      onChange={(e) => setLogFormData({ ...logFormData, notes: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  {/* Sync to Finance Checkbox */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                    <input
                      type="checkbox"
                      checked={logFormData.sync_to_finance}
                      onChange={(e) => setLogFormData({ ...logFormData, sync_to_finance: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">{t('services.sync_to_finance')}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{t('services.sync_note')}</p>
                    </div>
                  </label>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowLogForm(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('services.save_log_btn')}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* List of Service Logs */}
              <div className="space-y-3">
                {assetLogs.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <span className="text-3xl block">📋</span>
                    <p className="text-xs font-bold text-slate-700">{t('services.empty_logs')}</p>
                    <p className="text-[11px] text-slate-500">{t('services.empty_logs_sub')}</p>
                  </div>
                ) : (
                  assetLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200 transition space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatWarrantyDisplay(log.performed_date, i18n.language)}</span>
                            </span>
                            {log.current_odometer && (
                              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100 flex items-center gap-1">
                                <Gauge className="w-3 h-3" />
                                <span>{log.current_odometer.toLocaleString()} KM</span>
                              </span>
                            )}
                          </div>
                          <h5 className="font-black text-sm text-slate-900 mt-1.5 leading-snug">
                            {log.service_title}
                          </h5>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-black text-sm text-emerald-700 block">
                            Rp {Number(log.cost).toLocaleString('id-ID')}
                          </span>
                          <button
                            onClick={() => {
                              if (window.confirm(t('services.delete_log_confirm'))) {
                                onDeleteLog(log.id);
                              }
                            }}
                            className="p-1 text-slate-300 hover:text-red-600 rounded transition cursor-pointer mt-1"
                            title="Hapus Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Vendor & Notes */}
                      {(log.vendor_name || log.vendor_phone || log.notes) && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                          {log.vendor_name && (
                            <div className="flex items-center gap-1 font-semibold text-slate-700">
                              <span>🔧 {log.vendor_name}</span>
                              {log.vendor_phone && (
                                <a
                                  href={`tel:${log.vendor_phone}`}
                                  className="text-indigo-600 hover:underline flex items-center gap-0.5 ml-1 text-[11px]"
                                >
                                  <Phone className="w-3 h-3" /> {log.vendor_phone}
                                </a>
                              )}
                            </div>
                          )}

                          {log.notes && (
                            <p className="text-[11px] text-slate-500 italic">
                              "{log.notes}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: JADWAL SERVIS BERKALA                                      */}
          {/* ================================================================= */}
          {activeTab === 'schedules' && (
            <div className="space-y-4">
              
              {/* Add New Schedule Button / Toggle */}
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                  {t('services.tab_schedules')}
                </h4>
                <button
                  onClick={() => {
                    setShowScheduleForm(!showScheduleForm);
                    setFormError('');
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    showScheduleForm 
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {showScheduleForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{showScheduleForm ? t('services.close_form') : t('services.add_schedule_btn')}</span>
                </button>
              </div>

              {/* Schedule Input Form */}
              {showScheduleForm && (
                <form onSubmit={handleSubmitSchedule} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-indigo-200 space-y-4 shadow-sm animate-scaleUp">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">⏰</span>
                    <h5 className="font-extrabold text-sm text-slate-900">{t('services.add_schedule_btn')}</h5>
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Schedule Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('services.schedule_title')} *
                    </label>
                    <input
                      type="text"
                      placeholder={isVehicle ? t('services.schedule_title_vehicle_placeholder') : t('services.schedule_title_placeholder')}
                      value={scheduleFormData.title}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, title: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      required
                    />
                  </div>

                  {/* Frequency Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('services.frequency_type')}
                    </label>
                    <select
                      value={scheduleFormData.frequency_type}
                      onChange={(e) => handleFrequencyTypeChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer"
                    >
                      {isVehicle && <option value="WHICHEVER_FIRST">{t('services.freq_whichever_first')}</option>}
                      <option value="MONTHS">{t('services.freq_months')}</option>
                      <option value="DAYS">{t('services.freq_days')}</option>
                      {isVehicle && <option value="ODOMETER">{t('services.freq_odometer')}</option>}
                    </select>
                  </div>

                  {/* Dual-Factor WHICHEVER_FIRST Form Fields */}
                  {scheduleFormData.frequency_type === 'WHICHEVER_FIRST' ? (
                    <div className="space-y-3.5 pt-1">
                      <div className="p-3 bg-purple-50/80 border border-purple-200/80 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-purple-900">
                          <span>⚡</span>
                          <span>{i18n.language === 'id' ? 'Aturan Servis Otomotif (Dual-Trigger)' : 'Dual-Trigger Vehicle Maintenance'}</span>
                        </div>
                        <p className="text-[11px] text-purple-700 leading-relaxed">
                          {t('services.whichever_rule_desc')}
                        </p>
                      </div>

                      {/* Intervals: Bulan & KM */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {t('services.freq_months_input')}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={scheduleFormData.frequency_months}
                              onChange={(e) => handleMonthsChange(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                              required
                            />
                            <span className="text-xs font-bold text-slate-500 shrink-0">Bulan</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {t('services.freq_km_input')}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatThousands(scheduleFormData.frequency_km)}
                              onChange={(e) => handleKmChange(parseThousands(e.target.value) || 0)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                              placeholder="10.000"
                              required
                            />
                            <span className="text-xs font-bold text-slate-500 shrink-0">KM</span>
                          </div>
                        </div>
                      </div>

                      {/* Next Targets: Tanggal & KM */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {t('services.target_date_label')}
                          </label>
                          <input
                            type="date"
                            value={scheduleFormData.next_due_date}
                            onChange={(e) => setScheduleFormData({ ...scheduleFormData, next_due_date: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {t('services.target_km_label')}
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Contoh: 55.000"
                            value={formatThousands(scheduleFormData.next_due_odometer)}
                            onChange={(e) => setScheduleFormData({ ...scheduleFormData, next_due_odometer: parseThousands(e.target.value) ?? '' })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Single Mode: Value & Target */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {t('services.frequency_value')}
                          </label>
                          <div className="flex items-center gap-2">
                            {scheduleFormData.frequency_type === 'ODOMETER' ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formatThousands(scheduleFormData.frequency_value)}
                                onChange={(e) => setScheduleFormData({ ...scheduleFormData, frequency_value: parseThousands(e.target.value) || 0 })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                                placeholder="10.000"
                                required
                              />
                            ) : (
                              <input
                                type="number"
                                min="1"
                                value={scheduleFormData.frequency_value}
                                onChange={(e) => setScheduleFormData({ ...scheduleFormData, frequency_value: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                                required
                              />
                            )}
                            <span className="text-xs font-bold text-slate-500 shrink-0">
                              {scheduleFormData.frequency_type === 'MONTHS' ? 'Bulan' : scheduleFormData.frequency_type === 'DAYS' ? 'Hari' : 'KM'}
                            </span>
                          </div>
                        </div>

                        {scheduleFormData.frequency_type !== 'ODOMETER' ? (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              {t('services.next_due_date')}
                            </label>
                            <input
                              type="date"
                              value={scheduleFormData.next_due_date}
                              onChange={(e) => setScheduleFormData({ ...scheduleFormData, next_due_date: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              {t('services.next_due_odometer')}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="Contoh: 45.000"
                              value={formatThousands(scheduleFormData.next_due_odometer)}
                              onChange={(e) => setScheduleFormData({ ...scheduleFormData, next_due_odometer: parseThousands(e.target.value) ?? '' })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowScheduleForm(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('services.save_schedule_btn')}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* List of Maintenance Schedules */}
              <div className="space-y-3">
                {assetSchedules.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <span className="text-3xl block">📅</span>
                    <p className="text-xs font-bold text-slate-700">{t('services.empty_schedules')}</p>
                    <p className="text-[11px] text-slate-500">{t('services.empty_schedules_sub')}</p>
                  </div>
                ) : (
                  assetSchedules.map((sch) => {
                    const isDual = sch.frequency_type === 'WHICHEVER_FIRST';
                    const freqText = isDual
                      ? `Setiap ${sch.frequency_months || sch.frequency_value} Bulan atau ${Number(sch.frequency_km || 10000).toLocaleString()} KM`
                      : sch.frequency_type === 'MONTHS' 
                      ? `Setiap ${sch.frequency_value} Bulan` 
                      : sch.frequency_type === 'DAYS' 
                      ? `Setiap ${sch.frequency_value} Hari` 
                      : `Setiap ${Number(sch.frequency_value).toLocaleString()} KM`;

                    const isDateOverdue = sch.next_due_date && new Date(sch.next_due_date) <= new Date();
                    const isOdoOverdue = isVehicle && sch.next_due_odometer && currentVehicleOdo && currentVehicleOdo >= sch.next_due_odometer;
                    const isDueSoon = isDateOverdue || isOdoOverdue;

                    return (
                      <div
                        key={sch.id}
                        className={`p-4 bg-white hover:bg-slate-50/80 rounded-2xl border transition space-y-3 shadow-2xs ${isDueSoon ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`text-xs font-black px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${isDual ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-amber-700 bg-amber-50 border-amber-100'}`}>
                                <Clock className="w-3 h-3" />
                                <span>{freqText}</span>
                              </span>
                              {isDual && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {t('services.whichever_badge')}
                                </span>
                              )}
                              {isDueSoon && (
                                <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md animate-pulse">
                                  ⚠️ Waktunya Servis!
                                </span>
                              )}
                            </div>
                            <h5 className="font-black text-sm text-slate-900 mt-1.5 leading-snug">
                              {sch.title}
                            </h5>
                          </div>

                          <button
                            onClick={() => {
                              if (window.confirm(t('services.delete_schedule_confirm'))) {
                                onDeleteSchedule(sch.id);
                              }
                            }}
                            className="p-1 text-slate-300 hover:text-red-600 rounded transition cursor-pointer"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          <div className="text-xs text-slate-600 space-y-0.5">
                            <span className="text-slate-400 font-medium">Target Jatuh Tempo: </span>
                            {isDual ? (
                              <div className="font-extrabold text-slate-800 flex flex-wrap items-center gap-1.5">
                                <span className={isDateOverdue ? 'text-rose-600 font-black underline' : ''}>
                                  📅 {sch.next_due_date ? formatWarrantyDisplay(sch.next_due_date, i18n.language) : '-'}
                                </span>
                                <span className="text-purple-600 text-[11px] font-bold">ATAU</span>
                                <span className={isOdoOverdue ? 'text-rose-600 font-black underline' : ''}>
                                  🚗 {sch.next_due_odometer ? `${Number(sch.next_due_odometer).toLocaleString()} KM` : '-'}
                                </span>
                              </div>
                            ) : (
                              <span className="font-extrabold text-slate-800">
                                {sch.next_due_date ? formatWarrantyDisplay(sch.next_due_date, i18n.language) : (sch.next_due_odometer ? `${Number(sch.next_due_odometer).toLocaleString()} KM` : '-')}
                              </span>
                            )}
                          </div>

                          {/* Quick Action: Complete this service */}
                          <button
                            onClick={() => handleQuickLogFromSchedule(sch)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 transition cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <span>{t('services.mark_performed')}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {t('modals.close_preview')}
          </button>
        </div>

      </div>
    </div>
  );
}

