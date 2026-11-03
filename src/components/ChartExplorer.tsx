import React, { useState, useMemo, useRef } from 'react';
import { Search, Filter, Calendar, X, Eye, Info, Sparkles, Layers, Download, Grid, LayoutList, Table } from 'lucide-react';
import { DayKey, Language, WeekRecord, MarketType, MARKETS } from '../types';
import { 
  DAY_NAMES, 
  DAY_KEYS, 
  isRedJodi, 
  isMarketClosed,
  getCutAnk, 
  getJodiTotal, 
  getJodiDifference, 
  getFamilyJodis,
  getNearbyJodis,
  isValidPlayedJodi,
  calculatePanaSum,
  ALL_PANAS
} from '../utils/matkaMath';

interface ChartExplorerProps {
  history: WeekRecord[];
  language: Language;
  market?: MarketType;
}

export const ChartExplorer: React.FC<ChartExplorerProps> = ({
  history,
  language,
  market = 'kalyan',
}) => {
  const isMr = language === 'mr';
  const isNight = market === 'rajdhani_night';
  const marketInfo = MARKETS[market];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [onlyRed, setOnlyRed] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'compact' | 'panel' | 'classic'>('classic');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Classic view row navigation
  const classicTableRef = useRef<HTMLDivElement>(null);

  // Selected cell for detailed modal
  const [activeCellDetail, setActiveCellDetail] = useState<{
    week: string;
    dayKey: DayKey;
    openPana: string;
    jodi: string;
    closePana: string;
  } | null>(null);

  // Available years in dataset
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    history.forEach(rec => {
      // week format: "02-08-21 to 07-08-21" or "12-10-26 to 18-10-26"
      const match = rec.week.match(/-(\d{2})$/);
      if (match) {
        years.add('20' + match[1]);
      }
    });
    return Array.from(years).sort().reverse();
  }, [history]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return history.filter(row => {
      // Year filter
      if (selectedYear !== 'all') {
        const shortYear = selectedYear.slice(-2);
        if (!row.week.includes(`-${shortYear}`)) {
          return false;
        }
      }

      // Search term filter (jodi or pana)
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        let match = false;
        for (const d of DAY_KEYS) {
          const c = row[d];
          if (c) {
            if (c.jodi.includes(term) || c.openPana.includes(term) || c.closePana.includes(term)) {
              match = true;
              break;
            }
          }
        }
        if (!match) return false;
      }

      // Only red jodi filter
      if (onlyRed) {
        let hasRed = false;
        for (const d of DAY_KEYS) {
          if (isRedJodi(row[d]?.jodi)) {
            hasRed = true;
            break;
          }
        }
        if (!hasRed) return false;
      }

      return true;
    }).reverse(); // Most recent first
  }, [history, selectedYear, searchTerm, onlyRed]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const handleCellClick = (week: string, dayKey: DayKey, cell: { openPana: string; jodi: string; closePana: string }) => {
    if (!cell || cell.jodi.includes('*')) return;
    setActiveCellDetail({
      week,
      dayKey,
      openPana: cell.openPana,
      jodi: cell.jodi,
      closePana: cell.closePana,
    });
  };

  const handleExportCSV = () => {
    const headers = ['Week', 'Mon_OpenPana', 'Mon_Jodi', 'Mon_ClosePana', 'Tue_OpenPana', 'Tue_Jodi', 'Tue_ClosePana', 'Wed_OpenPana', 'Wed_Jodi', 'Wed_ClosePana', 'Thu_OpenPana', 'Thu_Jodi', 'Thu_ClosePana', 'Fri_OpenPana', 'Fri_Jodi', 'Fri_ClosePana', 'Sat_OpenPana', 'Sat_Jodi', 'Sat_ClosePana'];
    const rows = history.map(w => [
      `"${w.week}"`,
      w.mon?.openPana || '', w.mon?.jodi || '', w.mon?.closePana || '',
      w.tue?.openPana || '', w.tue?.jodi || '', w.tue?.closePana || '',
      w.wed?.openPana || '', w.wed?.jodi || '', w.wed?.closePana || '',
      w.thu?.openPana || '', w.thu?.jodi || '', w.thu?.closePana || '',
      w.fri?.openPana || '', w.fri?.jodi || '', w.fri?.closePana || '',
      w.sat?.openPana || '', w.sat?.jodi || '', w.sat?.closePana || '',
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      market === 'rajdhani_night'
        ? `rajdhani_night_historical_chart_2016_2026.csv`
        : market === 'manipur'
        ? `manipur_historical_chart_2022_2026.csv`
        : `kalyan_historical_chart_2021_2026.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Classic view: smooth scroll navigation
  const classicScrollUp = () => {
    const container = classicTableRef.current;
    if (!container) return;
    container.scrollBy({ top: -320, behavior: 'smooth' });
  };

  const classicScrollDown = () => {
    const container = classicTableRef.current;
    if (!container) return;
    container.scrollBy({ top: 320, behavior: 'smooth' });
  };

  const handleClassicRefresh = () => {
    const container = classicTableRef.current;
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Vertical pana renderer for mobile classic chart
  const renderVerticalPana = (pana: string, colorClass: string) => {
    const digits = pana && pana.length === 3 ? pana.split('') : ['*', '*', '*'];
    return (
      <div className={`flex flex-col items-center justify-center text-[8px] sm:text-[9.5px] font-bold font-mono leading-[1.05] shrink-0 select-none ${colorClass}`}>
        {digits.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
    );
  };

  // Classic view column header labels
  const classicDayLabels: Record<DayKey, { en: string; mr: string }> = {
    mon: { en: 'Mon', mr: 'सोम' },
    tue: { en: 'Tue', mr: 'मंगळ' },
    wed: { en: 'Wed', mr: 'बुध' },
    thu: { en: 'Thu', mr: 'गुरु' },
    fri: { en: 'Fri', mr: 'शुक्र' },
    sat: { en: 'Sat', mr: 'शनि' },
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>
                  {market === 'rajdhani_night'
                    ? (isMr ? 'राजधानी नाईट जोडी व पॅनल चार्ट (२०१६ - २०२६)' : 'Rajdhani Night Jodi & Panel Chart Archive')
                    : market === 'manipur'
                    ? (isMr ? 'मणीपुर जोडी व पॅनल चार्ट (२०२२ - २०२६)' : 'Manipur Jodi & Panel Chart Archive')
                    : (isMr ? 'कल्याण जोडी व पॅनल चार्ट (२०२१ - २०२६)' : 'Kalyan Jodi & Panel Chart Archive')}
                </span>
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                {marketInfo.name[language]}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {isMr 
                ? `${history.length} आठवड्यांचा संपूर्ण चार्ट. कोणत्याही जोडीवर क्लिक करून सखोल गणित तपासा.`
                : `${history.length} weeks complete historical panel archive. Click on any pair to inspect formulas and panas.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle (Jodi / Panel / Classic) */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('compact')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'compact'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isMr ? 'जोडी व्ह्यू' : 'Compact Jodi View'}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>{isMr ? 'जोडी व्ह्यू' : 'Jodi'}</span>
              </button>
              <button
                onClick={() => setViewMode('panel')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'panel'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isMr ? 'पारंपरिक उभा पॅनल चार्ट व्ह्यू' : 'Full Vertical Panel View'}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>{isMr ? 'पॅनल व्ह्यू' : 'Panel'}</span>
              </button>
              <button
                onClick={() => setViewMode('classic')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'classic'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isMr ? 'क्लासिक सत्ता मटका पॅनल चार्ट' : 'Classic Satta Panel Chart'}
              >
                <Table className="w-3.5 h-3.5" />
                <span>{isMr ? 'क्लासिक' : 'Classic'}</span>
              </button>
            </div>

            {/* Year Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="all">{isMr ? 'सर्व वर्षे (All Years)' : 'All Years'}</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Red Jodi Toggle */}
            <button
              onClick={() => {
                setOnlyRed(!onlyRed);
                setPage(1);
              }}
              className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border transition-all flex items-center gap-1.5 ${
                onlyRed
                  ? 'bg-red-950/60 border-red-500 text-red-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${onlyRed ? 'bg-red-400 animate-pulse' : 'bg-slate-600'}`} />
              <span>{isMr ? 'फक्त लाल' : 'Red Only'}</span>
            </button>

            {/* CSV Export Button */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center gap-1.5"
              title={isMr ? 'संपूर्ण चार्ट एक्सेल CSV फाईलमध्ये डाऊनलोड करा' : 'Export Full Chart to CSV'}
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isMr ? 'CSV डाऊनलोड' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={isMr ? 'जोडी किंवा पाना शोधा... (उदा. 55, 34, 159)' : 'Search Jodi or Pana (e.g. 55, 34, 159)...'}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chart Table */}
      {viewMode === 'classic' ? (
        /* ── CLASSIC PANEL VIEW ── */
        /* ── CLASSIC PANEL VIEW (EXACT TO SCREENSHOT) ── */
        <div className="relative">
          {/* Outer container: Solid dark red border */}
          <div className="border-2 sm:border-3 border-[#800000] rounded-none sm:rounded-lg overflow-hidden shadow-xl bg-white dark:bg-slate-900">
            {/* Scrollable table container (NO horizontal scroll, smooth vertical scroll) */}
            <div
              ref={classicTableRef}
              className="overflow-x-hidden overflow-y-auto max-h-[75vh]"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <table className="w-full table-fixed border-collapse text-center">
                {/* Sticky Dark Navy Blue Header */}
                <thead className="sticky top-0 z-20 bg-[#072448] classic-chart-header">
                  <tr className="bg-[#072448]">
                    <th
                      className="classic-chart-th sticky top-0 z-20 w-[13%] py-2 px-0.5 text-center font-bold text-[11px] sm:text-xs border-r border-b border-[#04172e] bg-[#072448] !text-white"
                      style={{ color: '#ffffff', backgroundColor: '#072448' }}
                    >
                      <span className="!text-white" style={{ color: '#ffffff' }}>{isMr ? 'तारीख' : 'Date'}</span>
                    </th>
                    {DAY_KEYS.map((day) => (
                      <th
                        key={day}
                        className="classic-chart-th sticky top-0 z-20 w-[14.5%] py-2 px-0.5 text-center font-bold text-[11px] sm:text-xs border-r border-b border-[#04172e] last:border-r-0 bg-[#072448] !text-white"
                        style={{ color: '#ffffff', backgroundColor: '#072448' }}
                      >
                        <span className="!text-white" style={{ color: '#ffffff' }}>{classicDayLabels[day][language]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-slate-400 text-sm bg-white dark:bg-slate-900"
                      >
                        {isMr ? 'कोणतेही निकाल आढळले नाहीत.' : 'No records found matching filters.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, rowIdx) => {
                      const isEven = rowIdx % 2 === 0;
                      // Split week range: "02-08-21 to 07-08-21"
                      const weekParts = row.week.split(/\s+to\s+/i);
                      const d1 = weekParts[0] || row.week;
                      const d2 = weekParts[1] || '';

                      return (
                        <tr
                          key={row.week}
                          className={isEven ? 'bg-white dark:bg-slate-900' : 'bg-[#f0f2f5] dark:bg-slate-800/80'}
                        >
                          {/* Date Column: 3 lines (d1, to, d2) */}
                          <td className="w-[13%] py-1 px-0.5 text-center border-r border-b border-gray-300 dark:border-slate-700/80">
                            <div className="flex flex-col items-center justify-center text-[7.5px] sm:text-[9px] font-bold font-mono leading-[1.1] text-slate-800 dark:text-slate-200 select-none py-0.5">
                              <span>{d1}</span>
                              {d2 ? (
                                <>
                                  <span className="text-[6.5px] sm:text-[7.5px] font-medium text-slate-500 dark:text-slate-400 lowercase leading-[1]">
                                    to
                                  </span>
                                  <span>{d2}</span>
                                </>
                              ) : null}
                            </div>
                          </td>

                          {/* Day Cells: Left vertical open pana, Center Jodi, Right vertical close pana */}
                          {DAY_KEYS.map((day) => {
                            const cell = row[day];

                            if (!cell) {
                              return (
                                <td
                                  key={day}
                                  className="w-[14.5%] py-1 px-0.5 border-r border-b border-gray-300 dark:border-slate-700/80 last:border-r-0 text-slate-400 text-xs"
                                >
                                  —
                                </td>
                              );
                            }

                            const isRed = isRedJodi(cell.jodi);
                            const isClosed = isMarketClosed(cell.jodi);
                            const isOpenOnly = !isClosed && cell.openPana !== '***' && cell.closePana === '***';
                            const isPending = !isOpenOnly && !isClosed && cell.jodi.includes('*');

                            return (
                              <td
                                key={day}
                                onClick={() => !isClosed && handleCellClick(row.week, day, cell)}
                                className={`w-[14.5%] py-1 px-0.5 border-r border-b border-gray-300 dark:border-slate-700/80 last:border-r-0 transition-colors ${
                                  isClosed
                                    ? 'bg-slate-100/60 dark:bg-slate-900/40 cursor-default'
                                    : isPending
                                    ? 'cursor-default'
                                    : isOpenOnly
                                    ? 'cursor-pointer hover:bg-amber-100/60 dark:hover:bg-amber-500/10'
                                    : 'cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700/50'
                                }`}
                                title={
                                  isClosed
                                    ? (isMr ? 'मार्केट सुट्टी / बंद' : 'Market Closed')
                                    : isPending
                                    ? undefined
                                    : isOpenOnly
                                    ? (isMr ? 'दुपारचा ओपन निकाल जाहीर (क्लोज संध्याकाळी ६:०० पर्यंत येईल)' : 'Open declared, Close pending until ~6:00 PM')
                                    : (isMr ? 'सविस्तर गणित पाहण्यासाठी क्लिक करा' : 'Click to inspect')
                                }
                              >
                                {isClosed ? (
                                  <div className="flex items-center justify-center px-0.5 sm:px-1 py-1 w-full h-full font-mono text-slate-400">
                                    <span className="text-[11px] sm:text-[13px] font-bold">**</span>
                                  </div>
                                ) : isPending ? (
                                  <div className="flex items-center justify-between px-0.5 sm:px-1 py-1 w-full h-full font-mono">
                                    {renderVerticalPana('***', 'text-slate-400 dark:text-slate-500')}
                                    <span className="text-[13px] sm:text-[15px] font-black leading-none px-0.5 tracking-tighter text-slate-400 dark:text-slate-500">
                                      **
                                    </span>
                                    {renderVerticalPana('***', 'text-slate-400 dark:text-slate-500')}
                                  </div>
                                ) : isOpenOnly ? (
                                  <div className="flex items-center justify-between px-0.5 sm:px-1 py-1 w-full h-full font-mono">
                                    {renderVerticalPana(cell.openPana, 'text-amber-500')}
                                    <span className="text-[13px] sm:text-[15px] font-black leading-none px-0.5 tracking-tighter text-amber-500">
                                      {cell.jodi.replace('*', '')}*
                                    </span>
                                    {renderVerticalPana('***', 'text-slate-400 dark:text-slate-500')}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between px-0.5 sm:px-1 py-1 w-full h-full font-mono">
                                    {renderVerticalPana(cell.openPana, isRed ? 'text-[#e50000]' : 'text-black dark:text-slate-100')}
                                    <span
                                      className={`text-[13px] sm:text-[15px] font-black leading-none px-0.5 tracking-tighter ${
                                        isRed ? 'text-[#e50000]' : 'text-black dark:text-white'
                                      }`}
                                    >
                                      {cell.jodi}
                                    </span>
                                    {renderVerticalPana(cell.closePana, isRed ? 'text-[#e50000]' : 'text-black dark:text-slate-100')}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Floating ↑ ↓ navigation — bottom-left */}
          <div className="fixed bottom-6 left-4 z-40 flex flex-col gap-2">
            <button
              type="button"
              onClick={classicScrollUp}
              className="classic-scroll-btn w-11 h-11 rounded-full bg-[#e91e63] hover:bg-[#d81b60] text-white shadow-lg flex items-center justify-center font-bold text-lg active:scale-95 transition-transform"
              style={{ color: '#ffffff' }}
              title={isMr ? 'वर स्क्रोल करा' : 'Scroll Up'}
              aria-label="Scroll up"
            >
              <span style={{ color: '#ffffff' }}>↑</span>
            </button>
            <button
              type="button"
              onClick={classicScrollDown}
              className="classic-scroll-btn w-11 h-11 rounded-full bg-[#e91e63] hover:bg-[#d81b60] text-white shadow-lg flex items-center justify-center font-bold text-lg active:scale-95 transition-transform"
              style={{ color: '#ffffff' }}
              title={isMr ? 'खाली स्क्रोल करा' : 'Scroll Down'}
              aria-label="Scroll down"
            >
              <span style={{ color: '#ffffff' }}>↓</span>
            </button>
          </div>

          {/* Floating Refresh button — bottom-right */}
          <button
            type="button"
            onClick={handleClassicRefresh}
            className="classic-refresh-btn fixed bottom-6 right-4 z-40 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-[#072448] hover:bg-[#0a2f5c] !text-white text-xs sm:text-sm font-bold shadow-xl border border-blue-900 flex items-center gap-1.5 active:scale-95 transition-transform"
            style={{ color: '#ffffff', backgroundColor: '#072448' }}
            title={isMr ? 'वरती जा' : 'Back to top'}
          >
            <span className="text-base leading-none !text-white" style={{ color: '#ffffff' }}>⟳</span>
            <span className="!text-white" style={{ color: '#ffffff' }}>{isMr ? 'रिफ्रेश' : 'Refresh'}</span>
          </button>

          {/* Row count info */}
          <div className="mt-2 px-1 text-xs text-slate-500 dark:text-slate-400 text-right">
            {isMr
              ? `एकूण ${filteredRows.length} आठवडे`
              : `${filteredRows.length} weeks shown`}
          </div>
        </div>
      ) : (
        /* ── EXISTING COMPACT / PANEL VIEW ── */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
                  <th className="py-3 px-3 font-semibold tracking-wider text-left min-w-[120px]">
                    {isMr ? 'तारीख (Week)' : 'Week Dates'}
                  </th>
                  {DAY_KEYS.map((day) => (
                    <th key={day} className="py-3 px-2 font-bold tracking-wider text-amber-600 dark:text-amber-400 min-w-[130px]">
                      <div>{DAY_NAMES[day][language]}</div>
                      {isNight && day === 'sat' && (
                        <span className="inline-block text-[10px] font-normal text-slate-500 dark:text-slate-400">
                          ({isMr ? 'सुट्टी / Off' : 'Closed'})
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs sm:text-sm font-mono">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                      {isMr ? 'कोणतेही निकाल आढळले नाहीत.' : 'No records found matching filters.'}
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.week} className="hover:bg-slate-800/40 transition-colors">
                      {/* Week Date Column */}
                      <td className="py-3 px-3 text-left font-sans text-xs text-slate-400 font-medium whitespace-nowrap">
                        {row.week}
                      </td>

                      {/* Day Cells */}
                      {DAY_KEYS.map((day) => {
                        const cell = row[day];
                        if (!cell) return <td key={day} className="py-2 px-1 text-slate-600">-</td>;

                        const isRed = isRedJodi(cell.jodi);
                        const isClosed = isMarketClosed(cell.jodi);
                        const isOpenOnly = !isClosed && cell.openPana !== '***' && cell.closePana === '***';
                        const isPending = !isOpenOnly && !isClosed && cell.jodi.includes('*');

                        return (
                          <td
                            key={day}
                            onClick={() => !isClosed && handleCellClick(row.week, day, cell)}
                            className={`py-2 px-2 transition-all ${
                              isClosed
                                ? 'bg-slate-900/40 text-amber-500/80 cursor-default'
                                : isPending
                                ? 'bg-slate-950/20 text-slate-600 cursor-default'
                                : isOpenOnly
                                ? 'bg-amber-500/10 border-amber-500/30 cursor-pointer'
                                : isRed
                                ? 'bg-red-950/20 hover:bg-red-950/40 cursor-pointer'
                                : 'hover:bg-amber-500/10 cursor-pointer'
                            }`}
                            title={
                              isClosed
                                ? (isMr ? 'मार्केट सुट्टी / बंद' : 'Market Closed')
                                : isPending 
                                ? undefined 
                                : isOpenOnly 
                                ? (isMr ? 'दुपारचा ओपन निकाल जाहीर (क्लोज संध्याकाळी ६:०० पर्यंत येईल)' : 'Open declared, Close pending until ~6:00 PM')
                                : (isMr ? 'सविस्तर गणित पाहण्यासाठी क्लिक करा' : 'Click to inspect')
                            }
                          >
                            {isClosed ? (
                              <div className="flex flex-col items-center justify-center py-1">
                                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded font-sans">
                                  {isMr ? 'मार्केट बंद' : 'CLOSED'}
                                </span>
                                <span className="text-xs font-mono text-slate-500 mt-0.5">XX</span>
                              </div>
                            ) : isPending ? (
                              viewMode === 'panel' ? (
                                <div className="flex flex-col items-center justify-center py-1 text-slate-600 text-xs font-mono">
                                  <span className="text-[10px]">***</span>
                                  <span className="font-bold my-0.5">**</span>
                                  <span className="text-[10px]">***</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5 text-slate-600 text-xs">
                                  <span>***</span>
                                  <span className="font-bold">**</span>
                                  <span>***</span>
                                </div>
                              )
                            ) : isOpenOnly ? (
                              viewMode === 'panel' ? (
                                <div className="flex flex-col items-center justify-center py-1 font-mono">
                                  <span className="text-[11px] text-amber-300 font-semibold tracking-tight">
                                    {cell.openPana}
                                  </span>
                                  <span className="text-base sm:text-xl font-black tracking-tight my-0.5 px-2 py-0.5 rounded text-amber-400 bg-amber-500/20 border border-amber-500/50 shadow-sm shadow-amber-500/20">
                                    {cell.jodi.replace('*', '')}*
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-medium tracking-tight">
                                    ***
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-[11px] text-amber-300 font-semibold tracking-tight">
                                    {cell.openPana}
                                  </span>
                                  <span className="text-base sm:text-lg font-black tracking-tight px-2 py-0.5 rounded text-amber-400 bg-amber-500/20 border border-amber-500/50 shadow-sm shadow-amber-500/20">
                                    {cell.jodi.replace('*', '')}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-medium tracking-tight">
                                    ***
                                  </span>
                                </div>
                              )
                            ) : (
                              viewMode === 'panel' ? (
                                <div className="flex flex-col items-center justify-center py-1 font-mono">
                                  <span className="text-[11px] text-slate-400 font-medium tracking-tight">
                                    {cell.openPana}
                                  </span>
                                  <span
                                    className={`text-base sm:text-xl font-black tracking-tight my-0.5 px-2 py-0.5 rounded ${
                                      isRed
                                        ? 'text-red-400 bg-red-950/60 font-black'
                                        : 'text-amber-300 font-black'
                                    }`}
                                  >
                                    {cell.jodi}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-medium tracking-tight">
                                    {cell.closePana}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-[11px] text-slate-400 font-medium tracking-tight">
                                    {cell.openPana}
                                  </span>
                                  <span
                                    className={`text-base sm:text-lg font-black tracking-tight px-1.5 py-0.5 rounded ${
                                      isRed
                                        ? 'text-red-400 bg-red-950/60 font-black'
                                        : 'text-amber-300 font-black'
                                    }`}
                                  >
                                    {cell.jodi}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-medium tracking-tight">
                                    {cell.closePana}
                                  </span>
                                </div>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              <span>
                {isMr
                  ? `एकूण ${filteredRows.length} आठवडे (पृष्ठ ${page} पैकी ${totalPages})`
                  : `Showing page ${page} of ${totalPages} (${filteredRows.length} weeks)`}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isMr ? 'मागील (Prev)' : 'Previous'}
              </button>
              <span className="px-2 font-mono text-slate-200">{page}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isMr ? 'पुढील (Next)' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CELL INSPECTOR MODAL */}
      {activeCellDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setActiveCellDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                {DAY_NAMES[activeCellDetail.dayKey][language]} · {activeCellDetail.week}
              </div>
              <h3 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                <span>{isMr ? 'कल्याण निकाल सविस्तर गणित' : 'Result Mathematical Breakdown'}</span>
              </h3>
            </div>

            {/* Core Box: Pana - Jodi - Pana */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-around text-center">
              <div>
                <div className="text-[11px] text-slate-400 mb-0.5">{isMr ? 'ओपन पाना' : 'Open Pana'}</div>
                <div className="text-xl font-black font-mono text-slate-200">{activeCellDetail.openPana}</div>
                <div className="text-[10px] text-emerald-400 font-mono mt-1">
                  ∑ = {calculatePanaSum(activeCellDetail.openPana)} (अंक)
                </div>
              </div>

              <div className="h-10 w-px bg-slate-800" />

              <div>
                <div className="text-[11px] text-slate-400 mb-0.5">{isMr ? 'जोडी' : 'Jodi'}</div>
                <div
                  className={`text-3xl font-black font-mono ${
                    isRedJodi(activeCellDetail.jodi) ? 'text-red-400' : 'text-amber-400'
                  }`}
                >
                  {activeCellDetail.jodi}
                </div>
                <div className="text-[10px] font-semibold mt-1">
                  {isRedJodi(activeCellDetail.jodi) ? (
                    <span className="text-red-400">{isMr ? 'लाल जोडी' : 'Red Jodi'}</span>
                  ) : (
                    <span className="text-slate-400">{isMr ? 'रेग्युलर जोडी' : 'Standard Jodi'}</span>
                  )}
                </div>
              </div>

              <div className="h-10 w-px bg-slate-800" />

              <div>
                <div className="text-[11px] text-slate-400 mb-0.5">{isMr ? 'क्लोज पाना' : 'Close Pana'}</div>
                <div className="text-xl font-black font-mono text-slate-200">{activeCellDetail.closePana}</div>
                <div className="text-[10px] text-emerald-400 font-mono mt-1">
                  ∑ = {calculatePanaSum(activeCellDetail.closePana)} (अंक)
                </div>
              </div>
            </div>

            {/* Mathematical Properties */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-slate-400 block">{isMr ? 'जोडी बेरीज (Total):' : 'Jodi Sum Total:'}</span>
                <span className="text-base font-bold font-mono text-white">
                  {getJodiTotal(activeCellDetail.jodi)}
                </span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-slate-400 block">{isMr ? 'जोडी फरक (Difference):' : 'Jodi Difference:'}</span>
                <span className="text-base font-bold font-mono text-white">
                  {getJodiDifference(activeCellDetail.jodi)}
                </span>
              </div>
            </div>

            {/* Cut Ank Table for this Jodi */}
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-amber-400 block">
                {isMr ? 'कट अंक संबंध (Cut Ank Relationship):' : 'Cut Ank Relationship:'}
              </span>
              <div className="text-slate-300 flex items-center justify-between">
                <span>
                  ओपन {activeCellDetail.jodi[0]} चा कट: <strong className="text-white font-mono">{getCutAnk(parseInt(activeCellDetail.jodi[0], 10))}</strong>
                </span>
                <span>
                  क्लोज {activeCellDetail.jodi[1]} चा कट: <strong className="text-white font-mono">{getCutAnk(parseInt(activeCellDetail.jodi[1], 10))}</strong>
                </span>
              </div>
            </div>

            {/* Family Jodis */}
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">
                  {isMr ? 'या जोडीची संपूर्ण फॅमिली (Family Jodis):' : 'Complete Family Pairs:'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {getFamilyJodis(activeCellDetail.jodi).length} {isMr ? 'जोड्या' : 'pairs'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 font-mono text-sm">
                {getFamilyJodis(activeCellDetail.jodi).map(fj => (
                  <span
                    key={fj}
                    className={`px-2 py-1 rounded-lg border font-bold ${
                      fj === activeCellDetail.jodi
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : isRedJodi(fj)
                        ? 'bg-red-950/40 border-red-500/40 text-red-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    {fj}
                  </span>
                ))}
              </div>
            </div>

            {/* Line & Trick Analysis Section (खेळ कसा झाला?) */}
            {(() => {
              const currentWeekIdx = history.findIndex(w => w.week === activeCellDetail.week);
              const currentDayIdx = DAY_KEYS.indexOf(activeCellDetail.dayKey);
              
              let prevDayData: { name: string; jodi: string; openPana: string; closePana: string } | null = null;
              if (currentDayIdx > 0 && currentWeekIdx >= 0) {
                const prevKey = DAY_KEYS[currentDayIdx - 1];
                const cell = history[currentWeekIdx][prevKey];
                if (cell && cell.jodi && !cell.jodi.includes('*')) {
                  prevDayData = { name: DAY_NAMES[prevKey][language], ...cell };
                }
              } else if (currentDayIdx === 0 && currentWeekIdx > 0) {
                const cell = history[currentWeekIdx - 1].sat;
                if (cell && cell.jodi && !cell.jodi.includes('*')) {
                  prevDayData = { name: DAY_NAMES.sat[language], ...cell };
                }
              }

              let prevWeekSameDayData: { jodi: string; openPana: string; closePana: string } | null = null;
              if (currentWeekIdx > 0) {
                const cell = history[currentWeekIdx - 1][activeCellDetail.dayKey];
                if (cell && cell.jodi && !cell.jodi.includes('*')) {
                  prevWeekSameDayData = cell;
                }
              }

              const curO = parseInt(activeCellDetail.jodi[0], 10);
              const curC = parseInt(activeCellDetail.jodi[1], 10);

              const tricks: string[] = [];

              if (prevDayData) {
                const pO = parseInt(prevDayData.jodi[0], 10);
                const pC = parseInt(prevDayData.jodi[1], 10);

                if (curO === pC) {
                  tricks.push(isMr ? `आदल्या दिवसाचा क्लोज अंक (${pC}) थेट आजच्या ओपनला आला.` : `Previous close (${pC}) arrived directly at open.`);
                } else if (curO === getCutAnk(pC)) {
                  tricks.push(isMr ? `आदल्या क्लोजचा (${pC}) कट अंक (${curO}) आज ओपनला आला.` : `Previous close cut (${pC} ➔ ${curO}) arrived at open.`);
                }

                if (curC === pC) {
                  tricks.push(isMr ? `आदल्या दिवसाचा क्लोज अंक (${pC}) थेट आज क्लोजला रिपीट झाला.` : `Previous close (${pC}) repeated at close.`);
                } else if (curC === getCutAnk(pC)) {
                  tricks.push(isMr ? `आदल्या क्लोजचा (${pC}) कट अंक (${curC}) आजच्या क्लोजला आला.` : `Previous close cut (${pC} ➔ ${curC}) arrived at close.`);
                }

                const pTotal = (pO + pC) % 10;
                if (curO === pTotal || curC === pTotal) {
                  tricks.push(isMr ? `आदल्या जोडीची बेरीज (${pTotal}) थेट आजच्या निकालात आली.` : `Previous pair total (${pTotal}) appeared today.`);
                }
                if (curO === getCutAnk(pTotal) || curC === getCutAnk(pTotal)) {
                  tricks.push(isMr ? `आदल्या जोडीच्या बेरजेचा कट (${getCutAnk(pTotal)}) आज निकालात आला.` : `Previous total cut (${getCutAnk(pTotal)}) appeared today.`);
                }
              }

              if (prevWeekSameDayData) {
                const pwO = parseInt(prevWeekSameDayData.jodi[0], 10);
                const pwC = parseInt(prevWeekSameDayData.jodi[1], 10);

                const isSameFamily = getFamilyJodis(prevWeekSameDayData.jodi).includes(activeCellDetail.jodi);
                if (isSameFamily) {
                  tricks.push(isMr ? `मागील आठवड्यातील समान वाराच्या जोडीची (${prevWeekSameDayData.jodi}) थेट फॅमिली जोडी (${activeCellDetail.jodi}) लागली.` : `Direct family pair carryover from previous week (${prevWeekSameDayData.jodi} ➔ ${activeCellDetail.jodi}).`);
                } else {
                  if (curO === pwO || curO === getCutAnk(pwO)) {
                    tricks.push(isMr ? `मागील आठवड्यातील समान वाराचा ओपन/कट अंक (${pwO} ➔ ${curO}) आला.` : `Same-day open repetition/cut.`);
                  }
                  if (curC === pwC || curC === getCutAnk(pwC)) {
                    tricks.push(isMr ? `मागील आठवड्यातील समान वाराचा क्लोज/कट अंक (${pwC} ➔ ${curC}) रिपीट झाला.` : `Same-day close repetition/cut.`);
                  }
                }
              }

              // 3. Multi-Week Diagonal Progression & Nearby Numbers Check (तिरपी लाइन व जवळचे अंक)
              let diagSourceStep: { week: string; day: DayKey; jodi: string } | null = null;
              if (currentWeekIdx >= 1 && currentDayIdx - 1 >= 0) {
                const dKey = DAY_KEYS[currentDayIdx - 1];
                const c = history[currentWeekIdx - 1]?.[dKey];
                if (c && isValidPlayedJodi(c.jodi)) {
                  diagSourceStep = { week: history[currentWeekIdx - 1].week, day: dKey, jodi: c.jodi };
                }
              }
              if (diagSourceStep) {
                const sJodi = diagSourceStep.jodi;
                const sRev = `${sJodi[1]}${sJodi[0]}`;
                const sFamily = getFamilyJodis(sJodi);
                const sNearby = getNearbyJodis(sJodi);
                const curJodi = activeCellDetail.jodi;

                if (curJodi === sJodi) {
                  tricks.push(
                    isMr
                      ? `२+ आठवड्यांच्या तिरपी रेषेवरून (${DAY_NAMES[diagSourceStep.day].mr} ${sJodi}) थेट जोडी (${curJodi}) लागली.`
                      : `Direct multi-week diagonal carry-over from ${DAY_NAMES[diagSourceStep.day].en} (${sJodi}).`
                  );
                } else if (curJodi === sRev) {
                  tricks.push(
                    isMr
                      ? `२+ आठवड्यांच्या तिरपी रेषेवरून (${DAY_NAMES[diagSourceStep.day].mr} ${sJodi}) पलट जोडी (${curJodi}) लागली.`
                      : `Palat reverse diagonal carry-over from ${DAY_NAMES[diagSourceStep.day].en} (${sJodi}).`
                  );
                } else if (sFamily.includes(curJodi)) {
                  tricks.push(
                    isMr
                      ? `२+ आठवड्यांच्या तिरपी रेषेवरून (${DAY_NAMES[diagSourceStep.day].mr} ${sJodi}) फॅमिली जोडी (${curJodi}) लागली.`
                      : `Family diagonal carry-over from ${DAY_NAMES[diagSourceStep.day].en} (${sJodi}).`
                  );
                } else if (sNearby.includes(curJodi)) {
                  tricks.push(
                    isMr
                      ? `२+ आठवड्यांच्या तिरपी रेषेवरून जवळचा अंक (±१ दाणा / शेजारील घर: ${sJodi} ➔ ${curJodi}) आला.`
                      : `Nearby ±1 Dana shift from diagonal source (${sJodi} ➔ ${curJodi}).`
                  );
                }
              }

              return (
                <div className="bg-amber-500/10 dark:bg-gradient-to-r dark:from-amber-500/10 dark:via-slate-950 dark:to-amber-500/5 border border-amber-500/30 p-3.5 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-amber-400 uppercase tracking-wider">
                      {isMr ? 'खेळ कसा झाला? (Line & Trick Post-Mortem):' : 'Line & Trick Post-Mortem:'}
                    </span>
                  </div>
                  
                  {prevDayData && (
                    <div className="text-slate-300">
                      <span className="text-slate-400">{isMr ? '१. आदल्या दिवसाचा निकाल:' : '1. Preceding Day:'}</span>{' '}
                      <strong className="text-white font-mono">{prevDayData.name} ({prevDayData.jodi})</strong>
                    </div>
                  )}

                  {prevWeekSameDayData && (
                    <div className="text-slate-300">
                      <span className="text-slate-400">{isMr ? '२. मागील आठवड्याचा समान वार:' : '2. Previous Week Same Day:'}</span>{' '}
                      <strong className="text-white font-mono">{prevWeekSameDayData.jodi}</strong>
                    </div>
                  )}

                  {diagSourceStep && (
                    <div className="text-slate-300">
                      <span className="text-slate-400">{isMr ? '३. तिरपी लाईन स्त्रोत (१ आठवड्यापूर्वी):' : '3. Diagonal Source (1 Wk Prior):'}</span>{' '}
                      <strong className="text-indigo-400 font-mono">{DAY_NAMES[diagSourceStep.day][language]} ({diagSourceStep.jodi})</strong>
                    </div>
                  )}

                  <div className="pt-1.5 border-t border-slate-800/80">
                    <div className="text-[11px] font-semibold text-slate-300 mb-1">
                      {isMr ? 'सिद्ध झालेली गणितीय लाईन (Derived Tricks):' : 'Identified Line Patterns:'}
                    </div>
                    {tricks.length > 0 ? (
                      <ul className="space-y-1 text-[11px] text-emerald-300 list-disc list-inside">
                        {tricks.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-[11px] text-slate-400">
                        {isMr ? 'ही जोडी स्वतंत्र बेरीज-फरक आणि पाना प्रोग्रेशनवर आधारलेली आहे.' : 'Independent combinatoric pattern.'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="text-right pt-2">
              <button
                onClick={() => setActiveCellDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
              >
                {isMr ? 'बंद करा' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
