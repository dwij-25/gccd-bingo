import { tempDatabase } from './tempDatabase.js';

const metaEnv = (import.meta as any).env;
const VITE_API_URL = metaEnv?.VITE_API_URL;
const API_BASE = VITE_API_URL ? `${VITE_API_URL}/api` : '/api';
const CURRENT_USER_KEY = 'gccd_bingo_active_user_v1';

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

function setActiveUserId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(CURRENT_USER_KEY, id);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const api = {
  async login(name: string, email: string) {
    // Try backend API first if configured
    if (VITE_API_URL) {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name, email })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.participant?.id) {
            setActiveUserId(data.participant.id);
          }
          return data;
        }
      } catch (e) {
        console.warn('Backend API unreachable, falling back to temporary database', e);
      }
    }

    // Temporary database handler (seamless in-browser persistence)
    try {
      const res = tempDatabase.login(name, email);
      setActiveUserId(res.participant.id);
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
    if (VITE_API_URL) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch {
        // ignore
      }
    }
    return { success: true };
  },

  async getMe() {
    const activeUserId = getActiveUserId();
    if (!activeUserId) {
      throw new ApiError('Not authenticated', 401);
    }

    // Try backend if active
    if (VITE_API_URL) {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
        if (res.ok) return await res.json();
      } catch {
        // ignore
      }
    }

    // Fallback to tempDatabase
    const card = tempDatabase.getCard(activeUserId);
    const submissions = tempDatabase.getAdminSubmissions().submissions;
    const sub = submissions.find(s => s.id === card.id);
    const participant = {
      id: activeUserId,
      name: sub?.participant_name || 'Attendee',
      email: sub?.email || '',
      organization: sub?.organization || 'Community Member'
    };

    return {
      success: true,
      participant,
      card
    };
  },

  async getCard() {
    const activeUserId = getActiveUserId();
    if (!activeUserId) {
      throw new ApiError('Not authenticated', 401);
    }

    if (VITE_API_URL) {
      try {
        const res = await fetch(`${API_BASE}/card`, { credentials: 'include' });
        if (res.ok) return await res.json();
      } catch {
        // ignore
      }
    }

    const card = tempDatabase.getCard(activeUserId);
    return { success: true, card };
  },

  async uploadTile(tileIndex: number, file: File, onProgress?: (pct: number) => void) {
    const activeUserId = getActiveUserId();
    if (!activeUserId) {
      throw new ApiError('Not authenticated', 401);
    }

    if (onProgress) onProgress(40);

    if (VITE_API_URL) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`${API_BASE}/card/tiles/${tileIndex}`, {
          method: 'PUT',
          credentials: 'include',
          body: formData
        });
        if (res.ok) {
          if (onProgress) onProgress(100);
          return await res.json();
        }
      } catch (e) {
        console.warn('Backend upload failed, saving to temporary database', e);
      }
    }

    const dataUrl = await fileToDataUrl(file);
    if (onProgress) onProgress(90);

    const result = tempDatabase.uploadTile(activeUserId, tileIndex, dataUrl);
    if (onProgress) onProgress(100);

    return result;
  },

  async removeTile(tileIndex: number) {
    const activeUserId = getActiveUserId();
    if (!activeUserId) {
      throw new ApiError('Not authenticated', 401);
    }

    if (VITE_API_URL) {
      try {
        const res = await fetch(`${API_BASE}/card/tiles/${tileIndex}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (res.ok) return await res.json();
      } catch {
        // ignore
      }
    }

    return tempDatabase.removeTile(activeUserId, tileIndex);
  },

  async saveDraft(tiles: any[]) {
    const activeUserId = getActiveUserId();
    if (!activeUserId) {
      throw new ApiError('Not authenticated', 401);
    }

    if (VITE_API_URL) {
      try {
        const res = await fetch(`${API_BASE}/card/save-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ tiles })
        });
        if (res.ok) return await res.json();
      } catch {
        // ignore
      }
    }

    return tempDatabase.saveDraft(activeUserId, tiles);
  },

  async submitCard() {
    const activeUserId = getActiveUserId();
    if (!activeUserId) {
      throw new ApiError('Not authenticated', 401);
    }

    if (VITE_API_URL) {
      try {
        const res = await fetch(`${API_BASE}/card/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ confirmSubmit: true })
        });
        if (res.ok) return await res.json();
      } catch {
        // ignore
      }
    }

    return tempDatabase.submitCard(activeUserId);
  },

  async checkBingo(bingoId: string) {
    if (VITE_API_URL) {
      try {
        const res = await fetch(`${API_BASE}/bingo/${encodeURIComponent(bingoId)}`);
        if (res.ok) return await res.json();
      } catch {
        // ignore
      }
    }

    return tempDatabase.checkBingo(bingoId);
  },

  // Admin APIs
  async getAdminSubmissions(status?: string, adminKey?: string) {
    if (VITE_API_URL) {
      try {
        const headers: Record<string, string> = {};
        if (adminKey) headers['x-admin-key'] = adminKey;
        const url = status ? `${API_BASE}/admin/submissions?status=${status}` : `${API_BASE}/admin/submissions`;
        const res = await fetch(url, { headers, credentials: 'include' });
        if (res.ok) return await res.json();
      } catch {
        // ignore
      }
    }

    return tempDatabase.getAdminSubmissions(status);
  },

  async adminMarkWinner(bingoId: string, isWinner: boolean, winTier?: string, adminKey?: string) {
    if (VITE_API_URL) {
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
    }

    return tempDatabase.adminMarkWinner(bingoId, isWinner, winTier);
  }
};
