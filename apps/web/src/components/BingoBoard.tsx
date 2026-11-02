import React from 'react';
import { Save, Lock, CheckCircle2, Download, Trophy, LogOut, Clock } from 'lucide-react';
import { Participant, BingoCard } from '../types/bingo.js';
import { BingoTile } from './BingoTile.js';

interface BingoBoardProps {
  participant: Participant;
  card: BingoCard;
  flippedIndex: number | null;
  onToggleFlip: (index: number) => void;
  onUploadPhoto: (index: number, file: File) => Promise<void>;
  onRemovePhoto: (index: number) => Promise<void>;
  onSaveDraft: () => Promise<any>;
  onOpenSubmitModal: () => void;
  onOpenCheckModal: () => void;
  onOpenExportModal: () => void;
  onLogout: () => void;
  isSaving: boolean;
  lastSavedTime: string | null;
  uploadProgress: { [key: number]: number };
}

export const BingoBoard: React.FC<BingoBoardProps> = ({
  participant,
  card,
  flippedIndex,
  onToggleFlip,
  onUploadPhoto,
  onRemovePhoto,
  onSaveDraft,
  onOpenSubmitModal,
  onOpenCheckModal,
  onOpenExportModal,
  onLogout,
  isSaving,
  lastSavedTime,
  uploadProgress
}) => {
  const isLocked = card.status !== 'draft';
  const completedCount = card.total_completed;
  const canSubmit = completedCount >= 9 && !isLocked;
  const progressPct = Math.round((completedCount / 9) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-[#1E1E1E] border-3 border-google-dark dark:border-white/30 rounded-3xl p-5 sm:p-7 shadow-brutal-lg transition-all animate-fadeIn">

      {/* ========================================================
           PARTICIPANT PROFILE RIBBON
           ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/60 border-2 border-google-dark dark:border-white/20 rounded-2xl p-3 sm:p-3.5 mb-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-google-blue text-white font-black text-base flex items-center justify-center border-2 border-google-dark shadow-xs">
            {participant.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-google-dark dark:text-white leading-tight">
              {participant.name}
            </h2>
            <p className="text-xs text-google-grey dark:text-gray-400">
              {participant.email} {participant.organization && `• ${participant.organization}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-tile-yellow border-2 border-google-dark rounded-lg text-xs font-black font-mono tracking-wider shadow-xs">
              {card.bingo_id}
            </span>
            <div className="text-[10px] text-google-grey dark:text-gray-400 flex items-center justify-end gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{lastSavedTime ? `Saved at ${lastSavedTime}` : 'All changes saved'}</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-google-grey hover:text-google-red border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Log out (your progress remains saved in the database)"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================
           DEV FEST BINGO HEADER (Faithful to SVG design)
           ======================================================== */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4">
        <img
          src="/assets/left_bracket.png"
          alt="{"
          className="w-8 sm:w-11 h-auto select-none"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        <div className="flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl font-black text-google-dark dark:text-white tracking-tighter leading-none mb-1">
            DevFest
          </h1>
          <div className="px-7 py-0.5 bg-white border-3 border-google-dark rounded-full text-base sm:text-lg font-black tracking-widest shadow-brutal text-google-dark">
            BINGO
          </div>
        </div>

        <img
          src="/assets/right_bracket.png"
          alt="}"
          className="w-8 sm:w-11 h-auto select-none"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* ========================================================
           SIGNAL LEGEND (Red = Not Finished, Green = Completed)
           ======================================================== */}
      <div className="flex items-center justify-center gap-6 mb-4 text-xs font-bold text-google-dark dark:text-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-google-dark bg-google-red shadow-[0_0_8px_rgba(234,67,53,0.7)]" />
          <span>Red Dot = Not Finished</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-google-dark bg-google-green shadow-[0_0_8px_rgba(52,168,83,0.8)]" />
          <span>Green Dot = Completed</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="mb-5">
        <div className="flex justify-between text-xs font-extrabold mb-1.5 text-google-dark dark:text-gray-300">
          <span>Challenge Progress</span>
          <span>{completedCount} / 9 Complete</span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 border-2 border-google-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-google-blue to-google-green transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ========================================================
           3x3 BINGO GRID WITH FLIP ANIMATION
           ======================================================== */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6">
        {card.tiles.map((tile, idx) => (
          <BingoTile
            key={tile.tile_index}
            tile={tile}
            index={idx}
            isFlipped={flippedIndex === idx}
            onToggleFlip={onToggleFlip}
            onUploadPhoto={onUploadPhoto}
            onRemovePhoto={onRemovePhoto}
            uploadProgress={uploadProgress[idx]}
            isLocked={isLocked}
          />
        ))}
      </div>

      {/* ========================================================
           ACTION BAR: SAVE DRAFT & SUBMIT
           ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
        {!isLocked && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-gray-800 text-google-dark dark:text-white font-black text-sm border-3 border-google-dark dark:border-white/30 rounded-2xl flex items-center justify-center gap-2 shadow-brutal hover:bg-gray-50 dark:hover:bg-gray-700 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-google-dark border-t-transparent rounded-full animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-google-blue" />
                <span>Save Draft</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onOpenSubmitModal}
          disabled={!canSubmit && !isLocked}
          className={`w-full sm:w-auto px-8 py-3.5 font-black text-sm tracking-wide border-3 border-google-dark rounded-2xl flex items-center justify-center gap-2 transition ${
            isLocked
              ? 'bg-google-green text-white shadow-brutal hover:bg-green-600'
              : canSubmit
              ? 'bg-google-green text-white shadow-brutal hover:bg-green-600 active:shadow-none animate-bounce'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-500 border-gray-400 cursor-not-allowed opacity-75'
          }`}
        >
          {isLocked ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>SUBMITTED & LOCKED</span>
            </>
          ) : canSubmit ? (
            <>
              <span>🚀 SUBMIT BINGO</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>SUBMIT ({completedCount}/9)</span>
            </>
          )}
        </button>
      </div>

      {/* ========================================================
           SECONDARY ACTION PILLS
           ======================================================== */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={onOpenCheckModal}
          className="px-4 py-2 bg-white dark:bg-gray-800 text-google-dark dark:text-white text-xs font-bold border-2 border-google-dark dark:border-white/20 rounded-full flex items-center gap-1.5 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <Trophy className="w-3.5 h-3.5 text-google-yellow" />
          <span>Check My Bingo Status</span>
        </button>

        <button
          type="button"
          onClick={onOpenExportModal}
          className="px-4 py-2 bg-white dark:bg-gray-800 text-google-dark dark:text-white text-xs font-bold border-2 border-google-dark dark:border-white/20 rounded-full flex items-center gap-1.5 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <Download className="w-3.5 h-3.5 text-google-blue" />
          <span>Download A4 Card (PNG)</span>
        </button>
      </div>
    </div>
  );
};
