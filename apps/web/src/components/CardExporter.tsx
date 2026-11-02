import React, { useState } from 'react';
import { X, Download, Sparkles } from 'lucide-react';
import { BingoCard, Participant } from '../types/bingo.js';

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

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1241;
      canvas.height = 1754;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const baseImg = new Image();
      baseImg.crossOrigin = 'anonymous';
      baseImg.src = '/assets/bingo_card_a4_template.png';

      await new Promise((resolve, reject) => {
        baseImg.onload = resolve;
        baseImg.onerror = reject;
      });

      // 1. Draw base A4 template
      ctx.drawImage(baseImg, 0, 0, 1241, 1754);

      // 2. Tile Coordinates in template (3x3 grid)
      const boxCoords = [
        { x: 92,  y: 350, w: 320, h: 320 },
        { x: 462, y: 350, w: 320, h: 320 },
        { x: 830, y: 350, w: 320, h: 320 },
        { x: 92,  y: 720, w: 320, h: 320 },
        { x: 462, y: 720, w: 320, h: 320 }, // Center
        { x: 830, y: 720, w: 320, h: 320 },
        { x: 92,  y: 1090, w: 320, h: 320 },
        { x: 462, y: 1090, w: 320, h: 320 },
        { x: 830, y: 1090, w: 320, h: 320 }
      ];

      // 3. Draw participant photos
      for (let i = 0; i < card.tiles.length; i++) {
        const t = card.tiles[i];
        const box = boxCoords[i];
        if (t.image_url) {
          try {
            await drawPhotoIntoBox(ctx, t.image_url, box);
          } catch (e) {
            console.warn(`Failed drawing tile photo #${i}`, e);
          }
        }
      }

      // 4. Draw Header Badge
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(80, 40, 1081, 70);
      ctx.strokeStyle = '#1E1E1E';
      ctx.lineWidth = 4;
      ctx.strokeRect(80, 40, 1081, 70);

      ctx.fillStyle = '#1E1E1E';
      ctx.font = "bold 26px 'Google Sans', sans-serif";
      ctx.fillText(`Participant: ${participant.name} (${participant.email})`, 110, 84);

      ctx.fillStyle = '#1A73E8';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`ID: ${card.bingo_id}`, 860, 84);

      // 5. Draw Footer
      ctx.fillStyle = '#5F6368';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Google Cloud Community Day 2026 • Verified Card • Generated ${new Date().toLocaleDateString()}`,
        620,
        1680
      );

      // 6. Trigger Download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `GCCD_Bingo_${card.bingo_id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onClose();
    } catch (err) {
      alert('Error generating A4 download: ' + err);
    } finally {
      setIsExporting(false);
    }
  };

  const drawPhotoIntoBox = (ctx: CanvasRenderingContext2D, url: string, box: any): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        ctx.save();
        const r = 30;
        ctx.beginPath();
        ctx.moveTo(box.x + r, box.y);
        ctx.lineTo(box.x + box.w - r, box.y);
        ctx.quadraticCurveTo(box.x + box.w, box.y, box.x + box.w, box.y + r);
        ctx.lineTo(box.x + box.w, box.y + box.h - r);
        ctx.quadraticCurveTo(box.x + box.w, box.y + box.h, box.x + box.w - r, box.y + box.h);
        ctx.lineTo(box.x + r, box.y + box.h);
        ctx.quadraticCurveTo(box.x, box.y + box.h, box.x, box.y + box.h - r);
        ctx.lineTo(box.x, box.y + r);
        ctx.quadraticCurveTo(box.x, box.y, box.x + r, box.y);
        ctx.closePath();
        ctx.clip();

        // Scale & center cover
        const imgRatio = img.width / img.height;
        const boxRatio = box.w / box.h;
        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        if (imgRatio > boxRatio) {
          sWidth = img.height * boxRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / boxRatio;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, box.x, box.y, box.w, box.h);

        // Checkmark badge overlay
        ctx.fillStyle = 'rgba(32, 33, 36, 0.75)';
        ctx.fillRect(box.x + 10, box.y + box.h - 40, box.w - 20, 30);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓ Completed', box.x + box.w / 2, box.y + box.h - 19);

        ctx.restore();
        resolve();
      };
      img.onerror = () => resolve();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] border-3 border-google-dark dark:border-white/30 rounded-3xl p-6 shadow-brutal-lg relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-blue-100 border-2 border-google-dark flex items-center justify-center mx-auto mb-4 shadow-brutal text-google-blue">
          <Download className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-black text-google-dark dark:text-white mb-2">
          Download Official A4 Card
        </h3>
        <p className="text-xs text-google-grey dark:text-gray-400 mb-6">
          Generates a high-resolution 1241x1754 printable PNG poster matching the official DevFest A4 design with your photos and Bingo ID.
        </p>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting}
          className="w-full py-3.5 bg-google-blue text-white font-extrabold text-sm border-2 border-google-dark rounded-xl shadow-brutal hover:bg-blue-600 transition flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Rendering A4 Card...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Download High-Res PNG</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
