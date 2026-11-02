import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../lib/api.js';
import { Participant, BingoCard } from '../types/bingo.js';

export function useAuth() {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [card, setCard] = useState<BingoCard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session from cookie or cached email
  useEffect(() => {
    async function initSession() {
      try {
        const res = await api.getMe();
        if (res.success && res.participant) {
          setParticipant(res.participant);
          setCard(res.card);
        }
      } catch {
        // Not logged in or expired
      } finally {
        setIsLoading(false);
      }
    }
    initSession();
  }, []);

  const login = useCallback(async (name: string, email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login(name, email);
      setParticipant(res.participant);
      setCard(res.card);
      return res;
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Login failed. Please try again.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setParticipant(null);
      setCard(null);
    }
  }, []);

  return {
    participant,
    card,
    setCard,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: Boolean(participant)
  };
}
