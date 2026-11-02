import React, { useState } from 'react';
import { Save, Lock, CheckCircle2, Download, Trophy, LogOut, Clock, Copy, CheckCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { Participant, BingoCard } from '../types/bingo.js';
import { BingoTile } from './BingoTile.js';

interface BingoBoardProps {
  participant: Participant;
  card: BingoCard;
  flippedIndex: number | null;
  onToggleFlip: (index: number) => void;
  onInitiateCrop: (index: number, imageSrc: string, tileTitle: string) => void;
  onAdjustPhoto: (index: number) => void;
  onRemovePhoto: (index: number) => Promise<void>;
  onSaveDraft: () => Promise<any>;
  onOpenSubmitModal: () => void;
  onOpenCheckModal: () => void;
  onOpenExportModal: () => void;
  onLogout: () => void;
  isSaving: boolean;
  saveError: string | null;
  lastSavedTime: string | null;
  uploadProgress: { [key: number]: number };
}

export const BingoBoard: React.FC<BingoBoardProps> = ({
  participant,
  card,
  flippedIndex,
  onToggleFlip,
  onInitiateCrop,
  onAdjustPhoto,
  onRemovePhoto,
  onSaveDraft,
  onOpenSubmitModal,
  onOpenCheckModal,
  onOpenExportModal,
  onLogout,
  isSaving,
  saveError,
  lastSavedTime,
  uploadProgress
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const isLocked = card.status !== 'draft';
  const completedCount = card.tiles.filter(t => t.image_url && t.image_url.trim().length > 0).length;
  const allGreen = completedCount >= 9;
  const canSubmit = allGreen && !isLocked;
  const progressPct = Math.round((completedCount / 9) * 100);

  const copyBingoId = () => {
    if (card.bingo_id) {
      navigator.clipboard.writeText(card.bingo_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border-3 border-google-dark rounded-3xl p-4 sm:p-7 shadow-brutal-lg transition-all animate-fadeIn">

      {/* ========================================================
           PARTICIPANT PROFILE RIBBON
           ======================================================== */}
      <div className="bg-gray-50 border-2 border-google-dark rounded-2xl p-3 sm:p-4 mb-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-google-blue text-white font-black text-base flex items-center justify-center border-2 border-google-dark shadow-xs flex-shrink-0">
              {participant.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold text-xs sm:text-sm text-google-dark leading-tight">
                  Participant: <span className="font-bold">{participant.name}</span> ({participant.email})
                </h2>

                {/* Bingo ID in monospace blue style with Copy Button */}
                <div className="flex items-center gap-1.5 bg-blue-50 border-2 border-google-blue px-2.5 py-0.5 rounded-lg text-xs font-mono font-black text-google-blue shadow-xs">
                  <span>ID: {card.bingo_id}</span>
                  <button
                    type="button"
                    onClick={copyBingoId}
                    className="p-0.5 hover:text-blue-700 transition cursor-pointer"
                    title="Copy Bingo ID to clipboard"
                    aria-label="Copy Bingo ID"
                  >
                    {copiedId ? (
                      <CheckCheck className="w-3.5 h-3.5 text-google-green" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submission Status shown SEPARATELY from the Bingo ID */}
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    isLocked
                      ? 'bg-google-green/15 text-google-green border-google-green'
                      : 'bg-amber-100 text-amber-800 border-amber-400'
                  }`}
                >
                  {isLocked ? 'Status: Submitted & Final' : 'Status: Draft (In Progress)'}
                </span>

                <div className="text-[10px] text-google-grey flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>{lastSavedTime ? `Last saved at ${lastSavedTime}` : 'All changes saved'}</span>
                </div>

                {/* Visible Error State with Retry Button */}
                {saveError && (
                  <div className="flex items-center gap-1.5 bg-red-50 border border-google-red text-google-red text-[11px] font-bold px-2 py-0.5 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Save failed.</span>
                    <button
                      type="button"
                      onClick={onSaveDraft}
                      className="underline hover:text-red-800 ml-1 flex items-center gap-0.5 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Retry</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-google-grey hover:text-google-red border border-gray-300 rounded-xl hover:bg-gray-100 transition cursor-pointer"
            title="Log out (your card remains saved in the database)"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================
           DEV FEST BINGO HEADER
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
          <h1 className="text-4xl sm:text-5xl font-black text-google-dark tracking-tighter leading-none mb-1">
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
      <div className="flex items-center justify-center gap-6 mb-4 text-xs font-bold text-google-dark">
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
        <div className="flex justify-between text-xs font-extrabold mb-1.5 text-google-dark">
          <span>Challenge Progress</span>
          <span>{completedCount} / 9 Complete</span>
        </div>
        <div className="w-full h-3 bg-gray-200 border-2 border-google-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-google-blue to-google-green transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ========================================================
           3x3 BINGO GRID WITH FLIP ANIMATION & FIXED ASPECT RATIO
           ======================================================== */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6">
        {card.tiles.map((tile, idx) => (
          <BingoTile
            key={tile.tile_index}
            tile={tile}
            index={idx}
            isFlipped={flippedIndex === idx}
            onToggleFlip={onToggleFlip}
            onInitiateCrop={onInitiateCrop}
            onAdjustPhoto={onAdjustPhoto}
            onRemovePhoto={onRemovePhoto}
            uploadProgress={uploadProgress[idx]}
            isLocked={isLocked}
          />
        ))}
      </div>

      {/* ========================================================
           ACTION BAR: SAVE DRAFT & SUBMIT (Steady, no bouncing)
           ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
        {!isLocked && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-3.5 bg-white text-google-dark font-black text-sm border-3 border-google-dark rounded-2xl flex items-center justify-center gap-2 shadow-brutal hover:bg-gray-50 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-google-dark border-t-transparent rounded-full animate-spin" />
                <span>Syncing Database...</span>
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
              ? 'bg-google-green text-white shadow-brutal hover:bg-green-600 cursor-default'
              : canSubmit
              ? 'bg-google-green text-white shadow-brutal hover:bg-green-600 active:shadow-none cursor-pointer'
              : 'bg-gray-200 text-gray-500 border-gray-400 cursor-not-allowed opacity-75'
          }`}
        >
          {isLocked ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>SUBMITTED & FINAL</span>
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
           SECONDARY ACTION CONTROLS
           ======================================================== */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-gray-200">
        {/* View Submission and Win Status: ONLY active when all 9 images are green or submitted */}
        <button
          type="button"
          disabled={!allGreen && !isLocked}
          onClick={onOpenCheckModal}
          className={`px-4 py-2.5 text-xs font-bold border-2 rounded-full flex items-center gap-2 transition ${
            allGreen || isLocked
              ? 'bg-tile-yellow text-google-dark border-google-dark shadow-brutal hover:bg-yellow-300 cursor-pointer'
              : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
          }`}
          title={
            allGreen || isLocked
              ? 'View your submission details and win evaluation'
              : 'Complete all 9 challenges (turn all dots green) to unlock submission and win status'
          }
        >
          <Trophy className={`w-3.5 h-3.5 ${allGreen || isLocked ? 'text-google-dark' : 'text-gray-400'}`} />
          <span>
            {allGreen || isLocked ? 'View Submission & Win Status 🏆' : `View Submission & Win (Need ${9 - completedCount} more)`}
          </span>
        </button>

        {/* Download A4 Card PNG: ONLY available AFTER submission */}
        {isLocked && (
          <button
            type="button"
            onClick={onOpenExportModal}
            className="px-5 py-2.5 bg-google-blue text-white text-xs font-extrabold border-2 border-google-dark rounded-full flex items-center gap-2 shadow-brutal hover:bg-blue-600 active:shadow-none transition animate-fadeIn cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download A4 Card (PNG)</span>
          </button>
        )}
      </div>
    </div>
  );
};
