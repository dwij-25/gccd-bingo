import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { BingoCard, Participant } from '../types/bingo.js';
import {
  PREDEFINED_CAPTIONS,
  buildSvgString,
  rasterizeSvgToBlob,
  urlToDataUri
} from '../lib/cardExportUtil.js';

interface CardExporterProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant;
  card: BingoCard;
}

export const CardExporter: React.FC<CardExporterProps> = ({
  isOpen,
  onClose,
  participant,
  card
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [selectedCaptionId, setSelectedCaptionId] = useState<string>('google-cloud');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);

  // Cached assets for instant preview re-rendering
  const cachedAssetsRef = useRef<{
    template: string;
    photos: Record<number, string | null>;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent;
      const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
      setIsIosSafari(isIos && isSafari);
    }
  }, []);

  // Pre-load all assets and render preview
  useEffect(() => {
    let isCancelled = false;

    const loadAndRenderPreview = async () => {
      try {
        if (!cachedAssetsRef.current) {
          setIsLoadingPreview(true);
          const template = await urlToDataUri('/assets/bingo_card_a4_template.png');

          const photos: Record<number, string | null> = {};
          for (let i = 0; i < 9; i++) {
            const tile = card.tiles?.find(t => t.tile_index === i);
            if (tile && tile.image_url) {
              photos[i] = await urlToDataUri(tile.image_url);
            } else {
              photos[i] = null;
            }
          }

          cachedAssetsRef.current = { template, photos };
        }

        if (isCancelled) return;

        const svgString = buildSvgString(
          participant,
          card,
          selectedCaptionId,
          cachedAssetsRef.current
        );
        const { dataUrl } = await rasterizeSvgToBlob(svgString, 1);

        if (!isCancelled) {
          setPreviewDataUrl(dataUrl);
          setIsLoadingPreview(false);
        }
      } catch (err) {
        console.error('Failed to generate preview card image:', err);
        if (!isCancelled) setIsLoadingPreview(false);
      }
    };

    if (isOpen) {
      loadAndRenderPreview();
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen, selectedCaptionId, card, participant]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cachedAssetsRef.current) return;
    setIsExporting(true);

    try {
      const svgString = buildSvgString(
        participant,
        card,
        selectedCaptionId,
        cachedAssetsRef.current
      );
      // High-res 2x (300 DPI equivalent) export
      const { blob, dataUrl } = await rasterizeSvgToBlob(svgString, 2);

      const cleanName = (participant.name || 'Attendee').replace(/[^a-zA-Z0-9_-]/g, '_');
      const bingoIdTag = card.bingo_id ? card.bingo_id.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Draft';
      const fileName = `GCCD-Bingo-${cleanName}-${bingoIdTag}.png`;

      const file = new File([blob], fileName, { type: 'image/png' });

      // 1. Mobile Web Share API
      if (typeof navigator !== 'undefined' && (navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
        try {
          await (navigator as any).share({
            files: [file],
            title: `GCCD Bingo Card — ${participant.name}`,
            text: `Here is my completed Google Cloud Community Day Bingo Card!`
          });
          return;
        } catch {
          // Fallback to direct anchor download
        }
      }

      // 2. iOS Safari Fallback: open image in new tab with instructions
      if (isIosSafari) {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>GCCD Bingo — ${participant.name}</title></head>
              <body style="margin:0; background:#121212; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:sans-serif; color:white;">
                <p style="padding:12px; background:#4285F4; border-radius:12px; font-weight:bold; font-size:14px; margin:16px;">
                  👉 Long-press the image below and select <strong>"Save to Photos"</strong>.
                </p>
                <img src="${dataUrl}" style="max-width:95vw; height:auto; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.5);" />
              </body>
            </html>
          `);
          return;
        }
      }

      // 3. Desktop / Standard Download Anchor
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Failed to generate Bingo Card PNG: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="w-full h-full sm:h-auto sm:max-w-lg bg-white border-0 sm:border-3 sm:border-google-dark rounded-none sm:rounded-3xl p-4 sm:p-6 shadow-none sm:shadow-brutal-lg relative overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-google-dark" />
        </button>

        <div className="text-center mb-3">
          <h3 className="text-xl sm:text-2xl font-black text-google-dark">
            Download Bingo A4 Card
          </h3>
        </div>

        {/* The Exact Card Image that will be downloaded */}
        <div className="w-full flex items-center justify-center mb-4">
          {isLoadingPreview || !previewDataUrl ? (
            <div className="w-full h-72 sm:h-80 bg-gray-50 border-3 border-google-dark rounded-2xl flex flex-col items-center justify-center gap-2.5 shadow-brutal">
              <div className="w-8 h-8 border-3 border-google-blue border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-google-grey">Rendering Card...</span>
            </div>
          ) : (
            <img
              src={previewDataUrl}
              alt="Bingo Card Preview"
              className="w-auto max-h-[380px] sm:max-h-[420px] object-contain rounded-2xl border-3 border-google-dark shadow-brutal select-none"
            />
          )}
        </div>

        {/* Tagline Selector */}
        <div className="mb-4">
          <label className="block text-xs font-black text-google-dark mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-google-yellow fill-google-yellow" />
            <span>Select Tagline:</span>
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {PREDEFINED_CAPTIONS.map((cap) => {
              const isSelected = selectedCaptionId === cap.id;
              return (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => setSelectedCaptionId(cap.id)}
                  className={`w-full text-left p-2 rounded-xl border-2 transition flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'border-google-dark bg-blue-50 shadow-xs ring-1 ring-google-dark'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">{cap.emoji}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-google-dark truncate">
                        {cap.tagline || '(No Tagline)'}
                      </div>
                      <div className="text-[10px] text-google-grey font-medium">
                        {cap.label}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-google-green flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting || isLoadingPreview}
          className="w-full py-3.5 bg-google-blue text-white font-extrabold text-sm sm:text-base border-2 border-google-dark rounded-xl flex items-center justify-center gap-2 shadow-brutal hover:bg-blue-600 active:shadow-none transition disabled:opacity-60 cursor-pointer"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating High-Res A4 PNG...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Bingo A4 Card (PNG)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
