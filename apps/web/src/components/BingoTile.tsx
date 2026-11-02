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
  Undo2,
  Sliders,
  RefreshCw,
  Trash2
} from 'lucide-react';
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
          className={`absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-google-dark shadow-brutal ${
            isDone ? 'bg-white' : colorClass
          } overflow-hidden flex flex-col transition-opacity duration-200 ${
            isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {!isDone ? (
            /* Empty State: Responsive Icon + Challenge Title */
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 sm:p-3.5">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-white/80 border border-google-dark/50 sm:border-2 sm:border-google-dark flex items-center justify-center mb-1 sm:mb-1.5 shadow-xs flex-shrink-0">
                {getChallengeIcon(index, 'w-3.5 h-3.5 sm:w-5 sm:h-5 text-google-dark')}
              </div>
              <span className="font-extrabold text-[10px] sm:text-xs md:text-sm leading-tight text-google-dark select-none line-clamp-2">
                {tile.title}
              </span>
            </div>
          ) : (
            /* Uploaded State: Solid header bar covering the whole top region, photo fills below */
            <>
              {/* Solid top header bar part of the box itself */}
              <div className="w-full bg-white border-b-2 border-google-dark px-2 py-1 sm:px-2.5 sm:py-1.5 flex items-center justify-between gap-1.5 flex-shrink-0 z-10 min-h-[26px] sm:min-h-[30px]">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {getChallengeIcon(index, 'w-3 h-3 sm:w-3.5 sm:h-3.5 text-google-blue flex-shrink-0')}
                  <span
                    className="font-extrabold text-[9px] sm:text-[11px] leading-tight text-google-dark line-clamp-1 select-none truncate"
                    title={tile.title}
                  >
                    {tile.title}
                  </span>
                </div>
                <div
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-google-dark bg-google-green shadow-[0_0_6px_rgba(52,168,83,0.8)] flex-shrink-0"
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
          className={`absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-google-dark bg-white p-2 sm:p-2.5 flex flex-col justify-between shadow-brutal overflow-hidden select-none transition-opacity duration-200 ${
            isFlipped ? 'opacity-100 rotate-y-180 pointer-events-auto' : 'opacity-0 rotate-y-180 pointer-events-none'
          }`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {/* Top row on Back: Status signal dot + Icon + Activity Title + Undo Button */}
          <div className="flex items-center justify-between w-full gap-1 flex-shrink-0 border-b border-gray-100 pb-1">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div
                className={`w-2.5 h-2.5 rounded-full border border-google-dark flex-shrink-0 ${
                  isDone
                    ? 'bg-google-green shadow-[0_0_6px_rgba(52,168,83,0.8)]'
                    : 'bg-google-red shadow-[0_0_6px_rgba(234,67,53,0.8)]'
                }`}
              />
              {getChallengeIcon(index, 'w-3 h-3 text-google-dark flex-shrink-0')}
              <span className="font-extrabold text-[9px] sm:text-[11px] text-google-dark truncate">
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
              <Undo2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-google-dark" />
            </button>
          </div>

          {/* Action Controls Section */}
          {isDone && tile.image_url ? (
            <div className="w-full flex flex-col gap-1.5 flex-1 justify-center my-auto min-h-0">
              {!isLocked ? (
                <>
                  <div className="grid grid-cols-2 gap-1.5 w-full">
                    {/* ADJUST BUTTON */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdjustPhoto(index);
                      }}
                      onTouchEnd={(e) => e.stopPropagation()}
                      className="py-1.5 px-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-google-dark rounded-xl font-black text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-xs active:shadow-none transition cursor-pointer select-none"
                      title="Adjust photo crop"
                    >
                      <Sliders className="w-3 h-3 text-amber-700 flex-shrink-0" />
                      <span>Adjust</span>
                    </button>

                    {/* RETAKE BUTTON */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInitiateCamera(index, tile.title);
                      }}
                      onTouchEnd={(e) => e.stopPropagation()}
                      className="py-1.5 px-1 bg-blue-50 hover:bg-blue-100 text-google-blue border border-google-dark rounded-xl font-black text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-xs active:shadow-none transition cursor-pointer select-none"
                      title="Retake photo"
                    >
                      <RefreshCw className="w-3 h-3 text-google-blue flex-shrink-0" />
                      <span>Retake</span>
                    </button>
                  </div>

                  {/* DELETE BUTTON */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePhoto(index);
                    }}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="w-full py-1.5 px-1 bg-red-50 hover:bg-red-100 text-google-red border border-google-dark rounded-xl font-black text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-xs active:shadow-none transition cursor-pointer select-none"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3 h-3 text-google-red flex-shrink-0" />
                    <span>Delete</span>
                  </button>
                </>
              ) : (
                <div className="text-[10px] font-bold text-google-grey text-center">
                  Card Submitted
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between items-center text-center my-0.5 px-0.5 min-h-0">
              <p className="text-[9px] sm:text-[10px] font-bold text-google-grey leading-tight line-clamp-2 my-auto px-0.5">
                {tile.description}
              </p>
              <div className="w-full flex-shrink-0">
                {uploadProgress ? (
                  <div className="w-full py-0.5 flex flex-col items-center gap-1">
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden border border-google-dark">
                      <div className="bg-google-blue h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <span className="text-[8px] font-bold text-google-blue">{uploadProgress}% saving...</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      onInitiateCamera(index, tile.title);
                    }}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="w-full py-1.5 sm:py-2 px-1 bg-google-blue text-white text-[11px] sm:text-xs font-black border border-google-dark sm:border-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs hover:bg-blue-600 active:shadow-none transition disabled:opacity-50 cursor-pointer flex-shrink-0 select-none"
                  >
                    <Camera className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">Take Photo</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
