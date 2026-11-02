import React, { useState, useEffect } from 'react';
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
  Menu,
  X,
  ChevronRight,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMr = language === 'mr';
  const isNight = market === 'rajdhani_night';
  const isManipur = market === 'manipur';
  const currentMarketInfo = MARKETS[market];
  const { user, isAdmin, isSigningIn, signInWithGoogle, signOutUser, cloudChartSyncStatus } =
    useFirebaseApp();

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile drawer on resize to desktop (md breakpoint)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    { id: 'predictor', label: isMr ? 'पक्के अंदाज' : 'Solid Predictor', icon: Sparkles },
    { id: 'scanner', label: isMr ? 'पॅटर्न व संगम' : 'Pattern & Sangam', icon: Repeat },
    { id: 'passbook', label: isMr ? 'माझी नोंदवही' : 'My Passbook', icon: BookMarked },
    {
      id: 'chart',
      label: isMr
        ? isNight
          ? 'राजधानी चार्ट'
          : isManipur
          ? 'मणीपुर चार्ट'
          : 'कल्याण चार्ट'
        : isNight
        ? 'Rajdhani Chart'
        : isManipur
        ? 'Manipur Chart'
        : 'Kalyan Chart',
      icon: BarChart3,
    },
    { id: 'calculators', label: isMr ? 'अंक गणित टूल्स' : 'Math Calculators', icon: Calculator },
    { id: 'analytics', label: isMr ? 'वारंवारता सांख्यिकी' : 'Frequency Analytics', icon: Flame },
    { id: 'backtest', label: isMr ? 'बॅकटेस्ट लॅब' : 'Backtest Lab', icon: ShieldCheck },
    { id: 'guide', label: isMr ? 'मार्गदर्शक व नियम' : 'Study Guide', icon: BookOpen },
  ];

  return (
    <>
      <header className="border-b border-slate-200/20 dark:border-slate-800 bg-[var(--background)]/90 backdrop-blur-md sticky top-0 z-40">
        {/* ========================================================= */}
        {/* MOBILE TOP BAR (< md:) - As seen in Screenshot 2          */}
        {/* ========================================================= */}
        <div className="md:hidden px-3 py-2 flex items-center justify-between gap-2">
          {/* Left: Hamburger Button + Logo Badge + Title/Subtitle */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white rounded-lg active:bg-slate-200/60 dark:active:bg-slate-800 transition-colors cursor-pointer"
              aria-label={isMr ? 'मेनू उघडा' : 'Open Menu'}
            >
              <Menu className="w-6 h-6" />
            </button>

            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base shadow-sm shrink-0 ${
                isNight
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-800 text-white shadow-indigo-500/20'
                  : isManipur
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-800 text-white shadow-emerald-500/20'
                  : 'bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {isNight ? 'रा' : isManipur ? 'म' : 'क'}
            </div>

            <div className="flex flex-col min-w-0">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {isMr
                  ? isNight
                    ? 'राजधानी नाईट'
                    : isManipur
                    ? 'मणीपुर अंक गणित'
                    : 'कल्याण अंक गणित'
                  : isNight
                  ? 'Rajdhani Night'
                  : isManipur
                  ? 'Manipur Ganit'
                  : 'Kalyan Ank Ganit'}
              </h1>
              <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate">
                <span className="truncate">{navItems.find((n) => n.id === activeTab)?.label}</span>
                <span className="opacity-60">·</span>
                {cloudChartSyncStatus === 'synced' ? (
                  <span className="inline-flex items-center text-emerald-500 dark:text-emerald-400">
                    <Cloud className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="opacity-70">☁</span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Compact Market Switcher Pills + Update Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => onMarketChange('kalyan')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  market === 'kalyan'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isMr ? 'कल्याण' : 'Kalyan'}
              </button>
              <button
                type="button"
                onClick={() => onMarketChange('rajdhani_night')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  market === 'rajdhani_night'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isMr ? 'राजधानी' : 'Rajdhani'}
              </button>
              <button
                type="button"
                onClick={() => onMarketChange('manipur')}
                className={`px-1.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  market === 'manipur'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isMr ? 'मणीपुर' : 'Manipur'}
              </button>
            </div>

            {onOpenUpdateModal && (
              <button
                type="button"
                onClick={onOpenUpdateModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
                title={isMr ? 'अपडेट करा' : 'Update'}
                aria-label="Update"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP TOP BAR (>= md:) - Preserved exactly as original  */}
        {/* ========================================================= */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg font-bold text-xl transition-all shrink-0 ${
                isNight
                  ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-800 text-white shadow-indigo-500/20'
                  : isManipur
                  ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 text-white shadow-emerald-500/20'
                  : 'bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {isNight ? 'रा' : isManipur ? 'म' : 'क'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-white">
                  {isMr
                    ? isNight
                      ? 'राजधानी नाईट अंक गणित & चार्ट'
                      : isManipur
                      ? 'मणीपुर अंक गणित & चार्ट'
                      : 'कल्याण अंक गणित & जोडी चार्ट'
                    : isNight
                    ? 'Rajdhani Night Ganit & Chart'
                    : isManipur
                    ? 'Manipur Ganit & Chart'
                    : 'Kalyan Ank Ganit & Jodi Chart'}
                </h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                <span
                  className={
                    isNight
                      ? 'text-indigo-400 font-medium'
                      : isManipur
                      ? 'text-emerald-400 font-medium'
                      : 'text-amber-400 font-medium'
                  }
                >
                  {currentMarketInfo.tagline[language]}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {totalWeeks || (isNight ? 535 : isManipur ? 208 : 273)} {isMr ? 'आठवडे' : 'Weeks'}
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

          {/* Center: Market Switcher (Kalyan vs Rajdhani Night vs Manipur) */}
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
            <button
              type="button"
              onClick={() => onMarketChange('manipur')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                market === 'manipur'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={
                isMr
                  ? 'मणीपुर (दुपारी ०३:२० - ०५:२०)'
                  : 'Manipur (Day Market: 03:20 PM - 05:20 PM)'
              }
            >
              <span>{isMr ? 'मणीपुर' : 'Manipur'}</span>
              <span className="text-[10px] opacity-75 font-normal hidden sm:inline">(Day)</span>
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

        {/* ========================================================= */}
        {/* DESKTOP NAVIGATION TABS (>= md:) - Hidden on Mobile       */}
        {/* ========================================================= */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6">
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

      {/* ========================================================= */}
      {/* MOBILE DRAWER SIDEBAR - As seen in Screenshot 1           */}
      {/* ========================================================= */}
      {/* Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Sidebar Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-[84vw] max-w-xs bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col justify-between overflow-y-auto p-4 transition-transform duration-300 ease-in-out md:hidden shadow-2xl ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={isMr ? 'नेव्हिगेशन मेनू' : 'Navigation Menu'}
      >
        <div className="space-y-4">
          {/* Drawer Top Header: Logo + Title + Subtitle + Close (X) */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md shrink-0 ${
                  isNight
                    ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-800 text-white'
                    : isManipur
                    ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 text-white'
                    : 'bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950'
                }`}
              >
                {isNight ? 'रा' : isManipur ? 'म' : 'क'}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {isMr
                    ? isNight
                      ? 'राजधानी नाईट अंक गणित'
                      : isManipur
                      ? 'मणीपुर अंक गणित & चार्ट'
                      : 'कल्याण अंक गणित & चार्ट'
                    : isNight
                    ? 'Rajdhani Night & Chart'
                    : isManipur
                    ? 'Manipur Ganit & Chart'
                    : 'Kalyan Ank Ganit & Chart'}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  {totalWeeks || (isNight ? 535 : isManipur ? 208 : 273)} {isMr ? 'आठवडे' : 'Weeks'} · {latestDateStr}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label={isMr ? 'मेनू बंद करा' : 'Close Menu'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Market Selector Segmented Buttons */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onMarketChange('kalyan')}
              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                market === 'kalyan'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div>{isMr ? 'कल्याण' : 'Kalyan'}</div>
              <div className="text-[10px] font-normal opacity-75">(Day)</div>
            </button>
            <button
              type="button"
              onClick={() => onMarketChange('rajdhani_night')}
              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                market === 'rajdhani_night'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div>{isMr ? 'राजधानी' : 'Rajdhani'}</div>
              <div className="text-[10px] font-normal opacity-75">(Night)</div>
            </button>
            <button
              type="button"
              onClick={() => onMarketChange('manipur')}
              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                market === 'manipur'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div>{isMr ? 'मणीपुर' : 'Manipur'}</div>
              <div className="text-[10px] font-normal opacity-75">(Day)</div>
            </button>
          </div>

          {/* Navigation Links with Icons and Chevrons */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Bottom Actions & Settings */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
          {/* Update / Cloud Sync Action Button */}
          {onOpenUpdateModal && (
            <button
              type="button"
              onClick={() => {
                onOpenUpdateModal();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 active:scale-98 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>{isMr ? 'अपडेट / क्लाउड सिंक' : 'Update / Cloud Sync'}</span>
            </button>
          )}

          {/* Google Sign In / User Profile */}
          {!user ? (
            <button
              type="button"
              disabled={isSigningIn}
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 active:scale-98 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span>{isSigningIn ? '...' : isMr ? 'गुगल लॉगिन करा' : 'Sign in with Google'}</span>
            </button>
          ) : (
            <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {isAdmin ? (isMr ? 'ॲडमिन' : 'Admin') : user.displayName || 'User'}
              </span>
              <button
                type="button"
                onClick={signOutUser}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isMr ? 'बाहेर पडा' : 'Sign Out'}</span>
              </button>
            </div>
          )}

          {/* Mobile PWA Install */}
          <PWAInstallButton language={language} fullWidth />

          {/* Theme & Language Controls */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            {/* Theme Selector */}
            <div
              className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700"
              role="group"
              aria-label="Theme selector"
            >
              <button
                type="button"
                onClick={() => onThemeChange('light')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-amber-500'
                }`}
                title={isMr ? 'लाईट मोड' : 'Light Mode'}
                aria-label="Light mode"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onThemeChange('dark')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-indigo-300 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-indigo-400'
                }`}
                title={isMr ? 'डार्क मोड' : 'Dark Mode'}
                aria-label="Dark mode"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onThemeChange('system')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-slate-700 text-emerald-300 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
                title={isMr ? 'सिस्टम थीम' : 'System Theme'}
                aria-label="System theme"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onLanguageChange('mr')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isMr
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  !isMr
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Official Website External Link */}
          <a
            href="https://dpboss.tax/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-amber-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all"
            title={isMr ? 'अधिकृत निकाल वेबसाईटवर जा' : 'Go to Official Live Website'}
          >
            <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{isMr ? 'अधिकृत लाईव्ह साईट' : 'Official Live Site'}</span>
            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
          </a>
        </div>
      </div>
    </>
  );
};
