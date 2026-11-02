import React, { useRef } from 'react';
import { Camera, RefreshCw, Trash2, Undo2, Sliders } from 'lucide-react';
import { BingoTile as BingoTileType } from '../types/bingo.js';

interface BingoTileProps {
  tile: BingoTileType;
  index: number;
  isFlipped: boolean;
  onToggleFlip: (index: number) => void;
  onInitiateCrop: (index: number, imageSrc: string, tileTitle: string) => void;
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
  onInitiateCrop,
  onAdjustPhoto,
  onRemovePhoto,
  uploadProgress,
  isLocked
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDone = Boolean(tile.image_url && tile.image_url.trim().length > 0);
  const colorClass = COLOR_CLASSES[index] || 'bg-tile-yellow';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onInitiateCrop(index, dataUrl, tile.title);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

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
          className={`absolute inset-0 w-full h-full backface-hidden rounded-2xl border-3 border-google-dark p-2 sm:p-2.5 flex flex-col justify-between shadow-brutal ${colorClass} overflow-hidden`}
        >
          {/* Completed Photo Background (Underneath top header) */}
          {isDone && tile.image_url && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden bg-black z-0">
              <img
                src={tile.image_url}
                alt={tile.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Top Header Row: Activity Title beside the Signal Dot (ALWAYS visible, even when image is saved) */}
          <div className="flex items-center justify-between w-full gap-2 relative z-20 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border-2 border-google-dark shadow-xs">
            <span
              className="font-extrabold text-[10px] sm:text-[11px] leading-tight text-google-dark truncate"
              title={tile.title}
            >
              {tile.title}
            </span>

            {/* Signal Dot: Red = Not finished, Green = Completed */}
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 border-google-dark flex-shrink-0 transition-colors duration-300 ${
                isDone
                  ? 'bg-google-green shadow-[0_0_8px_rgba(52,168,83,0.9)]'
                  : 'bg-google-red shadow-[0_0_8px_rgba(234,67,53,0.9)]'
              }`}
              title={isDone ? 'Completed' : 'Not finished'}
            />
          </div>

          {/* Center Graphic/Icon when NO photo is uploaded */}
          {!isDone && (
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center my-0.5 overflow-hidden">
              {index === 4 ? (
                <div className="flex flex-col items-center justify-center">
                  <img
                    src="/assets/center_gdg_logo.png"
                    alt="GDG Logo"
                    className="w-12 sm:w-16 h-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="font-black text-[11px] sm:text-xs text-google-dark mt-0.5">
                    GCCD Spirit
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-1">
                  <i className={`fas ${tile.icon || 'fa-camera'} text-xl sm:text-2xl text-google-dark mb-1`} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================
             BACK FACE
             ======================================================== */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl border-3 border-google-dark bg-white p-2 sm:p-2.5 flex flex-col justify-between shadow-brutal"
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
                  <img src={tile.image_url} alt="Uploaded challenge" className="w-full h-full object-cover" />
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
                    {/* REPLACE BUTTON */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-1 text-[10px] font-bold bg-blue-50 text-google-blue border border-google-dark rounded-md flex items-center justify-center gap-0.5 hover:bg-blue-100 transition cursor-pointer"
                      title="Replace photo"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Replace</span>
                    </button>
                    {/* REMOVE BUTTON */}
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(index)}
                      className="flex-1 py-1 text-[10px] font-bold bg-red-50 text-google-red border border-google-dark rounded-md flex items-center justify-center gap-0.5 hover:bg-red-100 transition cursor-pointer"
                      title="Remove photo"
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
                    <span className="text-[9px] font-bold text-google-blue">{uploadProgress}% uploading...</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-2 bg-google-blue text-white text-[11px] sm:text-xs font-bold border-2 border-google-dark rounded-xl flex items-center justify-center gap-1.5 shadow-brutal hover:bg-blue-600 active:shadow-none transition disabled:opacity-50 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload Pic</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="text-[9px] text-google-grey font-medium truncate">
            {isDone ? 'Photo uploaded' : 'Click to upload photo'}
          </div>
        </div>
      </div>
    </div>
  );
};
