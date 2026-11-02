import React, { useState } from 'react';
import { User, Mail, ArrowRight, AlertCircle, Info } from 'lucide-react';

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
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-[#1E1E1E] border-3 border-google-dark dark:border-white/30 rounded-3xl p-6 sm:p-8 shadow-brutal-lg transition-all animate-fadeIn">
      <div className="w-16 h-16 bg-tile-yellow border-3 border-google-dark rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl shadow-brutal">
        🪪
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-center text-google-dark dark:text-white mb-2">
        Join GCCD Bingo
      </h1>
      <p className="text-sm text-center text-google-grey dark:text-gray-400 mb-6 leading-relaxed">
        Enter your registered Name & Email from the Google Cloud Community Day attendee list to load or resume your Bingo Card.
      </p>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border-2 border-google-red rounded-xl text-xs sm:text-sm text-google-red font-semibold flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p>{error}</p>
            <p className="font-normal text-xs mt-1 text-red-600 dark:text-red-400">
              Tip: If you registered at the event entrance, please consult an organizer at the GCCD registration desk.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-google-dark dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-google-blue" /> Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dwij Pancholi"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-google-dark dark:border-white/20 rounded-xl text-sm font-medium focus:outline-none focus:border-google-blue focus:bg-white dark:focus:bg-gray-900 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-google-dark dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-google-red" /> Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. dwij@example.com"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-google-dark dark:border-white/20 rounded-xl text-sm font-medium focus:outline-none focus:border-google-blue focus:bg-white dark:focus:bg-gray-900 transition"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-google-blue text-white font-extrabold text-sm sm:text-base border-2 border-google-dark rounded-xl flex items-center justify-center gap-2 shadow-brutal hover:bg-blue-600 active:shadow-brutal-active active:translate-x-0.5 active:translate-y-0.5 transition disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verifying Attendee Database...</span>
            </>
          ) : (
            <>
              <span>Verify & Enter Bingo</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-center gap-1.5 text-xs text-google-grey dark:text-gray-400">
        <Info className="w-3.5 h-3.5 text-google-blue" />
        <span>Your card auto-saves in real-time as you complete challenges.</span>
      </div>
    </div>
  );
};
