import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  RefreshCw, 
  Globe, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Save, 
  Sparkles,
  ExternalLink,
  Cloud,
  LogIn,
  Layers,
  Check,
  RotateCcw
} from 'lucide-react';
import { DayKey, Language, WeekRecord, MarketType, MARKETS } from '../types';
import { DAY_NAMES, DAY_KEYS, getEffectiveHistory } from '../utils/matkaMath';
import { useFirebaseApp } from '../contexts/FirebaseContext';

interface ChartUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  market?: MarketType;
  latestWeek?: WeekRecord;
  history?: WeekRecord[];
  kalyanHistory?: WeekRecord[];
  rajdhaniHistory?: WeekRecord[];
  onHistoryUpdated: (newHistory: WeekRecord[]) => void;
}

export const ChartUpdateModal: React.FC<ChartUpdateModalProps> = ({
  isOpen,
  onClose,
  language,
  market = 'kalyan',
  latestWeek,
  history = [],
  kalyanHistory = [],
  rajdhaniHistory = [],
  onHistoryUpdated,
}) => {
  const isMr = language === 'mr';
  const isNight = market === 'rajdhani_night';
  const marketInfo = MARKETS[market];
  const { 
    user, 
    isAdmin, 
    signInWithGoogle, 
    syncWeekToCloud, 
    syncRecentChartToCloud,
    syncAllMarketsToCloud 
  } = useFirebaseApp();

  const [activeSubTab, setActiveSubTab] = useState<'auto' | 'bulk' | 'manual' | 'cloud'>('auto');
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [isMasterSyncing, setIsMasterSyncing] = useState<boolean>(false);

  // Auto-fetch state
  const [fetchUrl, setFetchUrl] = useState<string>('https://dpboss.tax/');
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isPartialResult, setIsPartialResult] = useState<boolean>(false);
  const [fetchedData, setFetchedData] = useState<{
    openPana: string;
    jodi: string;
    closePana: string;
  } | null>(null);
  const [fetchMessage, setFetchMessage] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Manual update state
  const findFirstPendingDay = (w?: WeekRecord): DayKey => {
    if (w) {
      for (const d of DAY_KEYS) {
        if (w[d] && w[d].jodi.includes('*')) return d;
      }
    }
    return 'mon';
  };

  const effectiveHistory = useMemo(
    () => getEffectiveHistory(history || [], market),
    [history, market]
  );
  const activeInitialWeek = latestWeek || (effectiveHistory.length > 0 ? effectiveHistory[effectiveHistory.length - 1] : undefined);

  const [selectedDay, setSelectedDay] = useState<DayKey>(() => findFirstPendingDay(activeInitialWeek));
  const [weekString, setWeekString] = useState<string>(activeInitialWeek?.week || '26-10-26 to 01-11-26');
  const [openPanaInput, setOpenPanaInput] = useState<string>('258');
  const [jodiInput, setJodiInput] = useState<string>('56');
  const [closePanaInput, setClosePanaInput] = useState<string>('150');

  // Bulk Week Scanner state
  const [bulkWeekString, setBulkWeekString] = useState<string>(activeInitialWeek?.week || '');
  const [bulkWeekData, setBulkWeekData] = useState<Record<DayKey, { openPana: string; jodi: string; closePana: string }>>(() => {
    const rec = activeInitialWeek;
    return {
      mon: { openPana: rec?.mon?.openPana || '***', jodi: rec?.mon?.jodi || '**', closePana: rec?.mon?.closePana || '***' },
      tue: { openPana: rec?.tue?.openPana || '***', jodi: rec?.tue?.jodi || '**', closePana: rec?.tue?.closePana || '***' },
      wed: { openPana: rec?.wed?.openPana || '***', jodi: rec?.wed?.jodi || '**', closePana: rec?.wed?.closePana || '***' },
      thu: { openPana: rec?.thu?.openPana || '***', jodi: rec?.thu?.jodi || '**', closePana: rec?.thu?.closePana || '***' },
      fri: { openPana: rec?.fri?.openPana || '***', jodi: rec?.fri?.jodi || '**', closePana: rec?.fri?.closePana || '***' },
      sat: isNight
        ? { openPana: '***', jodi: 'XX', closePana: '***' }
        : { openPana: rec?.sat?.openPana || '***', jodi: rec?.sat?.jodi || '**', closePana: rec?.sat?.closePana || '***' },
    };
  });
  const [isBulkScanning, setIsBulkScanning] = useState<boolean>(false);
  const [bulkScanMessage, setBulkScanMessage] = useState<string | null>(null);
  const [bulkScanError, setBulkScanError] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState<boolean>(false);

  // Saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const currentActive = effectiveHistory[effectiveHistory.length - 1] || latestWeek;
    if (currentActive?.week) {
      setWeekString(currentActive.week);
      setSelectedDay(findFirstPendingDay(currentActive));
      setBulkWeekString(currentActive.week);
      setBulkWeekData({
        mon: { openPana: currentActive.mon?.openPana || '***', jodi: currentActive.mon?.jodi || '**', closePana: currentActive.mon?.closePana || '***' },
        tue: { openPana: currentActive.tue?.openPana || '***', jodi: currentActive.tue?.jodi || '**', closePana: currentActive.tue?.closePana || '***' },
        wed: { openPana: currentActive.wed?.openPana || '***', jodi: currentActive.wed?.jodi || '**', closePana: currentActive.wed?.closePana || '***' },
        thu: { openPana: currentActive.thu?.openPana || '***', jodi: currentActive.thu?.jodi || '**', closePana: currentActive.thu?.closePana || '***' },
        fri: { openPana: currentActive.fri?.openPana || '***', jodi: currentActive.fri?.jodi || '**', closePana: currentActive.fri?.closePana || '***' },
        sat: isNight
          ? { openPana: '***', jodi: 'XX', closePana: '***' }
          : { openPana: currentActive.sat?.openPana || '***', jodi: currentActive.sat?.jodi || '**', closePana: currentActive.sat?.closePana || '***' },
      });
    }
  }, [effectiveHistory, market, latestWeek?.week]);

  // Handle Web Fetching (Single Today)
  const handleFetchFromWeb = async () => {
    setIsFetching(true);
    setFetchMessage(null);
    setFetchError(null);
    setFetchedData(null);

    try {
      const res = await fetch('/api/fetch-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customUrl: fetchUrl, market }),
      });
      const json = await res.json();

      if (json.success && json.found && json.data) {
        setFetchedData(json.data);
        if (json.dayKey) {
          setSelectedDay(json.dayKey as DayKey);
        }
        setOpenPanaInput(json.data.openPana);
        setJodiInput(json.data.jodi);
        setClosePanaInput(json.data.closePana);
        const currentMarketTitle = isNight ? (isMr ? 'राजधानी नाईट' : 'Rajdhani Night') : (isMr ? 'कल्याण' : 'Kalyan');
        setFetchMessage(isMr ? `वेबसाईटवरून ${currentMarketTitle} निकाल यशस्वीरित्या फेच झाला!` : `Live result for ${currentMarketTitle} successfully fetched from website!`);
      } else if (json.message) {
        setFetchError(json.message);
      } else {
        setFetchError(json.error || (isMr ? 'निकाल फेच करताना त्रुटी आली.' : 'Failed to fetch result.'));
      }
    } catch (err: any) {
      setFetchError(err.message || (isMr ? 'सर्व्हरशी संपर्क होऊ शकला नाही.' : 'Connection error.'));
    } finally {
      setIsFetching(false);
    }
  };

  // Sample Simulation for testing: Open-only
  const handleLoadSampleOpenOnly = () => {
    const sample = {
      openPana: '390',
      jodi: '2*',
      closePana: '***',
    };
    setFetchedData(sample);
    setIsPartialResult(true);
    setOpenPanaInput(sample.openPana);
    setJodiInput(sample.jodi);
    setClosePanaInput(sample.closePana);
    setFetchMessage(
      isMr 
        ? '🕒 दुपारचा कल्याण ओपन निकाल फेच झाला: 390-2- (क्लोज संध्याकाळी ६:०० पर्यंत येईल)' 
        : '🕒 Kalyan Open result fetched: 390-2- (Close pending until ~6:00 PM)'
    );
  };

  // Sample Simulation for testing: Full Result
  const handleLoadSampleFullResult = () => {
    const sample = {
      openPana: '390',
      jodi: '25',
      closePana: '113',
    };
    setFetchedData(sample);
    setIsPartialResult(false);
    setOpenPanaInput(sample.openPana);
    setJodiInput(sample.jodi);
    setClosePanaInput(sample.closePana);
    setFetchMessage(
      isMr 
        ? '🏁 संध्याकाळचा पूर्ण निकाल फेच झाला: 390-25-113 (ओपन व क्लोज दोन्ही)' 
        : '🏁 Full result fetched: 390-25-113 (Both Open & Close)'
    );
  };

  // Handle Save to Historical JSON (Single Day)
  const handleSaveToChart = async (overrideData?: { openPana: string; jodi: string; closePana: string }) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const payload = {
      market,
      week: weekString,
      day: selectedDay,
      openPana: overrideData ? overrideData.openPana : openPanaInput,
      jodi: overrideData ? overrideData.jodi : jodiInput,
      closePana: overrideData ? overrideData.closePana : closePanaInput,
    };

    try {
      const res = await fetch('/api/update-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.history) {
        onHistoryUpdated(json.history);
        let syncedCloud = false;
        if (isAdmin && Array.isArray(json.history)) {
          const targetIdx = json.history.findIndex((w: WeekRecord) => w.week === payload.week);
          if (targetIdx >= 0) {
            try {
              syncedCloud = await syncWeekToCloud(market, json.history[targetIdx], targetIdx);
            } catch {}
          }
        }
        setSaveSuccess(
          isMr 
            ? `✓ ${DAY_NAMES[selectedDay].mr} चा निकाल (${payload.openPana}-${payload.jodi}-${payload.closePana}) ${syncedCloud ? 'चार्ट व फायरबेस क्लाउडमध्ये' : 'चार्टमध्ये'} सेव्ह झाला!`
            : `✓ Result for ${DAY_NAMES[selectedDay].en} saved${syncedCloud ? ' & synced to Cloud' : ''}!`
        );
        setTimeout(() => {
          setSaveSuccess(null);
          onClose();
        }, 1800);
      } else {
        setSaveError(json.error || (isMr ? 'सेव्ह करताना त्रुटी आली.' : 'Failed to save record.'));
      }
    } catch (err: any) {
      setSaveError(err.message || (isMr ? 'सर्व्हर त्रुटी आली.' : 'Server communication error.'));
    } finally {
      setIsSaving(false);
    }
  };

  // FEATURE 1: Bulk Week Auto-Scan from DPBoss
  const handleBulkScanFromWeb = async () => {
    setIsBulkScanning(true);
    setBulkScanMessage(null);
    setBulkScanError(null);

    try {
      const res = await fetch(`/api/fetch-week-chart?market=${market}`);
      const json = await res.json();

      if (json.success && json.weekData) {
        setBulkWeekData((prev) => {
          const next = { ...prev };
          const days: DayKey[] = isNight ? ['mon', 'tue', 'wed', 'thu', 'fri'] : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          days.forEach((d) => {
            if (json.weekData[d]) {
              next[d] = {
                openPana: json.weekData[d].openPana || prev[d].openPana,
                jodi: json.weekData[d].jodi || prev[d].jodi,
                closePana: json.weekData[d].closePana || prev[d].closePana,
              };
            }
          });
          return next;
        });

        const marketName = isNight ? (isMr ? 'राजधानी नाईट' : 'Rajdhani Night') : (isMr ? 'कल्याण' : 'Kalyan');
        setBulkScanMessage(
          isMr
            ? `✓ dpboss पॅनल चार्टवरून ${marketName}चा संपूर्ण आठवडा (${json.rawDateStr || ''}) यशस्वीरित्या स्कॅन व फेच झाला!`
            : `✓ Full week for ${marketName} (${json.rawDateStr || ''}) successfully scanned from DPBoss!`
        );
      } else {
        setBulkScanError(json.message || (isMr ? 'वेबसाईटवरून आठवडा वाचता आला नाही.' : 'Failed to scan week.'));
      }
    } catch (err: any) {
      setBulkScanError(err.message || (isMr ? 'सर्व्हरशी संपर्क होऊ शकला नाही.' : 'Network error.'));
    } finally {
      setIsBulkScanning(false);
    }
  };

  // FEATURE 1: Save Entire Bulk Week
  const handleSaveBulkWeek = async () => {
    setIsBulkSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const res = await fetch('/api/update-full-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          week: bulkWeekString,
          weekData: bulkWeekData,
        }),
      });

      const json = await res.json();
      if (json.success && json.history) {
        onHistoryUpdated(json.history);
        let syncedCloud = false;
        if (isAdmin && Array.isArray(json.history)) {
          const targetIdx = json.history.findIndex((w: WeekRecord) => w.week === bulkWeekString);
          if (targetIdx >= 0) {
            try {
              syncedCloud = await syncWeekToCloud(market, json.history[targetIdx], targetIdx);
            } catch {}
          }
        }
        setSaveSuccess(
          isMr
            ? `✓ ${bulkWeekString} चा संपूर्ण आठवडा ${syncedCloud ? 'चार्ट व क्लाउडमध्ये' : 'चार्टमध्ये'} सेव्ह झाला!`
            : `✓ Full week for ${bulkWeekString} saved${syncedCloud ? ' & synced to Cloud' : ''}!`
        );
        setTimeout(() => {
          setSaveSuccess(null);
          onClose();
        }, 1800);
      } else {
        setSaveError(json.error || (isMr ? 'आठवडा सेव्ह करताना त्रुटी आली.' : 'Failed to save full week.'));
      }
    } catch (err: any) {
      setSaveError(err.message || (isMr ? 'सर्व्हर त्रुटी आली.' : 'Server communication error.'));
    } finally {
      setIsBulkSaving(false);
    }
  };

  // FEATURE 2: Master Sync (Both Markets) to Firebase Cloud
  const handleMasterSync = async () => {
    setIsMasterSyncing(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const effectiveKalyan = kalyanHistory && kalyanHistory.length > 0 ? kalyanHistory : effectiveHistory;
      const effectiveRajdhani = rajdhaniHistory && rajdhaniHistory.length > 0 ? rajdhaniHistory : effectiveHistory;

      const res = await syncAllMarketsToCloud(effectiveKalyan, effectiveRajdhani, 16);
      setSaveSuccess(
        isMr
          ? `✓ ॲडमिन मास्टर सिंक पूर्ण! कल्याण (${res.kalyan} आठवडे) व राजधानी नाईट (${res.rajdhani} आठवडे) दोन्ही चार्ट एकाच वेळी फायरबेस क्लाउडवर यशस्वीरित्या सिंक झाले!`
          : `✓ Master Sync Complete! Kalyan (${res.kalyan} wks) & Rajdhani Night (${res.rajdhani} wks) both synced to Firebase Cloud!`
      );
    } catch (err: any) {
      setSaveError(err?.message || (isMr ? 'मास्टर क्लाउड सिंक अयशस्वी.' : 'Master Cloud Sync failed.'));
    } finally {
      setIsMasterSyncing(false);
    }
  };

  if (!isOpen) return null;

  // Detect missing/pending days in bulk data
  const daysToCheck: DayKey[] = isNight ? ['mon', 'tue', 'wed', 'thu', 'fri'] : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const missingDays = daysToCheck.filter((d) => {
    const c = bulkWeekData[d];
    return !c || c.jodi.includes('*') || c.openPana === '***' || c.closePana === '***';
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>
                  {isMr 
                    ? `${marketInfo.name.mr} चार्ट निकाल अद्यतन (Update)` 
                    : `Update ${marketInfo.name.en} Chart`}
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-semibold">
                  {marketInfo.tagline[language]}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isMr 
                  ? 'मिसिंग दिवस ऑटो-स्कॅनर, थेट वेब फेच किंवा १-क्लिक मास्टर क्लाउड सिंक' 
                  : 'Bulk Missing Days Scanner, Live Web Fetch, or 1-Click Master Cloud Sync'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (4 Tabs) */}
        <div className="p-2 sm:p-3 bg-slate-950 border-b border-slate-800/80 flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveSubTab('auto')}
            className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'auto'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{isMr ? '१. आजचा निकाल' : '1. Today Live'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bulk')}
            className={`flex-1 min-w-[140px] py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'bulk'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="flex items-center gap-1">
              {isMr ? '२. मिसिंग स्कॅनर' : '2. Bulk Week'}
              {missingDays.length > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                  {missingDays.length}
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('manual')}
            className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'manual'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isMr ? '३. मॅन्युअल नोंद' : '3. Manual'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cloud')}
            className={`flex-1 min-w-[130px] py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'cloud'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>{isMr ? '४. क्लाउड सिंक' : '4. Cloud Sync'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Success Banner */}
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {saveError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* SUBTAB 1: AUTO WEB FETCH (TODAY'S LIVE) */}
          {activeSubTab === 'auto' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span>{isMr ? 'लाईव्ह निकाल स्त्रोत वेबसाईट (Source URL):' : 'Live Result Website Source:'}</span>
                  </label>
                  <a
                    href={fetchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>{isMr ? 'साईट उघडा' : 'Visit Site'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fetchUrl}
                    onChange={(e) => setFetchUrl(e.target.value)}
                    placeholder="https://dpboss.tax/"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleFetchFromWeb}
                    disabled={isFetching}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                    <span>{isFetching ? (isMr ? 'फेच होत आहे...' : 'Fetching...') : (isMr ? 'आजचा निकाल फेच करा' : 'Fetch Today Result')}</span>
                  </button>
                </div>

                {fetchMessage && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{fetchMessage}</span>
                  </div>
                )}

                {fetchError && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fetchError}</span>
                  </div>
                )}
              </div>

              {/* Fetched Data Preview & Confirm Card */}
              {fetchedData && (
                <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>{isMr ? 'फेच झालेला निकाल' : 'Fetched Result'}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {DAY_NAMES[selectedDay][language]} ({weekString})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                        {isMr ? 'ओपन पाना' : 'Open Pana'}
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-slate-200">
                        {fetchedData.openPana}
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                      <div className="text-[10px] text-amber-400 uppercase tracking-wider mb-1 font-bold">
                        {isMr ? 'जोडी' : 'Jodi'}
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-amber-300">
                        {fetchedData.jodi}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                        {isMr ? 'क्लोज पाना' : 'Close Pana'}
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-slate-200">
                        {fetchedData.closePana}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveToChart(fetchedData)}
                    disabled={isSaving}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {isSaving 
                        ? (isMr ? 'चार्टमध्ये सेव्ह होत आहे...' : 'Saving to Chart...') 
                        : (isMr ? `हा निकाल ${marketInfo.name.mr} चार्टमध्ये १-क्लिक सेव्ह करा` : `Save Result to ${marketInfo.name.en} Chart`)}
                    </span>
                  </button>
                </div>
              )}

              {/* Simulation test triggers */}
              <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>{isMr ? 'किंवा चाचणीसाठी डेमो निकाल लोड करा:' : 'Or simulate demo test result:'}</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleLoadSampleOpenOnly}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    {isMr ? 'ओपन निकाल (Open)' : 'Open Demo'}
                  </button>
                  <button
                    onClick={handleLoadSampleFullResult}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    {isMr ? 'पूर्ण निकाल (Full)' : 'Full Demo'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: BULK WEEK SCANNER & QUICK BACKFILL */}
          {activeSubTab === 'bulk' && (
            <div className="space-y-4">
              {/* Header Banner & Controls */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>{isMr ? 'आठवडा ऑटो-स्कॅनर व सुटलेले दिवस बॅकफिल' : 'Bulk Week Scanner & Missing Days Backfill'}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isMr 
                        ? '२-३ दिवस अपडेट न झाल्यास DPBoss पॅनल चार्टवरून सर्व सुटलेले दिवस १-क्लिकमध्ये फेच करा.' 
                        : 'If you missed 2-3 days, scan DPBoss panel chart to backfill all missing days in 1-click.'}
                    </p>
                  </div>

                  {/* Week Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{isMr ? 'आठवडा:' : 'Week:'}</span>
                    <select
                      value={bulkWeekString}
                      onChange={(e) => {
                        const target = e.target.value;
                        setBulkWeekString(target);
                        const found = effectiveHistory.find((w) => w.week === target);
                        if (found) {
                          setBulkWeekData({
                            mon: { openPana: found.mon?.openPana || '***', jodi: found.mon?.jodi || '**', closePana: found.mon?.closePana || '***' },
                            tue: { openPana: found.tue?.openPana || '***', jodi: found.tue?.jodi || '**', closePana: found.tue?.closePana || '***' },
                            wed: { openPana: found.wed?.openPana || '***', jodi: found.wed?.jodi || '**', closePana: found.wed?.closePana || '***' },
                            thu: { openPana: found.thu?.openPana || '***', jodi: found.thu?.jodi || '**', closePana: found.thu?.closePana || '***' },
                            fri: { openPana: found.fri?.openPana || '***', jodi: found.fri?.jodi || '**', closePana: found.fri?.closePana || '***' },
                            sat: isNight
                              ? { openPana: '***', jodi: 'XX', closePana: '***' }
                              : { openPana: found.sat?.openPana || '***', jodi: found.sat?.jodi || '**', closePana: found.sat?.closePana || '***' },
                          });
                        }
                      }}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-mono"
                    >
                      {effectiveHistory.slice(-10).reverse().map((w, idx) => (
                        <option key={w.week} value={w.week}>
                          {w.week} {idx === 0 ? (isMr ? '✨ (चालू आठवडा)' : '✨ (Current Week)') : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Missing Status Alert */}
                <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  missingDays.length > 0 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {missingDays.length > 0 ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span>
                      {missingDays.length > 0
                        ? isMr
                          ? `या आठवड्यात ${missingDays.length} दिवस सुटलेले/अपूर्ण आहेत: ${missingDays.map(d => DAY_NAMES[d].mr).join(', ')}`
                          : `${missingDays.length} missing/pending days in this week: ${missingDays.map(d => DAY_NAMES[d].en).join(', ')}`
                        : isMr
                        ? 'या आठवड्यातील सर्व खेळलेले दिवस पूर्णपणे भरलेले आहेत! ✓'
                        : 'All played days in this week are fully filled! ✓'}
                    </span>
                  </div>

                  <button
                    onClick={handleBulkScanFromWeb}
                    disabled={isBulkScanning}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0 shadow transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBulkScanning ? 'animate-spin' : ''}`} />
                    <span>{isBulkScanning ? (isMr ? 'स्कॅनिंग...' : 'Scanning...') : (isMr ? 'DPBoss वरून ऑटो-स्कॅन करा' : 'Auto-Scan DPBoss')}</span>
                  </button>
                </div>

                {bulkScanMessage && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{bulkScanMessage}</span>
                  </div>
                )}

                {bulkScanError && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bulkScanError}</span>
                  </div>
                )}
              </div>

              {/* Week Grid / Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">{isMr ? 'वार' : 'Day'}</th>
                        <th className="py-2.5 px-2 text-center">{isMr ? 'ओपन पाना' : 'Open Pana'}</th>
                        <th className="py-2.5 px-2 text-center">{isMr ? 'जोडी' : 'Jodi'}</th>
                        <th className="py-2.5 px-2 text-center">{isMr ? 'क्लोज पाना' : 'Close Pana'}</th>
                        <th className="py-2.5 px-3 text-center">{isMr ? 'स्थिती' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {DAY_KEYS.map((day) => {
                        const isClosedSat = isNight && day === 'sat';
                        const cell = bulkWeekData[day];
                        const isPending = !isClosedSat && (cell.jodi.includes('*') || cell.openPana === '***' || cell.closePana === '***');

                        return (
                          <tr key={day} className={`hover:bg-slate-900/50 transition-colors ${isPending ? 'bg-rose-500/5' : ''}`}>
                            <td className="py-2 px-3 font-sans font-bold text-slate-200">
                              <span className="flex items-center gap-1.5">
                                <span>{DAY_NAMES[day][language]}</span>
                                {isClosedSat && (
                                  <span className="text-[10px] text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1 py-0.2 rounded font-normal font-sans">
                                    {isMr ? 'बंद' : 'Off'}
                                  </span>
                                )}
                              </span>
                            </td>

                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="text"
                                maxLength={3}
                                disabled={isClosedSat}
                                value={cell.openPana}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkWeekData((prev) => ({
                                    ...prev,
                                    [day]: { ...prev[day], openPana: val },
                                  }));
                                }}
                                className="w-16 bg-slate-900 border border-slate-700 disabled:opacity-40 text-center py-1 rounded text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                              />
                            </td>

                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="text"
                                maxLength={2}
                                disabled={isClosedSat}
                                value={cell.jodi}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkWeekData((prev) => ({
                                    ...prev,
                                    [day]: { ...prev[day], jodi: val },
                                  }));
                                }}
                                className={`w-14 bg-slate-900 border border-slate-700 disabled:opacity-40 text-center py-1 rounded text-xs font-bold focus:outline-none focus:border-amber-500 ${
                                  cell.jodi.includes('*') ? 'text-slate-500' : 'text-amber-300'
                                }`}
                              />
                            </td>

                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="text"
                                maxLength={3}
                                disabled={isClosedSat}
                                value={cell.closePana}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkWeekData((prev) => ({
                                    ...prev,
                                    [day]: { ...prev[day], closePana: val },
                                  }));
                                }}
                                className="w-16 bg-slate-900 border border-slate-700 disabled:opacity-40 text-center py-1 rounded text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                              />
                            </td>

                            <td className="py-1.5 px-3 text-center font-sans">
                              {isClosedSat ? (
                                <span className="text-[10px] text-slate-500 font-medium">XX</span>
                              ) : isPending ? (
                                <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold">
                                  {isMr ? 'सुटलेला' : 'Missing'}
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold flex items-center justify-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>{isMr ? 'पूर्ण' : 'Filled'}</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    {isMr 
                      ? 'तपासणी करा व आवश्यक असल्यास अंक बदला, नंतर १-क्लिक सेव्ह करा.' 
                      : 'Review and edit numbers above, then click save.'}
                  </div>
                  <button
                    onClick={handleSaveBulkWeek}
                    disabled={isBulkSaving}
                    className="py-2 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {isBulkSaving 
                        ? (isMr ? 'आठवडा सेव्ह होत आहे...' : 'Saving Week...') 
                        : (isMr ? 'संपूर्ण आठवडा १-क्लिक सेव्ह करा' : 'Save Entire Week')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: MANUAL ENTRY (SINGLE DAY) */}
          {activeSubTab === 'manual' && (
            <div className="space-y-4">
              {/* Day Selector Buttons */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">
                  {isMr ? '१. निकाल जाहीर झालेला वार निवडा:' : '1. Select Weekday:'}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {DAY_KEYS.map((day) => {
                    const isSelected = selectedDay === day;
                    const isSatNight = isNight && day === 'sat';
                    return (
                      <button
                        key={day}
                        disabled={isSatNight}
                        onClick={() => setSelectedDay(day)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSatNight
                            ? 'opacity-30 border-slate-800 bg-slate-950 cursor-not-allowed'
                            : isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-white shadow-md shadow-amber-500/10'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <div className="text-xs font-bold">{DAY_NAMES[day][language]}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {isSatNight ? (isMr ? 'मार्केट बंद' : 'Closed') : DAY_NAMES[day].en.slice(0, 3)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Number Inputs Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      {isMr ? 'ओपन पाना (3 Digit)' : 'Open Pana'}
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={openPanaInput}
                      onChange={(e) => setOpenPanaInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="उदा. 346"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center text-sm font-bold font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-amber-300 block mb-1">
                      {isMr ? 'जोडी (2 Digit)' : 'Jodi'}
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={jodiInput}
                      onChange={(e) => setJodiInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="उदा. 31"
                      className="w-full bg-amber-500/10 border border-amber-500/40 rounded-xl p-2.5 text-center text-sm font-bold font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      {isMr ? 'क्लोज पाना (3 Digit)' : 'Close Pana'}
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={closePanaInput}
                      onChange={(e) => setClosePanaInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="उदा. 137"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center text-sm font-bold font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>{isMr ? 'आठवडा:' : 'Week:'}</span>
                    <select
                      value={weekString}
                      onChange={(e) => {
                        const target = e.target.value;
                        setWeekString(target);
                        const found = effectiveHistory.find((w) => w.week === target);
                        if (found) {
                          const newDay = findFirstPendingDay(found);
                          setSelectedDay(newDay);
                          const cell = found[newDay] || { openPana: '***', jodi: '**', closePana: '***' };
                          setOpenPanaInput(cell.openPana !== '***' ? cell.openPana : '');
                          setJodiInput(cell.jodi !== '**' && cell.jodi !== 'XX' ? cell.jodi : '');
                          setClosePanaInput(cell.closePana !== '***' ? cell.closePana : '');
                        }
                      }}
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-amber-500 font-mono"
                    >
                      {effectiveHistory.slice(-10).reverse().map((w, idx) => (
                        <option key={w.week} value={w.week}>
                          {w.week} {idx === 0 ? (isMr ? '✨ (चालू आठवडा)' : '✨ (Current Week)') : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>{isMr ? 'वार:' : 'Day:'} <strong className="text-amber-400 font-sans">{DAY_NAMES[selectedDay][language]}</strong></span>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={() => handleSaveToChart()}
                disabled={isSaving}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSaving 
                    ? (isMr ? 'चार्टमध्ये सेव्ह होत आहे...' : 'Saving to Chart...') 
                    : (isMr ? `${marketInfo.name.mr} चार्टमध्ये सेव्ह करा` : `Save to ${marketInfo.name.en} Chart`)}
                </span>
              </button>
            </div>
          )}

          {/* SUBTAB 4: FIREBASE CLOUD SYNC & MASTER BACKUP */}
          {activeSubTab === 'cloud' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-indigo-400" />
                  <span>
                    {isMr
                      ? 'फायरबेस क्लाउड सिंक व ॲडमिन मास्टर बॅकअप'
                      : 'Firebase Cloud Sync & Admin Master Backup'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isMr
                    ? 'सर्व युजर्सना रिअल-टाईममध्ये अद्ययावत चार्ट दिसतो. चार्ट क्लाउडवर सुरक्षितपणे पुश करण्याचा अधिकार फक्त व्हेरिफाईड ॲडमिन खात्याला आहे.'
                    : 'All users receive real-time cloud chart updates automatically. Writing chart updates to Firestore is restricted to the verified Admin account.'}
                </p>

                {!user ? (
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    className="w-full min-h-[44px] py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isMr ? 'ॲडमिन गुगल लॉगिन करा' : 'Sign in with Google (Admin)'}</span>
                  </button>
                ) : !isAdmin ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    {isMr
                      ? `सध्या लॉगिन खाते: ${user.email}. क्लाउड चार्ट रीड-ओनली सिंक सक्रिय आहे (फक्त ॲडमिन खाते मुख्य चार्ट क्लाउडवर बदलू शकते).`
                      : `Signed in as ${user.email}. Real-time cloud chart read sync is active.`}
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {/* FEATURE 2: 1-Click Master Sync (Both Markets) */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <span>{isMr ? '🌟 ॲडमिन मास्टर सिंक (Admin Master Sync)' : '🌟 Admin Master Sync'}</span>
                        </span>
                        <span className="text-[10px] bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-full">
                          {isMr ? '२ मार्केट एकत्र' : '2 Markets in 1'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {isMr
                          ? 'कल्याण आणि राजधानी नाईट या दोन्ही चार्टचे मागील १६ आठवडे एकाच क्लिकवर फायरबेस क्लाउडवर अपलोड करा.'
                          : 'Upload the last 16 weeks of BOTH Kalyan and Rajdhani Night charts to Firebase Cloud in one single click.'}
                      </p>

                      <button
                        type="button"
                        disabled={isMasterSyncing}
                        onClick={handleMasterSync}
                        className="w-full min-h-[44px] py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
                      >
                        <RefreshCw className={`w-4 h-4 ${isMasterSyncing ? 'animate-spin' : ''}`} />
                        <span>
                          {isMasterSyncing
                            ? isMr
                              ? 'दोन्ही मार्केट क्लाउडवर सिंक होत आहेत...'
                              : 'Syncing Both Markets to Cloud...'
                            : isMr
                            ? '🚀 दोन्ही मार्केट (कल्याण + राजधानी) एकाच क्लिकवर क्लाउड सिंक करा'
                            : '🚀 Master Sync: Both Kalyan & Rajdhani Night to Cloud'}
                        </span>
                      </button>
                    </div>

                    {/* Single Market Sync */}
                    <button
                      type="button"
                      disabled={isCloudSyncing || history.length === 0}
                      onClick={async () => {
                        setIsCloudSyncing(true);
                        setSaveError(null);
                        setSaveSuccess(null);
                        try {
                          const count = await syncRecentChartToCloud(market, history, 16);
                          setSaveSuccess(
                            isMr
                              ? `✓ मागील ${count} आठवड्यांचा ${marketInfo.name.mr} चार्ट फायरबेस क्लाउडवर यशस्वीरित्या सिंक झाला!`
                              : `✓ Synced ${count} recent weeks of ${marketInfo.name.en} to Firebase Cloud!`
                          );
                        } catch (err: any) {
                          setSaveError(err?.message || 'Cloud sync failed.');
                        } finally {
                          setIsCloudSyncing(false);
                        }
                      }}
                      className="w-full min-h-[40px] py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-slate-700 transition-colors"
                    >
                      <Cloud className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isCloudSyncing
                          ? isMr
                            ? 'सिंक होत आहे...'
                            : 'Syncing...'
                          : isMr
                          ? `फक्त ${marketInfo.name.mr} चा चार्ट सिंक करा (१६ आठवडे)`
                          : `Sync Only ${marketInfo.name.en} Chart (16 Weeks)`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
