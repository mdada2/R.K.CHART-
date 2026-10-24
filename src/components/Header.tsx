import React from 'react';
import {
  Sparkles,
  BookOpen,
  BarChart3,
  Calculator,
  ShieldCheck,
  Flame,
  RefreshCw,
  ExternalLink,
  Globe,
  Moon,
  Sun,
  Monitor,
  Repeat,
  BookMarked,
  LogIn,
  LogOut,
  Cloud,
} from 'lucide-react';
import { Language, MarketType, MARKETS } from '../types';
import { Theme } from '../App';
import { PWAInstallButton } from './PWAInstallButton';
import { useFirebaseApp } from '../contexts/FirebaseContext';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  market: MarketType;
  onMarketChange: (market: MarketType) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  latestDateStr: string;
  totalWeeks?: number;
  onOpenUpdateModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  market,
  onMarketChange,
  activeTab,
  onTabChange,
  latestDateStr,
  totalWeeks,
  onOpenUpdateModal,
}) => {
  const isMr = language === 'mr';
  const isNight = market === 'rajdhani_night';
  const currentMarketInfo = MARKETS[market];
  const { user, isAdmin, isSigningIn, signInWithGoogle, signOutUser, cloudChartSyncStatus } =
    useFirebaseApp();

  const navItems = [
    { id: 'predictor', label: isMr ? 'पक्के अंदाज' : 'Solid Predictor', icon: Sparkles },
    { id: 'scanner', label: isMr ? 'पॅटर्न व संगम' : 'Pattern & Sangam', icon: Repeat },
    { id: 'passbook', label: isMr ? 'माझी नोंदवही' : 'My Passbook', icon: BookMarked },
    {
      id: 'chart',
      label: isMr ? (isNight ? 'राजधानी चार्ट' : 'कल्याण चार्ट') : isNight ? 'Rajdhani Chart' : 'Kalyan Chart',
      icon: BarChart3,
    },
    { id: 'calculators', label: isMr ? 'अंक गणित टूल्स' : 'Math Calculators', icon: Calculator },
    { id: 'analytics', label: isMr ? 'वारंवारता सांख्यिकी' : 'Frequency Analytics', icon: Flame },
    { id: 'backtest', label: isMr ? 'बॅकटेस्ट लॅब' : 'Backtest Lab', icon: ShieldCheck },
    { id: 'guide', label: isMr ? 'मार्गदर्शक व नियम' : 'Study Guide', icon: BookOpen },
  ];

  return (
    <header className="border-b border-slate-200/20 dark:border-slate-800 bg-[var(--background)]/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg font-bold text-xl transition-all shrink-0 ${
              isNight
                ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-800 text-white shadow-indigo-500/20'
                : 'bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {isNight ? 'रा' : 'क'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white">
                {isMr
                  ? isNight
                    ? 'राजधानी नाईट अंक गणित & चार्ट'
                    : 'कल्याण अंक गणित & जोडी चार्ट'
                  : isNight
                  ? 'Rajdhani Night Ganit & Chart'
                  : 'Kalyan Ank Ganit & Jodi Chart'}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              <span className={isNight ? 'text-indigo-400 font-medium' : 'text-amber-400 font-medium'}>
                {currentMarketInfo.tagline[language]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {totalWeeks || (isNight ? 535 : 273)} {isMr ? 'आठवडे' : 'Weeks'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="hidden sm:inline font-mono tabular-nums">
                {isMr ? 'सक्रिय:' : 'Active:'} {latestDateStr}
              </span>
              {cloudChartSyncStatus === 'synced' && (
                <>
                  <span aria-hidden="true" className="hidden md:inline">
                    ·
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 text-emerald-400">
                    <Cloud className="w-3 h-3" />
                    <span>{isMr ? 'क्लाउड सिंक' : 'Cloud Live'}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Market Switcher (Kalyan Day vs Rajdhani Night) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => onMarketChange('kalyan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              market === 'kalyan'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
            title={isMr ? 'कल्याण (संध्याकाळी ०४:५० - ०६:५०)' : 'Kalyan (Day Market: 04:50 PM - 06:50 PM)'}
          >
            <span>{isMr ? 'कल्याण' : 'Kalyan'}</span>
            <span className="text-[10px] opacity-75 font-normal hidden sm:inline">(Day)</span>
          </button>
          <button
            type="button"
            onClick={() => onMarketChange('rajdhani_night')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              market === 'rajdhani_night'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title={
              isMr
                ? 'राजधानी नाईट (रात्री ०९:३५ - ११:४५)'
                : 'Rajdhani Night (Night Market: 09:35 PM - 11:45 PM)'
            }
          >
            <span>{isMr ? 'राजधानी नाईट' : 'Rajdhani Night'}</span>
            <span className="text-[10px] opacity-75 font-normal hidden sm:inline">(Night)</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* PWA Install Button */}
          <PWAInstallButton language={language} />

          {/* Google Sign-In / Account Control */}
          {!user ? (
            <button
              type="button"
              disabled={isSigningIn}
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 min-h-[38px] px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title={isMr ? 'क्लाउड सिंकसाठी गुगल लॉगिन करा' : 'Sign in with Google'}
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>{isSigningIn ? '...' : isMr ? 'गुगल लॉगिन' : 'Sign In'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1">
              <span className="text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                {isAdmin ? (isMr ? 'ॲडमिन' : 'Admin') : user.displayName?.split(' ')[0] || 'User'}
              </span>
              <button
                type="button"
                onClick={signOutUser}
                className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title={isMr ? 'लॉगआऊट करा' : 'Sign Out'}
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Theme Switcher */}
          <div
            className="flex items-center bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/80 shadow-inner"
            role="group"
            aria-label="Theme selector"
          >
            <button
              type="button"
              onClick={() => onThemeChange('light')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
              title={isMr ? 'लाईट मोड (Light)' : 'Light Theme'}
              aria-label="Light mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onThemeChange('dark')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-700 text-indigo-300 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-indigo-400'
              }`}
              title={isMr ? 'डार्क मोड (Dark)' : 'Dark Theme'}
              aria-label="Dark mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onThemeChange('system')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                theme === 'system'
                  ? 'bg-slate-700 text-emerald-300 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
              title={isMr ? 'सिस्टम थीम ऑटो (System Auto)' : 'System Default Theme'}
              aria-label="System theme"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Official Website External Link */}
          <a
            href="https://dpboss.tax/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 text-amber-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all whitespace-nowrap shrink-0"
            title={isMr ? 'अधिकृत निकाल वेबसाईटवर जा' : 'Go to Official Live Website'}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{isMr ? 'लाईव्ह साईट' : 'Live Site'}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Update / Fetch Result Modal Trigger */}
          {onOpenUpdateModal && (
            <button
              type="button"
              onClick={onOpenUpdateModal}
              className="flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
              title={isMr ? 'वेबवरून निकाल फेच किंवा क्लाउड अपडेट करा' : 'Fetch or update chart'}
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{isMr ? 'अपडेट / सिंक' : 'Update / Sync'}</span>
              <span className="sm:hidden">{isMr ? 'अपडेट' : 'Update'}</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => onLanguageChange('mr')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                isMr ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                !isMr ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none py-1 border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 min-h-[40px] px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
