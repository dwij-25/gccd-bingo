const API_BASE = '/api';

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

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || 'Server request failed', res.status, data.details, data.hint);
  }
  return data as T;
}

export const api = {
  async login(name: string, email: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email })
    });
    return handleResponse<any>(res);
  },

  async logout() {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return handleResponse<any>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include'
    });
    return handleResponse<any>(res);
  },

  async getCard() {
    const res = await fetch(`${API_BASE}/card`, {
      credentials: 'include'
    });
    return handleResponse<any>(res);
  },

  async uploadTile(tileIndex: number, file: File, onProgress?: (pct: number) => void) {
    const formData = new FormData();
    formData.append('image', file);

    const xhr = new XMLHttpRequest();
    return new Promise<any>((resolve, reject) => {
      xhr.open('PUT', `${API_BASE}/card/tiles/${tileIndex}`);
      xhr.withCredentials = true;

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(new ApiError(data.error || 'Upload failed', xhr.status));
          }
        } catch {
          reject(new ApiError('Invalid server response', xhr.status));
        }
      };

      xhr.onerror = () => reject(new ApiError('Network connection failed', 0));
      xhr.send(formData);
    });
  },

  async removeTile(tileIndex: number) {
    const res = await fetch(`${API_BASE}/card/tiles/${tileIndex}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse<any>(res);
  },

  async saveDraft(tiles: any[]) {
    const res = await fetch(`${API_BASE}/card/save-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tiles })
    });
    return handleResponse<any>(res);
  },

  async submitCard() {
    const res = await fetch(`${API_BASE}/card/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ confirmSubmit: true })
    });
    return handleResponse<any>(res);
  },

  async checkBingo(bingoId: string) {
    const res = await fetch(`${API_BASE}/bingo/${encodeURIComponent(bingoId)}`);
    return handleResponse<any>(res);
  },

  // Admin APIs
  async getAdminSubmissions(status?: string, adminKey?: string) {
    const headers: Record<string, string> = {};
    if (adminKey) headers['x-admin-key'] = adminKey;
    const url = status ? `${API_BASE}/admin/submissions?status=${status}` : `${API_BASE}/admin/submissions`;
    const res = await fetch(url, { headers, credentials: 'include' });
    return handleResponse<any>(res);
  },

  async adminMarkWinner(bingoId: string, isWinner: boolean, winTier?: string, adminKey?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminKey) headers['x-admin-key'] = adminKey;
    const res = await fetch(`${API_BASE}/admin/verify-winner`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ bingoId, isWinner, winTier })
    });
    return handleResponse<any>(res);
  }
};
