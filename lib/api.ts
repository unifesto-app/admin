const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'API error');
  }
  return res.json();
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: { page: number; limit: number; total: number };
}

export const usersApi = {
  list: (p?: Record<string, string>) => apiFetch<ApiResponse>(`/api/users${p ? '?' + new URLSearchParams(p) : ''}`),
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
