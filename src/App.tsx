import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { LiveAlertBar } from './components/LiveAlertBar';
import { AdminFlashBulletin } from './components/AdminFlashBulletin';
import { PredictorView } from './components/PredictorView';
import { PatternScannerView } from './components/PatternScannerView';
import { PersonalPassbookView } from './components/PersonalPassbookView';
import { ChartExplorer } from './components/ChartExplorer';
import { MathCalculators } from './components/MathCalculators';
import { FrequencyAnalytics } from './components/FrequencyAnalytics';
import { BacktestingLab } from './components/BacktestingLab';
import { EducationalGuide } from './components/EducationalGuide';
import { ChartUpdateModal } from './components/ChartUpdateModal';
import { OfflineIndicator } from './components/PWAInstallButton';
import { kalyanHistory, rajdhaniNightHistory, manipurHistory } from './data/historicalData';
import { Language, MarketType, WeekRecord } from './types';
import { getEffectiveHistory } from './utils/matkaMath';
import { mergeBaseAndCloudHistory, useFirebaseApp } from './contexts/FirebaseContext';
import {
  LOCAL_STORAGE_PREFIX,
  loadLocalOverrides,
  saveLocalOverrides,
  mergeWithOverrides,
} from './utils/chartStorage';

export {
  LOCAL_STORAGE_PREFIX,
  loadLocalOverrides,
  saveLocalOverrides,
  mergeWithOverrides,
};

export type Theme = 'light' | 'dark' | 'system';

