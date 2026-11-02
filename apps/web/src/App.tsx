import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth.js';
import { useBingoCard } from './hooks/useBingoCard.js';
import { Navbar } from './components/Navbar.js';
import { LoginGate } from './components/LoginGate.js';
import { BingoBoard } from './components/BingoBoard.js';
import { SubmitModal } from './components/SubmitModal.js';
import { CheckResultModal } from './components/CheckResultModal.js';
import { RulesModal } from './components/RulesModal.js';
import { AdminPanel } from './components/AdminPanel.js';
import { CardExporter } from './components/CardExporter.js';
import { ConfettiCanvas } from './components/ConfettiCanvas.js';

export function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { participant, card, setCard, isLoading, error, login, logout, isAuthenticated } = useAuth();

  const {
    card: activeCard,
    flippedTileIndex,
    toggleFlip,
    uploadProgress,
    uploadPhoto,
    removePhoto,
    saveDraft,
    submitCard,
    isSaving,
    lastSavedTime
  } = useBingoCard(card);

  // Sync activeCard back to Auth state
  useEffect(() => {
    if (activeCard) {
      setCard(activeCard);
    }
  }, [activeCard, setCard]);

  // Dark mode class toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Direct URL navigation for Organizer Portal: /admin or ?admin=true or #admin
  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || search.includes('admin=true') || hash === '#admin') {
        setIsAdminModalOpen(true);
      }
    };
    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    window.addEventListener('hashchange', checkAdminRoute);

    // Keyboard shortcut for organizers: Alt+A or Ctrl+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'a') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setIsAdminModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', checkAdminRoute);
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCloseAdmin = () => {
    setIsAdminModalOpen(false);
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path === '/admin' || search.includes('admin=true') || hash === '#admin') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitCard();
      setIsSubmitModalOpen(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 6000);
      setIsCheckModalOpen(true);
    } catch (err: any) {
      alert('Submission error: ' + (err.message || 'Failed to submit card'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Background Dots */}
      <div className="fixed inset-0 pointer-events-none ambient-dots-bg opacity-15 dark:opacity-10 z-0" />

      {/* Confetti Celebration */}
      <ConfettiCanvas active={showConfetti} />

      {/* Navigation */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-3 sm:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-16 animate-pulse">
            <div className="w-12 h-12 border-4 border-google-blue border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-google-grey">Loading GCCD Bingo...</span>
          </div>
        ) : !isAuthenticated || !activeCard ? (
          <LoginGate onLogin={login} isLoading={isLoading} error={error} />
        ) : (
          <BingoBoard
            participant={participant!}
            card={activeCard}
            flippedIndex={flippedTileIndex}
            onToggleFlip={toggleFlip}
            onUploadPhoto={uploadPhoto}
            onRemovePhoto={removePhoto}
            onSaveDraft={saveDraft}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
            onOpenCheckModal={() => setIsCheckModalOpen(true)}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onLogout={logout}
            isSaving={isSaving}
            lastSavedTime={lastSavedTime}
            uploadProgress={uploadProgress}
          />
        )}
      </main>

      {/* Modals */}
      {activeCard && (
        <>
          <SubmitModal
            isOpen={isSubmitModalOpen}
            onClose={() => setIsSubmitModalOpen(false)}
            onConfirm={handleConfirmSubmit}
            isSubmitting={isSubmitting}
            bingoId={activeCard.bingo_id}
          />

          <CardExporter
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            participant={participant!}
            card={activeCard}
          />
        </>
      )}

      {/* Rules & Regulations Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* View Submission and Win Status Modal */}
      <CheckResultModal
        isOpen={isCheckModalOpen}
        onClose={() => setIsCheckModalOpen(false)}
        defaultBingoId={activeCard?.bingo_id || ''}
      />

      {/* Protected Organizer Admin Panel (Accessible via direct URL /admin or ?admin=true) */}
      <AdminPanel
        isOpen={isAdminModalOpen}
        onClose={handleCloseAdmin}
      />

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-google-grey dark:text-gray-500 font-medium border-t border-gray-200 dark:border-gray-800 flex items-center justify-center gap-2">
        <span>Google Cloud Developer Community Day 2026 • Built for community, learning, and celebration.</span>
        <a
          href="?admin=true"
          onClick={(e) => {
            e.preventDefault();
            setIsAdminModalOpen(true);
            window.history.pushState({}, '', '?admin=true');
          }}
          className="text-gray-400 dark:text-gray-600 hover:text-google-blue hover:underline transition"
          title="Direct link for event organizers"
        >
          [Organizer Portal]
        </a>
      </footer>
    </div>
  );
}
