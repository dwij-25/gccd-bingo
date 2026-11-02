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
import { ToastProvider, useToast } from './components/Toast.js';
import { CropAdjustModal, CropData } from './components/CropAdjustModal.js';
import { CameraCaptureModal } from './components/CameraCaptureModal.js';

function BingoApp() {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Camera Capture Modal State
  const [cameraModalState, setCameraModalState] = useState<{
    isOpen: boolean;
    tileIndex: number;
    tileTitle: string;
  }>({
    isOpen: false,
    tileIndex: 0,
    tileTitle: ''
  });

  // Crop & Adjust Modal State (Issue 4)
  const [cropModalState, setCropModalState] = useState<{
    isOpen: boolean;
    tileIndex: number;
    imageSrc: string;
    tileTitle: string;
    initialCropData?: CropData | null;
  }>({
    isOpen: false,
    tileIndex: 0,
    imageSrc: '',
    tileTitle: ''
  });

  const { participant, card, isLoading, error, login, logout, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();

  const {
    card: activeCard,
    flippedTileIndex,
    toggleFlip,
    uploadProgress,
    uploadCroppedPhoto,
    removePhoto,
    resetProgress,
    saveDraft,
    submitCard,
    isSaving,
    saveError,
    lastSavedTime
  } = useBingoCard(card);

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

  // Open live camera capture interface
  const handleInitiateCamera = (index: number, tileTitle: string) => {
    setCameraModalState({
      isOpen: true,
      tileIndex: index,
      tileTitle
    });
  };

  const handleCameraCaptured = (dataUrl: string) => {
    const { tileIndex, tileTitle } = cameraModalState;
    setCameraModalState(prev => ({ ...prev, isOpen: false }));

    // Open crop & adjust modal with captured picture
    setCropModalState({
      isOpen: true,
      tileIndex,
      imageSrc: dataUrl,
      tileTitle,
      initialCropData: null
    });
  };

  // Open crop modal when user clicks "Adjust" on an existing photo
  const handleAdjustPhoto = (index: number) => {
    const tile = activeCard?.tiles.find(t => t.tile_index === index);
    if (tile && tile.image_url) {
      let parsedCrop: CropData | null = null;
      if (tile.crop_data) {
        try {
          parsedCrop = JSON.parse(tile.crop_data);
        } catch {
          // ignore
        }
      }
      setCropModalState({
        isOpen: true,
        tileIndex: index,
        imageSrc: tile.image_url,
        tileTitle: tile.title,
        initialCropData: parsedCrop
      });
    }
  };

  const handleConfirmCrop = async (croppedDataUrl: string, cropData: CropData) => {
    await uploadCroppedPhoto(cropModalState.tileIndex, croppedDataUrl, cropData);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitCard();
      setIsSubmitModalOpen(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 6000);
      setIsCheckModalOpen(true);
    } catch (err: any) {
      showError('Submission Error', err.message || 'Failed to submit card');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between overflow-x-hidden bg-white sm:bg-[#F8F9FA] text-[#202124]">
      {/* Background Dots */}
      <div className="fixed inset-0 pointer-events-none ambient-dots-bg opacity-15 z-0 hidden sm:block" />

      {/* Confetti Celebration */}
      <ConfettiCanvas active={showConfetti} />

      {/* Navigation (Only displayed when authenticated on the bingo board) */}
      {isAuthenticated && activeCard && (
        <Navbar
          onOpenRulesModal={() => setIsRulesModalOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start sm:justify-center p-0 sm:p-6 w-full max-w-full">
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
            onInitiateCamera={handleInitiateCamera}
            onAdjustPhoto={handleAdjustPhoto}
            onRemovePhoto={removePhoto}
            onSaveDraft={saveDraft}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
            onOpenCheckModal={() => setIsCheckModalOpen(true)}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onLogout={logout}
            isSaving={isSaving}
            saveError={saveError}
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

          <CameraCaptureModal
            isOpen={cameraModalState.isOpen}
            onClose={() => setCameraModalState(prev => ({ ...prev, isOpen: false }))}
            tileTitle={cameraModalState.tileTitle}
            onCapture={handleCameraCaptured}
          />

          <CropAdjustModal
            isOpen={cropModalState.isOpen}
            onClose={() => setCropModalState(prev => ({ ...prev, isOpen: false }))}
            imageSrc={cropModalState.imageSrc}
            tileTitle={cropModalState.tileTitle}
            initialCropData={cropModalState.initialCropData}
            onConfirmCrop={handleConfirmCrop}
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

      {/* Footer (Clean, no organizer portal link on main page) */}
      <footer className="hidden sm:flex relative z-10 w-full py-4 text-center text-xs text-google-grey font-medium border-t border-gray-200 items-center justify-center">
        <span>Google Developer Groups Cloud Ahmedabad • 2026</span>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <BingoApp />
    </ToastProvider>
  );
}
