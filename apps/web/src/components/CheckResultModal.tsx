import React, { useState } from 'react';
import { Search, Trophy, Check, X, Copy, CheckCheck } from 'lucide-react';
import { api } from '../lib/api.js';
import { CheckBingoResult } from '../types/bingo.js';

interface CheckResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBingoId?: string;
}

export const CheckResultModal: React.FC<CheckResultModalProps> = ({
  isOpen,
  onClose,
  defaultBingoId = ''
}) => {
  const [searchId, setSearchId] = useState(defaultBingoId);
  const [result, setResult] = useState<CheckBingoResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.checkBingo(searchId.trim());
      setResult(data);
    } catch (err: any) {
      setResult(null);
      setError(err.message || 'No bingo card found with this ID');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = () => {
    if (result?.bingoId) {
      navigator.clipboard.writeText(result.bingoId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white border-3 border-google-dark rounded-3xl p-6 sm:p-7 shadow-brutal-lg relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-google-dark" />
        </button>

        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-full bg-tile-yellow border-3 border-google-dark mx-auto mb-3 flex items-center justify-center text-3xl shadow-brutal">
            🏆
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-google-dark">
            Check Bingo Status
          </h3>
          <p className="text-xs text-google-grey">
            Enter your unique GCCD Bingo ID to check your results, lines, and prizes.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-5">
          <input
            type="text"
            required
            value={searchId}
            onChange={(e) => setSearchId(e.target.value.toUpperCase())}
            placeholder="e.g. GCCD-7K4M-92QX"
            className="flex-1 px-4 py-2.5 bg-gray-50 border-2 border-google-dark rounded-xl text-xs sm:text-sm font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-google-blue"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-google-blue text-white font-extrabold text-xs sm:text-sm border-2 border-google-dark rounded-xl shadow-brutal hover:bg-blue-600 transition flex items-center gap-1.5 cursor-pointer"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Check</span>
          </button>
        </form>

        {error && (
          <div className="p-3 bg-red-50 border border-google-red rounded-xl text-xs text-google-red font-semibold mb-4 text-center">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-gray-50 border-2 border-google-dark rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-google-dark">{result.participantName}</h4>
                <p className="text-xs text-google-grey">{result.organization || 'Attendee'}</p>
              </div>

              <button
                type="button"
                onClick={handleCopyId}
                className="px-3 py-1 bg-tile-yellow border-2 border-google-dark rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-yellow-200 transition cursor-pointer"
              >
                <span>{result.bingoId}</span>
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-google-green" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 bg-white border border-google-dark rounded-xl">
                <span className="text-[10px] uppercase font-bold text-google-grey block">Status</span>
                <span className={`text-xs font-black uppercase ${
                  result.status === 'winner' ? 'text-google-green' :
                  result.status === 'submitted' ? 'text-google-blue' : 'text-amber-500'
                }`}>
                  {result.status}
                </span>
              </div>
              <div className="p-2.5 bg-white border border-google-dark rounded-xl">
                <span className="text-[10px] uppercase font-bold text-google-grey block">Challenges</span>
                <span className="text-xs font-black text-google-dark">
                  {result.totalCompleted} / 9 Done
                </span>
              </div>
            </div>

            {/* Win Tier & Line Highlights */}
            <div className="p-3 bg-white border border-google-dark rounded-xl text-left">
              <span className="text-[10px] uppercase font-black text-google-blue block mb-1">
                Prize Category / Tier:
              </span>
              <p className="text-sm font-extrabold text-google-dark mb-2">
                {result.winTier}
              </p>

              {result.winEvaluation?.lines?.length > 0 ? (
                <div>
                  <span className="text-[10px] uppercase font-bold text-google-grey block mb-1">
                    Matching Lines:
                  </span>
                  <ul className="text-xs space-y-1">
                    {result.winEvaluation.lines.map((line, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-google-green font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-google-grey">
                  Complete 3 challenges in any row, column, or diagonal to qualify for prizes.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
