import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LiveAlertBar } from './components/LiveAlertBar';
import { PredictorView } from './components/PredictorView';
import { ChartExplorer } from './components/ChartExplorer';
import { MathCalculators } from './components/MathCalculators';
import { FrequencyAnalytics } from './components/FrequencyAnalytics';
import { BacktestingLab } from './components/BacktestingLab';
import { EducationalGuide } from './components/EducationalGuide';
import { ChartUpdateModal } from './components/ChartUpdateModal';
import { kalyanHistory, rajdhaniNightHistory } from './data/historicalData';
import { Language, MarketType, WeekRecord, MARKETS } from './types';

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

  
  // Separate historical state for each market so updates stay preserved
  const [kalyanRecords, setKalyanRecords] = useState<WeekRecord[]>(kalyanHistory);
  const [rajdhaniRecords, setRajdhaniRecords] = useState<WeekRecord[]>(rajdhaniNightHistory);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);

  // Active history based on chosen market
  const history = market === 'rajdhani_night' ? rajdhaniRecords : kalyanRecords;
  const isNight = market === 'rajdhani_night';
  const currentMarketInfo = MARKETS[market];

  // Fetch updated history from server on mount / market switch if available
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/chart-history?market=${market}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.history) && data.history.length > 0) {
          if (market === 'rajdhani_night') {
            setRajdhaniRecords(data.history);
          } else {
            setKalyanRecords(data.history);
          }
        }
      })
      .catch(() => {
        // Fallback to local imported JSON data
      });
    return () => {
      isMounted = false;
    };
  }, [market]);

  const handleHistoryUpdate = (newHistory: WeekRecord[]) => {
    if (market === 'rajdhani_night') {
      setRajdhaniRecords(newHistory);
    } else {
      setKalyanRecords(newHistory);
    }
  };

  const latestDateStr = history.length > 0 ? history[history.length - 1].week : '19-10-26 to 25-10-26';

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

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'predictor' && (
          <PredictorView
            history={history}
            language={language}
            market={market}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'chart' && (
          <ChartExplorer
            history={history}
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

      {/* Daily Result Update / Fetch Modal */}
      {isUpdateModalOpen && (
        <ChartUpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          language={language}
          market={market}
          latestWeek={history[history.length - 1]}
          onHistoryUpdated={handleHistoryUpdate}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-400">
            <span>{isNight ? (language === 'mr' ? 'राजधानी नाईट अंक गणित & चार्ट अभ्यास' : 'Rajdhani Night Ganit & Chart Study') : (language === 'mr' ? 'कल्याण अंक गणित & जोडी चार्ट अभ्यास' : 'Kalyan Ank Ganit & Jodi Chart Study')}</span>
            <span aria-hidden="true">·</span>
            <span>Educational Pattern & Combinatorics Engine</span>
            <span aria-hidden="true">·</span>
            <span>{history.length} {language === 'mr' ? 'आठवडे डेटा संग्रह' : 'Weeks Data Archive'}</span>
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
