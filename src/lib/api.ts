/* ============================================================
   عميل الـ API — PHP + SQLite
   يعمل أيضاً بدون خادم (وضع التجربة) عبر رمي ApiOfflineError
   ============================================================ */

export class ApiOfflineError extends Error {
  constructor() { super('الخادم غير متاح — وضع التجربة المحلي'); }
}

const TOKEN_KEY = 'rts_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export interface ApiUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'banned';
  avatar: string;
  created_at: string;
}

let offline = false;
export const isOffline = () => offline;

async function req<T = any>(path: string, opts: { method?: string; body?: any; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token && opts.auth !== false) headers['Authorization'] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: opts.method || 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    offline = false;
  } catch {
    offline = true;
    throw new ApiOfflineError();
  }
  let data: any = null;
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    const msg = data?.error || `خطأ ${res.status}`;
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export const api = {
  /* المصادقة */
  register: (name: string, username: string, email: string, password: string) =>
    req('/auth/register', { method: 'POST', auth: false, body: { name, username, email, password } }),
  login: (identifier: string, password: string) =>
    req('/auth/login', { method: 'POST', auth: false, body: { identifier, password } }),
  logout: () => req('/auth/logout', { method: 'POST' }).catch(() => null),
  me: () => req<{ user: ApiUser }>('/auth/me'),
  updateProfile: (body: any) => req('/auth/profile', { method: 'PUT', body }),

  /* الثيمات الجاهزة */
  themes: () => req<{ themes: any[] }>('/themes'),

  /* القوالب */
  templates: () => req<{ templates: any[] }>('/templates'),
  template: (id: number | string) => req<{ template: any }>(`/templates/${id}`),
  createTemplate: (body: any) => req('/templates', { method: 'POST', body }),
  updateTemplate: (id: number | string, body: any) => req(`/templates/${id}`, { method: 'PUT', body }),
  deleteTemplate: (id: number | string) => req(`/templates/${id}`, { method: 'DELETE' }),

  /* الإدارة */
  adminStats: () => req('/admin/stats'),
  adminUsers: () => req<{ users: any[] }>('/admin/users'),
  adminUpdateUser: (id: number, body: any) => req(`/admin/users/${id}`, { method: 'PUT', body }),
  adminDeleteUser: (id: number) => req(`/admin/users/${id}`, { method: 'DELETE' }),
  adminTemplates: () => req<{ templates: any[] }>('/admin/templates'),
  adminDeleteTemplate: (id: number) => req(`/admin/templates/${id}`, { method: 'DELETE' }),
  adminUpdateTemplate: (id: number, body: any) => req(`/admin/templates/${id}`, { method: 'PUT', body }),
  adminSaveTheme: (body: any) => req('/admin/themes', { method: 'POST', body }),
  adminDeleteTheme: (id: number) => req(`/admin/themes/${id}`, { method: 'DELETE' }),
  adminResetThemes: () => req('/admin/themes/reset', { method: 'POST' }),
};
