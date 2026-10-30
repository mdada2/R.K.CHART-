import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Award, 
  TrendingUp, 
  Layers,
  Sparkles,
  Calendar,
  Clock
} from 'lucide-react';
import { DayKey, Language, WeekRecord, BacktestSummary, MarketType, MARKETS, CalculationFormulaId } from '../types';
import { DAY_NAMES, runBacktest } from '../utils/matkaMath';

interface BacktestingLabProps {
  history: WeekRecord[];
  language: Language;
  market?: MarketType;
}

export const BacktestingLab: React.FC<BacktestingLabProps> = ({
  history,
  language,
  market = 'kalyan',
}) => {
  const isMr = language === 'mr';
  const isNight = market === 'rajdhani_night';
  const marketInfo = MARKETS[market];

  const [testCount, setTestCount] = useState<number>(30);
  const [selectedFormula, setSelectedFormula] = useState<CalculationFormulaId>('master');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestSummary | null>(() =>
    runBacktest(history, 30, 'master')
  );

  // Recalculate backtest when market, history, count, or formula changes
  useEffect(() => {
    setResults(runBacktest(history, testCount, selectedFormula));
  }, [history, market, testCount, selectedFormula]);

  const handleRunTest = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runBacktest(history, testCount, selectedFormula);
      setResults(res);
      setIsRunning(false);

      // Trigger celebratory confetti
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#10b981', '#3b82f6'],
      });
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Intro Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                {isMr ? 'गणितीय मॉडेल बॅकटेस्टिंग' : 'Mathematical Backtest Simulator'}
              </span>
              <span className="text-slate-400 dark:text-slate-600">·</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                {marketInfo.name[language]}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isNight 
                  ? (isMr ? 'सोम ते शुक्र (शनि-रवि बंद/XX)' : 'Mon to Fri (Sat-Sun Off)') 
                  : (isMr ? 'सोम ते शनि (६ दिवस)' : 'Mon to Sat (6 Days)')}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>
                {market === 'rajdhani_night' 
                  ? (isMr ? 'राजधानी नाईट: ऐतिहासिक निकाल पडताळणी लॅब' : 'Rajdhani Night: Historical Verification Lab')
                  : market === 'manipur'
                  ? (isMr ? 'मणीपुर: ऐतिहासिक निकाल पडताळणी लॅब' : 'Manipur: Historical Verification Lab')
                  : (isMr ? 'कल्याण: ऐतिहासिक निकाल पडताळणी लॅब' : 'Kalyan: Historical Verification Lab')}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {market === 'rajdhani_night'
                ? (isMr 
                    ? `राजधानी नाईटच्या २०१६ ते २०२६ मधील ५३०+ आठवड्यांच्या अधिकृत निकालांवर निवडलेल्या सूत्राची चाचणी केली जाते. यामध्ये शनिवार बंद (सुट्टी) असल्याने शुक्रवारनंतर थेट सोमवारची लाईन अचूक तपासली जाते.`
                    : `Tested against 530+ historical weeks of Rajdhani Night (2016-2026). Saturday is recognized as closed/holiday so Friday flows directly into Monday predictions.`)
                : market === 'manipur'
                ? (isMr
                    ? `मणीपुरच्या २०२२ ते २०२६ मधील २०८ आठवड्यांच्या (सोमवार ते शनिवार) अधिकृत निकालांवर मागील सत्रांची थेट अचूकता तपासा.`
                    : `Tested against 208 historical weeks of Manipur (Mon to Sat) to evaluate OTC and Jodi hit rates.`)
                : (isMr
                    ? `कल्याणच्या २०२१ ते २०२६ मधील २७०+ आठवड्यांच्या (सोमवार ते शनिवार) अधिकृत निकालांवर मागील सत्रांची थेट अचूकता तपासा.`
                    : `Tested against 270+ historical weeks of Kalyan (Mon to Sat) to evaluate OTC and Jodi hit rates.`)}
            </p>
          </div>

          <button
            onClick={handleRunTest}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 shrink-0"
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>{isMr ? 'चाचणी चालू आहे...' : 'Simulating...'}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>{isMr ? 'पुन्हा बॅकटेस्ट चालवा' : 'Re-Run Backtest'}</span>
              </>
            )}
          </button>
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 block mb-1.5">
              {isMr ? 'चाचणी सत्र संख्या (Number of Sessions):' : 'Number of Historical Sessions:'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 60, 100].map(cnt => (
                <button
                  key={cnt}
                  onClick={() => setTestCount(cnt)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    testCount === cnt
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {cnt} {isMr ? 'सत्रे' : 'Sessions'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 block mb-1.5">
              {isMr ? 'तपासायचे सूत्र (Formula to Evaluate):' : 'Formula to Evaluate:'}
            </label>
            <select
              value={selectedFormula}
              onChange={(e) => setSelectedFormula(e.target.value as any)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="master">{isMr ? 'मास्टर संगम हायब्रीड (Master Ensemble)' : 'Master Ensemble'}</option>
              <option value="lineFamily">{isMr ? 'खेळ लाईन व फॅमिली (Line & Family Trick)' : 'Line & Family Trick'}</option>
              <option value="totalDiff">{isMr ? 'चालू बेरीज-फरक ओटीसी (Total-Diff Trick)' : 'Total-Diff Trick'}</option>
              <option value="weeklyLine">{isMr ? 'आठवडी लाईन प्रोग्रेशन (Weekly Line)' : 'Weekly Line'}</option>
              <option value="frequency">{isMr ? 'वारंवारता व संभाव्यता (Frequency Due)' : 'Frequency Due'}</option>
            </select>
          </div>
        </div>
      </div>


      {/* METRIC SCORECARDS */}
      {results && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* OTC Hit Rate */}
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">
              {isMr ? 'ओटीसी पास दर (OTC Hit %)' : 'OTC Pass Rate'}
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {results.otcHitRate}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {results.otcHits} / {results.totalTested} {isMr ? 'सत्रे पास' : 'sessions passed'}
            </div>
          </div>

          {/* Open Hits */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-lg">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">
              {isMr ? 'ओपन पास (Open Hits)' : 'Open Digits Hit'}
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-amber-600 dark:text-amber-400">
              {results.openHits}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-500 mt-1">
              {((results.openHits / results.totalTested) * 100).toFixed(1)}% {isMr ? 'दर' : 'rate'}
            </div>
          </div>

          {/* Close Hits */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-lg">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">
              {isMr ? 'क्लोज पास (Close Hits)' : 'Close Digits Hit'}
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-sky-600 dark:text-sky-400">
              {results.closeHits}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-500 mt-1">
              {((results.closeHits / results.totalTested) * 100).toFixed(1)}% {isMr ? 'दर' : 'rate'}
            </div>
          </div>

          {/* Jodi Hits */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-lg">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">
              {isMr ? 'थेट जोडी पास (Jodi Hits)' : 'Direct Jodi Hits'}
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-purple-600 dark:text-purple-400">
              {results.jodiHits}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-500 mt-1">
              {results.jodiHitRate}% (8 {isMr ? 'जोड्यांपैकी' : 'pairs'})
            </div>
          </div>
        </div>
      )}

      {/* DETAILED VERIFICATION LOG TABLE */}
      {results && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>{isMr ? 'सत्रवार पडताळणी लॉग (Session Verification Log)' : 'Historical Verification Log'}</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isMr ? `मागील ${results.recentResults.length} निकाल तपासले` : `Checked ${results.recentResults.length} sessions`}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950/80 sticky top-0 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">{isMr ? 'आठवडा व वार' : 'Week & Day'}</th>
                  <th className="py-2.5 px-3">{isMr ? 'प्रत्यक्ष निकाल' : 'Actual Result'}</th>
                  <th className="py-2.5 px-3">{isMr ? 'सूत्राचे ४ ओटीसी अंक' : 'Formula 4 OTC'}</th>
                  <th className="py-2.5 px-3">{isMr ? 'अंदाज पडताळणी' : 'Verification Outcome'}</th>
                  <th className="py-2.5 px-3 text-right">{isMr ? 'स्थिती' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                {results.recentResults.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors ${
                      item.isJodiHit
                        ? 'bg-purple-500/10 dark:bg-purple-950/20'
                        : item.isOtcHit
                        ? 'bg-emerald-500/10 dark:bg-emerald-950/15'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-sans">
                      <div className="font-medium text-slate-900 dark:text-white">{DAY_NAMES[item.day][language]}</div>
                      <div className="text-[10px] text-slate-500">{item.week}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">{item.actualOpenPana}</span>
                        <span className="text-amber-600 dark:text-amber-400 text-sm bg-white dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 font-mono shadow-xs">
                          {item.actualJodi}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">{item.actualClosePana}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 font-bold text-amber-600 dark:text-amber-300 font-mono shadow-xs">
                        {item.predictedOTC.join(', ')}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-sans text-xs">
                      {item.hitDetails}
                    </td>

                    <td className="py-2.5 px-3 text-right font-sans">
                      {item.isJodiHit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40">
                          <Award className="w-3 h-3" />
                          <span>जोडी पास</span>
                        </span>
                      ) : item.isOtcHit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ओटीसी पास</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          <XCircle className="w-3 h-3" />
                          <span>मिस</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
