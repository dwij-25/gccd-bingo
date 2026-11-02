import React, { useState } from 'react';
import { User, Mail, ArrowRight, AlertCircle, BookOpen } from 'lucide-react';

interface LoginGateProps {
  onLogin: (name: string, email: string) => Promise<any>;
  isLoading: boolean;
  error: string | null;
  onOpenRulesModal?: () => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({
  onLogin,
  isLoading,
  error,
  onOpenRulesModal
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onLogin(name.trim(), email.trim());
  };

  return (
    <div className="w-full min-h-[100dvh] sm:min-h-0 sm:max-w-md mx-auto flex flex-col justify-between bg-white border-0 sm:border-3 border-google-dark rounded-none sm:rounded-3xl p-6 sm:p-8 shadow-none sm:shadow-brutal-lg transition-all animate-fadeIn">
      {/* Visual Brand Header with Gold Brackets and BINGO Pill */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 pt-4 sm:pt-0 mb-6 sm:mb-8 select-none flex-shrink-0">
        <img
          src="/assets/left_bracket.png"
          alt="{"
          className="w-8 sm:w-9 h-auto select-none"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        <div className="flex flex-col items-center text-center">
          <span className="text-xs sm:text-sm font-bold text-google-dark tracking-tight">
            Google Developer Groups
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-google-dark tracking-tight leading-tight my-1">
            Cloud Ahmedabad
          </h1>
          <div className="mt-1 px-8 py-1 bg-white border-2 sm:border-3 border-google-dark rounded-full text-base sm:text-lg font-black tracking-widest shadow-brutal text-google-dark">
            BINGO
          </div>
        </div>

        <img
          src="/assets/right_bracket.png"
          alt="}"
          className="w-8 sm:w-9 h-auto select-none"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border-2 border-google-red rounded-xl text-xs sm:text-sm text-google-red font-semibold flex items-start gap-2.5 flex-shrink-0">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Center Form Section */}
      <div className="w-full my-auto py-2 sm:py-0">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-extrabold text-google-dark mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-google-blue" /> Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3.5 bg-gray-50 border-2 border-google-dark rounded-xl text-base font-semibold focus:outline-none focus:border-google-blue focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-sm font-extrabold text-google-dark mb-1.5 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-google-red" /> Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3.5 bg-gray-50 border-2 border-google-dark rounded-xl text-base font-semibold focus:outline-none focus:border-google-blue focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-4 bg-google-blue text-white font-black text-base border-2 sm:border-3 border-google-dark rounded-xl flex items-center justify-center gap-2 shadow-brutal hover:bg-blue-600 active:shadow-none transition disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Enter Bingo</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>

      {onOpenRulesModal && (
        <div className="pt-4 pb-2 sm:pb-0 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenRulesModal}
            className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-google-dark border-2 border-google-dark rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs active:shadow-none transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-google-blue flex-shrink-0" />
            <span>How to Play &amp; Rules</span>
          </button>
        </div>
      )}
    </div>
  );
};
