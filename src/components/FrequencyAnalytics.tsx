import React, { useMemo, useState } from 'react';
import { Flame, Snowflake, BarChart3, TrendingUp, Info } from 'lucide-react';
import { DayKey, Language, WeekRecord, MarketType, MARKETS } from '../types';
import { DAY_NAMES, DAY_KEYS, isRedJodi, calculateFrequencyOTC, getCutAnk } from '../utils/matkaMath';

interface FrequencyAnalyticsProps {
  history: WeekRecord[];
  language: Language;
  market?: MarketType;
}

export const FrequencyAnalytics: React.FC<FrequencyAnalyticsProps> = ({
  history,
  language,
  market = 'kalyan',
}) => {
  const isMr = language === 'mr';
  const isNight = market === 'rajdhani_night';
  const marketInfo = MARKETS[market];

  const [selectedDayTab, setSelectedDayTab] = useState<DayKey | 'all'>('all');

  // Compute frequencies across either selected day or all days
  const analyticsData = useMemo(() => {
    const openCounts: Record<number, number> = { 0:0,1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0 };
    const closeCounts: Record<number, number> = { 0:0,1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0 };
    const lastSeen: Record<number, number> = { 0:999,1:999,2:999,3:999,4:999,5:999,6:999,7:999,8:999,9:999 };

    let totalPairs = 0;
    let redCount = 0;

    for (let i = history.length - 1; i >= 0; i--) {
      const rec = history[i];
      const daysToCheck = selectedDayTab === 'all' ? DAY_KEYS : [selectedDayTab];

      for (const d of daysToCheck) {
        const cell = rec[d];
        if (cell && cell.jodi && !cell.jodi.includes('*') && cell.jodi !== 'XX') {
          const o = parseInt(cell.jodi[0], 10);
          const c = parseInt(cell.jodi[1], 10);
          if (!isNaN(o) && !isNaN(c)) {
            totalPairs++;
            openCounts[o]++;
            closeCounts[c]++;

            if (isRedJodi(cell.jodi)) {
              redCount++;
            }

            const distance = history.length - 1 - i;
            if (lastSeen[o] === 999) lastSeen[o] = distance;
            if (lastSeen[c] === 999) lastSeen[c] = distance;
          }
        }
      }
    }

    const digitStats = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
      const total = openCounts[d] + closeCounts[d];
      const pct = totalPairs > 0 ? (total / (totalPairs * 2)) * 100 : 10;
      return {
        digit: d,
        open: openCounts[d],
        close: closeCounts[d],
        total,
        percentage: Number(pct.toFixed(1)),
        lastSeenWeeksAgo: lastSeen[d],
      };
    });

    // Find hottest and coldest
    const sortedByTotal = [...digitStats].sort((a, b) => b.total - a.total);
    const sortedByOverdue = [...digitStats].sort((a, b) => b.lastSeenWeeksAgo - a.lastSeenWeeksAgo);

    const redJodiPct = totalPairs > 0 ? Number(((redCount / totalPairs) * 100).toFixed(1)) : 20;

    return {
      digitStats,
      totalPairs,
      redCount,
      redJodiPct,
      hotDigits: sortedByTotal.slice(0, 3),
      coldDigits: sortedByOverdue.slice(0, 3),
      maxCount: Math.max(...digitStats.map(d => d.total)),
    };
  }, [history, selectedDayTab]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Intro */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">
              {marketInfo.name[language]}
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isNight ? (isMr ? 'सोम-शुक्र ५ दिवस (शनि-रवि सुट्टी)' : 'Mon-Fri 5 Days (Sat-Sun Off)') : (isMr ? 'सोम-शनि ६ दिवस' : 'Mon-Sat 6 Days')}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <span>
              {market === 'rajdhani_night' 
                ? (isMr ? 'राजधानी नाईट: वारंवारता सांख्यिकी व हॉट/कोल्ड अंक' : 'Rajdhani Night: Frequency Statistics & Hot/Cold Digits')
                : market === 'manipur'
                ? (isMr ? 'मणीपुर: वारंवारता सांख्यिकी व हॉट/कोल्ड अंक' : 'Manipur: Frequency Statistics & Hot/Cold Digits')
                : (isMr ? 'कल्याण: वारंवारता सांख्यिकी व हॉट/कोल्ड अंक' : 'Kalyan: Frequency Statistics & Hot/Cold Digits')}
            </span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {isMr
              ? `${history.length} आठवड्यांच्या एकूण ${analyticsData.totalPairs} निकालांचे सखोल गणितीय विश्लेषण.`
              : `Empirical distribution analysis across ${history.length} recorded weeks (${analyticsData.totalPairs} valid sessions).`}
          </p>
        </div>

        {/* Day Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setSelectedDayTab('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              selectedDayTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isMr ? 'सर्व दिवस' : 'All Days'}
          </button>
          {DAY_KEYS.map(d => {
            const isSatOff = isNight && d === 'sat';
            return (
              <button
                key={d}
                onClick={() => setSelectedDayTab(d)}
                className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedDayTab === d
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : isSatOff
                    ? 'text-slate-400 dark:text-slate-600 hover:text-slate-500 line-through'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={isSatOff ? (isMr ? 'शनिवार सुट्टी / बंद' : 'Saturday Closed') : undefined}
              >
                {DAY_NAMES[d][language].slice(0, 3)}
                {isSatOff && <span className="text-[9px] ml-0.5 no-underline font-normal">({isMr ? 'बंद' : 'Off'})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Cards: Hot, Cold, Red Jodi Ratio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Hot Digits Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isMr ? 'सर्वाधिक येणारे हॉट अंक (Hot)' : 'Most Frequent Hot Digits'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {analyticsData.hotDigits.map(h => (
                <span key={h.digit} className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {h.digit}
                </span>
              ))}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {isMr ? 'उच्च मोमेंटम व नियमित आवृत्ती' : 'Highest recurrence rate'}
            </div>
          </div>
        </div>

        {/* Cold Digits Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
            <Snowflake className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isMr ? 'प्रलंबित कोल्ड अंक (Due / Cold)' : 'Overdue Cold Digits'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {analyticsData.coldDigits.map(c => (
                <span key={c.digit} className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                  {c.digit}
                </span>
              ))}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {isMr ? 'कमी वारंवारता, येण्याची शक्यता' : 'Longest gap between appearances'}
            </div>
          </div>
        </div>

        {/* Red Jodi Occurrence */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isMr ? 'लाल जोडीचे प्रमाण (Red Jodis)' : 'Red Jodi Frequency'}
            </div>
            <div className="text-2xl font-black font-mono text-red-600 dark:text-red-400 mt-0.5">
              {analyticsData.redJodiPct}%
            </div>
            <div className="text-[11px] text-slate-500">
              {isMr ? 'सैद्धांतिक संभाव्यता: २०%' : 'Mathematical expectation: 20%'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Bar Chart: 0-9 Digit Distribution */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>{isMr ? '० ते ९ अंकांचे वारंवारता वितरण (0-9 Digits Distribution)' : '0-9 Digits Frequency Distribution'}</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isMr ? 'ओपन (सोनेरी) व क्लोज (निळा)' : 'Open (Amber) & Close (Blue)'}
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {analyticsData.digitStats.map(stat => {
            const barPct = analyticsData.maxCount > 0 ? (stat.total / analyticsData.maxCount) * 100 : 0;
            const openShare = stat.total > 0 ? (stat.open / stat.total) * 100 : 50;

            return (
              <div key={stat.digit} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-sm shadow-xs">
                      {stat.digit}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {isMr ? 'एकूण:' : 'Total:'} <strong className="text-slate-900 dark:text-white">{stat.total}</strong> {isMr ? 'वेळा' : 'times'}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      (ओपन: {stat.open}, क्लोज: {stat.close})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <span>{stat.percentage}% {isMr ? 'वाटा' : 'share'}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {stat.lastSeenWeeksAgo === 0
                        ? (isMr ? 'याच आठवड्यात' : 'This week')
                        : stat.lastSeenWeeksAgo === 999
                        ? (isMr ? 'अद्याप नाही' : 'Never')
                        : `${stat.lastSeenWeeksAgo} ${isMr ? 'आठवड्यांपूर्वी' : 'weeks ago'}`}
                    </span>
                  </div>
                </div>

                {/* Dual bar for Open & Close */}
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-800">
                  <div
                    style={{ width: `${(barPct * openShare) / 100}%` }}
                    className="bg-amber-500 h-full transition-all duration-500"
                    title={`Open: ${stat.open}`}
                  />
                  <div
                    style={{ width: `${(barPct * (100 - openShare)) / 100}%` }}
                    className="bg-sky-500 h-full transition-all duration-500"
                    title={`Close: ${stat.close}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
