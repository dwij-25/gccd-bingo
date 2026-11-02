import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { BingoCard, Participant } from '../types/bingo.js';
import { TEMPLATE_SLOTS, TEMPLATE_VIEWBOX } from '../lib/templateConfig.js';

interface CardExporterProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant;
  card: BingoCard;
}

export interface CaptionOption {
  id: string;
  label: string;
  tagline: string;
  theme: 'blue' | 'yellow' | 'green' | 'red' | 'rainbow' | 'none';
  bgColor: string;
  textColor: string;
  borderColor: string;
  emoji: string;
}

export const PREDEFINED_CAPTIONS: CaptionOption[] = [
  {
    id: 'google-cloud',
    label: 'Cloud Explorer',
    tagline: 'Connecting the Cloud • GCCD 2026',
    theme: 'blue',
    bgColor: '#E8F0FE',
    textColor: '#1A73E8',
    borderColor: '#4285F4',
    emoji: '☁️'
  },
  {
    id: 'bingo-champion',
    label: 'Bingo Champion',
    tagline: 'Bingo Champion • GDG Cloud Ahmedabad',
    theme: 'yellow',
    bgColor: '#FEF7E0',
    textColor: '#B06000',
    borderColor: '#FBBC04',
    emoji: '🏆'
  },
  {
    id: 'innovate-learn',
    label: 'Innovator',
    tagline: 'Innovate, Build & Learn • Google Cloud',
    theme: 'green',
    bgColor: '#E6F4EA',
    textColor: '#137333',
    borderColor: '#34A853',
    emoji: '💡'
  },
  {
    id: 'community-spirit',
    label: 'Community Spirit',
    tagline: 'Made with Community Spirit • DevFest',
    theme: 'red',
    bgColor: '#FCE8E6',
    textColor: '#C5221F',
    borderColor: '#EA4335',
    emoji: '❤️'
  },
  {
    id: 'mission-accomplished',
    label: 'Mission Accomplished',
    tagline: '8 Challenges Crushed • Mission Accomplished!',
    theme: 'rainbow',
    bgColor: '#F8F9FA',
    textColor: '#202124',
    borderColor: '#202124',
    emoji: '🎉'
  },
  {
    id: 'none',
    label: 'No Tagline',
    tagline: '',
    theme: 'none',
    bgColor: '#FFFFFF',
    textColor: '#5F6368',
    borderColor: '#DADCE0',
    emoji: '🚫'
  }
];

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Renders text with letters cycling through the 4 iconic Google colors
function renderGoogleColoredText(text: string): string {
  const colors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];
  let colorIndex = 0;
  return text.split('').map(char => {
    if (char === ' ') {
      return '<tspan> </tspan>';
    }
    const color = colors[colorIndex % colors.length];
    colorIndex++;
    return `<tspan fill="${color}">${escapeXml(char)}</tspan>`;
  }).join('');
}

