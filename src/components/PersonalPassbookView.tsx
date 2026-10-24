import React, { useMemo, useState, useEffect } from 'react';
import {
  BookMarked,
  CheckCircle2,
  Clock,
  Cloud,
  Image as ImageIcon,
  LogIn,
  Plus,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useFirebaseApp } from '../contexts/FirebaseContext';
import {
  DayKey,
  Language,
  MARKETS,
  MarketType,
  PassbookEntry,
  PassbookEvaluation,
  WeekRecord,
} from '../types';
import {
  calculatePanaSum,
  DAY_KEYS,
  DAY_NAMES,
  generateSolidPredictions,
  getEffectiveHistory,
  isMarketClosed,
  isValidPlayedJodi,
} from '../utils/matkaMath';
import { PhotoCardModal } from './PhotoCardModal';
import { PhotoCardPayload } from '../utils/photoCardRenderer';

interface PersonalPassbookViewProps {
  kalyanHistory: WeekRecord[];
  rajdhaniHistory: WeekRecord[];
  language: Language;
  activeMarket: MarketType;
}

function evaluateEntry(
  entry: PassbookEntry,
  kalyanEffective: WeekRecord[],
  rajdhaniEffective: WeekRecord[]
): PassbookEvaluation {
  const source = entry.market === 'rajdhani_night' ? rajdhaniEffective : kalyanEffective;
  const weekRec = source.find((w) => w.week === entry.week);
  const cell = weekRec ? weekRec[entry.day] : undefined;

  if (!cell) {
    return {
      status: 'pending',
      actualOpenPana: '***',
      actualJodi: '**',
      actualClosePana: '***',
      matchedOtcDigits: [],
      matchedJodi: null,
      matchedPanas: [],
      badgeTextMr: 'निकाल प्रलंबित',
      badgeTextEn: 'Result Pending',
    };
  }

  if (isMarketClosed(cell.jodi)) {
    return {
      status: 'closed',
      actualOpenPana: cell.openPana,
      actualJodi: cell.jodi,
      actualClosePana: cell.closePana,
      matchedOtcDigits: [],
      matchedJodi: null,
      matchedPanas: [],
      badgeTextMr: 'मार्केट बंद (XX)',
      badgeTextEn: 'Market Closed',
    };
  }

  const isOpenOnly = cell.openPana !== '***' && cell.closePana === '***';
  if (isOpenOnly) {
    const openAnk = calculatePanaSum(cell.openPana);
    const openHit = entry.otcDigits.includes(openAnk);
    const panaHit = entry.panas.includes(cell.openPana) ? [cell.openPana] : [];
    return {
      status: 'open_only',
      actualOpenPana: cell.openPana,
      actualJodi: cell.jodi,
      actualClosePana: cell.closePana,
      matchedOtcDigits: openHit ? [openAnk] : [],
      matchedJodi: null,
      matchedPanas: panaHit,
      badgeTextMr: openHit ? `ओपन पास (${openAnk}) · क्लोज बाकी` : `ओपन ${openAnk} · क्लोज बाकी`,
      badgeTextEn: openHit ? `Open Hit (${openAnk}) · Close Pending` : `Open ${openAnk} · Close Pending`,
    };
  }

  if (!isValidPlayedJodi(cell.jodi)) {
    return {
      status: 'pending',
      actualOpenPana: cell.openPana,
      actualJodi: cell.jodi,
      actualClosePana: cell.closePana,
      matchedOtcDigits: [],
      matchedJodi: null,
      matchedPanas: [],
      badgeTextMr: 'निकाल प्रलंबित',
      badgeTextEn: 'Result Pending',
    };
  }

  const o = parseInt(cell.jodi[0], 10);
  const c = parseInt(cell.jodi[1], 10);
  const matchedOtcDigits = Array.from(
    new Set([o, c].filter((d) => entry.otcDigits.includes(d)))
  );
  const matchedJodi = entry.jodis.includes(cell.jodi) ? cell.jodi : null;
  const matchedPanas = [cell.openPana, cell.closePana].filter((p) => entry.panas.includes(p));

  if (matchedJodi) {
    return {
      status: 'jodi_pass',
      actualOpenPana: cell.openPana,
      actualJodi: cell.jodi,
      actualClosePana: cell.closePana,
      matchedOtcDigits,
      matchedJodi,
      matchedPanas,
      badgeTextMr: `जोडी थेट पास (${matchedJodi})`,
      badgeTextEn: `Direct Jodi Pass (${matchedJodi})`,
    };
  }

  if (matchedPanas.length > 0) {
    return {
      status: 'pana_pass',
      actualOpenPana: cell.openPana,
      actualJodi: cell.jodi,
      actualClosePana: cell.closePana,
      matchedOtcDigits,
      matchedJodi: null,
      matchedPanas,
      badgeTextMr: `पाना पास (${matchedPanas.join(', ')})`,
      badgeTextEn: `Pana Pass (${matchedPanas.join(', ')})`,
    };
  }

  if (matchedOtcDigits.length > 0) {
    return {
      status: 'otc_pass',
      actualOpenPana: cell.openPana,
      actualJodi: cell.jodi,
      actualClosePana: cell.closePana,
      matchedOtcDigits,
      matchedJodi: null,
      matchedPanas: [],
      badgeTextMr: `ओटीसी पास (${matchedOtcDigits.join(', ')})`,
      badgeTextEn: `OTC Pass (${matchedOtcDigits.join(', ')})`,
    };
  }

  return {
    status: 'miss',
    actualOpenPana: cell.openPana,
    actualJodi: cell.jodi,
    actualClosePana: cell.closePana,
    matchedOtcDigits: [],
    matchedJodi: null,
    matchedPanas: [],
    badgeTextMr: 'अंदाज मिस',
    badgeTextEn: 'Guess Miss',
  };
}

