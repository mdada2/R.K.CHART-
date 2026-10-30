import React, { useMemo, useState, useEffect } from 'react';
import {
  Search,
  Repeat,
  Layers,
  Copy,
  Check,
  Send,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { DayKey, Language, MarketType, WeekRecord, MARKETS } from '../types';
import {
  DAY_KEYS,
  DAY_NAMES,
  generateSolidPredictions,
  getCutAnk,
  getEffectiveHistory,
  isRedJodi,
  isValidPlayedJodi,
  calculatePanaSum,
} from '../utils/matkaMath';
import {
  generateSangamSets,
  getSuggestedPanasForDigits,
  PatternMatchMode,
  scanJodiPatterns,
} from '../utils/patternScanner';

interface PatternScannerViewProps {
  history: WeekRecord[];
  language: Language;
  market: MarketType;
}

export const PatternScannerView: React.FC<PatternScannerViewProps> = ({
  history,
  language,
  market,
}) => {
  const isMr = language === 'mr';
  const isNight = market === 'rajdhani_night';
  const marketInfo = MARKETS[market];

  // Find the most recent played Jodi as default scan query
  const recentPlayedJodis = useMemo(() => {
    const found: { jodi: string; day: DayKey; week: string }[] = [];
    for (let w = history.length - 1; w >= 0 && found.length < 8; w--) {
      const rec = history[w];
      for (let d = DAY_KEYS.length - 1; d >= 0 && found.length < 8; d--) {
        const day = DAY_KEYS[d];
        const cell = rec[day];
        if (cell && isValidPlayedJodi(cell.jodi)) {
          found.push({ jodi: cell.jodi, day, week: rec.week });
        }
      }
    }
    return found;
  }, [history]);

  const [queryInput, setQueryInput] = useState<string>(() => recentPlayedJodis[0]?.jodi || '91');
  const [matchMode, setMatchMode] = useState<PatternMatchMode>('exact');
  const [activeSection, setActiveSection] = useState<'scanner' | 'sangam'>('scanner');

  useEffect(() => {
    if (recentPlayedJodis[0]?.jodi) {
      setQueryInput(recentPlayedJodis[0].jodi);
    }
  }, [market, recentPlayedJodis]);

  const scanResult = useMemo(
    () => scanJodiPatterns(history, queryInput || '91', matchMode),
    [history, queryInput, matchMode]
  );

  // Sangam state initialized from upcoming day's Solid OTC
  const effectiveHistory = useMemo(
    () => getEffectiveHistory(history, market),
    [history, market]
  );

  const nextOpenDay = useMemo((): DayKey => {
    const latest = effectiveHistory[effectiveHistory.length - 1];
    if (latest) {
      for (const d of DAY_KEYS) {
        if (latest[d]?.jodi.includes('*')) return d;
      }
    }
    return 'mon';
  }, [effectiveHistory]);

  const defaultPrediction = useMemo(
    () => generateSolidPredictions(effectiveHistory, nextOpenDay, 'master'),
    [effectiveHistory, nextOpenDay]
  );

  const [openPanaText, setOpenPanaText] = useState<string>(() =>
    getSuggestedPanasForDigits(defaultPrediction.primaryOTC).join(', ')
  );
  const [closePanaText, setClosePanaText] = useState<string>(() =>
    getSuggestedPanasForDigits([...defaultPrediction.primaryOTC].reverse()).join(', ')
  );
  const [selectedOpenDigits, setSelectedOpenDigits] = useState<number[]>(() =>
    defaultPrediction.primaryOTC.slice(0, 4)
  );
  const [selectedCloseDigits, setSelectedCloseDigits] = useState<number[]>(() =>
    defaultPrediction.primaryOTC.map((d) => getCutAnk(d)).slice(0, 4)
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleAutoFillSangamFromPrediction = () => {
    const otc = defaultPrediction.primaryOTC.slice(0, 4);
    const openSp = getSuggestedPanasForDigits(otc);
    const closeSp = otc
      .map((d) => defaultPrediction.doublePanas.find((p) => p.ank === d)?.panas[0] || '')
      .filter(Boolean);
    setSelectedOpenDigits(otc);
    setSelectedCloseDigits(otc);
    setOpenPanaText(openSp.join(', '));
    setClosePanaText((closeSp.length > 0 ? closeSp : openSp).join(', '));
  };

  const sangamSets = useMemo(() => {
    const oPanas = openPanaText
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const cPanas = closePanaText
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return generateSangamSets(oPanas, cPanas, selectedOpenDigits, selectedCloseDigits);
  }, [openPanaText, closePanaText, selectedOpenDigits, selectedCloseDigits]);

  const toggleDigitInList = (
    digit: number,
    list: number[],
    setter: React.Dispatch<React.SetStateAction<number[]>>
  ) => {
    if (list.includes(digit)) {
      if (list.length > 1) setter(list.filter((d) => d !== digit));
    } else if (list.length < 4) {
      setter([...list, digit]);
    }
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const shareSangamOnWhatsApp = () => {
    const marketName = marketInfo.name.mr;
    const halfText = sangamSets.halfSangamOpenPanaCloseAnk
      .slice(0, 8)
      .map((h) => h.label)
      .join(', ');
    const fullText = sangamSets.fullSangams
      .slice(0, 8)
      .map((f) => `${f.openPana}-${f.jodi}-${f.closePana}`)
      .join('\n');
    const msg =
      `*${marketName} हाफ व फुल संगम संच (${DAY_NAMES[nextOpenDay].mr})*\n\n` +
      `हाफ संगम: ${halfText || '-'}\n\n` +
      `फुल संगम:\n${fullText || '-'}`;
    const link = document.createElement('a');
    link.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header & Mode Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span className="font-semibold text-amber-400">
                {isMr ? marketInfo.name.mr : marketInfo.name.en}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {history.length} {isMr ? 'आठवडे ऐतिहासिक स्कॅन' : 'Weeks Archive Scan'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isMr
                ? 'पॅटर्न व रिपीट जोडी स्कॅनर आणि संगम कॅल्क्युलेटर'
                : 'Historical Pattern Scanner & Sangam Studio'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {isMr
                ? 'एखादी जोडी पडल्यानंतर पुढील दिवशी व पुढील आठवड्यात त्याच वारी कोणते अंक सर्वाधिक वेळा आले ते शोधा, आणि हाफ/फुल संगम तयार करा.'
                : 'Analyze exact follow-up OTC digits and pairs after any historical Jodi occurrence, plus build Half & Full Sangam sets.'}
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveSection('scanner')}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'scanner'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>{isMr ? '१. रिपीट जोडी स्कॅनर' : '1. Repeat Scanner'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('sangam')}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'sangam'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isMr ? '२. हाफ व फुल संगम' : '2. Sangam Builder'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: PATTERN & REPEAT JODI SCANNER */}
      {activeSection === 'scanner' && (
        <div className="space-y-6">
          {/* Search Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              <div className="lg:col-span-4">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {isMr ? 'स्कॅन करण्यासाठी २-अंकी जोडी टाका:' : 'Enter 2-Digit Jodi to Scan:'}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    placeholder="91"
                    className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-lg font-mono font-bold text-amber-400 tabular-nums focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="lg:col-span-8">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {isMr ? 'शोध प्रकार (Match Scope):' : 'Pattern Match Mode:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: 'exact' as PatternMatchMode,
                      label: isMr ? 'थेट तीच जोडी' : 'Exact Jodi',
                      sub: scanResult.queryJodi,
                    },
                    {
                      id: 'palat' as PatternMatchMode,
                      label: isMr ? 'सरळ + पलट' : 'Direct + Palat',
                      sub: `${scanResult.queryJodi}, ${scanResult.queryJodi[1]}${scanResult.queryJodi[0]}`,
                    },
                    {
                      id: 'family' as PatternMatchMode,
                      label: isMr ? 'संपूर्ण फॅमिली' : 'Full Family (8)',
                      sub: isMr ? '८ कट जोड्या' : 'All Cut Pairs',
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMatchMode(m.id)}
                      className={`min-h-[44px] p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        matchMode === m.id
                          ? 'bg-amber-500/15 border-amber-500/60 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold whitespace-nowrap truncate">{m.label}</div>
                      <div className="text-[11px] font-mono text-amber-400 tabular-nums truncate">
                        {m.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Recent Played Jodis Bar */}
            {recentPlayedJodis.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">
                  {isMr ? 'नुकत्याच आलेल्या जोड्या (१-क्लिक स्कॅन):' : 'Recent Played Jodis:'}
                </span>
                {recentPlayedJodis.map((item, idx) => (
                  <button
                    key={`${item.week}-${item.day}-${idx}`}
                    type="button"
                    onClick={() => setQueryInput(item.jodi)}
                    className={`min-h-[36px] px-3 py-1 rounded-lg border text-xs font-mono font-bold tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                      queryInput === item.jodi
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-amber-500/50'
                    }`}
                  >
                    {item.jodi} · {DAY_NAMES[item.day][language]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">
                {isMr ? 'एकूण वेळा आली' : 'Total Occurrences'}
              </div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-white mt-1">
                {scanResult.totalOccurrences}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                {scanResult.targetSet.join(', ')}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">
                {isMr ? 'शेवटची कधी आली' : 'Last Seen'}
              </div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-amber-400 mt-1">
                {scanResult.weeksSinceLastSeen === 0
                  ? isMr
                    ? 'चालू आठवडा'
                    : 'This Week'
                  : scanResult.weeksSinceLastSeen > 0
                  ? `${scanResult.weeksSinceLastSeen} ${isMr ? 'आठवड्यांपूर्वी' : 'wks ago'}`
                  : '--'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {scanResult.recentOccurrences[0]?.week || '-'}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">
                {isMr ? 'सरासरी अंतर (आठवडे)' : 'Average Gap'}
              </div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-400 mt-1">
                {scanResult.averageWeekGap > 0 ? `${scanResult.averageWeekGap}` : '--'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {isMr ? 'दोन निकालांमधील सरासरी गॅप' : 'Mean weeks between hits'}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">
                {isMr ? 'पुढील दिवशी लाल जोडी प्रमाण' : 'Next-Day Red Jodi Rate'}
              </div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-rose-400 mt-1">
                {scanResult.nextDrawRedRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {isMr ? 'हाफ / फुल रेड वारंवारता' : 'Red/Cut pair follow-up'}
              </div>
            </div>
          </div>

          {/* Follow-up Analysis Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card A: Next Trading Day Follow-up */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {isMr
                      ? `${scanResult.queryJodi} नंतर लगेच पुढील दिवशी काय आले?`
                      : `What Followed on the Next Draw After ${scanResult.queryJodi}?`}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isMr
                      ? `${scanResult.nextDrawSampleSize} ऐतिहासिक पुढील दिवसांच्या रेकॉर्डवरून`
                      : `Based on ${scanResult.nextDrawSampleSize} subsequent market draws`}
                  </p>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">
                  {isMr ? 'सर्वाधिक आलेले ४ OTC अंक:' : 'Top 4 Follow-Up OTC Digits:'}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {scanResult.nextDrawTopOTC.map((item) => (
                    <div
                      key={item.digit}
                      className="bg-slate-950 border border-amber-500/40 rounded-xl p-3 text-center"
                    >
                      <div className="text-2xl font-black font-mono tabular-nums text-amber-400">
                        {item.digit}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-slate-300 mt-1">
                        {item.percentage}% ({item.count})
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">
                  {isMr ? 'सर्वाधिक रिपीट झालेल्या जोड्या:' : 'Most Frequent Next-Day Jodis:'}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {scanResult.nextDrawTopJodis.map((j) => (
                    <div
                      key={j.jodi}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center"
                    >
                      <div
                        className={`text-lg font-extrabold font-mono tabular-nums ${
                          j.isRed ? 'text-rose-400' : 'text-white'
                        }`}
                      >
                        {j.jodi}
                      </div>
                      <div className="text-[10px] font-mono tabular-nums text-slate-400">
                        {j.count}x
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card B: Same Weekday Next Week Follow-up */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {isMr
                      ? `पुढील आठवड्यात त्याच वारी (Weekly Line) काय आले?`
                      : `What Followed on the Same Weekday Next Week?`}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isMr
                      ? `${scanResult.sameDaySampleSize} साप्ताहिक लाईन रेकॉर्डवरून`
                      : `Based on ${scanResult.sameDaySampleSize} same-weekday 1-week transitions`}
                  </p>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">
                  {isMr ? 'आठवडी लाईन टॉप ४ OTC अंक:' : 'Top 4 Same-Weekday OTC Digits:'}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {scanResult.sameDayTopOTC.map((item) => (
                    <div
                      key={item.digit}
                      className="bg-slate-950 border border-indigo-500/40 rounded-xl p-3 text-center"
                    >
                      <div className="text-2xl font-black font-mono tabular-nums text-indigo-400">
                        {item.digit}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-slate-300 mt-1">
                        {item.percentage}% ({item.count})
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">
                  {isMr ? 'आठवडी लाईन टॉप जोड्या:' : 'Top Same-Weekday Jodis:'}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {scanResult.sameDayTopJodis.map((j) => (
                    <div
                      key={j.jodi}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center"
                    >
                      <div
                        className={`text-lg font-extrabold font-mono tabular-nums ${
                          j.isRed ? 'text-rose-400' : 'text-white'
                        }`}
                      >
                        {j.jodi}
                      </div>
                      <div className="text-[10px] font-mono tabular-nums text-slate-400">
                        {j.count}x
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Historical Occurrences Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isMr
                  ? 'मागील १५ वेळा जेव्हा ही जोडी पडली त्यावेळचा प्रत्यक्ष इतिहास'
                  : 'Last 15 Historical Occurrences & Subsequent Outcomes'}
              </h3>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {scanResult.recentOccurrences.length} / {scanResult.totalOccurrences}
              </span>
            </div>

            {scanResult.recentOccurrences.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                {isMr
                  ? 'या जोडीसाठी अद्याप ऐतिहासिक रेकॉर्ड सापडला नाही. दुसरी २-अंकी जोडी टाकून पहा.'
                  : 'No historical matches found for this pair yet.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 bg-slate-950/60">
                      <th className="py-3 px-4 font-semibold">{isMr ? 'आठवडा' : 'Week'}</th>
                      <th className="py-3 px-4 font-semibold">{isMr ? 'वार' : 'Day'}</th>
                      <th className="py-3 px-4 font-semibold text-right">
                        {isMr ? 'पडलेला निकाल' : 'Matched Result'}
                      </th>
                      <th className="py-3 px-4 font-semibold text-right">
                        {isMr ? 'पुढील दिवसाचा निकाल' : 'Next Draw'}
                      </th>
                      <th className="py-3 px-4 font-semibold text-right">
                        {isMr ? 'पुढील आठवडा (तोच वार)' : 'Next Week Same Day'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-xs sm:text-sm font-mono tabular-nums">
                    {scanResult.recentOccurrences.map((occ, i) => (
                      <tr key={`${occ.week}-${occ.day}-${i}`} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{occ.week}</td>
                        <td className="py-3 px-4 font-sans text-slate-200 whitespace-nowrap">
                          {DAY_NAMES[occ.day][language]}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-400 whitespace-nowrap">
                          {occ.openPana}-{occ.matchedJodi}-{occ.closePana}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {occ.nextDraw ? (
                            <span
                              className={
                                isRedJodi(occ.nextDraw.jodi)
                                  ? 'text-rose-400 font-bold'
                                  : 'text-emerald-400 font-bold'
                              }
                            >
                              {occ.nextDraw.openPana}-{occ.nextDraw.jodi}-{occ.nextDraw.closePana}
                            </span>
                          ) : (
                            <span className="text-slate-500">{isMr ? 'प्रलंबित' : 'Pending'}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {occ.sameDayNextWeek ? (
                            <span className="text-indigo-300 font-bold">
                              {occ.sameDayNextWeek.openPana}-{occ.sameDayNextWeek.jodi}-
                              {occ.sameDayNextWeek.closePana}
                            </span>
                          ) : (
                            <span className="text-slate-500">{isMr ? 'प्रलंबित' : 'Pending'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: HALF & FULL SANGAM CALCULATOR */}
      {activeSection === 'sangam' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isMr
                    ? 'हाफ संगम व फुल संगम संच जनरेटर'
                    : 'Half Sangam & Full Sangam Combinatorics Builder'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isMr
                    ? 'ओपन पाना, क्लोज पाना आणि OTC अंक निवडून सर्व वैध संगम जोड्या तयार करा.'
                    : 'Combine Open/Close Panas and OTC digits into clean playable study sets.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAutoFillSangamFromPrediction}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isMr
                    ? `${DAY_NAMES[nextOpenDay].mr} पक्क्या अंदाजावरून भरा`
                    : `Auto-Fill from ${DAY_NAMES[nextOpenDay].en} Forecast`}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Open Side Inputs */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  {isMr
                    ? '१. ओपन पाना टाका (कमाल ६ पाने, स्वल्पविरामाने वेगळे करा):'
                    : '1. Open Panas (up to 6 3-digit panas):'}
                </label>
                <input
                  type="text"
                  value={openPanaText}
                  onChange={(e) => setOpenPanaText(e.target.value)}
                  placeholder="137, 246, 159, 389"
                  className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white tabular-nums focus:outline-none focus:border-amber-500"
                />

                <div>
                  <div className="text-xs text-slate-400 mb-1.5">
                    {isMr ? 'ओपन अंक निवडा (कमाल ४):' : 'Select Open Digits (max 4):'}
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
                      const active = selectedOpenDigits.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            toggleDigitInList(d, selectedOpenDigits, setSelectedOpenDigits)
                          }
                          className={`min-h-[42px] rounded-lg font-mono font-bold text-sm tabular-nums border transition-colors cursor-pointer ${
                            active
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Close Side Inputs */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  {isMr
                    ? '२. क्लोज पाना टाका (कमाल ६ पाने, स्वल्पविरामाने वेगळे करा):'
                    : '2. Close Panas (up to 6 3-digit panas):'}
                </label>
                <input
                  type="text"
                  value={closePanaText}
                  onChange={(e) => setClosePanaText(e.target.value)}
                  placeholder="230, 140, 578, 290"
                  className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white tabular-nums focus:outline-none focus:border-amber-500"
                />

                <div>
                  <div className="text-xs text-slate-400 mb-1.5">
                    {isMr ? 'क्लोज अंक निवडा (कमाल ४):' : 'Select Close Digits (max 4):'}
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
                      const active = selectedCloseDigits.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            toggleDigitInList(d, selectedCloseDigits, setSelectedCloseDigits)
                          }
                          className={`min-h-[42px] rounded-lg font-mono font-bold text-sm tabular-nums border transition-colors cursor-pointer ${
                            active
                              ? 'bg-indigo-500 text-white border-indigo-500'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() =>
                  copyText(
                    'all-sangam',
                    [
                      ...sangamSets.halfSangamOpenPanaCloseAnk.map((h) => h.label),
                      ...sangamSets.fullSangams.map((f) => f.label),
                    ].join('\n')
                  )
                }
                className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedKey === 'all-sangam' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>
                  {copiedKey === 'all-sangam'
                    ? isMr
                      ? 'सर्व संगम कॉपी झाले!'
                      : 'Copied!'
                    : isMr
                    ? 'सर्व संगम कॉपी करा'
                    : 'Copy All Sangam Sets'}
                </span>
              </button>

              <button
                type="button"
                onClick={shareSangamOnWhatsApp}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isMr ? 'WhatsApp वर शेअर करा' : 'Share on WhatsApp'}</span>
              </button>
            </div>
          </div>

          {/* Generated Sangam Output Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Half Sangam A */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="text-sm font-bold text-white">
                  {isMr ? 'हाफ संगम A (ओपन पाना × क्लोज अंक)' : 'Half Sangam A (Open Pana × Close Ank)'}
                </h4>
                <span className="text-xs font-mono tabular-nums text-amber-400">
                  {sangamSets.halfSangamOpenPanaCloseAnk.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {sangamSets.halfSangamOpenPanaCloseAnk.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => copyText(item.label, item.label)}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 flex items-center justify-between text-xs font-mono tabular-nums cursor-pointer"
                  >
                    <span className="font-bold text-amber-300">{item.label}</span>
                    <span className="text-slate-500">({item.jodi})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Half Sangam B */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="text-sm font-bold text-white">
                  {isMr ? 'हाफ संगम B (ओपन अंक × क्लोज पाना)' : 'Half Sangam B (Open Ank × Close Pana)'}
                </h4>
                <span className="text-xs font-mono tabular-nums text-indigo-400">
                  {sangamSets.halfSangamOpenAnkClosePana.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {sangamSets.halfSangamOpenAnkClosePana.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => copyText(item.label, item.label)}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 flex items-center justify-between text-xs font-mono tabular-nums cursor-pointer"
                  >
                    <span className="font-bold text-indigo-300">{item.label}</span>
                    <span className="text-slate-500">({item.jodi})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Sangam */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="text-sm font-bold text-white">
                  {isMr ? 'फुल संगम (ओपन पाना × क्लोज पाना)' : 'Full Sangam (Open Pana × Close Pana)'}
                </h4>
                <span className="text-xs font-mono tabular-nums text-emerald-400">
                  {sangamSets.fullSangams.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                {sangamSets.fullSangams.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => copyText(item.label, item.label)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between text-xs font-mono tabular-nums cursor-pointer"
                  >
                    <span className="font-bold text-white">
                      {item.openPana} <ArrowRight className="inline w-3 h-3 text-slate-500 mx-1" />{' '}
                      {item.closePana}
                    </span>
                    <span
                      className={`font-extrabold ${
                        item.isRed ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {isMr ? 'जोडी' : 'Jodi'} {item.jodi}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
