import React, { useState, useMemo } from 'react';
import {
  Flame,
  Megaphone,
  X,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Check,
} from 'lucide-react';
import { Language, MarketType, AdminBulletin, MARKETS } from '../types';
import { useFirebaseApp } from '../contexts/FirebaseContext';

interface AdminFlashBulletinProps {
  language: Language;
  market: MarketType;
}

function formatRelativeTime(ms: number, isMr: boolean): string {
  if (!ms || isNaN(ms)) return isMr ? 'काही वेळापूर्वी' : 'Recently';
  const now = Date.now();
  const diffSec = Math.floor((now - ms) / 1000);
  if (diffSec < 60) {
    return isMr ? 'आत्ताच' : 'Just now';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return isMr ? `${diffMin} मिनिटांपूर्वी` : `${diffMin}m ago`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    const d = new Date(ms);
    const timeStr = d.toLocaleTimeString(isMr ? 'mr-IN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return isMr ? `आज ${timeStr}` : `Today ${timeStr}`;
  }
  const d = new Date(ms);
  return d.toLocaleDateString(isMr ? 'mr-IN' : 'en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseNumbers(input: string): number[] {
  if (!input.trim()) return [];
  const parts = input.split(/[\s,]+/);
  const nums: number[] = [];
  for (const p of parts) {
    const clean = p.trim();
    if (/^\d$/.test(clean)) {
      const n = parseInt(clean, 10);
      if (!nums.includes(n)) nums.push(n);
    }
  }
  return nums.slice(0, 10);
}

function parseStrings(input: string, len: number): string[] {
  if (!input.trim()) return [];
  const parts = input.split(/[\s,]+/);
  const list: string[] = [];
  const regex = new RegExp(`^\\d{${len}}$`);
  for (const p of parts) {
    const clean = p.trim();
    if (regex.test(clean) && !list.includes(clean)) {
      list.push(clean);
    }
  }
  return list.slice(0, 20);
}

export const AdminFlashBulletin: React.FC<AdminFlashBulletinProps> = ({
  language,
  market,
}) => {
  const isMr = language === 'mr';
  const {
    isAdmin,
    activeBulletins,
    publishBulletin,
    deleteBulletin,
    toggleBulletinActive,
  } = useFirebaseApp();

  // Dialog states
  const [selectedBulletinForDetails, setSelectedBulletinForDetails] = useState<AdminBulletin | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState<boolean>(false);
  const [activeBulletinIndex, setActiveBulletinIndex] = useState<number>(0);

  // Form states for Admin Creator
  const [editingBulletinId, setEditingBulletinId] = useState<string | null>(null);
  const [formMarket, setFormMarket] = useState<MarketType | 'all'>(market);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formMessage, setFormMessage] = useState<string>('');
  const [formOtcInput, setFormOtcInput] = useState<string>('');
  const [formJodisInput, setFormJodisInput] = useState<string>('');
  const [formPanasInput, setFormPanasInput] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Form submission feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Bulletins relevant to current market (active only)
  const relevantBulletins = useMemo(() => {
    return activeBulletins.filter(
      (b) => b.isActive && (b.market === 'all' || b.market === market)
    );
  }, [activeBulletins, market]);

  const activeBulletin = relevantBulletins[activeBulletinIndex % Math.max(1, relevantBulletins.length)] || null;

  const resetForm = () => {
    setEditingBulletinId(null);
    setFormMarket(market);
    setFormTitle('');
    setFormMessage('');
    setFormOtcInput('');
    setFormJodisInput('');
    setFormPanasInput('');
    setFormIsActive(true);
    setStatusMessage(null);
  };

  const startEditBulletin = (bulletin: AdminBulletin) => {
    setEditingBulletinId(bulletin.id);
    setFormMarket(bulletin.market);
    setFormTitle(bulletin.title);
    setFormMessage(bulletin.message);
    setFormOtcInput(bulletin.otcDigits && bulletin.otcDigits.length > 0 ? bulletin.otcDigits.join(', ') : '');
    setFormJodisInput(bulletin.jodis && bulletin.jodis.length > 0 ? bulletin.jodis.join(', ') : '');
    setFormPanasInput(bulletin.panas && bulletin.panas.length > 0 ? bulletin.panas.join(', ') : '');
    setFormIsActive(bulletin.isActive);
    setStatusMessage(null);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setStatusMessage({
        type: 'error',
        text: isMr ? 'कृपया शीर्षक प्रविष्ट करा.' : 'Please enter a title/headline.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const otcDigits = parseNumbers(formOtcInput);
    const jodis = parseStrings(formJodisInput, 2);
    const panas = parseStrings(formPanasInput, 3);

    const success = await publishBulletin(
      {
        market: formMarket,
        title: formTitle.trim(),
        message: formMessage.trim(),
        otcDigits,
        jodis,
        panas,
        isActive: formIsActive,
      },
      editingBulletinId || undefined
    );

    setIsSubmitting(false);

    if (success) {
      setStatusMessage({
        type: 'success',
        text: isMr
          ? 'फ्लॅश पोस्ट यशस्वीरीत्या पब्लिश झाली!'
          : 'Live flash bulletin successfully published!',
      });
      setTimeout(() => {
        resetForm();
      }, 1200);
    } else {
      setStatusMessage({
        type: 'error',
        text: isMr
          ? 'पब्लिश करताना अडचण आली. कृपया पुन्हा प्रयत्न करा.'
          : 'Failed to publish. Please verify admin privileges.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    const success = await deleteBulletin(id);
    setIsSubmitting(false);
    setConfirmDeleteId(null);
    if (success && editingBulletinId === id) {
      resetForm();
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await toggleBulletinActive(id, !currentActive);
  };

  const getMarketName = (m: MarketType | 'all') => {
    if (m === 'all') return isMr ? 'सर्व मार्केट्स (All)' : 'All Markets';
    return isMr ? MARKETS[m].name.mr : MARKETS[m].name.en;
  };

  // If no bulletins and not admin, do not render anything
  if (!activeBulletin && !isAdmin) {
    return null;
  }

  return (
    <>
      {/* 1. Flash Post Top Banner */}
      {activeBulletin ? (
        <div className="w-full bg-gradient-to-r from-red-950/70 via-amber-950/60 to-red-950/70 border-y border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] relative z-20 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            {/* Left: Badge + Market + Title */}
            <div
              onClick={() => setSelectedBulletinForDetails(activeBulletin)}
              className="flex items-center flex-wrap gap-2 sm:gap-3 cursor-pointer group flex-1 min-w-[280px]"
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md shadow-red-600/30 ring-1 ring-red-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-200 opacity-90"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-300"></span>
                </span>
                <Flame className="w-3.5 h-3.5 animate-pulse text-yellow-200" />
                <span>{isMr ? '🔥 ॲडमिन लाईव्ह फ्लॅश' : '🔥 Admin Live Flash'}</span>
              </div>

              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                {getMarketName(activeBulletin.market)}
              </span>

              <div className="flex items-center gap-1.5 font-bold text-amber-100 text-sm sm:text-base group-hover:text-amber-300 transition-colors">
                <span className="line-clamp-1">{activeBulletin.title}</span>
                <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Quick VIP Highlights on Banner */}
              {activeBulletin.otcDigits && activeBulletin.otcDigits.length > 0 && (
                <div className="hidden md:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-400/30 font-mono font-bold">
                  <span>VIP OTC:</span>
                  <span className="text-amber-100">{activeBulletin.otcDigits.join(', ')}</span>
                </div>
              )}

              {activeBulletin.jodis && activeBulletin.jodis.length > 0 && (
                <div className="hidden lg:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-mono font-bold">
                  <span>{isMr ? 'जोडी:' : 'Jodi:'}</span>
                  <span className="text-emerald-100">{activeBulletin.jodis.join(', ')}</span>
                </div>
              )}

              <span className="text-[11px] text-amber-400/80 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(activeBulletin.updatedAtMs, isMr)}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {relevantBulletins.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-900/60 rounded-lg p-0.5 border border-amber-500/30 text-xs">
                  <button
                    onClick={() =>
                      setActiveBulletinIndex(
                        (prev) => (prev - 1 + relevantBulletins.length) % relevantBulletins.length
                      )
                    }
                    className="px-2 py-0.5 hover:bg-amber-500/20 text-amber-300 rounded transition-colors"
                    title={isMr ? 'मागील सूचना' : 'Previous bulletin'}
                  >
                    ‹
                  </button>
                  <span className="text-[11px] px-1 text-amber-200 font-mono font-semibold">
                    {((activeBulletinIndex % relevantBulletins.length) + 1)} / {relevantBulletins.length}
                  </span>
                  <button
                    onClick={() =>
                      setActiveBulletinIndex((prev) => (prev + 1) % relevantBulletins.length)
                    }
                    className="px-2 py-0.5 hover:bg-amber-500/20 text-amber-300 rounded transition-colors"
                    title={isMr ? 'पुढील सूचना' : 'Next bulletin'}
                  >
                    ›
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelectedBulletinForDetails(activeBulletin)}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
              >
                {isMr ? 'तपशील पहा' : 'View Details'}
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    resetForm();
                    setIsCreatorOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all font-sans"
                  title={isMr ? 'ॲडमिन फ्लॅश मॅनेजर' : 'Admin Flash Manager'}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>{isMr ? '📢 ॲडमिन फ्लॅश' : '📢 Post Flash'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Slim Admin Bar when no active bulletin exists */
        isAdmin && (
          <div className="w-full bg-slate-900/95 border-y border-amber-500/30 py-2 px-3 sm:px-6 relative z-20 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Megaphone className="w-4 h-4" />
                </span>
                <span className="font-medium text-slate-200">
                  {isMr
                    ? `📢 ॲडमिन पॅनेल: '${getMarketName(market)}' साठी सध्या कोणतीही लाईव्ह फ्लॅश पोस्ट नाही.`
                    : `📢 Admin Panel: No active live flash bulletin for '${getMarketName(market)}'.`}
                </span>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setIsCreatorOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 transition-all shadow-md shadow-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>{isMr ? '📢 ॲडमिन फ्लॅश पोस्ट करा' : '📢 Post Live Flash'}</span>
              </button>
            </div>
          </div>
        )
      )}

      {/* 2. User Detail Modal */}
      {selectedBulletinForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-[0_0_40px_rgba(245,158,11,0.25)] text-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-sm ring-1 ring-red-400/50">
                  <Flame className="w-3.5 h-3.5 text-yellow-200 animate-pulse" />
                  <span>{isMr ? '🔥 ॲडमिन लाईव्ह फ्लॅश' : '🔥 Admin Live Flash'}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    {getMarketName(selectedBulletinForDetails.market)}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(selectedBulletinForDetails.updatedAtMs, isMr)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBulletinForDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isMr ? 'बंद करा' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-200 leading-snug tracking-wide">
                {selectedBulletinForDetails.title}
              </h2>
            </div>

            {/* Message Body */}
            {selectedBulletinForDetails.message && (
              <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80 text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                {selectedBulletinForDetails.message}
              </div>
            )}

            {/* VIP OTC Digits */}
            {selectedBulletinForDetails.otcDigits && selectedBulletinForDetails.otcDigits.length > 0 && (
              <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 p-4 rounded-xl border border-amber-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{isMr ? '🎯 अचूक VIP OTC अंक (ओपन / क्लोज)' : '🎯 VIP OTC Digits (Open / Close)'}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedBulletinForDetails.otcDigits.map((digit, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-amber-500/30 ring-2 ring-amber-300"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIP Jodis */}
            {selectedBulletinForDetails.jodis && selectedBulletinForDetails.jodis.length > 0 && (
              <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 p-4 rounded-xl border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{isMr ? '⭐ स्पेशल VIP जोड्या' : '⭐ Special VIP Jodis'}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {selectedBulletinForDetails.jodis.map((jodi, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/50 text-emerald-200 font-mono font-black text-xl tracking-wider shadow-md shadow-emerald-500/10"
                    >
                      {jodi}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIP Panas */}
            {selectedBulletinForDetails.panas && selectedBulletinForDetails.panas.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 p-4 rounded-xl border border-indigo-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-black text-indigo-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>{isMr ? '✨ स्पेशल VIP पाने' : '✨ Special VIP Panas'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedBulletinForDetails.panas.map((pana, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-mono font-bold text-base shadow-sm"
                    >
                      {pana}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer & Footer */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <span className="text-[11px] text-slate-400 italic">
                {isMr
                  ? 'टीप: सदर अंदाज केवळ शैक्षणिक व मनोरंजनासाठी आहे.'
                  : 'Notice: Information provided is for educational & analytical purposes only.'}
              </span>
              <button
                onClick={() => setSelectedBulletinForDetails(null)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
              >
                {isMr ? 'बंद करा (Close)' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Admin Creator & Manager Modal */}
      {isCreatorOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl max-w-2xl w-full flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.3)] text-slate-100 max-h-[94vh] overflow-hidden">
            {/* Modal Sticky Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-950/95 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/30 shrink-0">
                  <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-black text-amber-200 truncate">
                    {isMr ? '📢 ॲडमिन फ्लॅश पोस्ट व बुलेटिन बोर्ड' : '📢 Admin Flash Post & Bulletin Board'}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                    {isMr
                      ? 'येथे पोस्ट केलेली घोषणा सर्व युजर्सना रिअल-टाइम फ्लॅश होईल.'
                      : 'Posts appear as live flash announcements to all users in real time.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatorOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form wrapping body + sticky footer */}
            <form onSubmit={handlePublish} className="flex-1 flex flex-col overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="p-3.5 sm:p-6 overflow-y-auto space-y-5 flex-1">
                {/* Existing Bulletins Management List */}
                {activeBulletins.length > 0 && (
                  <div className="space-y-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <Layers className="w-4 h-4" />
                        {isMr ? `विद्यमान फ्लॅश पोस्ट्स (${activeBulletins.length})` : `Existing Bulletins (${activeBulletins.length})`}
                      </span>
                      {editingBulletinId && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="text-xs text-amber-400 hover:underline font-semibold"
                        >
                          {isMr ? '+ नवीन पोस्ट तयार करा' : '+ Create New Post'}
                        </button>
                      )}
                    </div>

                    <div className="max-h-44 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60">
                      {activeBulletins.map((b) => (
                        <div
                          key={b.id}
                          className={`pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs ${
                            editingBulletinId === b.id ? 'bg-amber-500/10 p-2 rounded-lg' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  b.isActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {b.isActive ? (isMr ? 'सक्रिय (Live)' : 'Live') : (isMr ? 'बंद (Paused)' : 'Paused')}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-amber-300">
                                {getMarketName(b.market)}
                              </span>
                              <span className="font-bold text-slate-200 truncate max-w-[200px] sm:max-w-[280px]">
                                {b.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 block pt-0.5">
                              {formatRelativeTime(b.updatedAtMs, isMr)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(b.id, b.isActive)}
                              className={`p-1.5 rounded transition-colors ${
                                b.isActive
                                  ? 'text-emerald-400 hover:bg-emerald-500/20'
                                  : 'text-slate-400 hover:bg-slate-700'
                              }`}
                              title={b.isActive ? (isMr ? 'बंद करा' : 'Pause') : (isMr ? 'सक्रिय करा' : 'Activate')}
                            >
                              {b.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditBulletin(b)}
                              className="p-1.5 text-amber-400 hover:bg-amber-500/20 rounded transition-colors"
                              title={isMr ? 'संपादित करा' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {confirmDeleteId === b.id ? (
                              <div className="flex items-center gap-1 bg-red-950 p-1 rounded border border-red-500/40">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(b.id)}
                                  className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold"
                                >
                                  {isMr ? 'नक्की' : 'Confirm'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1 py-0.5 text-slate-400 text-[10px]"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(b.id)}
                                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                title={isMr ? 'हटवा' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Creator / Editor Fields */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      {editingBulletinId
                        ? isMr ? '✏️ पोस्ट संपादित करा' : '✏️ Edit Bulletin'
                        : isMr ? '✍️ नवीन फ्लॅश पोस्ट तयार करा' : '✍️ Create New Flash Post'}
                    </span>
                    {editingBulletinId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        {isMr ? 'रद्द करा (Cancel)' : 'Cancel'}
                      </button>
                    )}
                  </div>

              {/* Market Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {isMr ? 'मार्केट निवडा (Select Market)' : 'Select Market'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['all', 'kalyan', 'rajdhani_night', 'manipur'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormMarket(m)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        formMarket === m
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {getMarketName(m)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Headline */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {isMr ? 'शीर्षक / हेडलाईन * (Title / Headline)' : 'Title / Headline *'}
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={
                    isMr
                      ? 'उदा. 🔥 आजचे व्हीआयपी ओटीसी व स्पेशल जोडी ४६...'
                      : 'e.g. 🔥 Today VIP OTC & Special Jodi 46...'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {isMr ? 'सविस्तर मेसेज (Detailed Message)' : 'Detailed Message'}
                </label>
                <textarea
                  rows={3}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder={
                    isMr
                      ? 'घोषणा, लाईन विश्लेषण किंवा महत्त्वाच्या सूचना येथे लिहा...'
                      : 'Write your announcement, line logic, or tips here...'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium leading-relaxed"
                />
              </div>

              {/* VIP OTC, Jodis, Panas inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* VIP OTC */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-amber-300">
                    {isMr ? 'VIP OTC अंक' : 'VIP OTC Digits'}
                  </label>
                  <input
                    type="text"
                    value={formOtcInput}
                    onChange={(e) => setFormOtcInput(e.target.value)}
                    placeholder="4, 9, 2, 7"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-amber-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500">
                    {isMr ? 'उदा. 4, 9, 2' : 'e.g. 4, 9, 2'}
                  </span>
                </div>

                {/* VIP Jodis */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-emerald-300">
                    {isMr ? 'VIP जोड्या' : 'VIP Jodis'}
                  </label>
                  <input
                    type="text"
                    value={formJodisInput}
                    onChange={(e) => setFormJodisInput(e.target.value)}
                    placeholder="46, 91"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-emerald-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-[10px] text-slate-500">
                    {isMr ? 'उदा. 46, 91' : 'e.g. 46, 91'}
                  </span>
                </div>

                {/* VIP Panas */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-indigo-300">
                    {isMr ? 'VIP पाने' : 'VIP Panas'}
                  </label>
                  <input
                    type="text"
                    value={formPanasInput}
                    onChange={(e) => setFormPanasInput(e.target.value)}
                    placeholder="149, 268"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-indigo-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-400"
                  />
                  <span className="text-[10px] text-slate-500">
                    {isMr ? 'उदा. 149, 268' : 'e.g. 149, 268'}
                  </span>
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200 block">
                    {isMr ? 'लाईव्ह स्टेटस (Live Status)' : 'Live Status'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {isMr
                      ? 'सक्रिय असल्यास सर्व युजर्सना लगेच स्क्रीनवर दिसेल.'
                      : 'When active, flashes instantly on all user dashboards.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    formIsActive ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="bg-slate-950 w-4 h-4 rounded-full shadow-md"></span>
                </button>
              </div>

              {/* Status feedback */}
              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-red-950 text-red-300 border border-red-500/40'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-800 bg-slate-950/95 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreatorOpen(false)}
                  className="px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  {isMr ? 'रद्द करा' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? isMr ? 'पब्लिश होत आहे...' : 'Publishing...'
                      : editingBulletinId
                      ? isMr ? 'बदल सेव्ह करा' : 'Save Changes'
                      : isMr ? '🚀 लाईव्ह फ्लॅश पब्लिश करा' : '🚀 Publish Live Flash'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
