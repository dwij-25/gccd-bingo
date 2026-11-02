import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api.js';
import { sound } from '../lib/audio.js';
import { compressImage } from '../lib/imageCompressor.js';
import { BingoCard, BingoTile } from '../types/bingo.js';

export function useBingoCard(initialCard: BingoCard | null) {
  const [card, setCard] = useState<BingoCard | null>(initialCard);
  const [flippedTileIndex, setFlippedTileIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (initialCard) {
      setCard(initialCard);
      if (initialCard.updated_at) {
        const d = new Date(initialCard.updated_at);
        setLastSavedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    }
  }, [initialCard]);

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
    sound.playFlip();
  }, []);

  // Upload Photo for tile
  const uploadPhoto = useCallback(async (tileIndex: number, rawFile: File) => {
    if (!card || card.status !== 'draft') return;

    try {
      setUploadProgress(prev => ({ ...prev, [tileIndex]: 10 }));
      
      // Client-side compression
      const compressed = await compressImage(rawFile);
      setUploadProgress(prev => ({ ...prev, [tileIndex]: 30 }));

      const res = await api.uploadTile(tileIndex, compressed, (pct) => {
        setUploadProgress(prev => ({ ...prev, [tileIndex]: Math.max(30, pct) }));
      });

      if (res.success) {
        sound.playUpload();

        // Update local card tiles
        setCard(prev => {
          if (!prev) return null;
          const updatedTiles = prev.tiles.map(t => {
            if (t.tile_index === tileIndex) {
              return {
                ...t,
                status: 'completed' as const,
                image_url: res.imageUrl,
                uploaded_at: res.updatedAt
              };
            }
            return t;
          });
          return {
            ...prev,
            total_completed: res.totalCompleted,
            updated_at: res.updatedAt,
            tiles: updatedTiles
          };
        });

        const d = new Date();
        setLastSavedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setHasUnsavedChanges(false);

        if (res.canSubmit) {
          sound.playWin();
        }
      }
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      throw err;
    } finally {
      setUploadProgress(prev => {
        const copy = { ...prev };
        delete copy[tileIndex];
        return copy;
      });
    }
  }, [card]);

  // Remove Photo from tile
  const removePhoto = useCallback(async (tileIndex: number) => {
    if (!card || card.status !== 'draft') return;

    try {
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
                uploaded_at: null
              };
            }
            return t;
          });
          return {
            ...prev,
            total_completed: res.totalCompleted,
            updated_at: res.updatedAt,
            tiles: updatedTiles
          };
        });

        const d = new Date();
        setLastSavedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Failed to remove photo:', err);
      throw err;
    }
  }, [card]);

  // Save Draft manually
  const saveDraft = useCallback(async () => {
    if (!card || card.status !== 'draft' || isSaving) return;

    setIsSaving(true);
    try {
      const res = await api.saveDraft(card.tiles);
      if (res.success) {
        sound.playSave();
        const d = new Date(res.timestamp);
        setLastSavedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setHasUnsavedChanges(false);
      }
      return res;
    } finally {
      setIsSaving(false);
    }
  }, [card, isSaving]);

  // Submit Card
  const submitCard = useCallback(async () => {
    if (!card || card.total_completed < 9 || card.status !== 'draft') return;

    try {
      const res = await api.submitCard();
      if (res.success) {
        sound.playWin();
        setCard(prev => prev ? {
          ...prev,
          status: 'submitted',
          submitted_at: res.submittedAt,
          win_tier: res.winEvaluation.winTier
        } : null);
        setHasUnsavedChanges(false);
      }
      return res;
    } catch (err) {
      console.error('Submit error:', err);
      throw err;
    }
  }, [card]);

  return {
    card,
    setCard,
    flippedTileIndex,
    toggleFlip,
    uploadProgress,
    uploadPhoto,
    removePhoto,
    saveDraft,
    submitCard,
    isSaving,
    lastSavedTime,
    hasUnsavedChanges
  };
}