// Convert any image URL to a Data URI
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
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [selectedCaptionId, setSelectedCaptionId] = useState<string>('google-cloud');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);

  // Cached data URIs for instant preview regeneration
  const cachedAssetsRef = useRef<{
    template: string;
    leftBracket: string;
    rightBracket: string;
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

  // Build the complete SVG Document string
  const buildSvgString = (
    captionId: string,
    assets: { template: string; leftBracket: string; rightBracket: string; photos: Record<number, string | null> }
  ): string => {
    const { width, height } = TEMPLATE_VIEWBOX;
    const chosenCaption = PREDEFINED_CAPTIONS.find(c => c.id === captionId) || PREDEFINED_CAPTIONS[0];

    const clipPathsSvg = TEMPLATE_SLOTS.map(s => `
      <clipPath id="slot-clip-${s.index}">
        <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.radius}" ry="${s.radius}" />
      </clipPath>
    `).join('\n');

    const slotsSvg = TEMPLATE_SLOTS.map(s => {
      const tile = card.tiles.find(t => t.tile_index === s.index);
      const photoUri = assets.photos[s.index];
      const hasPhoto = Boolean(photoUri);
      const activityTitle = tile?.title || s.title || s.label;
      const displayTitle = activityTitle.length > 27 ? activityTitle.slice(0, 25) + '…' : activityTitle;

      if (hasPhoto) {
        return `
          <!-- Slot ${s.index} Completed Photo -->
          <g clip-path="url(#slot-clip-${s.index})">
            <image href="${photoUri}" x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" preserveAspectRatio="xMidYMid slice" />
            
            <!-- Top Header Bar: Activity name beside green dot -->
            <rect x="${s.x}" y="${s.y}" width="${s.width}" height="44" fill="#FFFFFF" fill-opacity="0.94" />
            <line x1="${s.x}" y1="${s.y + 44}" x2="${s.x + s.width}" y2="${s.y + 44}" stroke="#202124" stroke-width="2" />
            <text x="${s.x + 14}" y="${s.y + 28}" fill="#202124" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="15">${escapeXml(displayTitle)}</text>
            <circle cx="${s.x + s.width - 22}" cy="${s.y + 22}" r="9" fill="#34A853" stroke="#202124" stroke-width="2.5" />
          </g>
          <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.radius}" ry="${s.radius}" fill="none" stroke="#202124" stroke-width="4" />
        `;
      } else if (s.index === 4) {
        return `
          <!-- Slot 4 Center Emblem -->
          <g clip-path="url(#slot-clip-4)">
            <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="#FFFFFF" />
            <g transform="translate(${s.x + s.width / 2 - 50}, ${s.y + s.height / 2 - 40})">
              <rect x="23" y="14" width="13" height="34" rx="6.5" transform="rotate(45 29.5 31)" fill="#EA4335" stroke="#202124" stroke-width="2.5" />
              <rect x="23" y="34" width="13" height="34" rx="6.5" transform="rotate(-45 29.5 51)" fill="#4285F4" stroke="#202124" stroke-width="2.5" />
              <rect x="64" y="14" width="13" height="34" rx="6.5" transform="rotate(-45 70.5 31)" fill="#34A853" stroke="#202124" stroke-width="2.5" />
              <rect x="64" y="34" width="13" height="34" rx="6.5" transform="rotate(45 70.5 51)" fill="#FBBC04" stroke="#202124" stroke-width="2.5" />
            </g>
          </g>
          <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.radius}" ry="${s.radius}" fill="none" stroke="#202124" stroke-width="4" />
        `;
      } else {
        let line1 = '', line2 = '', line3 = '';
        if (s.index === 0) { line1 = 'Selfie with'; line2 = 'a speaker'; }
        else if (s.index === 1) { line1 = 'The full'; line2 = 'auditorium'; }
        else if (s.index === 2) { line1 = 'A slide that'; line2 = 'taught you'; line3 = 'something'; }
        else if (s.index === 3) { line1 = 'Selfie with'; line2 = 'a volunteer'; }
        else if (s.index === 5) { line1 = 'Selfie with'; line2 = 'someone'; line3 = 'new'; }
        else if (s.index === 6) { line1 = 'Photo booth'; line2 = 'or standee'; }
        else if (s.index === 7) { line1 = 'A sponsor'; line2 = 'booth'; }
        else if (s.index === 8) { line1 = 'Selfie with'; line2 = 'your badge'; }
        else { line1 = s.title; }

        const textSvg = line3 ? `
          <text x="${s.x + s.width / 2}" y="${s.y + s.height / 2 - 24}" fill="#202124" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="22" text-anchor="middle">${escapeXml(line1)}</text>
          <text x="${s.x + s.width / 2}" y="${s.y + s.height / 2 + 3}" fill="#202124" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="22" text-anchor="middle">${escapeXml(line2)}</text>
          <text x="${s.x + s.width / 2}" y="${s.y + s.height / 2 + 30}" fill="#202124" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="22" text-anchor="middle">${escapeXml(line3)}</text>
        ` : `
          <text x="${s.x + s.width / 2}" y="${s.y + s.height / 2 - 12}" fill="#202124" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="23" text-anchor="middle">${escapeXml(line1)}</text>
          <text x="${s.x + s.width / 2}" y="${s.y + s.height / 2 + 18}" fill="#202124" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="23" text-anchor="middle">${escapeXml(line2)}</text>
        `;

        return `
          <!-- Slot ${s.index} Empty Draft -->
          <g clip-path="url(#slot-clip-${s.index})">
            <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="${s.color}" />
            ${textSvg}
          </g>
          <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.radius}" ry="${s.radius}" fill="none" stroke="#202124" stroke-width="4" />
        `;
      }
    }).join('\n');

    // Selected Caption rendering in empty space below the grid (y=1636..1688)
    const hasCaption = chosenCaption.theme !== 'none' && chosenCaption.tagline.trim().length > 0;

    const captionSvg = hasCaption ? `
      <!-- Layer 4.5: Caption Badge in Empty Space below grid (y=1636..1688) -->
      <g>
        <rect x="234" y="1640" width="772" height="50" rx="25" ry="25" fill="#202124" />
        <rect x="230" y="1636" width="772" height="50" rx="25" ry="25" fill="${chosenCaption.bgColor}" stroke="#202124" stroke-width="3.5" />
        <text x="616" y="1668" fill="${chosenCaption.textColor}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="20" text-anchor="middle" letter-spacing="0.5">
          ${chosenCaption.emoji}  ${escapeXml(chosenCaption.tagline)}
        </text>
      </g>
    ` : '';

    // Pixelated Name font sizing
    const rawUpperName = participant.name.trim().toUpperCase();
    const pixelFontSize = Math.min(28, Math.max(16, Math.floor(820 / (rawUpperName.length + 14))));

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <defs>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&amp;family=Press+Start+2P&amp;family=Silkscreen:wght@700&amp;display=swap');
          </style>
          ${clipPathsSvg}
        </defs>

        <!-- Layer 1: Background Template Base -->
        <image href="${assets.template}" x="0" y="0" width="${width}" height="${height}" />

        <!-- Layer 1.5: Google Developer Groups Cloud Ahmedabad BINGO Brand Header with Orange Containers -->
        <g id="gdg-brand-header">
          <rect x="220" y="140" width="800" height="390" fill="#F0F0F0" />
          <image href="${assets.leftBracket}" x="75" y="145" width="120" height="390" preserveAspectRatio="xMidYMid meet" />
          <image href="${assets.rightBracket}" x="1046" y="145" width="120" height="390" preserveAspectRatio="xMidYMid meet" />

          <text x="620" y="248" fill="#202124" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="800" font-size="44" text-anchor="middle">Google Developer Groups</text>
          <text x="620" y="332" fill="#202124" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="64" text-anchor="middle">Cloud Ahmedabad</text>

          <rect x="400" y="380" width="440" height="106" rx="53" ry="53" fill="#FFFFFF" stroke="#202124" stroke-width="6" />
          <text x="620" y="455" fill="#202124" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="62" text-anchor="middle" letter-spacing="6">BINGO</text>
        </g>

        <!-- Layer 2 & 3: 9 Slots (Strictly bounded and clipped) -->
        ${slotsSvg}

        <!-- Layer 4: Top Header Ribbon: Participant Name in Pixelated Font & Google Colors -->
        <g id="participant-ribbon">
          <rect x="64" y="28" width="1121" height="74" rx="18" ry="18" fill="#202124" />
          <rect x="60" y="24" width="1121" height="74" rx="18" ry="18" fill="#FFFFFF" stroke="#202124" stroke-width="4.5" />
          
          <text x="620" y="70" text-anchor="middle" font-family="'Silkscreen', 'Press Start 2P', monospace" font-weight="700" font-size="${pixelFontSize}" letter-spacing="1.5">
            ${renderGoogleColoredText(rawUpperName)}'S
            <tspan fill="#202124"> BINGO CARD</tspan>
          </text>
        </g>

        <!-- Layer 4.5: Caption / Tagline Badge -->
        ${captionSvg}

        <!-- Layer 5: Footer Text -->
        <text x="620" y="1714" fill="#5F6368" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="600" font-size="16" text-anchor="middle">Google Cloud Community Day 2026</text>
      </svg>
    `;
  };

  // Rasterize SVG string to Canvas and return PNG Data URL
  const rasterizeSvgToDataUrl = async (svgString: string, scale = 1): Promise<string> => {
    const { width, height } = TEMPLATE_VIEWBOX;
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

    return canvas.toDataURL('image/png');
  };

  // Pre-load all assets and generate the actual card preview
  useEffect(() => {
    let isCancelled = false;

    const loadAndRenderPreview = async () => {
      try {
        if (!cachedAssetsRef.current) {
          setIsLoadingPreview(true);
          const [template, leftBracket, rightBracket] = await Promise.all([
            urlToDataUri('/assets/bingo_card_a4_template.png'),
            urlToDataUri('/assets/left_bracket.png'),
            urlToDataUri('/assets/right_bracket.png')
          ]);

          const photos: Record<number, string | null> = {};
          for (let i = 0; i < 9; i++) {
            const tile = card.tiles.find(t => t.tile_index === i);
            if (tile && tile.image_url) {
              photos[i] = await urlToDataUri(tile.image_url);
            } else {
              photos[i] = null;
            }
          }

          cachedAssetsRef.current = { template, leftBracket, rightBracket, photos };
        }

        if (isCancelled) return;

        const svgString = buildSvgString(selectedCaptionId, cachedAssetsRef.current);
        const dataUrl = await rasterizeSvgToDataUrl(svgString, 1);

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

  // Generate high-resolution 2x (300 DPI equivalent) PNG for download
  const handleDownload = async () => {
    if (!cachedAssetsRef.current) return;
    setIsExporting(true);

    try {
      const svgString = buildSvgString(selectedCaptionId, cachedAssetsRef.current);
      const highResDataUrl = await rasterizeSvgToDataUrl(svgString, 2);

      const fileName = `GCCD_Bingo_${participant.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;

      // Convert data URL to Blob for sharing/downloading
      const res = await fetch(highResDataUrl);
      const blob = await res.blob();
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
                <img src="${highResDataUrl}" style="max-width:95vw; height:auto; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.5);" />
              </body>
            </html>
          `);
          return;
        }
      }

      // 3. Desktop / Standard Download Anchor
      const a = document.createElement('a');
      a.href = highResDataUrl;
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
            Download Official A4 Card
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
              <span>Download A4 Card (PNG)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
