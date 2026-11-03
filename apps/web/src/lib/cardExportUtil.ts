import { BingoCard, Participant } from '../types/bingo.js';
import { TEMPLATE_SLOTS, TEMPLATE_VIEWBOX } from './templateConfig.js';

export interface CaptionOption {
  id: string;
  label: string;
  tagline: string;
  theme: string;
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
    tagline: 'Made with Community Spirit • GCCD Ahmedabad',
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
    emoji: '⚪'
  }
];

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];

export function renderGoogleColoredText(text: string): string {
  let colorIdx = 0;
  return text.split('').map((char) => {
    if (char === ' ') return ' ';
    const color = GOOGLE_COLORS[colorIdx % GOOGLE_COLORS.length];
    colorIdx++;
    return `<tspan fill="${color}">${escapeXml(char)}</tspan>`;
  }).join('');
}

export async function urlToDataUri(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      resolve('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    };
    img.src = url;
  });
}

export function buildSvgString(
  participant: Participant,
  card: BingoCard,
  captionId: string,
  assets: { template: string; photos: Record<number, string | null> }
): string {
  const { width, height } = TEMPLATE_VIEWBOX;
  const chosenCaption = PREDEFINED_CAPTIONS.find(c => c.id === captionId) || PREDEFINED_CAPTIONS[0];

  const clipPathsSvg = TEMPLATE_SLOTS.map(s => `
    <clipPath id="slot-clip-${s.index}">
      <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.radius}" ry="${s.radius}" />
    </clipPath>
  `).join('\n');

  const slotsSvg = TEMPLATE_SLOTS.map(s => {
    const tile = card.tiles?.find(t => t.tile_index === s.index);
    const photoUri = assets.photos[s.index];
    const hasPhoto = Boolean(photoUri);
    const activityTitle = tile?.title || s.title || s.label;
    const displayTitle = activityTitle.length > 27 ? activityTitle.slice(0, 25) + '…' : activityTitle;

    if (hasPhoto) {
      return `
        <!-- Slot ${s.index} Completed Photo -->
        <g clip-path="url(#slot-clip-${s.index})">
          <image href="${photoUri}" x="${s.x}" y="${s.y + 44}" width="${s.width}" height="${s.height - 44}" preserveAspectRatio="xMidYMid slice" />
          
          <!-- Top Header Bar: Solid part of the box covering the whole top region -->
          <rect x="${s.x}" y="${s.y}" width="${s.width}" height="44" fill="#FFFFFF" />
          <line x1="${s.x}" y1="${s.y + 44}" x2="${s.x + s.width}" y2="${s.y + 44}" stroke="#202124" stroke-width="3" />
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
  const rawUpperName = (participant.name || 'ATTENDEE').trim().toUpperCase();
  const pixelFontSize = Math.min(28, Math.max(16, Math.floor(820 / (rawUpperName.length + 14))));

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&amp;family=Press+Start+2P&amp;family=Silkscreen:wght@700&amp;display=swap');
        </style>
        ${clipPathsSvg}
      </defs>

      <!-- Layer 1: Background Template Base (Has authentic original orange brackets & GDG Cloud Ahmedabad BINGO title) -->
      <image href="${assets.template}" x="0" y="0" width="${width}" height="${height}" />

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
}

export async function rasterizeSvgToBlob(svgString: string, scale = 1): Promise<{ blob: Blob; dataUrl: string }> {
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

  const dataUrl = canvas.toDataURL('image/png', 0.95);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => {
      if (b) resolve(b);
      else reject(new Error('Canvas blob export failed'));
    }, 'image/png', 0.95);
  });

  return { blob, dataUrl };
}

export async function generateBingoCard(
  participant: Participant,
  card: BingoCard,
  captionId = 'google-cloud'
): Promise<{ blob: Blob; dataUrl: string; fileName: string }> {
  // Pre-load base template
  const template = await urlToDataUri('/assets/bingo_card_a4_template.png');

  // Pre-load photos
  const photos: Record<number, string | null> = {};
  for (let i = 0; i < 9; i++) {
    const tile = card.tiles?.find(t => t.tile_index === i);
    if (tile && tile.image_url) {
      photos[i] = await urlToDataUri(tile.image_url);
    } else {
      photos[i] = null;
    }
  }

  const svg = buildSvgString(participant, card, captionId, { template, photos });
  const { blob, dataUrl } = await rasterizeSvgToBlob(svg, 1);

  const cleanName = (participant.name || 'Attendee').replace(/[^a-zA-Z0-9_-]/g, '_');
  const bingoIdTag = card.bingo_id ? card.bingo_id.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Draft';
  const fileName = `GCCD-Bingo-${cleanName}-${bingoIdTag}.png`;

  return { blob, dataUrl, fileName };
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
