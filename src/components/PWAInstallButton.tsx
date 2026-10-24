import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { Language } from '../types';

export const PWAInstallButton: React.FC<{ language: Language }> = ({ language }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const isMr = language === 'mr';

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        title={isMr ? 'मोबाईल होम-स्क्रीनवर ॲप इन्स्टॉल करा' : 'Install App to Home Screen'}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{isMr ? 'ॲप इन्स्टॉल करा' : 'Install App'}</span>
      </button>
    );
  }

  // Always offer guided install button on iOS or browsers where beforeinstallprompt hasn't fired yet (e.g. iframe preview)
  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-1.5 min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-emerald-300 hover:text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        title={isMr ? 'मोबाईल होम-स्क्रीनवर इन्स्टॉल मार्गदर्शक' : 'Home Screen App Install Guide'}
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
        <span className="hidden sm:inline">{isMr ? 'होम-स्क्रीन ॲप' : 'Install App'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isMr ? 'मोबाईलवर ॲप म्हणून इन्स्टॉल करा' : 'Install on Mobile Home Screen'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isMr ? 'ऑफलाईन चार्ट आणि जलद वापरासाठी' : 'Works offline with full chart archive'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <Share className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <span>
                    {isMr
                      ? '१. Safari ब्राउझरमध्ये खालील "Share" बटणावर टॅप करा.'
                      : '1. Tap the Share button in your Safari toolbar.'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <PlusSquare className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>
                    {isMr
                      ? '२. खाली स्क्रोल करा आणि "Add to Home Screen" निवडा.'
                      : '2. Scroll down and select "Add to Home Screen".'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  {isMr
                    ? '१. मोबाईल Chrome ब्राउझरमध्ये हे ॲप स्वतंत्र टॅबमध्ये उघडा.'
                    : '1. Open this app URL directly in mobile Chrome or Edge.'}
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  {isMr
                    ? '२. वरच्या कोपऱ्यातील ३ टिंबांवर (⋮) टॅप करून "Install App" किंवा "Add to Home screen" निवडा.'
                    : '2. Tap the browser menu (⋮) and choose "Install App" or "Add to Home screen".'}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
            >
              {isMr ? 'समजले, बंद करा' : 'Got It'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC<{ language: Language }> = ({ language }) => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg">
      <span>
        {language === 'mr'
          ? 'ऑफलाईन मोड — सेव्ह केलेला चार्ट वापरला जात आहे'
          : 'Offline Mode — Using cached chart archive'}
      </span>
    </div>
  );
};
