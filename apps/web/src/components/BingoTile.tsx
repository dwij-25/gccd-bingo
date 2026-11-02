import React from 'react';
import { Camera, RefreshCw, Trash2, Undo2, Sliders } from 'lucide-react';
import { BingoTile as BingoTileType } from '../types/bingo.js';

interface BingoTileProps {
  tile: BingoTileType;
  index: number;
  isFlipped: boolean;
  onToggleFlip: (index: number) => void;
  onInitiateCamera: (index: number, tileTitle: string) => void;
  onAdjustPhoto: (index: number) => void;
  onRemovePhoto: (index: number) => Promise<void>;
  uploadProgress?: number;
  isLocked: boolean;
}

const COLOR_CLASSES = [
  'bg-tile-yellow',
  'bg-tile-pink',
  'bg-tile-blue',
  'bg-tile-blue',
  'bg-white', // Center GDG Logo
  'bg-tile-green',
  'bg-tile-green',
  'bg-tile-yellow',
  'bg-tile-pink'
];

export const BingoTile: React.FC<BingoTileProps> = ({
  tile,
  index,
  isFlipped,
  onToggleFlip,
  onInitiateCamera,
  onAdjustPhoto,
  onRemovePhoto,
  uploadProgress,
  isLocked
}) => {
  const isDone = Boolean(tile.image_url && tile.image_url.trim().length > 0);
  const colorClass = COLOR_CLASSES[index] || 'bg-tile-yellow';
  const isCenter = index === 4 || Boolean(tile.isCenter);

  // Center Box is the static GDG Cloud Ahmedabad Emblem: intact & non-flippable
  if (isCenter) {
    return (
      <div
        className="relative aspect-[1/1] sm:aspect-[324/290] select-none w-full"
        aria-label="Google Developer Groups Cloud Ahmedabad Emblem"
      >
        <div className="w-full h-full rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-google-dark shadow-brutal bg-white overflow-hidden flex flex-col items-center justify-center p-2">
          <svg viewBox="0 0 100 80" className="w-14 h-14 sm:w-20 sm:h-20 select-none">
            {/* Left Bracket < */}
            <rect x="23" y="14" width="13" height="34" rx="6.5" transform="rotate(45 29.5 31)" fill="#EA4335" stroke="#202124" strokeWidth="2.5" />
            <rect x="23" y="34" width="13" height="34" rx="6.5" transform="rotate(-45 29.5 51)" fill="#4285F4" stroke="#202124" strokeWidth="2.5" />
            {/* Right Bracket > */}
            <rect x="64" y="14" width="13" height="34" rx="6.5" transform="rotate(-45 70.5 31)" fill="#34A853" stroke="#202124" strokeWidth="2.5" />
            <rect x="64" y="34" width="13" height="34" rx="6.5" transform="rotate(45 70.5 51)" fill="#FBBC04" stroke="#202124" strokeWidth="2.5" />
          </svg>
        </div>
      </div>
    );
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    onToggleFlip(index);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative aspect-[1/1] sm:aspect-[324/290] cursor-pointer select-none perspective-1000 w-full"
      role="button"
      tabIndex={0}
      aria-label={`Bingo challenge: ${tile.title}. Status: ${isDone ? 'Completed' : 'Not finished'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleFlip(index);
        }
      }}
    >
      <div
        className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* ========================================================
             FRONT FACE
             ======================================================== */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-google-dark shadow-brutal ${colorClass} overflow-hidden`}
        >
          {!isDone ? (
            /* Empty State: exactly like reference image (centered text, no dots, no headers) */
            <div className="w-full h-full flex items-center justify-center text-center px-1.5 py-2 sm:px-4">
              <span className="font-extrabold text-[11px] sm:text-sm md:text-base leading-tight text-google-dark select-none whitespace-pre-line">
                {tile.title}
              </span>
            </div>
          ) : (
            /* Uploaded State: Photo fills card + title goes UP beside green dot */
            <>
              {/* Photo Background */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-black z-0">
                <img
                  src={tile.image_url!}
                  alt={tile.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title goes UP beside the green dot */}
              <div className="absolute top-1.5 inset-x-1.5 sm:top-2 sm:inset-x-2 z-20 flex items-center justify-between gap-1 bg-white/95 backdrop-blur-xs px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl border border-google-dark/80 sm:border-2 sm:border-google-dark shadow-xs">
                <span
                  className="font-extrabold text-[9px] sm:text-[11px] leading-tight text-google-dark truncate"
                  title={tile.title}
                >
                  {tile.title}
                </span>
                <div
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-google-dark sm:border-2 bg-google-green shadow-[0_0_8px_rgba(52,168,83,0.9)] flex-shrink-0"
                  title="Completed"
                />
              </div>
            </>
          )}
        </div>

        {/* ========================================================
             BACK FACE
             ======================================================== */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-google-dark bg-white p-2 sm:p-2.5 flex flex-col justify-between shadow-brutal overflow-hidden"
        >
          {/* Top row on Back: Activity name beside signal dot + Undo Button */}
          <div className="flex items-center justify-between w-full gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-google-dark sm:border-2 flex-shrink-0 ${
                  isDone
                    ? 'bg-google-green shadow-[0_0_8px_rgba(52,168,83,0.9)]'
                    : 'bg-google-red shadow-[0_0_8px_rgba(234,67,53,0.9)]'
                }`}
              />
              <span className="font-extrabold text-[10px] sm:text-[11px] text-google-dark truncate">
                {tile.title}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFlip(index);
              }}
              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 border border-google-dark transition cursor-pointer flex-shrink-0"
              title="Flip Back"
              aria-label="Flip Back to Front"
            >
              <Undo2 className="w-3 h-3 text-google-dark" />
            </button>
          </div>

          {/* Description & Action Controls */}
          <div className="flex-1 flex flex-col justify-center items-center text-center my-0.5 px-0.5 min-h-0 overflow-hidden">
            <p className="text-[10px] sm:text-xs font-bold text-google-dark leading-tight line-clamp-2 mb-1.5 flex-shrink-0">
              {tile.description}
            </p>

            {isDone && tile.image_url ? (
              <div className="w-full flex flex-col items-center gap-1 flex-1 justify-center min-h-0">
                <div className="w-full h-8 sm:h-10 rounded-md overflow-hidden border border-google-dark bg-black flex-shrink-0">
                  <img src={tile.image_url} alt="Captured challenge" className="w-full h-full object-cover" />
                </div>
                {!isLocked && (
                  <div className="flex gap-1 w-full flex-shrink-0">
                    {/* ADJUST BUTTON */}
                    <button
                      type="button"
                      onClick={() => onAdjustPhoto(index)}
                      className="flex-1 py-1 text-[9px] font-bold bg-amber-50 text-amber-700 border border-google-dark rounded flex items-center justify-center gap-0.5 hover:bg-amber-100 transition cursor-pointer"
                      title="Adjust crop & position"
                    >
                      <Sliders className="w-2.5 h-2.5" />
                      <span>Adjust</span>
                    </button>
                    {/* RETAKE BUTTON */}
                    <button
                      type="button"
                      onClick={() => onInitiateCamera(index, tile.title)}
                      className="flex-1 py-1 text-[9px] font-bold bg-blue-50 text-google-blue border border-google-dark rounded flex items-center justify-center gap-0.5 hover:bg-blue-100 transition cursor-pointer"
                      title="Retake picture"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Retake</span>
                    </button>
                    {/* REMOVE BUTTON */}
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(index)}
                      className="p-1 text-[9px] font-bold bg-red-50 text-google-red border border-google-dark rounded flex items-center justify-center hover:bg-red-100 transition cursor-pointer"
                      title="Remove picture"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full flex-shrink-0">
                {uploadProgress ? (
                  <div className="w-full py-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden border border-google-dark">
                      <div className="bg-google-blue h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-google-blue">{uploadProgress}% saving...</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => onInitiateCamera(index, tile.title)}
                    className="w-full py-1.5 sm:py-2 px-1.5 bg-google-blue text-white text-[11px] font-black border-2 border-google-dark rounded-xl flex items-center justify-center gap-1 shadow-xs hover:bg-blue-600 active:shadow-none transition disabled:opacity-50 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Click Picture</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
