import React, { useEffect, useState } from 'react';
import { Download, Image as ImageIcon, Send, X, Check } from 'lucide-react';
import {
  dataUrlToPngFile,
  PhotoCardPayload,
  renderSharePhotoCard,
} from '../utils/photoCardRenderer';

interface PhotoCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: PhotoCardPayload;
  whatsappCaption?: string;
}

export const PhotoCardModal: React.FC<PhotoCardModalProps> = ({
  isOpen,
  onClose,
  payload,
  whatsappCaption,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const isMr = payload.language === 'mr';

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setIsRendering(true);
    setShareNote(null);
    renderSharePhotoCard(payload)
      .then((url) => {
        if (active) {
          setDataUrl(url);
          setIsRendering(false);
        }
      })
      .catch(() => {
        if (active) setIsRendering(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, payload]);

  if (!isOpen) return null;

  const fileSlug = `${payload.market}-${payload.day}-${payload.weekStr.replace(/\s+/g, '_')}.png`;

  const handleDownloadPng = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileSlug;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2200);
  };

  const handleNativeImageShare = async () => {
    if (!dataUrl) return;
    try {
      const pngFile = await dataUrlToPngFile(dataUrl, fileSlug);
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };
      if (nav.share && nav.canShare && nav.canShare({ files: [pngFile] })) {
        await nav.share({
          files: [pngFile],
          title: isMr ? 'पक्के अंक व जोडी अभ्यास कार्ड' : 'Solid OTC & Jodi Card',
          text: whatsappCaption || '',
        });
        return;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }

    // Desktop / non-file-share fallback: download PNG automatically and notify user
    handleDownloadPng();
    setShareNote(
      isMr
        ? 'फोटो कार्ड डाऊनलोड झाले आहे — आता तुम्ही ते थेट WhatsApp वर पाठवू शकता.'
        : 'HD PNG card downloaded — attach it directly in WhatsApp.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isMr ? 'व्हॉट्सॲप HD फोटो कार्ड (1080×1350)' : 'WhatsApp HD Photo Card (1080×1350)'}
              </h3>
              <p className="text-xs text-slate-400">
                {isMr ? 'गॅलरीत सेव्ह करा किंवा थेट WhatsApp वर पाठवा' : 'Save HD PNG or share directly'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-2 flex items-center justify-center min-h-[320px]">
            {isRendering ? (
              <div className="text-xs text-slate-400 py-16">
                {isMr ? 'HD फोटो कार्ड तयार होत आहे...' : 'Rendering HD photo card...'}
              </div>
            ) : dataUrl ? (
              <img
                src={dataUrl}
                alt="Study Forecast Card"
                referrerPolicy="no-referrer"
                className="max-h-[54vh] w-auto rounded-lg shadow-lg object-contain"
              />
            ) : (
              <div className="text-xs text-rose-400 py-12">
                {isMr ? 'कार्ड तयार करताना अडचण आली.' : 'Unable to render photo card.'}
              </div>
            )}
          </div>

          {shareNote && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              {shareNote}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={!dataUrl}
              onClick={handleDownloadPng}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {downloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>
                {downloaded
                  ? isMr
                    ? 'PNG सेव्ह झाले!'
                    : 'PNG Saved!'
                  : isMr
                  ? 'HD फोटो सेव्ह करा (PNG)'
                  : 'Download HD PNG'}
              </span>
            </button>

            <button
              type="button"
              disabled={!dataUrl}
              onClick={handleNativeImageShare}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
              <span>{isMr ? 'WhatsApp फोटो शेअर करा' : 'Share Photo on WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
