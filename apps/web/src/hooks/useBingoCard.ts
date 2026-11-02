import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';
import { BingoCard, BingoTile } from '../types/bingo.js';
import { useToast } from '../components/Toast.js';
import { CropData } from '../components/CropAdjustModal.js';

export function useBingoCard(initialCard: BingoCard | null) {
  const [card, setCard] = useState<BingoCard | null>(initialCard);
  const [flippedTileIndex, setFlippedTileIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { showSuccess, showError } = useToast();

  // Rehydrate card on mount / load (stabilized by ID to prevent cyclical re-renders)
  useEffect(() => {
    if (initialCard && (!card || card.id !== initialCard.id)) {
      // Rehydrate tile statuses: If tile has an image_url, status MUST be 'completed' and dot is GREEN
      const rehydratedTiles = initialCard.tiles.map(t => ({
        ...t,
        status: (t.image_url && t.image_url.trim().length > 0) ? ('completed' as const) : ('not_finished' as const)
      }));

      const totalCompleted = rehydratedTiles.filter(t => t.status === 'completed' && t.image_url).length;

      setCard({
        ...initialCard,
        tiles: rehydratedTiles,
        total_completed: totalCompleted
      });

      if (initialCard.updated_at) {
        const d = new Date(initialCard.updated_at);
        setLastSavedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } else if (!initialCard) {
      setCard(null);
    }
  }, [initialCard?.id]);

  // Unsaved changes browser warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && card?.status === 'draft') {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes to your Bingo card! Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, card?.status]);

  // Flip toggle
  const toggleFlip = useCallback((index: number) => {
    setFlippedTileIndex(prev => (prev === index ? null : index));
  }, []);

  // Upload cropped photo (called after CropAdjustModal confirm)
  const uploadCroppedPhoto = useCallback(async (tileIndex: number, croppedDataUrl: string, cropData: CropData) => {
    if (!card || card.status !== 'draft') return;

    try {
      setUploadProgress(prev => ({ ...prev, [tileIndex]: 30 }));
      setSaveError(null);

      const res = await api.uploadTile(tileIndex, croppedDataUrl, cropData, (pct) => {
        setUploadProgress(prev => ({ ...prev, [tileIndex]: Math.max(30, pct) }));
      });

      if (res.success) {
        // Update local card tiles
        setCard(prev => {
          if (!prev) return null;
          const updatedTiles = prev.tiles.map(t => {
            if (t.tile_index === tileIndex) {
              return {
                ...t,
                status: 'completed' as const,
                image_url: res.imageUrl,
                crop_data: JSON.stringify(cropData),
                uploaded_at: res.updatedAt
              };
            }
            return t;
          });

          const totalCompleted = updatedTiles.filter(t => t.status === 'completed' && t.image_url).length;

          return {
            ...prev,
            total_completed: totalCompleted,
            updated_at: res.updatedAt,
            tiles: updatedTiles
          };
        });

        const d = new Date();
        setLastSavedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setHasUnsavedChanges(false);
        setSaveError(null);
        showSuccess('Photo Saved', `Challenge #${tileIndex + 1} completed and saved to database.`);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to save photo to database.';
      setSaveError(msg);
      showError('Upload Error', msg);
      throw err;
    } finally {
      setUploadProgress(prev => {
        const copy = { ...prev };
        delete copy[tileIndex];
        return copy;
      });
    }
  }, [card, showSuccess, showError]);

  // Remove Photo from tile
  const removePhoto = useCallback(async (tileIndex: number) => {
    if (!card || card.status !== 'draft') return;

    try {
      setSaveError(null);
      const res = await api.removeTile(tileIndex);
      if (res.success) {
        setCard(prev => {
          if (!prev) return null;
          const updatedTiles = prev.tiles.map(t => {
            if (t.tile_index === tileIndex) {
              return {
                ...t,
                status: 'not_finished' as const,
                image_url: null,
                crop_data: null,
                uploaded_at: null
              };
            }
            return t;
          });

          const totalCompleted = updatedTiles.filter(t => t.status === 'completed' && t.image_url).length;

          return {
            ...prev,
            total_completed: totalCompleted,
            updated_at: res.updatedAt,
            tiles: updatedTiles
          };
        });

        const d = new Date();
        setLastSavedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setHasUnsavedChanges(false);
        showSuccess('Photo Removed', `Tile #${tileIndex + 1} reset to not finished.`);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to remove photo.';
      setSaveError(msg);
      showError('Removal Error', msg);
      throw err;
    }
  }, [card, showSuccess, showError]);

  // Save Draft manually (Waits for all in-flight uploads to finish)
  const saveDraft = useCallback(async () => {
    if (!card || card.status !== 'draft' || isSaving) return;

    // Check for pending active uploads (fixes race condition)
    if (Object.keys(uploadProgress).length > 0) {
      showError('Uploads in progress', 'Please wait a moment for your active photo uploads to finish before saving draft.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await api.saveDraft(card.tiles);
      if (res.success) {
        const d = new Date(res.savedAt || Date.now());
        setLastSavedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setHasUnsavedChanges(false);
        showSuccess('Draft Saved & Synced', 'All challenge photos are safely saved in the cloud database.');
      }
      return res;
    } catch (err: any) {
      const msg = err.message || 'Failed to save draft to database.';
      setSaveError(msg);
      showError('Draft Save Failed', msg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [card, isSaving, uploadProgress, showSuccess, showError]);

  // Submit Card
  const submitCard = useCallback(async () => {
    if (!card || card.status !== 'draft') return;

    const completed = card.tiles.filter(t => t.image_url && t.image_url.trim().length > 0).length;
    if (completed < 9) {
      showError('Cannot Submit', `Only ${completed} of 9 challenges are completed. All 9 tiles must be green.`);
      return;
    }

    try {
      const res = await api.submitCard();
      if (res.success) {
        setCard(prev => prev ? {
          ...prev,
          status: 'submitted',
          submitted_at: res.card.submitted_at || new Date().toISOString()
        } : null);
        setHasUnsavedChanges(false);
        setSaveError(null);
        showSuccess('Bingo Submitted!', `Your card is finalized with ID: ${card.bingo_id}`);
      }
      return res;
    } catch (err: any) {
      const msg = err.message || 'Submit failed.';
      showError('Submission Error', msg);
      throw err;
    }
  }, [card, showSuccess, showError]);

  return {
    card,
    setCard,
    flippedTileIndex,
    toggleFlip,
    uploadProgress,
    uploadCroppedPhoto,
    removePhoto,
    saveDraft,
    submitCard,
    isSaving,
    saveError,
    lastSavedTime,
    hasUnsavedChanges
  };
}
