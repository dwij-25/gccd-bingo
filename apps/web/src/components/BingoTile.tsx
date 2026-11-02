import React, { useRef } from 'react';
import { Camera, RefreshCw, Trash2, Undo2, CheckCircle2 } from 'lucide-react';
import { BingoTile as BingoTileType } from '../types/bingo.js';

interface BingoTileProps {
  tile: BingoTileType;
  index: number;
  isFlipped: boolean;
  onToggleFlip: (index: number) => void;
  onUploadPhoto: (index: number, file: File) => Promise<void>;
  onRemovePhoto: (index: number) => Promise<void>;
  uploadProgress?: number;
  isLocked: boolean;
}

const COLOR_CLASSES = [
  'bg-tile-yellow',
  'bg-tile-pink',
  'bg-tile-blue',
  'bg-tile-blue',
  'bg-white dark:bg-gray-900', // Center GDG Logo
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
  onUploadPhoto,
  onRemovePhoto,
  uploadProgress,
  isLocked
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDone = tile.status === 'completed' && Boolean(tile.image_url);
  const colorClass = COLOR_CLASSES[index] || 'bg-tile-yellow';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadPhoto(index, file);
      e.target.value = '';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Avoid flipping if user clicked directly on actionable buttons or inputs
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    onToggleFlip(index);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative aspect-square cursor-pointer select-none perspective-1000 group"
      role="button"
      tabIndex={0}
      aria-label={`Bingo challenge ${index + 1}: ${tile.title}. Status: ${isDone ? 'Completed' : 'Not finished'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleFlip(index);
        }
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp,image/heic"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* ========================================================
             FRONT FACE
             ======================================================== */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden rounded-2xl border-3 border-google-dark dark:border-white/30 p-2.5 sm:p-3 flex flex-col justify-between shadow-brutal transition-transform group-hover:-translate-y-1 ${colorClass}`}
        >
          {/* Header row: Challenge # and Signal Dot */}
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] sm:text-xs font-black bg-white/90 dark:bg-black/60 px-1.5 py-0.5 rounded border border-google-dark dark:border-white/20">
              #{index + 1}
            </span>

            {/* Signal Dot: Red = Not finished, Green = Completed */}
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 border-google-dark ${
                isDone
                  ? 'bg-google-green shadow-[0_0_8px_rgba(52,168,83,0.8)]'
                  : 'bg-google-red animate-pulse shadow-[0_0_8px_rgba(234,67,53,0.8)]'
              }`}
              title={isDone ? "Task is Done" : "Not finished"}
            />
          </div>

          {/* Center Content */}
          <div className="relative flex-1 flex flex-col items-center justify-center text-center my-1">
            {index === 4 ? (
              // Center GDG Emblem Tile
              <div className="flex flex-col items-center justify-center">
                <img
                  src="/assets/center_gdg_logo.png"
                  alt="GDG Logo"
                  className="w-14 sm:w-20 h-auto object-contain"
                  onError={(e) => {
                    // Fallback brackets
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="font-black text-xs sm:text-sm text-google-dark dark:text-white mt-1">
                  GCCD Spirit
                </span>
              </div>
            ) : (
              // Standard Challenge Tile
              <div className="flex flex-col items-center justify-center">
                <i className={`fas ${tile.icon || 'fa-camera'} text-xl sm:text-2xl text-google-dark dark:text-white mb-1.5`} />
                <h3 className="font-extrabold text-xs sm:text-sm leading-tight text-google-dark dark:text-white line-clamp-2 px-1">
                  {tile.title}
                </h3>
              </div>
            )}

            {/* Thumbnail Overlay when Done */}
            {isDone && tile.image_url && (
              <div
                className="absolute inset-0 rounded-xl bg-cover bg-center overflow-hidden flex items-end justify-center p-1.5 border border-google-dark/40 shadow-inner"
                style={{ backgroundImage: `url(${tile.image_url})` }}
              >
                <div className="bg-black/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-google-green" />
                  <span>Done</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Flip Indicator */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-google-dark/70 dark:text-white/70 text-center flex items-center justify-center gap-1">
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Flip</span>
          </div>
        </div>

        {/* ========================================================
             BACK FACE
             ======================================================== */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl border-3 border-google-dark dark:border-white/30 bg-white dark:bg-gray-800 p-2.5 sm:p-3 flex flex-col justify-between shadow-brutal"
        >
          {/* Top row on Back */}
          <div className="flex items-center justify-between w-full">
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 border-google-dark ${
                isDone
                  ? 'bg-google-green shadow-[0_0_8px_rgba(52,168,83,0.8)]'
                  : 'bg-google-red shadow-[0_0_8px_rgba(234,67,53,0.8)]'
              }`}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFlip(index);
              }}
              className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 border border-google-dark transition"
              title="Flip Back"
              aria-label="Flip Back to Front"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Description & Image Controls */}
          <div className="flex-1 flex flex-col justify-center items-center text-center my-1 overflow-hidden">
            <p className="text-[11px] sm:text-xs font-semibold leading-tight text-google-dark dark:text-gray-200 mb-2 px-1">
              {tile.description}
            </p>

            {isDone && tile.image_url ? (
              <div className="w-full flex flex-col items-center gap-1.5">
                <div className="w-full h-14 rounded-lg overflow-hidden border border-google-dark bg-black">
                  <img src={tile.image_url} alt="Uploaded challenge" className="w-full h-full object-cover" />
                </div>
                {!isLocked && (
                  <div className="flex gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-1 text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-google-blue border border-google-dark rounded-md flex items-center justify-center gap-1 hover:bg-blue-100 transition"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Replace</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(index)}
                      className="flex-1 py-1 text-[10px] font-bold bg-red-50 dark:bg-red-900/30 text-google-red border border-google-dark rounded-md flex items-center justify-center gap-1 hover:bg-red-100 transition"
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
                  <div className="w-full py-2 flex flex-col items-center gap-1">
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden border border-google-dark">
                      <div className="bg-google-blue h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold">{uploadProgress}% uploading...</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-2 bg-google-blue text-white text-[11px] sm:text-xs font-bold border-2 border-google-dark rounded-xl flex items-center justify-center gap-1.5 shadow-brutal hover:bg-blue-600 active:shadow-none transition disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take / Upload Pic</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="text-[9px] text-google-grey dark:text-gray-400 font-medium truncate">
            {tile.hint || 'Google Cloud Challenge'}
          </div>
        </div>
      </div>
    </div>
  );
};
