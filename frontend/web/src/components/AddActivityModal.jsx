import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Bell, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap,
  Palmtree,
  Briefcase,
  Mail,
  Cake,
  Activity,
  Bookmark,
  Repeat,
  Sparkles,
  Check
} from 'lucide-react';
import {
  generateRecurringOccurrences,
  getRecurrenceSummary,
  DAY_SHORT_ID,
  DAY_SHORT_EN,
  DAY_NAMES_ID,
  DAY_NAMES_EN,
  MONTH_NAMES_ID,
  MONTH_NAMES_EN,
  formatDateDb
} from '../utils/recurringHelper';
import { useActivityCategories, getCategoryDisplayName } from '../utils/masterCategoriesHelper';

const ACTIVITY_TYPES = [
  { code: 'COURSE_LES', labelKey: 'activity.type_course', icon: GraduationCap, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { code: 'VACATION', labelKey: 'activity.type_vacation', icon: Palmtree, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { code: 'BIZTRIP', labelKey: 'activity.type_biztrip', icon: Briefcase, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { code: 'INVITATION', labelKey: 'activity.type_invitation', icon: Mail, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { code: 'BIRTHDAY', labelKey: 'activity.type_birthday', icon: Cake, color: 'text-pink-600 bg-pink-50 border-pink-200' },
  { code: 'ROUTINE', labelKey: 'activity.type_routine', icon: Activity, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { code: 'OTHER', labelKey: 'activity.type_other', icon: Bookmark, color: 'text-slate-600 bg-slate-50 border-slate-200' }
];

const REMINDER_OPTIONS = [
  { value: 0, labelKey: 'activity.reminder_none' },
  { value: 15, labelKey: 'activity.reminder_15' },
  { value: 30, labelKey: 'activity.reminder_30' },
  { value: 60, labelKey: 'activity.reminder_60' },
  { value: 120, labelKey: 'activity.reminder_120' },
  { value: 1440, labelKey: 'activity.reminder_1440' }
];

function getDefaultStartDatetime() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

function getDefaultEndDatetime() {
  const d = new Date();
  d.setHours(d.getHours() + 2, 30, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:30`;
}

function getDefaultRecurrenceEndDate(startDatetimeStr) {
  const d = startDatetimeStr ? new Date(startDatetimeStr) : new Date();
  if (isNaN(d.getTime())) return '';
  // Default to 8 weeks ahead
  d.setDate(d.getDate() + 56);
  return formatDateDb(d);
}

export default function AddActivityModal({ 
  isOpen, 
  onClose, 
  onSaveActivity, 
  activityToEdit = null, 
  isEditingMaster = false,
  members = [],
  currentUser = null
}) {
  const { t, i18n } = useTranslation();
  const { activeCategories: activityCategories } = useActivityCategories();

  const defaultAuthor = currentUser?.name || (members && members.length > 0 ? members[0].name : 'Calvin');
  const defaultActivityType = activityCategories[0]?.code || 'COURSE_LES';

  const [formData, setFormData] = useState({
    title: '',
    activity_type: defaultActivityType,
    start_datetime: getDefaultStartDatetime(),
    end_datetime: getDefaultEndDatetime(),
    location: '',
    reminder_minutes_before: 30,
    notes: '',
    created_by_name: defaultAuthor
  });

  const [recurringConfig, setRecurringConfig] = useState({
    is_recurring: false,
    recurrence_pattern: 'WEEKLY', // 'WEEKLY' | 'BIWEEKLY' | 'DAILY' | 'MONTHLY'
    recurrence_days: [], // array of numbers 0..6
    recurrence_end_date: ''
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Populate form if editing
  useEffect(() => {
    const curAuthor = currentUser?.name || (members && members.length > 0 ? members[0].name : 'Calvin');
    if (activityToEdit) {
      let startStr = activityToEdit.start_datetime || '';
      if (startStr.includes(' ')) {
        startStr = startStr.replace(' ', 'T').slice(0, 16);
      }
      let endStr = activityToEdit.end_datetime || '';
      if (endStr.includes(' ')) {
        endStr = endStr.replace(' ', 'T').slice(0, 16);
      }

      setFormData({
        title: activityToEdit.title || '',
        activity_type: activityToEdit.activity_type || 'COURSE_LES',
        start_datetime: startStr || getDefaultStartDatetime(),
        end_datetime: endStr || '',
        location: activityToEdit.location || '',
        reminder_minutes_before: activityToEdit.reminder_minutes_before !== undefined ? activityToEdit.reminder_minutes_before : 30,
        notes: activityToEdit.notes || '',
        created_by_name: activityToEdit.created_by_name || curAuthor
      });

      setRecurringConfig({
        is_recurring: Boolean(activityToEdit.is_recurring || activityToEdit.recurrence_group_id),
        recurrence_pattern: 'WEEKLY',
        recurrence_days: [],
        recurrence_end_date: ''
      });
    } else {
      const defaultStart = getDefaultStartDatetime();
      setFormData({
        title: '',
        activity_type: defaultActivityType,
        start_datetime: defaultStart,
        end_datetime: getDefaultEndDatetime(),
        location: '',
        reminder_minutes_before: 30,
        notes: '',
        created_by_name: curAuthor
      });

      const startDateObj = new Date(defaultStart);
      const initialDay = !isNaN(startDateObj.getTime()) ? startDateObj.getDay() : 2; // Default Tuesday if NaN

      setRecurringConfig({
        is_recurring: false,
        recurrence_pattern: 'WEEKLY',
        recurrence_days: [initialDay],
        recurrence_end_date: getDefaultRecurrenceEndDate(defaultStart)
      });
    }
    setErrorMsg('');
  }, [activityToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // When start_datetime changes, update default day of week if recurring days has 1 element
    if (name === 'start_datetime' && value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const dayOfWeek = d.getDay();
        setRecurringConfig(prev => ({
          ...prev,
          recurrence_days: prev.recurrence_days.length <= 1 ? [dayOfWeek] : prev.recurrence_days,
          recurrence_end_date: prev.recurrence_end_date || getDefaultRecurrenceEndDate(value)
        }));
      }
    }
  };

  const handleTypeSelect = (code) => {
    setFormData(prev => ({ ...prev, activity_type: code }));
  };

  const handleRecurringToggle = (enabled) => {
    if (enabled) {
      const startDateObj = new Date(formData.start_datetime);
      const dayOfWeek = !isNaN(startDateObj.getTime()) ? startDateObj.getDay() : 2;
      setRecurringConfig(prev => ({
        ...prev,
        is_recurring: true,
        recurrence_days: prev.recurrence_days.length > 0 ? prev.recurrence_days : [dayOfWeek],
        recurrence_end_date: prev.recurrence_end_date || getDefaultRecurrenceEndDate(formData.start_datetime)
      }));
    } else {
      setRecurringConfig(prev => ({ ...prev, is_recurring: false }));
    }
  };

  const toggleDayOfWeek = (dayNum) => {
    setRecurringConfig(prev => {
      const exists = prev.recurrence_days.includes(dayNum);
      if (exists) {
        // Keep at least 1 day selected
        if (prev.recurrence_days.length === 1) return prev;
        return { ...prev, recurrence_days: prev.recurrence_days.filter(d => d !== dayNum) };
      } else {
        return { ...prev, recurrence_days: [...prev.recurrence_days, dayNum].sort((a, b) => a - b) };
      }
    });
  };

  const setEndDatePreset = (monthsToAdd) => {
    const d = new Date(formData.start_datetime || new Date());
    if (isNaN(d.getTime())) return;
    d.setMonth(d.getMonth() + monthsToAdd);
    setRecurringConfig(prev => ({
      ...prev,
      recurrence_end_date: formatDateDb(d)
    }));
  };

  // Live preview calculation of occurrences
  const previewOccurrences = useMemo(() => {
    if (!recurringConfig.is_recurring || !recurringConfig.recurrence_end_date) return [];
    const baseAct = {
      title: formData.title || (i18n.language === 'id' ? 'Agenda' : 'Event'),
      activity_type: formData.activity_type,
      start_datetime: formData.start_datetime.replace('T', ' ') + (formData.start_datetime.length === 16 ? ':00' : ''),
      end_datetime: formData.end_datetime ? formData.end_datetime.replace('T', ' ') + (formData.end_datetime.length === 16 ? ':00' : '') : null,
      location: formData.location,
      reminder_minutes_before: formData.reminder_minutes_before,
      notes: formData.notes
    };
    return generateRecurringOccurrences(baseAct, recurringConfig, i18n.language);
  }, [formData, recurringConfig, i18n.language]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedTitle = (formData.title || '').trim();
    if (!trimmedTitle) {
      setErrorMsg(i18n.language === 'id' ? 'Judul aktivitas wajib diisi.' : 'Activity title is required.');
      return;
    }

    if (!formData.start_datetime) {
      setErrorMsg(i18n.language === 'id' ? 'Waktu mulai agenda wajib ditentukan.' : 'Start date & time is required.');
      return;
    }

    if (recurringConfig.is_recurring && !activityToEdit) {
      if (!recurringConfig.recurrence_end_date) {
        setErrorMsg(i18n.language === 'id' ? 'Tentukan tanggal berakhir pengulangan jadwal.' : 'Please set recurrence end date.');
        return;
      }
      const startD = new Date(formData.start_datetime);
      const endD = new Date(`${recurringConfig.recurrence_end_date}T23:59:59`);
      if (endD < startD) {
        setErrorMsg(i18n.language === 'id' ? 'Tanggal selesai pengulangan harus setelah tanggal mulai.' : 'Recurrence end date must be after start date.');
        return;
      }
    }

    try {
      // Format start and end datetime for database (YYYY-MM-DD HH:mm:ss)
      const cleanStart = formData.start_datetime.replace('T', ' ') + (formData.start_datetime.length === 16 ? ':00' : '');
      const cleanEnd = formData.end_datetime 
        ? formData.end_datetime.replace('T', ' ') + (formData.end_datetime.length === 16 ? ':00' : '') 
        : null;

      const basePayload = {
        title: trimmedTitle,
        activity_type: formData.activity_type,
        start_datetime: cleanStart,
        end_datetime: cleanEnd,
        location: (formData.location || '').trim() || null,
        reminder_minutes_before: parseInt(formData.reminder_minutes_before, 10) || 0,
        notes: (formData.notes || '').trim() || null,
        created_by_name: formData.created_by_name || defaultAuthor
      };

      if (!activityToEdit && recurringConfig.is_recurring) {
        const occurrences = generateRecurringOccurrences(basePayload, recurringConfig, i18n.language);
        onSaveActivity({
          ...basePayload,
          is_recurring: true,
          recurring_occurrences: occurrences,
          recurrence_group_id: occurrences[0]?.recurrence_group_id,
          recurrence_rule: occurrences[0]?.recurrence_rule,
          recurrence_summary: occurrences[0]?.recurrence_summary
        }, false);
      } else {
        onSaveActivity(basePayload, Boolean(activityToEdit), isEditingMaster);
      }

      onClose();
    } catch (err) {
      console.error('[AddActivityModal handleSubmit error]:', err);
      setErrorMsg(err.message || 'Gagal menyimpan agenda aktivitas.');
    }
  };

  // Rule of hooks: unconditional hook calls before early return
  if (!isOpen) return null;

  const dayShortLabels = i18n.language === 'id' ? DAY_SHORT_ID : DAY_SHORT_EN;
  const monthNames = i18n.language === 'id' ? MONTH_NAMES_ID : MONTH_NAMES_EN;

  return (
    <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 animate-scaleUp max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-pink-500/20">
              {isEditingMaster ? '⭐' : '📅'}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {isEditingMaster
                  ? (i18n.language === 'id' ? 'Edit Master Jadwal Berulang' : 'Edit Master Recurring Schedule')
                  : activityToEdit ? t('activity.modal_title_edit') : t('activity.modal_title_add')}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditingMaster
                  ? (i18n.language === 'id' 
                      ? 'Perubahan nama, kategori, lokasi, dan catatan akan otomatis diterapkan ke seluruh sesi terkait.'
                      : 'Updated title, category, location, and notes will cascade to all linked sessions.')
                  : t('activity.modal_subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('activity.field_title')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('activity.title_placeholder')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              required
            />
          </div>

          {/* 2. Activity Type Selector (Database ENUM) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('activity.field_type')} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {((activityCategories && activityCategories.length > 0) ? activityCategories : ACTIVITY_TYPES).map((cat) => {
                const isSelected = formData.activity_type === cat.code;
                const IconComponent = typeof cat.icon === 'function' ? cat.icon : null;
                const isEmoji = typeof cat.icon === 'string' && cat.icon.length > 0;
                const COLOR_MAP = {
                  amber: 'text-amber-600 bg-amber-50 border-amber-200',
                  emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
                  blue: 'text-blue-600 bg-blue-50 border-blue-200',
                  purple: 'text-purple-600 bg-purple-50 border-purple-200',
                  pink: 'text-pink-600 bg-pink-50 border-pink-200',
                  indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200',
                  rose: 'text-rose-600 bg-rose-50 border-rose-200',
                  teal: 'text-teal-600 bg-teal-50 border-teal-200',
                  slate: 'text-slate-600 bg-slate-50 border-slate-200',
                  yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
                  cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200',
                  violet: 'text-violet-600 bg-violet-50 border-violet-200'
                };
                const colorClasses = COLOR_MAP[cat.color] || (typeof cat.color === 'string' && cat.color.includes('text-') ? cat.color : 'text-pink-600 bg-pink-50 border-pink-200');
                const labelText = getCategoryDisplayName(cat, i18n.language) || (cat.labelKey ? t(cat.labelKey) : cat.code);

                return (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => handleTypeSelect(cat.code)}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition text-center cursor-pointer ${
                      isSelected
                        ? 'bg-pink-50/80 border-pink-500 text-pink-700 font-bold ring-2 ring-pink-500/20 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClasses}`}>
                      {IconComponent ? (
                        <IconComponent className="w-4 h-4" />
                      ) : isEmoji ? (
                        <span className="text-base leading-none">{cat.icon}</span>
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-[10px] leading-tight line-clamp-1">{labelText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Date & Time Row (start_datetime & end_datetime) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-pink-600" />
                <span>{t('activity.field_start')}</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="start_datetime"
                value={formData.start_datetime}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('activity.field_end')}</span>
              </label>
              <input
                type="datetime-local"
                name="end_datetime"
                value={formData.end_datetime}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              />
            </div>
          </div>

          {/* 4. RECURRING SCHEDULE SECTION (New Feature) */}
          {!activityToEdit && (
            <div className="bg-gradient-to-br from-pink-50/60 to-rose-50/40 border border-pink-100 rounded-2xl p-4 space-y-3.5 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold shrink-0">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">
                      {t('activity.recurring_enable')}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {t('activity.recurring_subtitle')}
                    </span>
                  </div>
                </div>

                {/* Switch Toggle */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={recurringConfig.is_recurring}
                    onChange={(e) => handleRecurringToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>

              {/* Recurring configuration options when enabled */}
              {recurringConfig.is_recurring && (
                <div className="pt-3 border-t border-pink-200/60 space-y-3.5 animate-fadeIn">
                  
                  {/* Frequency Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      {t('activity.recurring_frequency')}
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { code: 'WEEKLY', labelKey: 'activity.freq_weekly' },
                        { code: 'BIWEEKLY', labelKey: 'activity.freq_biweekly' },
                        { code: 'DAILY', labelKey: 'activity.freq_daily' },
                        { code: 'MONTHLY', labelKey: 'activity.freq_monthly' }
                      ].map((freq) => (
                        <button
                          key={freq.code}
                          type="button"
                          onClick={() => setRecurringConfig(prev => ({ ...prev, recurrence_pattern: freq.code }))}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                            recurringConfig.recurrence_pattern === freq.code
                              ? 'bg-pink-600 text-white shadow-xs shadow-pink-600/20'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {t(freq.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Day of Week Selector (Weekly or Bi-weekly) */}
                  {(recurringConfig.recurrence_pattern === 'WEEKLY' || recurringConfig.recurrence_pattern === 'BIWEEKLY') && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        {t('activity.recurring_days_label')}
                      </label>
                      <div className="grid grid-cols-7 gap-1">
                        {[0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
                          const isSelected = recurringConfig.recurrence_days.includes(dayNum);
                          return (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={() => toggleDayOfWeek(dayNum)}
                              className={`py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
                                isSelected
                                  ? 'bg-pink-600 text-white shadow-xs ring-2 ring-pink-500/20'
                                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              {dayShortLabels[dayNum]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recurrence End Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700">
                        {t('activity.recurring_end_date_label')} <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEndDatePreset(1)}
                          className="text-[10px] font-bold bg-white text-pink-700 px-2 py-0.5 rounded-md border border-pink-200 hover:bg-pink-50 transition cursor-pointer"
                        >
                          +1 Bln
                        </button>
                        <button
                          type="button"
                          onClick={() => setEndDatePreset(2)}
                          className="text-[10px] font-bold bg-white text-pink-700 px-2 py-0.5 rounded-md border border-pink-200 hover:bg-pink-50 transition cursor-pointer"
                        >
                          +2 Bln
                        </button>
                        <button
                          type="button"
                          onClick={() => setEndDatePreset(3)}
                          className="text-[10px] font-bold bg-white text-pink-700 px-2 py-0.5 rounded-md border border-pink-200 hover:bg-pink-50 transition cursor-pointer"
                        >
                          +3 Bln
                        </button>
                      </div>
                    </div>
                    <input
                      type="date"
                      value={recurringConfig.recurrence_end_date}
                      onChange={(e) => setRecurringConfig(prev => ({ ...prev, recurrence_end_date: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                      required={recurringConfig.is_recurring}
                    />
                  </div>

                  {/* Dynamic Live Preview Box */}
                  {previewOccurrences.length > 0 && (
                    <div className="bg-white rounded-xl border border-pink-200/80 p-3 space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-pink-700">
                        <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                        <span>{t('activity.recurring_preview_title')}</span>
                      </div>
                      
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {i18n.language === 'id' ? (
                          <>
                            Akan otomatis membuat <strong className="text-pink-600 font-extrabold">{previewOccurrences.length} sesi agenda</strong>: {previewOccurrences[0]?.recurrence_summary} sampai tanggal <strong className="text-slate-800">{recurringConfig.recurrence_end_date}</strong>.
                          </>
                        ) : (
                          <>
                            Will automatically generate <strong className="text-pink-600 font-extrabold">{previewOccurrences.length} sessions</strong>: {previewOccurrences[0]?.recurrence_summary} until <strong className="text-slate-800">{recurringConfig.recurrence_end_date}</strong>.
                          </>
                        )}
                      </p>

                      {/* Preview badges of first scheduled dates */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                        {previewOccurrences.slice(0, 5).map((occ, idx) => {
                          const dt = new Date(occ.start_datetime);
                          const formattedDate = !isNaN(dt.getTime()) ? `${dt.getDate()} ${monthNames[dt.getMonth()]}` : `Sesi ${idx + 1}`;
                          return (
                            <span
                              key={occ.id || idx}
                              className="text-[10px] font-bold bg-pink-50 text-pink-700 px-2 py-0.5 rounded-lg border border-pink-100"
                            >
                              {formattedDate}
                            </span>
                          );
                        })}
                        {previewOccurrences.length > 5 && (
                          <span className="text-[10px] font-bold text-slate-400 px-1">
                            +{previewOccurrences.length - 5} {i18n.language === 'id' ? 'sesi lainnya' : 'more sessions'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* 5. Location & Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('activity.field_location')}</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder={t('activity.location_placeholder')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('activity.field_reminder')}</span>
              </label>
              <select
                name="reminder_minutes_before"
                value={formData.reminder_minutes_before}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 transition cursor-pointer"
              >
                {REMINDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5b. Dijadwalkan / Dibuat Oleh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>👤</span>
                <span>{i18n.language === 'id' ? 'Dijadwalkan / Dibuat Oleh' : 'Scheduled / Created By'}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {i18n.language === 'id' ? 'Pilih anggota pembuat agenda' : 'Select member'}
              </span>
            </label>
            <select
              name="created_by_name"
              value={formData.created_by_name}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 transition cursor-pointer font-medium"
            >
              {members && members.length > 0 ? (
                members.map((m) => (
                  <option key={m.id || m.name} value={m.name}>
                    👤 {m.name} ({m.role || 'MEMBER'})
                  </option>
                ))
              ) : (
                <option value={currentUser?.name || 'Calvin'}>
                  👤 {currentUser?.name || 'Calvin'} (OWNER)
                </option>
              )}
            </select>
          </div>

          {/* 6. Notes / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('activity.field_notes')}</span>
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder={t('activity.notes_placeholder')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer text-xs"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-extrabold shadow-md shadow-pink-600/20 transition transform active:scale-98 cursor-pointer flex items-center gap-1.5 text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{activityToEdit ? t('activity.save_changes_btn') : t('activity.save_activity_btn')}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
