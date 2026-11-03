import React from 'react';
import {
  Camera,
  Users,
  Presentation,
  HeartHandshake,
  UserPlus,
  Image as ImageIcon,
  Store,
  BadgeCheck,
  RefreshCw
} from 'lucide-react';
import { BingoTile as BingoTileType } from '../types/bingo.js';

interface BingoTileProps {
  tile: BingoTileType;
  index: number;
  isFlipped: boolean;
  onToggleFlip: (index: number) => void;
  onInitiateCamera: (index: number, tileTitle: string) => void;
  onAdjustPhoto?: (index: number) => void;
  onRemovePhoto?: (index: number) => Promise<void>;
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

export function getChallengeIcon(index: number, className = 'w-5 h-5') {
  switch (index) {
    case 0:
      return <Camera className={className} />;
    case 1:
      return <Users className={className} />;
    case 2:
      return <Presentation className={className} />;
    case 3:
      return <HeartHandshake className={className} />;
    case 5:
      return <UserPlus className={className} />;
    case 6:
      return <ImageIcon className={className} />;
    case 7:
      return <Store className={className} />;
    case 8:
      return <BadgeCheck className={className} />;
    default:
      return <Camera className={className} />;
  }
}

export const BingoTile: React.FC<BingoTileProps> = ({
  tile,
  index,
  isFlipped,
  onToggleFlip,
  onInitiateCamera,
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
          className={`absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-google-dark shadow-brutal ${
            isDone ? 'bg-white' : colorClass
          } overflow-hidden flex flex-col transition-opacity duration-200 ${
            isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {!isDone ? (
            /* Empty State: Responsive Icon + Challenge Title without harsh truncation */
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-1.5 sm:p-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-white/80 border border-google-dark/50 sm:border-2 sm:border-google-dark flex items-center justify-center mb-1 shadow-xs flex-shrink-0">
                {getChallengeIcon(index, 'w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-google-dark')}
              </div>
              <span className="font-extrabold text-[9px] sm:text-xs md:text-sm leading-snug text-google-dark select-none line-clamp-3 text-center px-0.5">
                {tile.title}
              </span>
            </div>
          ) : (
            /* Uploaded State: Solid header bar covering the whole top region, photo fills below */
            <>
              {/* Solid top header bar with full activity title and green status dot */}
              <div className="w-full bg-white border-b-2 border-google-dark px-1.5 py-1 sm:px-2.5 sm:py-1.5 flex items-center justify-between gap-1 flex-shrink-0 z-10 min-h-[26px]">
                <span
                  className="font-black text-[9px] sm:text-[10.5px] leading-tight text-google-dark line-clamp-2 select-none flex-1 text-left"
                  title={tile.title}
                >
                  {tile.title}
                </span>
                <div
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-google-dark bg-google-green shadow-[0_0_6px_rgba(52,168,83,0.8)] flex-shrink-0 ml-1"
                  title="Challenge completed"
                />
              </div>

              {/* Photo Area below header, leaving zero space above */}
              <div className="flex-1 w-full bg-black relative overflow-hidden">
                <img
                  src={tile.image_url!}
                  alt={tile.title}
                  className="w-full h-full object-cover select-none"
                />
              </div>
            </>
          )}
        </div>

        {/* ========================================================
             BACK FACE
             ======================================================== */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-google-dark bg-white p-2 sm:p-3 flex flex-col justify-between shadow-brutal overflow-hidden select-none transition-opacity duration-200 ${
            isFlipped ? 'opacity-100 rotate-y-180 pointer-events-auto' : 'opacity-0 rotate-y-180 pointer-events-none'
          }`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {/* Challenge Description (Takes the full space, cleanly centered without repeating title) */}
          <div className="flex-1 w-full flex items-center justify-center text-center px-1 min-h-0">
            <p className="font-extrabold text-[10.5px] sm:text-xs md:text-sm text-google-dark leading-snug sm:leading-relaxed select-none">
              {tile.description}
            </p>
          </div>

          {/* Action Button: Retake Photo (when completed) or Take Photo (when empty) */}
          <div className="w-full flex-shrink-0 pt-1">
            {uploadProgress ? (
              <div className="w-full py-1 flex flex-col items-center gap-1">
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden border border-google-dark">
                  <div className="bg-google-blue h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="text-[9px] font-bold text-google-blue">{uploadProgress}% saving...</span>
              </div>
            ) : isDone && tile.image_url ? (
              !isLocked ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInitiateCamera(index, tile.title);
                  }}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="w-full py-1.5 sm:py-2 px-1.5 bg-google-blue text-white text-[10.5px] sm:text-xs font-black border border-google-dark sm:border-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs hover:bg-blue-600 active:shadow-none transition cursor-pointer select-none"
                  title="Retake photo"
                >
                  <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span>Retake Photo</span>
                </button>
              ) : (
                <div className="w-full py-1.5 text-center text-[10px] sm:text-xs font-bold text-google-grey bg-gray-100 rounded-xl border border-gray-300">
                  Card Submitted
                </div>
              )
            ) : (
              <button
                type="button"
                disabled={isLocked}
                onClick={(e) => {
                  e.stopPropagation();
                  onInitiateCamera(index, tile.title);
                }}
                onTouchEnd={(e) => e.stopPropagation()}
                className="w-full py-1.5 sm:py-2 px-1.5 bg-google-blue text-white text-[10.5px] sm:text-xs font-black border border-google-dark sm:border-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs hover:bg-blue-600 active:shadow-none transition disabled:opacity-50 cursor-pointer select-none"
              >
                <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span>Take Photo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
