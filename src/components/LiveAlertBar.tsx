import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Radio, RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Language, WeekRecord, DayKey, MarketType, MARKETS } from '../types';
import { getISTDayKey } from '../utils/matkaMath';
interface LiveAlertBarProps {
  language: Language;
  history: WeekRecord[];
  market?: MarketType;
  onHistoryUpdated: (newHistory: WeekRecord[]) => void;
}
export const LiveAlertBar: React.FC<LiveAlertBarProps> = ({
  language,
  history,
  market = 'kalyan',
  onHistoryUpdated,
}) => {
  const isMr = language === 'mr';
  const isNight = market === 'rajdhani_night';
  const marketInfo = MARKETS[market];
  const [isAutoTrackOn, setIsAutoTrackOn] = useState<boolean>(false);
  const [isVoiceOn, setIsVoiceOn] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastCheckedMsg, setLastCheckedMsg] = useState<string | null>(null);
  const prevLatestCellRef = useRef<string>('');
  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  // Web Audio Pleasant Chime
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.4); // C6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch (e) {
      // AudioContext not allowed before user interaction
    }
  };
  // Web Speech Announcement
  const speakAnnouncement = (text: string) => {
    if (!isVoiceOn || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'mr-IN'; // Fallback to Hindi/Marathi
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };
  // Perform check
  const checkLiveResult = async (manual = false) => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      const todayKey = getISTDayKey();
      // Check market-specific closure:
      // For Rajdhani Night: Saturday and Sunday are closed.
      // For Kalyan: Only Sunday is closed.
      if (!todayKey || (isNight && todayKey === 'sat')) {
        setLastCheckedMsg(
          isNight
            ? (isMr
                ? 'शनिवार/रविवार: राजधानी नाईट आज बंद आहे (Market Holiday). सोमवार रात्री ०९:३५ ची प्रतीक्षा करा.'
                : 'Sat/Sun: Rajdhani Night closed today. Monday draw starts ~09:35 PM.')
            : (isMr
                ? 'रविवार: कल्याण मार्केट आज बंद आहे (Market Holiday). सोमवार संध्याकाळी ०४:५० ची प्रतीक्षा करा.'
                : 'Sunday: Kalyan Market closed today. Monday draw starts ~04:50 PM.')
        );
        return;
      }
      const res = await fetch(`/api/fetch-live?market=${market}`);
      const json = await res.json();
      if (json.isSunday || json.isMarketClosed) {
        setLastCheckedMsg(
          isNight
            ? (isMr
                ? 'राजधानी नाईट: आज सुट्टी/मार्केट बंद आहे. पुढील निकाल सोमवारी रात्री ०९:३५ नंतर येईल.'
                : 'Rajdhani Night closed today. Next draw Monday ~09:35 PM.')
            : (isMr
                ? 'कल्याण मार्केट आज बंद आहे. नवीन निकाल सोमवारी संध्याकाळी ०४:५० नंतर येईल.'
                : 'Sunday: Kalyan Market closed. Next draw Monday ~04:50 PM.')
        );
        return;
      }
      if (json.success && json.found && (json.data || json.result)) {
        const live = json.data || json.result;
        const currentHash = `${live.openPana}-${live.jodi}-${live.closePana}`;
        // Ensure we only update for the active market day
        const dayKey = (json.dayKey || live.dayKey || todayKey) as DayKey;
        // Day identified by server
        // No rejection if draw is pending for today
        // If today is Monday, verify the result is not Saturday's stale result
        if (dayKey === 'mon' && history.length >= 2) {
          const prevWeek = history[history.length - 2];
          if (
            prevWeek &&
            prevWeek.sat &&
            prevWeek.sat.jodi === live.jodi &&
            prevWeek.sat.openPana === live.openPana
          ) {
            setLastCheckedMsg(
              isMr
                ? 'वेबसाईटवर अजून शनिवारचा निकाल दिसत आहे. सोमवारचा निकाल संध्याकाळी ०४:५० नंतर जाहीर होईल.'
                : 'Old Saturday result still on website. Monday draw starts ~3:45 PM.'
            );
            return;
          }
        }
        // Check if anything changed compared to current week in history
        const latestWeek = history[history.length - 1];
        const existingCell = latestWeek ? latestWeek[dayKey] : null;
        const existingHash = existingCell ? `${existingCell.openPana}-${existingCell.jodi}-${existingCell.closePana}` : '';
        if (existingHash && currentHash !== existingHash && !currentHash.includes('***-**-***')) {
          // New result detected!
          // Call update API
          await fetch('/api/update-chart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              market,
              day: dayKey,
              openPana: live.openPana,
              jodi: live.jodi,
              closePana: live.closePana,
            }),
          });
          // Fetch fresh chart
          const histRes = await fetch(`/api/chart-history?market=${market}`);
          const histData = await histRes.json();
          if (histData.success && histData.history) {
            onHistoryUpdated(histData.history);
          }
          // Sound alert & voice
          playChime();
          const voiceMsg = isMr
            ? `कल्याणचा निकाल जाहीर झाला आहे! निकाल: ${live.openPana}, जोडी ${live.jodi}`
            : `Kalyan result declared! Jodi ${live.jodi}`;
          speakAnnouncement(voiceMsg);
          setLastCheckedMsg(isMr ? `नवीन निकाल प्राप्त: ${currentHash}` : `New result: ${currentHash}`);
        } else {
          const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          setLastCheckedMsg(
            manual
              ? (isMr ? `तपासले (${nowStr}): चालू निकाल अपडेटेड आहे.` : `Checked (${nowStr}): Result up to date.`)
              : null
          );
        }
      } else if (json.message) {
        setLastCheckedMsg(json.message);
      }
    } catch (e) {
      if (manual) {
        setLastCheckedMsg(isMr ? 'वेबसाईटशी संपर्क होऊ शकला नाही.' : 'Unable to connect to live server.');
      }
    } finally {
      setIsChecking(false);
    }
  };
  // Background timer (checks every 45 seconds if auto-tracking is on)
  useEffect(() => {
    if (!isAutoTrackOn) return;
    const interval = setInterval(() => {
      checkLiveResult(false);
    }, 45000);
    return () => clearInterval(interval);
  }, [isAutoTrackOn, history]);
  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-2.5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Clock and Schedule */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono font-semibold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentTime || 'IST'}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-slate-300">
            <span className="text-slate-500 font-normal">|</span>
            <span className="text-slate-400">{isMr ? 'ड्रॉ वेळ:' : 'Draw Times:'}</span>
            <span className="font-semibold text-white">{isMr ? `${marketInfo.openTime} (ओपन)` : (isNight ? '09:35 PM (Open)' : '04:50 PM (Open)')}</span>
            <span className="text-slate-500">·</span>
            <span className="font-semibold text-white">{isMr ? `${marketInfo.closeTime} (क्लोज)` : (isNight ? '11:45 PM (Close)' : '06:50 PM (Close)')}</span>
          </div>
        </div>
        {/* Right: Controls & Auto-Tracking Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {lastCheckedMsg && (
            <span className="text-[11px] text-emerald-400 font-medium hidden md:inline animate-fadeIn">
              {lastCheckedMsg}
            </span>
          )}
          {/* Quick Check Button */}
          <button
            onClick={() => checkLiveResult(true)}
            disabled={isChecking}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
            title={isMr ? 'आत्ता निकाल तपासा' : 'Check live result now'}
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isChecking ? (isMr ? 'तपासत आहे...' : 'Checking...') : (isMr ? 'तपासा' : 'Check')}</span>
          </button>
          {/* Voice Alert Toggle */}
          <button
            onClick={() => {
              const next = !isVoiceOn;
              setIsVoiceOn(next);
              if (next) {
                playChime();
                speakAnnouncement(isMr ? 'आवाज अलर्ट चालू झाला' : 'Voice alert active');
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              isVoiceOn
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={isMr ? 'निकाल आल्यावर मराठीत आवाज ऐकू येईल' : 'Voice announcement toggle'}
          >
            {isVoiceOn ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isVoiceOn ? (isMr ? 'आवाज: चालू' : 'Voice: On') : (isMr ? 'आवाज: बंद' : 'Mute')}</span>
          </button>
          {/* Auto-Track Live Indicator */}
          <button
            onClick={() => setIsAutoTrackOn(!isAutoTrackOn)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              isAutoTrackOn
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title={isMr ? 'दर ४५ सेकंदांनी आपोआप निकाल तपासा' : 'Auto-check every 45s'}
          >
            <Radio className={`w-3.5 h-3.5 ${isAutoTrackOn ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />
            <span>
              {isAutoTrackOn ? (isMr ? 'ऑटो-लाईव्ह: ऑन' : 'Auto-Live: On') : (isMr ? 'ऑटो-लाईव्ह: बंद' : 'Off')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};