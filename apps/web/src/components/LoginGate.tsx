import React, { useState } from 'react';
import { User, Mail, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginGateProps {
  onLogin: (name: string, email: string) => Promise<any>;
  isLoading: boolean;
  error: string | null;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onLogin, isLoading, error }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onLogin(name.trim(), email.trim());
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border-2 border-google-dark rounded-2xl p-6 sm:p-7 shadow-brutal transition-all">
      {/* Visual Brand Header with Gold Brackets and BINGO Pill */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 mb-6">
        <img
          src="/assets/left_bracket.png"
          alt="{"
          className="w-6 sm:w-8 h-auto select-none"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        <div className="flex flex-col items-center text-center">
          <span className="text-xs sm:text-sm font-bold text-google-dark tracking-tight">
            Google Developer Groups
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-google-dark tracking-tight leading-tight mb-1.5">
            Cloud Ahmedabad
          </h1>
          <div className="px-6 py-0.5 bg-white border-2 border-google-dark rounded-full text-sm sm:text-base font-black tracking-widest shadow-brutal text-google-dark">
            BINGO
          </div>
        </div>

        <img
          src="/assets/right_bracket.png"
          alt="}"
          className="w-6 sm:w-8 h-auto select-none"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-google-red rounded-xl text-xs text-google-red font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-google-dark mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-google-blue" /> Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-google-dark rounded-xl text-sm font-medium focus:outline-none focus:border-google-blue focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-google-dark mb-1 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-google-red" /> Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-google-dark rounded-xl text-sm font-medium focus:outline-none focus:border-google-blue focus:bg-white transition"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 bg-google-blue text-white font-extrabold text-sm border-2 border-google-dark rounded-xl flex items-center justify-center gap-2 shadow-brutal hover:bg-blue-600 active:shadow-none transition disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Enter Bingo</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
