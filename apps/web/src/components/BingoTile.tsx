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

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    onToggleFlip(index);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative aspect-[324/290] cursor-pointer select-none perspective-1000 w-full"
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
          className={`absolute inset-0 w-full h-full backface-hidden rounded-2xl sm:rounded-3xl border-3 border-google-dark shadow-brutal ${colorClass} overflow-hidden`}
        >
          {!isDone ? (
            /* Empty State: exactly like reference image (centered text or center emblem, no dots, no headers) */
            index === 4 ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                <svg viewBox="0 0 100 80" className="w-16 h-16 sm:w-20 sm:h-20 select-none">
                  {/* Left Bracket < */}
                  <rect x="23" y="14" width="13" height="34" rx="6.5" transform="rotate(45 29.5 31)" fill="#EA4335" stroke="#202124" strokeWidth="2.5" />
                  <rect x="23" y="34" width="13" height="34" rx="6.5" transform="rotate(-45 29.5 51)" fill="#4285F4" stroke="#202124" strokeWidth="2.5" />
                  {/* Right Bracket > */}
                  <rect x="64" y="14" width="13" height="34" rx="6.5" transform="rotate(-45 70.5 31)" fill="#34A853" stroke="#202124" strokeWidth="2.5" />
                  <rect x="64" y="34" width="13" height="34" rx="6.5" transform="rotate(45 70.5 51)" fill="#FBBC04" stroke="#202124" strokeWidth="2.5" />
                </svg>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-center px-2 py-3 sm:px-4">
                <span className="font-extrabold text-xs sm:text-sm md:text-base leading-tight text-google-dark select-none whitespace-pre-line">
                  {tile.title}
                </span>
              </div>
            )
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
              <div className="absolute top-2 inset-x-2 z-20 flex items-center justify-between gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border-2 border-google-dark shadow-xs">
                <span
                  className="font-extrabold text-[10px] sm:text-[11px] leading-tight text-google-dark truncate"
                  title={tile.title}
                >
                  {tile.title}
                </span>
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 border-google-dark bg-google-green shadow-[0_0_8px_rgba(52,168,83,0.9)] flex-shrink-0"
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
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl sm:rounded-3xl border-3 border-google-dark bg-white p-2 sm:p-2.5 flex flex-col justify-between shadow-brutal"
        >
          {/* Top row on Back: Activity name beside signal dot + Undo Button */}
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 border-google-dark flex-shrink-0 ${
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
              <Undo2 className="w-3.5 h-3.5 text-google-dark" />
            </button>
          </div>

          {/* Description & Action Controls */}
          <div className="flex-1 flex flex-col justify-center items-center text-center my-1 overflow-hidden">
            <p className="text-[10px] sm:text-[11px] font-semibold leading-tight text-google-dark mb-2 px-1 line-clamp-2">
              {tile.description}
            </p>

            {isDone && tile.image_url ? (
              <div className="w-full flex flex-col items-center gap-1.5">
                <div className="w-full h-12 rounded-lg overflow-hidden border border-google-dark bg-black">
                  <img src={tile.image_url} alt="Captured challenge" className="w-full h-full object-cover" />
                </div>
                {!isLocked && (
                  <div className="flex gap-1 w-full">
                    {/* ADJUST BUTTON */}
                    <button
                      type="button"
                      onClick={() => onAdjustPhoto(index)}
                      className="flex-1 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-google-dark rounded-md flex items-center justify-center gap-0.5 hover:bg-amber-100 transition cursor-pointer"
                      title="Adjust crop, rotation, or fit"
                    >
                      <Sliders className="w-2.5 h-2.5" />
                      <span>Adjust</span>
                    </button>
                    {/* RETAKE BUTTON */}
                    <button
                      type="button"
                      onClick={() => onInitiateCamera(index, tile.title)}
                      className="flex-1 py-1 text-[10px] font-bold bg-blue-50 text-google-blue border border-google-dark rounded-md flex items-center justify-center gap-0.5 hover:bg-blue-100 transition cursor-pointer"
                      title="Retake picture with camera"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Retake</span>
                    </button>
                    {/* REMOVE BUTTON */}
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(index)}
                      className="flex-1 py-1 text-[10px] font-bold bg-red-50 text-google-red border border-google-dark rounded-md flex items-center justify-center gap-0.5 hover:bg-red-100 transition cursor-pointer"
                      title="Remove picture"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full">
                {uploadProgress ? (
                  <div className="w-full py-1.5 flex flex-col items-center gap-1">
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
                    className="w-full py-2.5 px-2 bg-google-blue text-white text-[11px] sm:text-xs font-extrabold border-2 border-google-dark rounded-xl flex items-center justify-center gap-1.5 shadow-brutal hover:bg-blue-600 active:shadow-none transition disabled:opacity-50 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Click Picture</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="text-[9px] text-google-grey font-medium truncate">
            {isDone ? 'Photo captured' : 'Take a photo at the event'}
          </div>
        </div>
      </div>
    </div>
  );
};
