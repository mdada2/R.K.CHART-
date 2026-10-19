import React, { useState } from 'react';
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
  ExternalLink 
} from 'lucide-react';
import { DayKey, Language, WeekRecord, MarketType, MARKETS } from '../types';
import { DAY_NAMES, DAY_KEYS } from '../utils/matkaMath';

interface ChartUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  market?: MarketType;
  latestWeek?: WeekRecord;
  onHistoryUpdated: (newHistory: WeekRecord[]) => void;
}

export const ChartUpdateModal: React.FC<ChartUpdateModalProps> = ({
  isOpen,
  onClose,
  language,
  market = 'kalyan',
  latestWeek,
  onHistoryUpdated,
}) => {
  const isMr = language === 'mr';
  const isNight = market === 'rajdhani_night';
  const marketInfo = MARKETS[market];

  const [activeSubTab, setActiveSubTab] = useState<'auto' | 'manual'>('auto');

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
  const [selectedDay, setSelectedDay] = useState<DayKey>('thu');
  const [weekString, setWeekString] = useState<string>(latestWeek?.week || '19-10-26 to 25-10-26');
  const [openPanaInput, setOpenPanaInput] = useState<string>('258');
  const [jodiInput, setJodiInput] = useState<string>('56');
  const [closePanaInput, setClosePanaInput] = useState<string>('150');

  // Saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Handle Web Fetching
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
        setFetchMessage(isMr ? 'वेबसाईटवरून निकाल यशस्वीरित्या फेच झाला!' : 'Live result successfully fetched from website!');
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

  // Sample Simulation for testing: Open-only (3:45 PM)
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

  // Sample Simulation for testing: Full Result (6:00 PM)
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

  // Handle Save to kalyanHistorical.json
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
        setSaveSuccess(
          isMr 
            ? `✓ ${DAY_NAMES[selectedDay].mr} चा निकाल (${payload.openPana}-${payload.jodi}-${payload.closePana}) चार्टमध्ये सेव्ह झाला!`
            : `✓ Result for ${DAY_NAMES[selectedDay].en} saved to Kalyan Chart successfully!`
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{isMr ? 'दैनिक चार्ट निकाल अपडेट / फेच' : 'Update & Fetch Daily Chart Result'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isMr ? 'वेबसाइटवरून ऑटो-फेच करा किंवा १-क्लिकमध्ये मॅन्युअल अपडेट करा' : 'Auto-fetch from live result sites or manually update daily chart'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="p-3 bg-slate-950 border-b border-slate-800/80 flex gap-2">
          <button
            onClick={() => setActiveSubTab('auto')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeSubTab === 'auto'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{isMr ? '१. वेबसाईटवरून ऑटो फेच' : '1. Auto Web Fetch'}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('manual')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeSubTab === 'manual'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isMr ? '२. मॅन्युअल निकाल नोंदणी' : '2. Manual Entry'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Success Banner */}
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {saveError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{saveError}</span>
            </div>
          )}

          {/* SUBTAB 1: AUTO WEB FETCH */}
          {activeSubTab === 'auto' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="text-xs text-slate-300 font-medium flex items-center justify-between">
                  <span>{isMr ? 'निकाल वेबसाईट URL (Source Web Portal):' : 'Result Web Portal URL:'}</span>
                  <span className="text-[11px] text-amber-400 font-mono">Kalyan Live</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={fetchUrl}
                    onChange={(e) => setFetchUrl(e.target.value)}
                    placeholder="https://dpboss.services/"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                  <a
                    href={fetchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                    title={isMr ? 'मूळ निकाल वेबसाईट नवीन टॅबमध्ये उघडा' : 'Open official site in new tab'}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isMr ? 'वेबसाईट उघडा' : 'Open Site'}</span>
                  </a>
                  <button
                    onClick={handleFetchFromWeb}
                    disabled={isFetching}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                    <span>{isFetching ? (isMr ? 'फेचिंग...' : 'Fetching...') : (isMr ? 'फेच करा' : 'Fetch')}</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 gap-2">
                  <span>{isMr ? 'टीप: ओपन दुपारी ३:४५ ला व क्लोज ५:४५ - ६:०० ला येतो.' : 'Note: Open comes ~3:45 PM & Close ~5:45 - 6:00 PM.'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLoadSampleOpenOnly}
                      className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{isMr ? '३:४५ PM ओपन चाचणी (390-2-***)' : '3:45 PM Open Sample'}</span>
                    </button>
                    <span>·</span>
                    <button
                      onClick={handleLoadSampleFullResult}
                      className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isMr ? '६:०० PM पूर्ण निकाल (390-25-113)' : '6:00 PM Full Sample'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {fetchMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{fetchMessage}</span>
                </div>
              )}
              {fetchError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fetchError}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isMr 
                      ? 'वेबसाईट क्लाउडफ्लेअर किंवा ब्लॉकमुळे रिस्पॉन्स न दिल्यास, तुम्ही वरील "३:४५ PM ओपन चाचणी" किंवा "मॅन्युअल निकाल नोंदणी" टॅब वापरू शकता.' 
                      : 'If the web portal is blocked or timed out, you can use Open Sample or switch to Manual Entry.'}
                  </p>
                </div>
              )}

              {/* Fetched Preview Cards */}
              {fetchedData && (
                <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        {isMr ? 'फेच झालेला निकाल:' : 'Detected Result:'}
                      </span>
                      {isPartialResult ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {isMr ? '🕒 फक्त ओपन निकाल (क्लोज ~६:०० पर्यंत येईल)' : '🕒 Open Only (Close Pending)'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {isMr ? '🏁 पूर्ण निकाल (ओपन + क्लोज)' : '🏁 Full Result (Open + Close)'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {DAY_NAMES[selectedDay][language]}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center font-mono">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-sans">{isMr ? 'ओपन पाना' : 'Open Pana'}</div>
                      <div className="text-xl font-bold text-white mt-1">{fetchedData.openPana}</div>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-amber-500/50">
                      <div className="text-[10px] text-amber-400 font-sans">{isMr ? 'जोडी / ओपन' : 'Jodi / Open'}</div>
                      <div className="text-2xl font-black text-amber-400 mt-0.5">
                        {fetchedData.jodi.replace('*', '')}
                        {isPartialResult && <span className="text-slate-500 text-lg font-normal">_</span>}
                      </div>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-sans">{isMr ? 'क्लोज पाना' : 'Close Pana'}</div>
                      <div className="text-xl font-bold text-slate-400 mt-1">{fetchedData.closePana}</div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{isMr ? 'कोणत्या वारी सेव्ह करायचे?' : 'Save for Day:'}</span>
                      <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value as DayKey)}
                        className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 focus:outline-none"
                      >
                        {DAY_KEYS.map((d) => (
                          <option key={d} value={d}>
                            {DAY_NAMES[d][language]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => handleSaveToChart(fetchedData)}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? (isMr ? 'सेव्ह होत आहे...' : 'Saving...') : (isMr ? 'चार्टमध्ये सेव्ह करा' : 'Confirm & Save')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 2: MANUAL ENTRY FORM */}
          {activeSubTab === 'manual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Day Selection */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">
                    {isMr ? '१. वार निवडा:' : '1. Select Weekday:'}
                  </label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value as DayKey)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                  >
                    {DAY_KEYS.map((d) => (
                      <option key={d} value={d}>
                        {DAY_NAMES[d][language]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Week string */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">
                    {isMr ? '२. आठवडा तारीख:' : '2. Week Duration:'}
                  </label>
                  <input
                    type="text"
                    value={weekString}
                    onChange={(e) => setWeekString(e.target.value)}
                    placeholder="12-10-26 to 18-10-26"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Results Input */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    {isMr ? 'निकाल प्रविष्ट करा (Enter Numbers):' : 'Enter Numbers:'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenPanaInput('***');
                      setJodiInput('XX');
                      setClosePanaInput('***');
                    }}
                    className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold text-[11px] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    title={isMr ? 'हा दिवस मार्केट सुट्टी/बंद म्हणून सेट करा' : 'Mark day as Market Closed/Holiday'}
                  >
                    <span>🏖️</span>
                    <span>{isMr ? 'मार्केट बंद (XX)' : 'Market Closed (XX)'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 font-mono">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-sans">
                      {isMr ? 'ओपन पाना' : 'Open Pana'}
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={openPanaInput}
                      onChange={(e) => setOpenPanaInput(e.target.value.replace(/[^0-9*X-]/gi, '').toUpperCase())}
                      placeholder="258"
                      className="w-full text-center px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-sans">
                      {isMr ? 'जोडी (२ अंक)' : 'Jodi (2-digits)'}
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={jodiInput}
                      onChange={(e) => setJodiInput(e.target.value.replace(/[^0-9*X-]/gi, '').toUpperCase())}
                      placeholder="56"
                      className="w-full text-center px-3 py-2 bg-slate-900 border border-amber-500/50 rounded-xl text-lg font-black text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-sans">
                      {isMr ? 'क्लोज पाना' : 'Close Pana'}
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={closePanaInput}
                      onChange={(e) => setClosePanaInput(e.target.value.replace(/[^0-9*X-]/gi, '').toUpperCase())}
                      placeholder="150"
                      className="w-full text-center px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-amber-500"
                    />
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
                    ? (isMr ? 'चार्टमध्ये सेव्ह होत आहे...' : 'Saving to Kalyan Chart...') 
                    : (isMr ? 'कल्याण चार्टमध्ये सेव्ह करा' : 'Save to Kalyan Chart')}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
