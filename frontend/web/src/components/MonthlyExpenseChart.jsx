import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Target, Info, Calendar, Pencil } from 'lucide-react';

const BASE_HISTORICAL_MONTHS = [
  { month: '2026-04', label: 'Apr 2026', shortLabel: 'Apr', baseAmount: 8450000, category: 'Belanja Bulanan' },
  { month: '2026-05', label: 'Mei 2026', shortLabel: 'May', baseAmount: 9200000, category: 'Tagihan & Utilitas' },
  { month: '2026-06', label: 'Jun 2026', shortLabel: 'Jun', baseAmount: 7850000, category: 'Belanja Bulanan' },
  { month: '2026-07', label: 'Jul 2026', shortLabel: 'Jul', baseAmount: 10450000, category: 'Pendidikan & Kuliner' },
  { month: '2026-08', label: 'Agu 2026', shortLabel: 'Aug', baseAmount: 8900000, category: 'Servis Mobil & Bensin' },
  { month: '2026-09', label: 'Sep 2026', shortLabel: 'Sep', baseAmount: 0, category: 'Belanja Rumah Tangga' }
];

export function getBaseMonths(isDemo = false, lang = 'id') {
  if (isDemo) {
    return BASE_HISTORICAL_MONTHS;
  }
  const monthNamesId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const names = lang === 'en' ? monthNamesEn : monthNamesId;

  const res = [];
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;
  for (let i = 5; i >= 0; i--) {
    let m = endMonth - i;
    let y = endYear;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const ym = `${y}-${String(m).padStart(2, '0')}`;
    res.push({
      month: ym,
      label: `${names[m - 1]} ${y}`,
      shortLabel: names[m - 1],
      baseAmount: 0,
      category: '-'
    });
  }
  return res;
}

export function computeMonthlyData(expenses, isDemo = false, lang = 'id') {
  const baseMonths = getBaseMonths(isDemo, lang);
  const expenseMap = {};
  if (Array.isArray(expenses)) {
    expenses.forEach(e => {
      const d = e.date || e.expense_date;
      if (!d) return;
      const ym = String(d).slice(0, 7);
      if (!expenseMap[ym]) {
        expenseMap[ym] = { total: 0, categories: {} };
      }
      const amt = Number(e.amount) || 0;
      expenseMap[ym].total += amt;
      const cat = e.category || 'Lainnya';
      expenseMap[ym].categories[cat] = (expenseMap[ym].categories[cat] || 0) + amt;
    });
  }

  const monthsObj = {};
  baseMonths.forEach(m => {
    monthsObj[m.month] = { ...m };
  });

  Object.keys(expenseMap).forEach(ym => {
    if (!monthsObj[ym]) {
      const parts = ym.split('-');
      const year = parts[0];
      const monthNum = parts[1];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(monthNum, 10) - 1;
      const shortLabel = monthNames[mIdx] || monthNum;
      monthsObj[ym] = {
        month: ym,
        label: `${shortLabel} ${year}`,
        shortLabel: shortLabel,
        baseAmount: 0,
        category: 'Pengeluaran Baru'
      };
    }
  });

  const sortedMonthKeys = Object.keys(monthsObj).sort();
  const latestKeys = sortedMonthKeys.slice(-6);

  return latestKeys.map((key) => {
    const m = monthsObj[key];
    const expData = expenseMap[m.month];
    const userExpenseTotal = expData ? expData.total : 0;
    const totalAmount = m.baseAmount + userExpenseTotal;

    let dominantCategory = m.category;
    if (expData && Object.keys(expData.categories).length > 0) {
      const sortedCats = Object.entries(expData.categories).sort((a, b) => b[1] - a[1]);
      if (sortedCats[0][1] > m.baseAmount) {
        dominantCategory = sortedCats[0][0];
      }
    }

    return {
      ...m,
      amount: totalAmount,
      category: dominantCategory,
      userExpenseTotal
    };
  });
}