export default function App() {
  const [language, setLanguage] = useState<Language>('mr');
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('app-theme') as Theme;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {}
    return 'system';
  });
  const [market, setMarket] = useState<MarketType>('kalyan');
  const [activeTab, setActiveTab] = useState<string>('predictor');

  const { cloudKalyanWeeks, cloudRajdhaniWeeks, cloudManipurWeeks } = useFirebaseApp();

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    try {
      localStorage.setItem('app-theme', theme);
    } catch {}

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches);
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  // Base historical state per market (updated by server API or local JSON with user overrides)
  const [kalyanBaseRecords, setKalyanBaseRecords] = useState<WeekRecord[]>(() =>
    mergeWithOverrides(kalyanHistory, loadLocalOverrides('kalyan'))
  );
  const [rajdhaniBaseRecords, setRajdhaniBaseRecords] = useState<WeekRecord[]>(() =>
    mergeWithOverrides(rajdhaniNightHistory, loadLocalOverrides('rajdhani_night'))
  );
  const [manipurBaseRecords, setManipurBaseRecords] = useState<WeekRecord[]>(() =>
    mergeWithOverrides(manipurHistory, loadLocalOverrides('manipur'))
  );
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);

  // Merge real-time Firestore cloud weeks onto base history
  const kalyanRecords = useMemo(
    () => mergeBaseAndCloudHistory(kalyanBaseRecords, cloudKalyanWeeks),
    [kalyanBaseRecords, cloudKalyanWeeks]
  );
  const rajdhaniRecords = useMemo(
    () => mergeBaseAndCloudHistory(rajdhaniBaseRecords, cloudRajdhaniWeeks),
    [rajdhaniBaseRecords, cloudRajdhaniWeeks]
  );
  const manipurRecords = useMemo(
    () => mergeBaseAndCloudHistory(manipurBaseRecords, cloudManipurWeeks),
    [manipurBaseRecords, cloudManipurWeeks]
  );

  // Active history based on chosen market
  const history =
    market === 'rajdhani_night'
      ? rajdhaniRecords
      : market === 'manipur'
      ? manipurRecords
      : kalyanRecords;
  const isNight = market === 'rajdhani_night';
  const isManipur = market === 'manipur';

  // Fetch updated history from server on mount / market switch if available
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/chart-history?market=${market}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.history) && data.history.length > 0) {
          // Merge server data with user local overrides so updated/scanned weeks always take precedence
          const localOverrides = loadLocalOverrides(market);
          const mergedWithLocal = mergeWithOverrides(data.history, localOverrides);
          if (market === 'rajdhani_night') {
            setRajdhaniBaseRecords(mergedWithLocal);
          } else if (market === 'manipur') {
            setManipurBaseRecords(mergedWithLocal);
          } else {
            setKalyanBaseRecords(mergedWithLocal);
          }
        }
      })
      .catch(() => {
        // Offline / fallback to bundled + local overrides + Firestore cached data
      });
    return () => {
      isMounted = false;
    };
  }, [market]);

  const handleHistoryUpdate = (newHistory: WeekRecord[]) => {
    const baseStatic =
      market === 'rajdhani_night'
        ? rajdhaniNightHistory
        : market === 'manipur'
        ? manipurHistory
        : kalyanHistory;

    const staticMap = new Map<string, string>();
    for (const b of baseStatic) {
      staticMap.set(b.week, JSON.stringify(b));
    }

    const currentOverrides = loadLocalOverrides(market);
    let changed = false;

    // Detect modified or newly appended weeks compared to static baseline
    for (const weekItem of newHistory) {
      const staticJson = staticMap.get(weekItem.week);
      const currentJson = JSON.stringify(weekItem);
      if (!staticJson || staticJson !== currentJson) {
        currentOverrides[weekItem.week] = weekItem;
        changed = true;
      }
    }

    if (changed) {
      saveLocalOverrides(market, currentOverrides);
    }

    const finalMerged = mergeWithOverrides(newHistory, currentOverrides);

    if (market === 'rajdhani_night') {
      setRajdhaniBaseRecords(finalMerged);
    } else if (market === 'manipur') {
      setManipurBaseRecords(finalMerged);
    } else {
      setKalyanBaseRecords(finalMerged);
    }
  };

  const effectiveHistory = getEffectiveHistory(history, market);
  const effectiveLatestWeek = effectiveHistory[effectiveHistory.length - 1];
  const latestDateStr = effectiveLatestWeek ? effectiveLatestWeek.week : '26-10-26 to 01-11-26';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeChange={setTheme}
        market={market}
        onMarketChange={setMarket}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        latestDateStr={latestDateStr}
        totalWeeks={history.length}
        onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
      />

      {/* Live Draw & Audio Announcement Bar */}
      <LiveAlertBar
        language={language}
        market={market}
        history={history}
        onHistoryUpdated={handleHistoryUpdate}
      />

      {/* Admin Flash Bulletin / Real-Time Live Post */}
      <AdminFlashBulletin
        language={language}
        market={market}
      />

      {/* Main Content Body */}
      <main
        className={`flex-1 max-w-7xl w-full mx-auto ${
          activeTab === 'chart' ? 'px-0.5 sm:px-4 pt-3 sm:pt-6' : 'px-3 sm:px-6 pt-6'
        }`}
      >
        {activeTab === 'predictor' && (
          <PredictorView
            history={history}
            language={language}
            market={market}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'scanner' && (
          <PatternScannerView
            history={history}
            language={language}
            market={market}
          />
        )}

        {activeTab === 'passbook' && (
          <PersonalPassbookView
            kalyanHistory={kalyanRecords}
            rajdhaniHistory={rajdhaniRecords}
            manipurHistory={manipurRecords}
            language={language}
            activeMarket={market}
          />
        )}

        {activeTab === 'chart' && (
          <ChartExplorer
            history={effectiveHistory}
            language={language}
            market={market}
          />
        )}

        {activeTab === 'calculators' && (
          <MathCalculators
            language={language}
            history={history}
            market={market}
          />
        )}

        {activeTab === 'analytics' && (
          <FrequencyAnalytics
            history={history}
            language={language}
            market={market}
          />
        )}

        {activeTab === 'backtest' && (
          <BacktestingLab
            history={history}
            language={language}
            market={market}
          />
        )}

        {activeTab === 'guide' && (
          <EducationalGuide
            language={language}
            market={market}
          />
        )}
      </main>

      {/* Daily Result Update / Cloud Sync Modal */}
      {isUpdateModalOpen && (
        <ChartUpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          language={language}
          market={market}
          latestWeek={effectiveLatestWeek}
          history={effectiveHistory}
          kalyanHistory={getEffectiveHistory(kalyanRecords, 'kalyan')}
          rajdhaniHistory={getEffectiveHistory(rajdhaniRecords, 'rajdhani_night')}
          manipurHistory={getEffectiveHistory(manipurRecords, 'manipur')}
          onHistoryUpdated={handleHistoryUpdate}
        />
      )}

      {/* Offline Connectivity Banner */}
      <OfflineIndicator language={language} />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-400">
            <span>
              {isNight
                ? language === 'mr'
                  ? 'राजधानी नाईट अंक गणित & चार्ट अभ्यास'
                  : 'Rajdhani Night Ganit & Chart Study'
                : isManipur
                ? language === 'mr'
                  ? 'मणीपुर अंक गणित & चार्ट अभ्यास'
                  : 'Manipur Ganit & Chart Study'
                : language === 'mr'
                ? 'कल्याण अंक गणित & जोडी चार्ट अभ्यास'
                : 'Kalyan Ank Ganit & Jodi Chart Study'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Educational Pattern & Combinatorics Engine</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {history.length} {language === 'mr' ? 'आठवडे डेटा संग्रह' : 'Weeks Data Archive'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            {language === 'mr'
              ? 'केवळ शैक्षणिक आणि संख्याशास्त्रीय अभ्यासासाठी. सर्व अंदाज व विश्लेषण ऐतिहासिक पॅनल वितरणावर आधारित गणितीय मॉडेल्स आहेत.'
              : 'For educational and mathematical study only. All calculations are mathematical models based on historical panel distributions.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
