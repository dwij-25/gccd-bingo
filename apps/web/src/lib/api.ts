import { tempDatabase } from './tempDatabase.js';

const API_BASE = '/api';
const CURRENT_USER_KEY = 'gccd_bingo_active_user_v1';
const CURRENT_EMAIL_KEY = 'gccd_bingo_active_email_v1';

export class ApiError extends Error {
  public status: number;
  public details?: any;
  public hint?: string;

  constructor(message: string, status: number, details?: any, hint?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.hint = hint;
  }
}

function getActiveUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_USER_KEY);
}

function setActiveUserId(id: string | null, email?: string) {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(CURRENT_USER_KEY, id);
    if (email) localStorage.setItem(CURRENT_EMAIL_KEY, email.trim().toLowerCase());
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(CURRENT_EMAIL_KEY);
  }
}

function getActiveUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_EMAIL_KEY);
}

export const api = {
  async login(name: string, email: string) {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Vercel Serverless / Cloud Database API first
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: cleanName, email: cleanEmail })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.participant?.id) {
          setActiveUserId(data.participant.id, data.participant.email);
        }
        return data;
      }
      const errData = await res.json().catch(() => ({}));
      if (res.status === 400 || res.status === 404) {
        throw new ApiError(errData.error || 'Login verification failed', res.status);
      }
    } catch (e: any) {
      if (e instanceof ApiError) throw e;
      console.warn('Serverless API call failed, falling back to local database sync', e);
    }

    // 2. Fallback to tempDatabase (preserves offline/local storage)
    try {
      const res = tempDatabase.login(cleanName, cleanEmail);
      setActiveUserId(res.participant.id, res.participant.email);
      return {
        success: true,
        participant: res.participant,
        card: res.card,
        token: res.token
      };
    } catch (err: any) {
      throw new ApiError(err.message || 'Login failed', 400);
    }
  },

  async logout() {
    setActiveUserId(null);
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    return { success: true };
  },

  async getMe() {
    const activeUserId = getActiveUserId();
    const activeEmail = getActiveUserEmail();
    if (!activeUserId && !activeEmail) {
      throw new ApiError('Not authenticated', 401);
    }

    try {
      const query = activeEmail ? `email=${encodeURIComponent(activeEmail)}` : `participantId=${encodeURIComponent(activeUserId || '')}`;
      const res = await fetch(`${API_BASE}/auth/me?${query}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.participant?.id) {
          setActiveUserId(data.participant.id, data.participant.email);
        }
        return data;
      }
    } catch {
      // ignore
    }

    if (activeUserId) {
      const card = tempDatabase.getCard(activeUserId);
      const sub = tempDatabase.getAdminSubmissions().submissions.find(s => s.id === card.id);
      return {
        success: true,
        participant: {
          id: activeUserId,
          name: sub?.participant_name || 'Attendee',
          email: sub?.email || activeEmail || '',
          organization: sub?.organization || 'Community Member'
        },
        card
      };
    }

    throw new ApiError('Not authenticated', 401);
  },

  async getCard() {
    const activeUserId = getActiveUserId();
    if (!activeUserId) throw new ApiError('Not authenticated', 401);

    try {
      const res = await fetch(`${API_BASE}/card?participantId=${encodeURIComponent(activeUserId)}`, { credentials: 'include' });
      if (res.ok) return await res.json();
    } catch {
      // ignore
    }

    const card = tempDatabase.getCard(activeUserId);
    return { success: true, card };
  },

  async uploadTile(tileIndex: number, image: string, cropData?: any, onProgress?: (pct: number) => void) {
    const activeUserId = getActiveUserId();
    if (!activeUserId) throw new ApiError('Not authenticated', 401);

    if (onProgress) onProgress(35);

    try {
      const res = await fetch(`${API_BASE}/card/tiles/${tileIndex}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          participantId: activeUserId,
          image,
          cropData
        })
      });

      if (res.ok) {
        if (onProgress) onProgress(100);
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      throw new ApiError(errData.error || 'Server upload failed', res.status);
    } catch (e: any) {
      if (e instanceof ApiError) throw e;
      console.warn('Server upload failed, falling back to temp database', e);
    }

    // Fallback to local tempDatabase
    const result = tempDatabase.uploadTile(activeUserId, tileIndex, image);
    if (onProgress) onProgress(100);
    return result;
  },

  async removeTile(tileIndex: number) {
    const activeUserId = getActiveUserId();
    if (!activeUserId) throw new ApiError('Not authenticated', 401);

    try {
      const res = await fetch(`${API_BASE}/card/tiles/${tileIndex}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ participantId: activeUserId })
      });
      if (res.ok) return await res.json();
    } catch {
      // ignore
    }

    return tempDatabase.removeTile(activeUserId, tileIndex);
  },

  async saveDraft(tiles: any[]) {
    const activeUserId = getActiveUserId();
    if (!activeUserId) throw new ApiError('Not authenticated', 401);

    try {
      const res = await fetch(`${API_BASE}/card/save-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ participantId: activeUserId, tiles })
      });
      if (res.ok) return await res.json();
      const errData = await res.json().catch(() => ({}));
      throw new ApiError(errData.error || 'Save draft failed', res.status);
    } catch (e: any) {
      if (e instanceof ApiError) throw e;
      console.warn('Server save draft failed, saving to temp database', e);
    }

    return tempDatabase.saveDraft(activeUserId, tiles);
  },

  async submitCard() {
    const activeUserId = getActiveUserId();
    if (!activeUserId) throw new ApiError('Not authenticated', 401);

    try {
      const res = await fetch(`${API_BASE}/card/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ participantId: activeUserId })
      });
      if (res.ok) return await res.json();
      const errData = await res.json().catch(() => ({}));
      throw new ApiError(errData.error || 'Submit failed', res.status);
    } catch (e: any) {
      if (e instanceof ApiError) throw e;
      console.warn('Server submit failed, submitting to temp database', e);
    }

    return tempDatabase.submitCard(activeUserId);
  },

  async resetCard() {
    const activeUserId = getActiveUserId();
    if (!activeUserId) throw new ApiError('Not authenticated', 401);

    try {
      const res = await fetch(`${API_BASE}/card/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ participantId: activeUserId })
      });
      if (res.ok) return await res.json();
      const errData = await res.json().catch(() => ({}));
      throw new ApiError(errData.error || 'Reset failed', res.status);
    } catch (e: any) {
      if (e instanceof ApiError) throw e;
      console.warn('Server reset failed, resetting in temp database', e);
    }

    return tempDatabase.resetCard(activeUserId);
  },

  async checkBingo(bingoId: string) {
    try {
      const res = await fetch(`${API_BASE}/bingo/${encodeURIComponent(bingoId.trim().toUpperCase())}`);
      if (res.ok) return await res.json();
    } catch {
      // ignore
    }

    return tempDatabase.checkBingo(bingoId);
  },

  async getWinners() {
    try {
      const res = await fetch(`${API_BASE}/winners`);
      if (res.ok) return await res.json();
    } catch {
      // ignore
    }

    return tempDatabase.getWinners();
  },

  async getAdminSubmissions(status?: string, adminKey?: string) {
    try {
      const headers: Record<string, string> = {};
      if (adminKey) headers['x-admin-key'] = adminKey;
      const url = status ? `${API_BASE}/admin/submissions?status=${status}` : `${API_BASE}/admin/submissions`;
      const res = await fetch(url, { headers, credentials: 'include' });
      if (res.ok) return await res.json();
    } catch {
      // ignore
    }

    return tempDatabase.getAdminSubmissions(status);
  },

  async adminMarkWinner(bingoId: string, isWinner: boolean, winTier?: string, adminKey?: string) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminKey) headers['x-admin-key'] = adminKey;
      const res = await fetch(`${API_BASE}/admin/verify-winner`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ bingoId, isWinner, winTier })
      });
      if (res.ok) return await res.json();
    } catch {
      // ignore
    }

    return tempDatabase.adminMarkWinner(bingoId, isWinner, winTier);
  },

  async adminResetDatabase(adminKey?: string) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminKey) headers['x-admin-key'] = adminKey;
      const res = await fetch(`${API_BASE}/admin/reset-database`, {
        method: 'POST',
        headers,
        credentials: 'include'
      });
      if (res.ok) return await res.json();
    } catch {
      // ignore
    }
  }
};
