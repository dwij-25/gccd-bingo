import React, { useState, useEffect } from 'react';
import { Trophy, Award, Sparkles, RefreshCw, X, Search, Check, Hourglass, ArrowRight } from 'lucide-react';
import { api } from '../lib/api.js';
import { Participant, BingoCard } from '../types/bingo.js';

interface WinnerItem {
  rank: number;
  bingoId: string;
  name: string;
  email?: string;
  organization?: string;
  winTier: string;
  submittedAt?: string;
  evaluatedAt?: string;
}

interface CheckResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBingoId?: string;
  currentParticipant?: Participant | null;
  currentCard?: BingoCard | null;
}

export const CheckResultModal: React.FC<CheckResultModalProps> = ({
  isOpen,
  onClose,
  defaultBingoId = '',
  currentParticipant,
  currentCard
}) => {
  const [winners, setWinners] = useState<WinnerItem[]>([]);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Please wait till the results are being counted or evaluated.');
  const [isLoading, setIsLoading] = useState(false);

  // Optional manual lookup
  const [showManualLookup, setShowManualLookup] = useState(false);
  const [searchId, setSearchId] = useState(defaultBingoId || currentCard?.bingo_id || '');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadWinners();
      if (defaultBingoId || currentCard?.bingo_id) {
        setSearchId(defaultBingoId || currentCard?.bingo_id || '');
      }
    }
  }, [isOpen, defaultBingoId, currentCard]);

  if (!isOpen) return null;

  const loadWinners = async () => {
    setIsLoading(true);
    try {
      const data = await api.getWinners();
      const list = data.winners || [];
      setWinners(list);
      setIsEvaluated(Boolean(data.evaluated && list.length > 0));
      if (data.message) {
        setStatusMessage(data.message);
      }
    } catch (err) {
      console.warn('Failed to fetch winners:', err);
      setIsEvaluated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    try {
      const data = await api.checkBingo(searchId.trim());
      setLookupResult(data);
    } catch (err: any) {
      setLookupResult(null);
      setLookupError(err.message || 'No bingo card found with this ID');
    } finally {
      setLookupLoading(false);
    }
  };

  // Check if current user is one of the winners
  const activeBingoId = (currentCard?.bingo_id || defaultBingoId || '').trim().toUpperCase();
  const activeEmail = (currentParticipant?.email || '').trim().toLowerCase();

  const matchedWinner = winners.find(w => {
    const wId = (w.bingoId || '').trim().toUpperCase();
    const wEmail = (w.email || '').trim().toLowerCase();
    return (activeBingoId && wId === activeBingoId) || (activeEmail && wEmail === activeEmail);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-white border-2 sm:border-3 border-google-dark rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-brutal-lg relative max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-tile-yellow border-2 border-google-dark flex items-center justify-center text-lg shadow-xs">
              🏆
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-google-dark leading-tight">
                Bingo Results & Winners
              </h3>
              <span className="text-[10px] text-google-grey font-bold">
                Google Cloud Community Day 2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={loadWinners}
              disabled={isLoading}
              className="p-1.5 border border-google-dark sm:border-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              title="Refresh results"
              aria-label="Refresh results"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-google-dark ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-google-dark transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-0">
          {isLoading && winners.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-9 h-9 border-3 border-google-blue border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-google-grey">Loading evaluation status...</span>
            </div>
          ) : !isEvaluated ? (
            /* ========================================================
               PENDING STATE: Results are being counted or evaluated
               ======================================================== */
            <div className="space-y-3.5 py-2">
              <div className="p-4 sm:p-5 bg-amber-50 border-2 border-google-dark rounded-2xl text-center shadow-xs">
                <div className="w-12 h-12 bg-white rounded-2xl border-2 border-google-dark mx-auto flex items-center justify-center mb-2.5 shadow-xs">
                  <Hourglass className="w-6 h-6 text-amber-600 animate-pulse" />
                </div>
                <span className="inline-block px-2.5 py-0.5 bg-amber-200/80 text-amber-900 border border-amber-800 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                  Evaluation In Progress
                </span>
                <h4 className="text-sm sm:text-base font-black text-google-dark leading-snug px-2">
                  Please wait till the results are being counted or evaluated.
                </h4>
                <p className="text-[11px] sm:text-xs text-google-grey font-medium mt-1.5 max-w-md mx-auto leading-relaxed">
                  The GCCD organizers are currently reviewing challenge submissions. Top 10 Winners will be announced right here once evaluation is complete.
                </p>
              </div>

              {/* Attendee's Own Submission Status Card */}
              {currentParticipant && currentCard && (
                <div className="p-3.5 bg-gray-50 border-2 border-google-dark rounded-2xl space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-google-grey block">Your Submission</span>
                      <h5 className="font-extrabold text-xs sm:text-sm text-google-dark">{currentParticipant.name}</h5>
                    </div>
                    <span className="font-mono font-black text-xs text-google-blue bg-blue-50 px-2 py-0.5 rounded-lg border border-google-blue">
                      {currentCard.bingo_id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center pt-1">
                    <div className="p-2 bg-white border border-gray-300 rounded-xl">
                      <span className="text-[9.5px] uppercase font-black text-google-grey block">Challenges Done</span>
                      <span className="text-xs sm:text-sm font-black text-google-dark">
                        {currentCard.total_completed} / 9 Complete
                      </span>
                    </div>
                    <div className="p-2 bg-white border border-gray-300 rounded-xl">
                      <span className="text-[9.5px] uppercase font-black text-google-grey block">Status</span>
                      <span className={`text-xs sm:text-sm font-black uppercase ${
                        currentCard.status === 'submitted' ? 'text-google-blue' : 'text-amber-600'
                      }`}>
                        {currentCard.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================
               EVALUATED STATE: Top 10 Winners Declared
               ======================================================== */
            <div className="space-y-3.5">
              {/* Winner Celebration Banner if current user matched! */}
              {matchedWinner ? (
                <div className="p-4 sm:p-5 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-3 border-google-dark rounded-2xl shadow-brutal text-center animate-fadeIn">
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
                    <span className="text-xs font-black text-amber-800 uppercase tracking-widest">
                      GCCD WINNER CONFIRMED!
                    </span>
                    <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
                  </div>

                  <h3 className="text-base sm:text-xl font-black text-google-dark">
                    🎉 CONGRATULATIONS, {matchedWinner.name.toUpperCase()}! 🎉
                  </h3>

                  <div className="my-2.5 inline-flex items-center gap-2 px-3 py-1 bg-tile-yellow border-2 border-google-dark rounded-full font-black text-xs sm:text-sm text-google-dark shadow-xs">
                    <Award className="w-4 h-4 text-google-dark" />
                    <span>Rank #{matchedWinner.rank} Winner • {matchedWinner.winTier}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-google-dark font-extrabold max-w-md mx-auto leading-relaxed">
                    Your challenge photos have been successfully verified by the organizers! Please head over to the organizer desk / stage to claim your exclusive Google Cloud prize!
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border-2 border-google-dark rounded-2xl flex items-center gap-2.5">
                  <div className="p-2 bg-white rounded-xl border border-google-blue text-google-blue flex-shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-google-dark">
                    <span className="font-black block">Official Winners Declared!</span>
                    <span className="text-[11px] text-google-grey font-medium">
                      Thank you for participating! Check out the Top 10 Winners evaluated by the organizers below.
                    </span>
                  </div>
                </div>
              )}

              {/* TOP 10 WINNERS LEADERBOARD */}
              <div className="border-2 border-google-dark rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="bg-gray-100 border-b-2 border-google-dark px-3.5 py-2 flex items-center justify-between">
                  <span className="font-black text-xs text-google-dark uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-600" />
                    <span>Top 10 Bingo Winners</span>
                  </span>
                  <span className="text-[10px] font-black text-google-grey uppercase">
                    {winners.length} Winner{winners.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="divide-y divide-gray-200">
                  {winners.map((w) => {
                    const isSelf = activeBingoId && w.bingoId?.toUpperCase() === activeBingoId;
                    return (
                      <div
                        key={w.rank}
                        className={`p-2.5 sm:p-3 flex items-center justify-between gap-2 transition ${
                          isSelf ? 'bg-amber-100/70 border-l-4 border-l-amber-500 font-bold' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rank Medal */}
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border-2 border-google-dark flex items-center justify-center font-black text-xs flex-shrink-0 ${
                              w.rank === 1
                                ? 'bg-yellow-400 text-google-dark shadow-xs'
                                : w.rank === 2
                                ? 'bg-gray-300 text-google-dark shadow-xs'
                                : w.rank === 3
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-gray-100 text-google-dark'
                            }`}
                          >
                            {w.rank === 1 ? '🥇' : w.rank === 2 ? '🥈' : w.rank === 3 ? '🥉' : `#${w.rank}`}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-xs sm:text-sm text-google-dark truncate">
                                {w.name}
                              </span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 bg-google-blue text-white rounded text-[9px] font-black uppercase">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-google-grey block">
                              {w.bingoId}
                            </span>
                          </div>
                        </div>

                        {/* Win Tier Badge */}
                        <div className="text-right flex-shrink-0">
                          <span className="inline-block px-2 py-0.5 bg-green-100 text-green-900 border border-green-700 rounded-full text-[10px] font-black">
                            {w.winTier || 'Winner'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Optional: Check Individual Card Lookup Toggle */}
          <div className="pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowManualLookup(v => !v)}
              className="text-[11px] font-black text-google-blue hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Search className="w-3 h-3" />
              <span>{showManualLookup ? 'Hide Card Lookup' : 'Look up another Bingo ID status'}</span>
            </button>

            {showManualLookup && (
              <form onSubmit={handleManualSearch} className="flex gap-1.5 mt-2 animate-fadeIn">
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                  placeholder="e.g. GCCD-9GRH-L37X"
                  className="flex-1 px-3 py-1.5 bg-gray-50 border-2 border-google-dark rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-google-blue"
                />
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="px-3 py-1.5 bg-google-blue text-white text-xs font-black border-2 border-google-dark rounded-xl shadow-xs hover:bg-blue-600 transition cursor-pointer"
                >
                  {lookupLoading ? 'Checking...' : 'Check'}
                </button>
              </form>
            )}

            {lookupError && (
              <div className="mt-1.5 p-2 bg-red-50 border border-google-red rounded-xl text-[10px] text-google-red font-bold">
                {lookupError}
              </div>
            )}

            {lookupResult && (
              <div className="mt-2 p-2.5 bg-gray-50 border border-google-dark rounded-xl text-xs space-y-1 animate-fadeIn">
                <div className="flex justify-between font-black">
                  <span>{lookupResult.participantName}</span>
                  <span className="uppercase text-google-blue">{lookupResult.status}</span>
                </div>
                <div className="flex justify-between text-google-grey text-[10.5px]">
                  <span>{lookupResult.bingoId}</span>
                  <span>{lookupResult.totalCompleted} / 9 challenges</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
