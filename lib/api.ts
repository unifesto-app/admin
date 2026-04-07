const LOCAL_API_BASE = 'http://localhost:4000';
const PROD_API_BASE = 'https://api.unifesto.app';

function normalizeBase(raw?: string) {
  const value = (raw ?? '').trim().replace(/\/+$/, '');
  if (!value) return '';
  if (value === 'localhost:4000') return LOCAL_API_BASE;
  if (value === 'http://localhost:3001' || value === 'https://localhost:3001') return LOCAL_API_BASE;
  if (!/^https?:\/\//i.test(value)) {
    if (value.startsWith('localhost')) return `http://${value}`;
    return `https://${value}`;
  }
  if (value.startsWith('http://') && !value.startsWith('http://localhost')) {
    return value.replace('http://', 'https://');
  }
  return value;
}

function getBaseCandidates() {
  const isBrowser = typeof window !== 'undefined';
  const isHttpsPage = isBrowser && window.location.protocol === 'https:';
  const isProd = process.env.NODE_ENV === 'production';
  const envBase = normalizeBase(process.env.NEXT_PUBLIC_API_URL);
  const defaultBase = isProd ? PROD_API_BASE : LOCAL_API_BASE;
  const ordered = [envBase, defaultBase, PROD_API_BASE, isProd ? '' : LOCAL_API_BASE]
    .filter(Boolean)
    .filter((base) => !(isHttpsPage && String(base).startsWith('http://')));
  return Array.from(new Set(ordered));
}

export const API_BASE = getBaseCandidates()[0] ?? LOCAL_API_BASE;

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const candidates = getBaseCandidates();
  let lastError = `Cannot reach API at ${API_BASE}. Make sure backend API is running.`;

  for (const base of candidates) {
    try {
      const headers = new Headers(options?.headers);
      const method = (options?.method ?? 'GET').toUpperCase();
      if ((options?.body ?? null) !== null && method !== 'GET' && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      const res = await fetch(`${base}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        const message = err.error ?? 'API error';
        if (res.status === 404 && base !== candidates[candidates.length - 1]) {
          lastError = message;
          continue;
        }
        throw new Error(message);
      }

      return res.json();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error.message : 'API error';
    }
  }

  throw new Error(lastError);
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: { page: number; limit: number; total: number };
}

export interface TrackerView {
  id: number;
  device_id: string;
  view: string;
  view_count: number;
  first_seen_at: string;
  last_seen_at: string;
  metadata?: Record<string, unknown>;
}

export interface TrackersResponse {
  success: boolean;
  device_id?: string;
  total_unique_views?: number;
  data?: TrackerView[];
  error?: string;
}

export const usersApi = {
  list: (p?: Record<string, string>) => apiFetch<ApiResponse>(`/api/users${p ? '?' + new URLSearchParams(p) : ''}`),
  create: (b: Record<string, unknown>) => apiFetch<ApiResponse>('/api/users', { method: 'POST', body: JSON.stringify(b) }),
  get: (id: string) => apiFetch<ApiResponse>(`/api/users/${id}`),
  update: (id: string, b: Record<string, unknown>) => apiFetch<ApiResponse>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  delete: (id: string) => apiFetch<ApiResponse>(`/api/users/${id}`, { method: 'DELETE' }),
};

export const eventsApi = {
  list: (p?: Record<string, string>) => apiFetch<ApiResponse>(`/api/events${p ? '?' + new URLSearchParams(p) : ''}`),
  get: (id: string) => apiFetch<ApiResponse>(`/api/events/${id}`),
  create: (b: Record<string, unknown>) => apiFetch<ApiResponse>('/api/events', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Record<string, unknown>) => apiFetch<ApiResponse>(`/api/events/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  delete: (id: string) => apiFetch<ApiResponse>(`/api/events/${id}`, { method: 'DELETE' }),
};

export const orgsApi = {
  list: (p?: Record<string, string>) => apiFetch<ApiResponse>(`/api/organizations${p ? '?' + new URLSearchParams(p) : ''}`),
  create: (b: Record<string, unknown>) => apiFetch<ApiResponse>('/api/organizations', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Record<string, unknown>) => apiFetch<ApiResponse>(`/api/organizations?id=${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  delete: (id: string) => apiFetch<ApiResponse>(`/api/organizations?id=${id}`, { method: 'DELETE' }),
};

export const financeApi = {
  list: (type: 'transactions' | 'invoices' | 'payouts', p?: Record<string, string>) =>
    apiFetch<ApiResponse>(`/api/finance?${new URLSearchParams({ type, ...p })}`),
  create: (type: 'invoices' | 'payouts', b: Record<string, unknown>) =>
    apiFetch<ApiResponse>(`/api/finance?type=${type}`, { method: 'POST', body: JSON.stringify(b) }),
  updateStatus: (type: string, id: string, status: string) =>
    apiFetch<ApiResponse>(`/api/finance?type=${type}&id=${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export const adminApi = {
  get: (resource: string, p?: Record<string, string>) =>
    apiFetch<ApiResponse>(`/api/admin?${new URLSearchParams({ resource, ...p })}`),
  create: (resource: string, b: Record<string, unknown>) =>
    apiFetch<ApiResponse>(`/api/admin?resource=${resource}`, { method: 'POST', body: JSON.stringify(b) }),
  update: (resource: string, b: Record<string, unknown>, id?: string) =>
    apiFetch<ApiResponse>(`/api/admin?resource=${resource}${id ? `&id=${id}` : ''}`, { method: 'PATCH', body: JSON.stringify(b) }),
  delete: (resource: string, id: string) =>
    apiFetch<ApiResponse>(`/api/admin?resource=${resource}&id=${id}`, { method: 'DELETE' }),
};

export const trackersApi = {
  trackView: (view: string, metadata?: Record<string, unknown>) =>
    apiFetch<ApiResponse<TrackerView>>('/api/trackers/views', {
      method: 'POST',
      body: JSON.stringify({ view, metadata }),
    }),
  listViews: (limit?: number) =>
    apiFetch<TrackersResponse>(`/api/trackers/views${typeof limit === 'number' ? `?limit=${limit}` : ''}`),
};
