import React, { useState } from 'react';
import { Save, Lock, Download, Trophy, LogOut, Clock, Copy, CheckCheck, RefreshCw } from 'lucide-react';
import { Participant, BingoCard } from '../types/bingo.js';
import { BingoTile } from './BingoTile.js';

interface BingoBoardProps {
  participant: Participant;
  card: BingoCard;
  flippedIndex: number | null;
  onToggleFlip: (index: number) => void;
  onInitiateCamera: (index: number, tileTitle: string) => void;
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

  // 8 Challenges (Tile index 4 is the static GDG Cloud Ahmedabad center emblem)
  const challengeTiles = card.tiles.filter(t => t.tile_index !== 4 && !t.isCenter);
  const completedCount = challengeTiles.filter(t => t.image_url && t.image_url.trim().length > 0).length;
  const totalChallenges = 8;
  const allGreen = completedCount >= totalChallenges;
  const isSubmitted = card.status === 'submitted' || card.status === 'winner' || card.status === 'verified';
  const progressPct = Math.round((completedCount / totalChallenges) * 100);

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
           MINIMAL PARTICIPANT BAR (With Synced Time beside ID)
           ======================================================== */}
      <div className="bg-gray-50 border-2 border-google-dark rounded-2xl px-3.5 py-2.5 mb-5 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <span className="font-extrabold text-google-dark">
            {participant.name} <span className="font-normal text-google-grey text-xs">({participant.email})</span>
          </span>

          {/* Bingo ID in monospace blue style with Copy Button */}
          <div className="flex items-center gap-1.5 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-google-blue/30">
            <span className="text-[11px] font-bold text-google-grey">ID:</span>
            <span className="font-mono font-black text-xs sm:text-sm text-google-blue tracking-wider select-all">
              {card.bingo_id}
            </span>
            <button
              type="button"
              onClick={copyBingoId}
              className="p-1 hover:bg-blue-100 rounded text-google-blue transition cursor-pointer"
              title="Copy Bingo ID"
              aria-label="Copy Bingo ID to clipboard"
            >
              {copiedId ? (
                <CheckCheck className="w-3.5 h-3.5 text-google-green" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Last synced time placed directly within this box beside the ID */}
          {lastSavedTime && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-google-grey bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs">
              <Clock className="w-3 h-3 text-google-blue flex-shrink-0" />
              <span>Synced {lastSavedTime}</span>
            </div>
          )}
        </div>

        {/* Logout Button */}
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

      {/* ========================================================
           GOOGLE DEVELOPER GROUPS CLOUD AHMEDABAD BINGO
           VISUAL BRAND HEADER WITH ORANGE CONTAINERS { }
           ======================================================== */}
      <div className="w-full flex items-center justify-center gap-3 sm:gap-6 my-4 select-none">
        <img
          src="/assets/left_bracket.png"
          alt="{"
          className="w-10 sm:w-14 h-auto select-none"
        />

        <div className="flex flex-col items-center text-center">
          <span className="text-sm sm:text-base md:text-lg font-bold text-google-dark tracking-tight">
            Google Developer Groups
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-google-dark tracking-tight leading-none my-1">
            Cloud Ahmedabad
          </h1>
          <div className="mt-1 px-8 sm:px-10 py-1 sm:py-1.5 bg-white border-3 border-google-dark rounded-full text-lg sm:text-2xl font-black tracking-widest shadow-brutal text-google-dark">
            BINGO
          </div>
        </div>

        <img
          src="/assets/right_bracket.png"
          alt="}"
          className="w-10 sm:w-14 h-auto select-none"
        />
      </div>

      {/* Progress Track */}
      <div className="mb-5">
        <div className="flex justify-between text-xs font-extrabold mb-1.5 text-google-dark">
          <span>Challenge Progress</span>
          <span>{completedCount} / {totalChallenges} Complete</span>
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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
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

        <button
          type="button"
          onClick={onOpenSubmitModal}
          disabled={!allGreen}
          className={`w-full sm:w-auto px-8 py-3.5 font-black text-sm tracking-wide border-3 border-google-dark rounded-2xl flex items-center justify-center gap-2 transition ${
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
      <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-gray-200">
        {/* View Submission and Win Status */}
        <button
          type="button"
          disabled={!allGreen && !isSubmitted}
          onClick={onOpenCheckModal}
          className={`px-4 py-2.5 text-xs font-bold border-2 rounded-full flex items-center gap-2 transition ${
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