export const PersonalPassbookView: React.FC<PersonalPassbookViewProps> = ({
  kalyanHistory,
  rajdhaniHistory,
  language,
  activeMarket,
}) => {
  const isMr = language === 'mr';
  const {
    user,
    isSigningIn,
    signInWithGoogle,
    passbookEntries,
    savePassbookEntry,
    deletePassbookEntry,
  } = useFirebaseApp();

  const kalyanEffective = useMemo(
    () => getEffectiveHistory(kalyanHistory, 'kalyan'),
    [kalyanHistory]
  );
  const rajdhaniEffective = useMemo(
    () => getEffectiveHistory(rajdhaniHistory, 'rajdhani_night'),
    [rajdhaniHistory]
  );

  const [formMarket, setFormMarket] = useState<MarketType>(activeMarket);
  const currentEffective = formMarket === 'rajdhani_night' ? rajdhaniEffective : kalyanEffective;
  const recentWeeks = useMemo(
    () => [...currentEffective].slice(-6).reverse(),
    [currentEffective]
  );

  const [formWeek, setFormWeek] = useState<string>(
    () => currentEffective[currentEffective.length - 1]?.week || ''
  );
  const [formDay, setFormDay] = useState<DayKey>('mon');
  const [selectedOtc, setSelectedOtc] = useState<number[]>([1, 6, 2, 7]);
  const [jodisInput, setJodisInput] = useState<string>('12, 21, 67, 76');
  const [panasInput, setPanasInput] = useState<string>('146, 240');
  const [noteInput, setNoteInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  const [filterMarket, setFilterMarket] = useState<'all' | MarketType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pass' | 'pending' | 'miss'>('all');
  const [photoCardPayload, setPhotoCardPayload] = useState<PhotoCardPayload | null>(null);

  useEffect(() => {
    setFormMarket(activeMarket);
  }, [activeMarket]);

  useEffect(() => {
    const latest = currentEffective[currentEffective.length - 1];
    if (latest) {
      setFormWeek(latest.week);
      const pendingDay = DAY_KEYS.find((d) => latest[d]?.jodi.includes('*')) || 'mon';
      setFormDay(pendingDay);
    }
  }, [formMarket, currentEffective]);

  const handleLoadAppPrediction = () => {
    const pred = generateSolidPredictions(currentEffective, formDay, 'master');
    setSelectedOtc(pred.primaryOTC.slice(0, 4));
    setJodisInput([...pred.strongJodis, ...pred.supportJodis.slice(0, 2)].join(', '));
    const topPanas = pred.singlePanas
      .map((s) => s.panas[0])
      .filter(Boolean)
      .slice(0, 4);
    setPanasInput(topPanas.join(', '));
    setNoteInput(isMr ? 'मास्टर संगम सूत्र अभ्यास' : 'Master Consensus Formula');
  };

  const toggleOtcDigit = (digit: number) => {
    if (selectedOtc.includes(digit)) {
      if (selectedOtc.length > 1) {
        setSelectedOtc(selectedOtc.filter((d) => d !== digit));
      }
    } else if (selectedOtc.length < 4) {
      setSelectedOtc([...selectedOtc, digit]);
    }
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOtc.length === 0 || !formWeek) return;

    setIsSaving(true);
    setFormFeedback(null);
    try {
      const parsedJodis = jodisInput
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter((s) => /^\d{2}$/.test(s))
        .slice(0, 8);
      const parsedPanas = panasInput
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter((s) => /^\d{3}$/.test(s))
        .slice(0, 6);

      await savePassbookEntry({
        market: formMarket,
        week: formWeek,
        day: formDay,
        otcDigits: selectedOtc,
        jodis: parsedJodis,
        panas: parsedPanas,
        note: noteInput,
      });

      setFormFeedback(
        isMr
          ? `✓ ${DAY_NAMES[formDay].mr} ची तुमची गेसिंग नोंद यशस्वीरित्या जतन झाली!`
          : `✓ Saved your ${DAY_NAMES[formDay].en} guess to Passbook!`
      );
      setNoteInput('');
      setTimeout(() => setFormFeedback(null), 3000);
    } catch {
      setFormFeedback(
        isMr ? 'नोंद जतन करताना त्रुटी आली.' : 'Failed to save passbook entry.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const evaluatedList = useMemo(() => {
    return passbookEntries.map((entry) => ({
      entry,
      evalResult: evaluateEntry(entry, kalyanEffective, rajdhaniEffective),
    }));
  }, [passbookEntries, kalyanEffective, rajdhaniEffective]);

  const stats = useMemo(() => {
    const completed = evaluatedList.filter((item) =>
      ['jodi_pass', 'pana_pass', 'otc_pass', 'miss'].includes(item.evalResult.status)
    );
    const otcPasses = completed.filter((item) =>
      ['jodi_pass', 'pana_pass', 'otc_pass'].includes(item.evalResult.status)
    ).length;
    const jodiPasses = completed.filter(
      (item) => item.evalResult.status === 'jodi_pass'
    ).length;

    return {
      totalSaved: evaluatedList.length,
      verifiedCount: completed.length,
      otcHitRate: completed.length > 0 ? Math.round((otcPasses / completed.length) * 100) : 0,
      jodiHitRate: completed.length > 0 ? Math.round((jodiPasses / completed.length) * 100) : 0,
      otcPasses,
      jodiPasses,
    };
  }, [evaluatedList]);

  const filteredList = useMemo(() => {
    return evaluatedList.filter(({ entry, evalResult }) => {
      if (filterMarket !== 'all' && entry.market !== filterMarket) return false;
      if (filterStatus === 'pass') {
        return ['jodi_pass', 'pana_pass', 'otc_pass'].includes(evalResult.status);
      }
      if (filterStatus === 'pending') {
        return ['pending', 'open_only'].includes(evalResult.status);
      }
      if (filterStatus === 'miss') {
        return evalResult.status === 'miss';
      }
      return true;
    });
  }, [evaluatedList, filterMarket, filterStatus]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header & Cloud Sync Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="font-semibold text-amber-400">
              {isMr ? 'वैयक्तिक अभ्यास रेकॉर्ड' : 'Personal Study Passbook'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {user
                ? isMr
                  ? `क्लाउड सिंक सक्रिय (${user.email})`
                  : `Cloud Synced (${user.email})`
                : isMr
                ? 'स्थानिक मोबाईल स्टोरेज मोड'
                : 'Local Device Storage Mode'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {isMr
              ? 'माझी गेसिंग नोंदवही आणि पास-फेल ट्रॅकर'
              : 'My Guessing Passbook & Pass-Fail Tracker'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {isMr
              ? 'ड्रॉपूर्वी तुमचे स्वतःचे ४ OTC अंक, जोड्या व पाने जतन करा. निकाल जाहीर होताच तुमचा अंदाज पास झाला का ते आपोआप तपासले जाईल.'
              : 'Save your daily OTC digits, Jodis, and Panas before the draw and automatically track your real accuracy rate.'}
          </p>
        </div>

        {!user ? (
          <button
            type="button"
            disabled={isSigningIn}
            onClick={signInWithGoogle}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors self-start lg:self-auto whitespace-nowrap cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>
              {isSigningIn
                ? isMr
                  ? 'लॉगिन होत आहे...'
                  : 'Signing in...'
                : isMr
                ? 'गुगल लॉगिन करून क्लाउडवर सेव्ह ठेवा'
                : 'Sign in with Google for Cloud Backup'}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs text-emerald-300 self-start lg:self-auto">
            <Cloud className="w-4 h-4 shrink-0" />
            <span>
              {isMr
                ? 'तुमच्या सर्व नोंदी फायरबेस क्लाउडमध्ये सुरक्षित आहेत'
                : 'All passbook entries synced to Firebase Cloud'}
            </span>
          </div>
        )}
      </div>

      {/* Top 4 Accuracy Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">{isMr ? 'एकूण जतन नोंदी' : 'Saved Entries'}</div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-white mt-1">
            {stats.totalSaved}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.verifiedCount} {isMr ? 'निकाल तपासले' : 'draws verified'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">{isMr ? 'माझा OTC हिट-रेट' : 'My OTC Hit-Rate'}</div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-400 mt-1">
            {stats.otcHitRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.otcPasses} / {stats.verifiedCount} {isMr ? 'वेळा पास' : 'hits'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">{isMr ? 'थेट जोडी पास' : 'Direct Jodi Hits'}</div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-amber-400 mt-1">
            {stats.jodiPasses}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.jodiHitRate}% {isMr ? 'जोडी अचूकता' : 'pair hit rate'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">{isMr ? 'स्टोरेज स्थिती' : 'Backup Mode'}</div>
          <div className="text-lg font-bold text-indigo-400 mt-1.5 truncate">
            {user ? (isMr ? 'गुगल क्लाउड सिंक' : 'Google Cloud') : isMr ? 'लोकल डिव्हाइस' : 'Local Device'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {isMr ? 'ऑफलाईन असतानाही उपलब्ध' : 'Offline-ready'}
          </div>
        </div>
      </div>

      {/* Main Split: Left Add Entry Form + Right Passbook Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* New Guess Entry Form */}
        <form
          onSubmit={handleSubmitEntry}
          className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-amber-400" />
              <span>{isMr ? 'नवीन गेसिंग नोंद करा' : 'Log New Daily Guess'}</span>
            </h3>
            <button
              type="button"
              onClick={handleLoadAppPrediction}
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1 hover:bg-amber-500/25 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isMr ? 'ॲपचे पक्के अंदाज भरा' : 'Fill App Forecast'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {isMr ? 'मार्केट:' : 'Market:'}
              </label>
              <select
                value={formMarket}
                onChange={(e) => setFormMarket(e.target.value as MarketType)}
                className="w-full min-h-[42px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white"
              >
                <option value="kalyan">{MARKETS.kalyan.name[language]}</option>
                <option value="rajdhani_night">{MARKETS.rajdhani_night.name[language]}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {isMr ? 'वार:' : 'Weekday:'}
              </label>
              <select
                value={formDay}
                onChange={(e) => setFormDay(e.target.value as DayKey)}
                className="w-full min-h-[42px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white"
              >
                {DAY_KEYS.map((d) => (
                  <option key={d} value={d}>
                    {DAY_NAMES[d][language]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {isMr ? 'आठवडा कालावधी निवडा:' : 'Target Week:'}
            </label>
            <select
              value={formWeek}
              onChange={(e) => setFormWeek(e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono tabular-nums text-white"
            >
              {recentWeeks.map((w) => (
                <option key={w.week} value={w.week}>
                  {w.week}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-300">
                {isMr ? 'तुमचे पक्के OTC अंक निवडा (१ ते ४ अंक):' : 'Pick Your OTC Digits (1 to 4):'}
              </span>
              <span className="font-mono tabular-nums text-amber-400 font-bold">
                {selectedOtc.join(' - ')}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
                const isPicked = selectedOtc.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleOtcDigit(d)}
                    className={`min-h-[44px] rounded-xl font-mono font-bold text-base tabular-nums border transition-colors cursor-pointer ${
                      isPicked
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

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {isMr ? 'पक्क्या जोड्या (कमाल ८, उदा. 12, 58, 91):' : 'Selected Jodis (up to 8):'}
            </label>
            <input
              type="text"
              value={jodisInput}
              onChange={(e) => setJodisInput(e.target.value)}
              placeholder="12, 21, 58, 91"
              className="w-full min-h-[42px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono tabular-nums text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {isMr ? 'निवडक पाना (कमाल ६, उदा. 137, 240):' : 'Selected Panas (up to 6):'}
            </label>
            <input
              type="text"
              value={panasInput}
              onChange={(e) => setPanasInput(e.target.value)}
              placeholder="137, 240, 579"
              className="w-full min-h-[42px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono tabular-nums text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {isMr ? 'अभ्यास टीप / ट्रिक नाव (ऐच्छिक):' : 'Study Trick Note (optional):'}
            </label>
            <input
              type="text"
              maxLength={200}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder={isMr ? 'उदा. शनिवार क्लोज कट लाईन' : 'e.g. Saturday cut progression'}
              className="w-full min-h-[42px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          {formFeedback && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              {formFeedback}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || selectedOtc.length === 0}
            className="w-full min-h-[46px] rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {isSaving
                ? isMr
                  ? 'जतन होत आहे...'
                  : 'Saving...'
                : isMr
                ? 'नोंदवहीत जतन करा'
                : 'Save to Passbook'}
            </span>
          </button>
        </form>

        {/* Saved Passbook Entries List */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">
              {isMr ? 'जतन केलेल्या गेसिंग नोंदी व निकाल पडताळणी' : 'Saved Guesses & Live Verification'}
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                {[
                  { id: 'all', label: isMr ? 'सर्व' : 'All' },
                  { id: 'kalyan', label: isMr ? 'कल्याण' : 'Kalyan' },
                  { id: 'rajdhani_night', label: isMr ? 'राजधानी' : 'Rajdhani' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFilterMarket(m.id as any)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      filterMarket === m.id
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                {[
                  { id: 'all', label: isMr ? 'सर्व स्थिती' : 'All' },
                  { id: 'pass', label: isMr ? 'पास' : 'Passed' },
                  { id: 'pending', label: isMr ? 'प्रलंबित' : 'Pending' },
                  { id: 'miss', label: isMr ? 'मिस' : 'Miss' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFilterStatus(s.id as any)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      filterStatus === s.id
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredList.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="text-sm font-semibold text-slate-300">
                {isMr ? 'अद्याप कोणतीही गेसिंग नोंद नाही' : 'No Passbook Entries Yet'}
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isMr
                  ? 'डाव्या बाजूच्या फॉर्ममधून तुमचे ४ OTC अंक आणि जोड्या जतन करा, म्हणजे निकाल लागल्यावर अचूकता आपोआप दिसेल.'
                  : 'Use the form to save your first OTC and Jodi guess before the next draw.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map(({ entry, evalResult }) => {
                const isPass = ['jodi_pass', 'pana_pass', 'otc_pass'].includes(evalResult.status);
                const isMiss = evalResult.status === 'miss';
                const marketName =
                  entry.market === 'rajdhani_night'
                    ? isMr
                      ? 'राजधानी नाईट'
                      : 'Rajdhani Night'
                    : isMr
                    ? 'कल्याण'
                    : 'Kalyan';

                return (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="font-bold text-white">{marketName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-amber-400">
                            {DAY_NAMES[entry.day][language]}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{entry.week}</span>
                        </div>
                        {entry.note && (
                          <p className="text-xs text-slate-400 mt-1">{entry.note}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        {isPass ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{isMr ? evalResult.badgeTextMr : evalResult.badgeTextEn}</span>
                          </span>
                        ) : isMiss ? (
                          <span className="flex items-center gap-1 text-rose-400">
                            <XCircle className="w-4 h-4 shrink-0" />
                            <span>{isMr ? evalResult.badgeTextMr : evalResult.badgeTextEn}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-300">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>{isMr ? evalResult.badgeTextMr : evalResult.badgeTextEn}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-400 block">
                          {isMr ? 'माझे OTC अंक:' : 'My OTC:'}
                        </span>
                        <span className="font-mono font-bold text-sm text-amber-400 tabular-nums">
                          {entry.otcDigits.join(' - ')}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">
                          {isMr ? 'माझ्या जोड्या:' : 'My Jodis:'}
                        </span>
                        <span className="font-mono font-bold text-slate-200 tabular-nums">
                          {entry.jodis.length > 0 ? entry.jodis.join(', ') : '--'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">
                          {isMr ? 'प्रत्यक्ष चार्ट निकाल:' : 'Actual Result:'}
                        </span>
                        <span className="font-mono font-bold text-emerald-300 tabular-nums">
                          {evalResult.actualOpenPana}-{evalResult.actualJodi}-
                          {evalResult.actualClosePana}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() =>
                          setPhotoCardPayload({
                            market: entry.market,
                            language,
                            weekStr: entry.week,
                            day: entry.day,
                            titleBadge: isMr ? 'माझी वैयक्तिक गेसिंग नोंदवही' : 'MY PERSONAL STUDY CARD',
                            otcDigits: entry.otcDigits,
                            strongJodis: entry.jodis.slice(0, 4),
                            supportJodis: entry.jodis.slice(4, 8),
                            panas: entry.panas,
                            formulaLabel: entry.note || (isMr ? 'वैयक्तिक चार्ट अभ्यास' : 'Personal Study'),
                            declaredResult: !evalResult.actualJodi.includes('*')
                              ? `${evalResult.actualOpenPana}-${evalResult.actualJodi}-${evalResult.actualClosePana}`
                              : undefined,
                            passBanner: isPass
                              ? isMr
                                ? evalResult.badgeTextMr
                                : evalResult.badgeTextEn
                              : undefined,
                          })
                        }
                        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{isMr ? 'फोटो कार्ड काढा' : 'Photo Card'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deletePassbookEntry(entry.id)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isMr ? 'हटवा' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {photoCardPayload && (
        <PhotoCardModal
          isOpen={Boolean(photoCardPayload)}
          onClose={() => setPhotoCardPayload(null)}
          payload={photoCardPayload}
        />
      )}
    </div>
  );
};
