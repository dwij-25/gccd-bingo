import React from 'react';
import { Volume2, VolumeX, Moon, Sun, Shield, Search } from 'lucide-react';
import { sound } from '../lib/audio.js';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenCheckModal: () => void;
  onOpenAdminModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  onOpenCheckModal,
  onOpenAdminModal
}) => {
  const [soundOn, setSoundOn] = React.useState(sound.enabled);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundOn(sound.enabled);
  };

  return (
    <header className="w-full max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
      {/* Brand Badge */}
      <div className="flex items-center gap-2.5 bg-white dark:bg-[#1E1E1E] px-4 py-2 rounded-full border-2 border-google-dark dark:border-white/20 shadow-brutal">
        <svg width="22" height="22" viewBox="0 0 48 48">
          <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC04" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        <span className="font-extrabold text-xs md:text-sm tracking-wide">
          GCCD <span className="text-google-blue">•</span> DevFest Bingo
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCheckModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-white dark:bg-[#1E1E1E] border-2 border-google-dark dark:border-white/20 hover:bg-gray-100 dark:hover:bg-gray-800 transition shadow-brutal"
          title="Check Result by Bingo ID"
        >
          <Search className="w-3.5 h-3.5 text-google-blue" />
          <span>Check Status</span>
        </button>

        <button
          onClick={toggleSound}
          className="p-2 rounded-full bg-white dark:bg-[#1E1E1E] border-2 border-google-dark dark:border-white/20 hover:bg-gray-100 dark:hover:bg-gray-800 transition shadow-brutal"
          title={soundOn ? "Mute Sound Effects" : "Enable Sound Effects"}
          aria-label="Toggle Sound"
        >
          {soundOn ? <Volume2 className="w-4 h-4 text-google-green" /> : <VolumeX className="w-4 h-4 text-google-grey" />}
        </button>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-white dark:bg-[#1E1E1E] border-2 border-google-dark dark:border-white/20 hover:bg-gray-100 dark:hover:bg-gray-800 transition shadow-brutal"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-google-yellow" /> : <Moon className="w-4 h-4 text-google-blue" />}
        </button>

        <button
          onClick={onOpenAdminModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-white dark:bg-[#1E1E1E] border-2 border-google-dark dark:border-white/20 hover:bg-gray-100 dark:hover:bg-gray-800 transition shadow-brutal"
          title="Organizer Management Dashboard"
        >
          <Shield className="w-3.5 h-3.5 text-google-red" />
          <span className="hidden md:inline">Organizer</span>
        </button>
      </div>
    </header>
  );
};
