import React, { useState } from 'react';
import { X, Download, Share2, Sparkles, CheckCircle2 } from 'lucide-react';
import { BingoCard, Participant } from '../types/bingo.js';
import { TEMPLATE_SLOTS, TEMPLATE_VIEWBOX } from '../lib/templateConfig.js';

interface CardExporterProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant;
  card: BingoCard;
}

// Convert any image URL (local asset, relative path, or external) to a Data URI
async function urlToDataUri(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context error'));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      // Return 1x1 transparent if fails
      resolve('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    };
    img.src = url;
  });
}

export const CardExporter: React.FC<CardExporterProps> = ({
  isOpen,
  onClose,
  participant,
  card
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isIosSafari, setIsIosSafari] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent;
      const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
      setIsIosSafari(isIos && isSafari);
    }
  }, []);

  if (!isOpen) return null;

  const generateCardPng = async (): Promise<{ blob: Blob; dataUrl: string }> => {
    // 1. Convert base template to data URI
    const templateDataUri = await urlToDataUri('/assets/bingo_card_a4_template.png');

    // 2. Convert all tile images to data URIs
    const photoDataUris: Record<number, string | null> = {};
    for (let i = 0; i < 9; i++) {
      const tile = card.tiles.find(t => t.tile_index === i);
      if (tile && tile.image_url) {
        photoDataUris[i] = await urlToDataUri(tile.image_url);
      } else {
        photoDataUris[i] = null;
      }
    }

    // 3. Build SVG Document
    const { width, height } = TEMPLATE_VIEWBOX;

    // Define clip paths for each slot
    const clipPathsSvg = TEMPLATE_SLOTS.map(s => `
      <clipPath id="slot-clip-${s.index}">
        <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.radius}" ry="${s.radius}" />
      </clipPath>
    `).join('\n');

    // Render layers for each slot
    const slotsSvg = TEMPLATE_SLOTS.map(s => {
      const photoUri = photoDataUris[s.index];
      const hasPhoto = Boolean(photoUri);

      if (hasPhoto) {
        return `
          <!-- Slot ${s.index} Completed Photo -->
          <g clip-path="url(#slot-clip-${s.index})">
            <image href="${photoUri}" x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" preserveAspectRatio="xMidYMid slice" />
            
            <!-- Bottom Status Label Strip INSIDE Slot -->
            <rect x="${s.x}" y="${s.y + s.height - 38}" width="${s.width}" height="38" fill="#1E1E1E" fill-opacity="0.85" />
            <text x="${s.x + s.width / 2}" y="${s.y + s.height - 14}" fill="#34A853" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="16" text-anchor="middle">✓ Completed</text>
          </g>
          <!-- Border around slot -->
          <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.radius}" ry="${s.radius}" fill="none" stroke="#202124" stroke-width="4" />
        `;
      } else {
        return `
          <!-- Slot ${s.index} Empty Draft -->
          <g clip-path="url(#slot-clip-${s.index})">
            <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="${s.color}" />
            <text x="${s.x + s.width / 2}" y="${s.y + s.height / 2 - 10}" fill="#202124" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="800" font-size="15" text-anchor="middle">${s.label}</text>
            
            <!-- Bottom Status Label Strip -->
            <rect x="${s.x}" y="${s.y + s.height - 38}" width="${s.width}" height="38" fill="#1E1E1E" fill-opacity="0.75" />
            <text x="${s.x + s.width / 2}" y="${s.y + s.height - 14}" fill="#EA4335" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="800" font-size="15" text-anchor="middle">● Not finished</text>
          </g>
          <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.radius}" ry="${s.radius}" fill="none" stroke="#202124" stroke-width="4" />
        `;
      }
    }).join('\n');

    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <defs>
          ${clipPathsSvg}
        </defs>

        <!-- Layer 1: Background Template (Logo, Header, Structure) -->
        <image href="${templateDataUri}" x="0" y="0" width="${width}" height="${height}" />

        <!-- Layer 2 & 3: 9 Slots (Strictly bounded and clipped) -->
        ${slotsSvg}

        <!-- Layer 4: Top Header Participant Ribbon -->
        <g>
          <rect x="60" y="30" width="1121" height="68" rx="14" ry="14" fill="#FFFFFF" stroke="#202124" stroke-width="4" />
          <text x="88" y="73" fill="#202124" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="24">Participant: ${participant.name} (${participant.email})</text>
          <text x="1150" y="73" fill="#1A73E8" font-family="monospace, monospace" font-weight="900" font-size="24" text-anchor="end">ID: ${card.bingo_id}</text>
        </g>

        <!-- Layer 5: Footer Text -->
        <text x="620" y="1710" fill="#5F6368" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="600" font-size="16" text-anchor="middle">Google Cloud Community Day 2026 • Verified Card • Generated ${new Date().toLocaleDateString()}</text>
      </svg>
    `;

    // 4. Rasterize SVG to Canvas at 2x Scale (2482 x 3508)
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas 2d context');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const svgImg = new Image();
    await new Promise((resolve, reject) => {
      svgImg.onload = resolve;
      svgImg.onerror = reject;
      svgImg.src = svgUrl;
    });

    ctx.drawImage(svgImg, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(svgUrl);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Failed to generate PNG blob'));
        const dataUrl = canvas.toDataURL('image/png');
        resolve({ blob, dataUrl });
      }, 'image/png');
    });
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const { blob, dataUrl } = await generateCardPng();
      setPreviewUri(dataUrl);

      const fileName = `GCCD_Bingo_${card.bingo_id}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // 1. Mobile Web Share API
      if (typeof navigator !== 'undefined' && (navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
        try {
          await (navigator as any).share({
            files: [file],
            title: `GCCD Bingo Card — ${card.bingo_id}`,
            text: `Here is my completed Google Cloud Community Day Bingo Card (${card.bingo_id})!`
          });
          return;
        } catch (shareErr) {
          // User canceled or fallback to download
        }
      }

      // 2. iOS Safari Fallback: open image in new tab with instructions
      if (isIosSafari) {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>GCCD Bingo — ${card.bingo_id}</title></head>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-[#1E1E1E] border-3 border-google-dark dark:border-white/30 rounded-3xl p-6 sm:p-7 shadow-brutal-lg relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-google-dark dark:text-white" />
        </button>

        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-google-blue/10 border-2 border-google-blue mx-auto mb-3 flex items-center justify-center text-google-blue shadow-sm">
            <Download className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-google-dark dark:text-white">
            Download Official A4 Card
          </h3>
          <p className="text-xs text-google-grey dark:text-gray-400 mt-1">
            Exports a high-resolution 300 DPI A4 image (2482 × 3508 px) with your photos and official Bingo ID embedded.
          </p>
        </div>

        {/* Card Details Summary */}
        <div className="bg-gray-50 dark:bg-gray-800/60 border-2 border-google-dark dark:border-white/20 rounded-2xl p-4 mb-6 space-y-2 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-bold text-google-grey dark:text-gray-400">Participant:</span>
            <span className="font-black text-google-dark dark:text-white">{participant.name}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-bold text-google-grey dark:text-gray-400">Registered Email:</span>
            <span className="font-mono text-google-dark dark:text-gray-200">{participant.email}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-bold text-google-grey dark:text-gray-400">Official Bingo ID:</span>
            <span className="font-mono font-black text-google-blue bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded border border-google-blue">
              {card.bingo_id}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-google-grey dark:text-gray-400">Card Status:</span>
            <span className="font-extrabold uppercase text-google-green">
              {card.status} ({card.total_completed}/9 Completed)
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting}
          className="w-full py-3.5 bg-google-blue text-white font-extrabold text-sm sm:text-base border-2 border-google-dark rounded-xl flex items-center justify-center gap-2 shadow-brutal hover:bg-blue-600 active:shadow-none transition disabled:opacity-60"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating High-Res A4 PNG...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export Official A4 PNG (300 DPI)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
