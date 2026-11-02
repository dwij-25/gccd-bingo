import React, { useState } from 'react';
import { Save, Lock, RefreshCw, Trophy, Download, Copy, CheckCheck, Clock, LogOut } from 'lucide-react';
import { BingoCard, Participant } from '../types/bingo.js';
import { BingoTile } from './BingoTile.js';

interface BingoBoardProps {
  participant: Participant;
  card: BingoCard;
  flippedIndex: number | null;
  onToggleFlip: (index: number) => void;
  onInitiateCamera: (index: number, tileTitle: string) => void;
  onAdjustPhoto: (index: number) => void;
  onRemovePhoto: (index: number) => Promise<void>;
  onSaveDraft: () => Promise<void>;
  onOpenSubmitModal: () => void;
  onOpenCheckModal: () => void;
  onOpenExportModal: () => void;
  onLogout: () => void;
  isSaving: boolean;
  saveError: string | null;
  lastSavedTime: string | null;
  uploadProgress: Record<number, number>;
}

export const BingoBoard: React.FC<BingoBoardProps> = ({
  participant,
  card,
  flippedIndex,
  onToggleFlip,
  onInitiateCamera,
  onAdjustPhoto,
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
  const [copiedId, setCopiedId] = useState(false);

  // Challenges are the 8 outer tiles (center tile index 4 is the fixed emblem)
  const challengeTiles = card.tiles.filter(t => t.tile_index !== 4);
  const totalChallenges = 8;
  const completedCount = challengeTiles.filter(t => Boolean(t.image_url && t.image_url.trim().length > 0)).length;
  const allGreen = completedCount === totalChallenges;
  const isSubmitted = card.status === 'submitted' || card.status === 'verified';
  const progressPct = Math.round((completedCount / totalChallenges) * 100);

  const copyBingoId = () => {
    if (card.bingo_id) {
      navigator.clipboard.writeText(card.bingo_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="w-full sm:max-w-2xl mx-auto bg-white border-0 sm:border-3 border-google-dark rounded-none sm:rounded-3xl p-3 sm:p-7 shadow-none sm:shadow-brutal-lg transition-all animate-fadeIn flex flex-col justify-between min-h-[calc(100dvh-3.5rem)] sm:min-h-0">

      {/* ========================================================
           MINIMAL PARTICIPANT BAR (Clean single/double row layout)
           ======================================================== */}
      <div className="bg-gray-50 border-2 border-google-dark rounded-xl sm:rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 mb-2.5 sm:mb-4 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Participant Name & Email + ID */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-google-dark truncate">
                {participant.name}
              </span>
              <span className="text-[10px] sm:text-xs text-google-grey truncate hidden xs:inline">
                ({participant.email})
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 bg-blue-50/80 px-2 py-0.5 rounded border border-google-blue/30">
                <span className="text-[10px] font-bold text-google-grey">ID:</span>
                <span className="font-mono font-black text-xs text-google-blue tracking-wider select-all">
                  {card.bingo_id}
                </span>
                <button
                  type="button"
                  onClick={copyBingoId}
                  className="p-0.5 hover:bg-blue-100 rounded text-google-blue transition cursor-pointer"
                  title="Copy Bingo ID"
                  aria-label="Copy Bingo ID"
                >
                  {copiedId ? (
                    <CheckCheck className="w-3 h-3 text-google-green" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              {lastSavedTime && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-google-grey bg-white px-1.5 py-0.5 rounded border border-gray-200">
                  <Clock className="w-2.5 h-2.5 text-google-blue flex-shrink-0" />
                  <span>{lastSavedTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 text-google-grey hover:text-google-red hover:bg-red-50 rounded-lg transition cursor-pointer flex-shrink-0"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================
           GOOGLE DEVELOPER GROUPS CLOUD AHMEDABAD BINGO
           VISUAL BRAND HEADER WITH ORANGE CONTAINERS { }
           ======================================================== */}
      <div className="w-full flex items-center justify-center gap-2 sm:gap-6 my-2 sm:my-4 select-none">
        <img
          src="/assets/left_bracket.png"
          alt="{"
          className="w-8 sm:w-14 h-auto select-none"
        />

        <div className="flex flex-col items-center text-center">
          <span className="text-xs sm:text-base md:text-lg font-bold text-google-dark tracking-tight">
            Google Developer Groups
          </span>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-google-dark tracking-tight leading-none my-0.5 sm:my-1">
            Cloud Ahmedabad
          </h1>
          <div className="mt-1 px-6 sm:px-10 py-0.5 sm:py-1.5 bg-white border-2 sm:border-3 border-google-dark rounded-full text-base sm:text-2xl font-black tracking-widest shadow-brutal text-google-dark">
            BINGO
          </div>
        </div>

        <img
          src="/assets/right_bracket.png"
          alt="}"
          className="w-8 sm:w-14 h-auto select-none"
        />
      </div>

      {/* Progress Track */}
      <div className="mb-3 sm:mb-5">
        <div className="flex justify-between text-xs font-extrabold mb-1 text-google-dark">
          <span>Challenge Progress</span>
          <span>{completedCount} / {totalChallenges} Complete</span>
        </div>
        <div className="w-full h-2.5 sm:h-3 bg-gray-200 border-2 border-google-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-google-blue to-google-green transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ========================================================
           3x3 BINGO GRID WITH FLIP ANIMATION & EXTENDED MOBILE HEIGHT
           ======================================================== */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 my-auto sm:my-0 mb-3 sm:mb-6">
        {card.tiles.map((tile, idx) => (
          <BingoTile
            key={tile.tile_index}
            tile={tile}
            index={idx}
            isFlipped={flippedIndex === idx}
            onToggleFlip={(i) => {
              // Center tile (index 4) is non-flippable
              if (i === 4) return;
              onToggleFlip(i);
            }}
            onInitiateCamera={onInitiateCamera}
            onAdjustPhoto={onAdjustPhoto}
            onRemovePhoto={onRemovePhoto}
            uploadProgress={uploadProgress[idx]}
            isLocked={false}
          />
        ))}
      </div>

      {/* ========================================================
           ACTION BAR: SAVE DRAFT & SUBMIT / RESUBMIT
           ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 w-full">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-3 sm:py-3.5 bg-white text-google-dark font-black text-sm border-2 sm:border-3 border-google-dark rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-brutal hover:bg-gray-50 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
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

        <button
          type="button"
          onClick={onOpenSubmitModal}
          disabled={!allGreen}
          className={`w-full sm:w-auto px-8 py-3 sm:py-3.5 font-black text-sm tracking-wide border-2 sm:border-3 border-google-dark rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition ${
            allGreen
              ? 'bg-google-green text-white shadow-brutal hover:bg-green-600 active:shadow-none cursor-pointer'
              : 'bg-gray-200 text-gray-500 border-gray-400 cursor-not-allowed opacity-75'
          }`}
        >
          {isSubmitted ? (
            allGreen ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>🚀 RESUBMIT BINGO</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>RESUBMIT ({completedCount}/{totalChallenges})</span>
              </>
            )
          ) : allGreen ? (
            <>
              <span>🚀 SUBMIT BINGO</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>SUBMIT ({completedCount}/{totalChallenges})</span>
            </>
          )}
        </button>
      </div>

      {/* ========================================================
           SECONDARY ACTION CONTROLS
           ======================================================== */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2.5 sm:pt-3 border-t border-gray-200 w-full">
        {/* View Submission and Win Status */}
        <button
          type="button"
          disabled={!allGreen && !isSubmitted}
          onClick={onOpenCheckModal}
          className={`w-full sm:w-auto px-4 py-2 sm:py-2.5 text-xs font-bold border-2 rounded-full flex items-center justify-center gap-2 transition ${
            allGreen || isSubmitted
              ? 'bg-tile-yellow text-google-dark border-google-dark shadow-brutal hover:bg-yellow-300 cursor-pointer'
              : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
          }`}
          title={
            allGreen || isSubmitted
              ? 'View your submission details and win evaluation'
              : 'Complete all 8 challenges (turn all dots green) to unlock submission and win status'
          }
        >
          <Trophy className={`w-3.5 h-3.5 ${allGreen || isSubmitted ? 'text-google-dark' : 'text-gray-400'}`} />
          <span>
            {allGreen || isSubmitted ? 'View Submission & Win Status 🏆' : `View Submission & Win (Need ${totalChallenges - completedCount} more)`}
          </span>
        </button>

        {/* Download A4 Card PNG: Available after submission or all green */}
        {(isSubmitted || allGreen) && (
          <button
            type="button"
            onClick={onOpenExportModal}
            className="w-full sm:w-auto px-5 py-2 sm:py-2.5 bg-google-blue text-white text-xs font-extrabold border-2 border-google-dark rounded-full flex items-center justify-center gap-2 shadow-brutal hover:bg-blue-600 active:shadow-none transition animate-fadeIn cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Bingo A4 Card (PNG)</span>
          </button>
        )}
      </div>
    </div>
  );
};