export default function MonthlyExpenseChart({ 
  expenses = [],
  data = null, 
  budgetLimit = 10000000,
  onEditBudget = null,
  isDemo = false,
  className = '' 
}) {
  const { t, i18n } = useTranslation();
  const [hoveredMonth, setHoveredMonth] = useState(null);

  const chartData = data || computeMonthlyData(expenses, isDemo, i18n.language);
  const maxVal = Math.max(...chartData.map(d => d.amount), budgetLimit) * 1.25;

  const currentMonthData = chartData[chartData.length - 1];
  const prevMonthData = chartData.length > 1 ? chartData[chartData.length - 2] : null;

  const totalSpentAll = chartData.reduce((acc, d) => acc + d.amount, 0);
  const averageMonthly = Math.round(totalSpentAll / chartData.length);

  const momDiff = prevMonthData && prevMonthData.amount > 0
    ? Math.round(((currentMonthData.amount - prevMonthData.amount) / prevMonthData.amount) * 100)
    : 0;

  const highestMonth = [...chartData].sort((a, b) => b.amount - a.amount)[0];

  // Plafon target line is fixed at 65% of the chart canvas
  const CEILING_PERCENT = 65;

  // Monotonic, visually clear height calculation
  const getBarHeight = (amount) => {
    if (!amount || amount <= 0) return 6;
    if (amount <= budgetLimit) {
      const ratio = amount / budgetLimit;
      return Math.max(6, Math.round(ratio * CEILING_PERCENT));
    }
    // Over budget: guaranteed visible breach above the ceiling line
    const excessRatio = (amount - budgetLimit) / budgetLimit;
    const overshootPercent = Math.min(25, 8 + Math.round(excessRatio * 100));
    return Math.min(92, CEILING_PERCENT + overshootPercent);
  };

  const formatLimitDisplay = (lim) => {
    if (lim >= 1000000) {
      const inMillions = lim / 1000000;
      const formatted = inMillions % 1 === 0 ? inMillions.toFixed(0) : inMillions.toFixed(1);
      return `Rp ${formatted} ${i18n.language === 'id' ? 'Jt' : 'M'}`;
    }
    return `Rp ${lim.toLocaleString('id-ID')}`;
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
              📊
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {t('chart.title')}
            </h3>
            <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
              {i18n.language === 'id' ? '6 Bulan Terakhir' : 'Last 6 Months'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('chart.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-500">{t('chart.budget_ceiling')}:</span>
            <span className="font-bold text-slate-900">{formatLimitDisplay(budgetLimit)}</span>
            {onEditBudget && (
              <button
                type="button"
                onClick={onEditBudget}
                className="ml-1 p-0.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition cursor-pointer"
                title={t('finance.edit_budget_btn') || 'Ubah Plafon'}
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">{t('chart.six_month_avg')}:</span>
            <span className="font-bold text-slate-900">
              {averageMonthly > 0 ? `Rp ${(averageMonthly / 1000000).toFixed(1)} ${i18n.language === 'id' ? 'Jt/bln' : 'M/mo'}` : 'Rp 0'}
            </span>
          </div>

          {totalSpentAll === 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <span>✨ {i18n.language === 'id' ? 'Belum ada pengeluaran' : 'No expenses recorded'}</span>
            </div>
          ) : (
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black border ${
              momDiff <= 0 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {momDiff <= 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{Math.abs(momDiff)}% {t('chart.saved_vs_prev')} {prevMonthData?.shortLabel}</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                  <span>+{momDiff}% {t('chart.increased_vs_prev')} {prevMonthData?.shortLabel}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        {/* CHART PLOT AREA: Strict 240px container without padding to guarantee exact alignment */}
        <div className="relative h-60 w-full">
          {/* Budget Ceiling Reference Line */}
          <div 
            className="absolute left-0 right-0 border-b-2 border-dashed border-rose-500 z-10 flex items-center justify-end pointer-events-none transition-all duration-300"
            style={{ bottom: `${CEILING_PERCENT}%` }}
          >
            <span className="bg-rose-50 text-rose-700 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-rose-200 -mt-6 mr-1 shadow-xs whitespace-nowrap">
              🎯 {t('chart.budget_ceiling')} ({formatLimitDisplay(budgetLimit)})
            </span>
          </div>

          {/* Bars Plot Grid */}
          <div className="grid grid-cols-6 gap-2 sm:gap-4 h-full w-full items-end px-2 relative z-0">
            {chartData.map((item) => {
              const currentMonthKey = new Date().toISOString().slice(0, 7);
              const heightPercent = getBarHeight(item.amount);
              const isCurrent = item.month === currentMonthKey;
              const isOverBudget = item.amount > budgetLimit;
              const isHovered = hoveredMonth === item.month;

              return (
                <div 
                  key={item.month}
                  className="flex flex-col items-center justify-end h-full relative cursor-pointer group"
                  onMouseEnter={() => setHoveredMonth(item.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {/* Tooltip Hover Card */}
                  {isHovered && (
                    <div className="absolute -top-16 z-30 bg-slate-900 text-white rounded-xl py-1.5 px-3 text-[11px] shadow-xl whitespace-nowrap animate-fadeIn pointer-events-none">
                      <p className="font-extrabold text-amber-300">{item.label}</p>
                      <p className="font-bold text-white">Rp {item.amount.toLocaleString('id-ID')}</p>
                      <p className="text-[10px] text-slate-300">{item.category}</p>
                      {isOverBudget && (
                        <p className="text-[9px] text-rose-400 font-bold mt-0.5">⚠️ {t('chart.over_budget')}</p>
                      )}
                      <div className="w-2 h-2 bg-slate-900 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                    </div>
                  )}

                  {/* Dedicated Bar Container with Exact Calculated Height */}
                  <div 
                    className="w-full relative flex flex-col items-center justify-end"
                    style={{ height: `${heightPercent}%` }}
                  >
                    {/* Top Amount Badge (Floating above bar top, never affecting bar height) */}
                    <span className={`absolute -top-6 text-[10px] sm:text-[11px] font-bold transition z-20 whitespace-nowrap ${
                      isOverBudget
                        ? 'text-rose-600 font-black'
                        : isCurrent 
                          ? 'text-purple-700 font-black' 
                          : 'text-slate-500 group-hover:text-slate-900'
                    }`}>
                      {item.amount === 0 ? 'Rp 0' : `Rp ${(item.amount / 1000000).toFixed(1)}M`}
                    </span>

                    {/* Bar Graphic filling 100% of container */}
                    <div 
                      className={`w-full h-full rounded-t-xl transition-all duration-500 ease-out shadow-xs ${
                        isOverBudget 
                          ? 'bg-gradient-to-t from-rose-500 to-red-400 ring-2 ring-rose-400/50 shadow-rose-500/20' 
                          : isCurrent
                            ? 'bg-gradient-to-t from-purple-600 via-indigo-600 to-blue-500 shadow-purple-500/25 ring-2 ring-purple-400/40'
                            : 'bg-gradient-to-t from-slate-700 to-indigo-600 group-hover:from-indigo-600 group-hover:to-purple-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* X-AXIS LABELS: Separated from plot area to prevent coordinate distortion */}
        <div className="grid grid-cols-6 gap-2 sm:gap-4 px-2 pt-3 border-t border-slate-100 mt-2">
          {chartData.map((item) => {
            const currentMonthKey = new Date().toISOString().slice(0, 7);
            const isCurrent = item.month === currentMonthKey;
            const isOverBudget = item.amount > budgetLimit;

            return (
              <div key={item.month} className="text-center">
                <p className={`text-xs font-bold transition ${
                  isOverBudget
                    ? 'text-rose-600 font-black'
                    : isCurrent 
                      ? 'text-purple-700 font-black' 
                      : 'text-slate-600'
                }`}>
                  {item.shortLabel} {isCurrent ? `(${t('chart.active_month')})` : ''}
                </p>
                {isCurrent && (
                  <span className="inline-block w-1.5 h-1.5 bg-purple-600 rounded-full mt-0.5"></span>
                )}
                {isOverBudget && (
                  <span className="inline-block text-[9px] text-rose-500 font-bold block leading-none mt-0.5">
                    Over Limit
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            {totalSpentAll === 0 
              ? (i18n.language === 'id' 
                  ? 'Belum ada riwayat pengeluaran tercatat untuk rumah tangga ini.' 
                  : 'No expense history recorded yet for this household.')
              : `${t('chart.insight_highest')} ${highestMonth?.label} (Rp ${highestMonth?.amount.toLocaleString('id-ID')}).`}
          </span>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto text-[11px] font-semibold text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-500"></span>
            <span>{i18n.language === 'id' ? 'Bulan Berjalan' : 'Current Month'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
            <span>{i18n.language === 'id' ? 'Bulan Lalu' : 'Previous Months'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
