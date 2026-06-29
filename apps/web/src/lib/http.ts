// Cliente HTTP centralizado. Todas las llamadas a /api pasan por acá.
// Las cookies (httpOnly JWT) se envían automáticamente con credentials: 'include'.
// Un 401 redirige al login.

import router from '@/router';

const BASE = '/api';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);

  if (res.status === 401) {
    router.push('/login');
    throw new Error('No autenticado');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Error ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}

export async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', credentials: 'include', body: formData });
  if (res.status === 401) { router.push('/login'); throw new Error('No autenticado'); }
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Error'); }
  return res.json();
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  postForm: <T>(path: string, formData: FormData) => uploadFile<T>(path, formData),
};
