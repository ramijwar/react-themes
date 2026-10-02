import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api, setToken, getToken, ApiOfflineError, type ApiUser } from '../lib/api';

/* ============================================================
   سياق المصادقة + التنبيهات (Toast)
   ============================================================ */

const LS_LOCAL_USERS = 'rts_local_users';
const LS_LOCAL_SESSION = 'rts_local_session';

interface LocalUser { name: string; username: string; email: string; password: string; role: 'admin' | 'user'; }

function localUsers(): LocalUser[] {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_LOCAL_USERS) || '[]');
    if (!Array.isArray(arr) || arr.length === 0) {
      const seed: LocalUser[] = [
        { name: 'المدير العام', username: 'admin', email: 'admin@studio.app', password: 'admin123', role: 'admin' },
        { name: 'تجريبي', username: 'demo', email: 'demo@studio.app', password: 'demo123', role: 'user' },
      ];
      localStorage.setItem(LS_LOCAL_USERS, JSON.stringify(seed));
      return seed;
    }
    return arr;
  } catch { return []; }
}

function toApiUser(u: LocalUser): ApiUser {
  return { id: u.username === 'admin' ? 1 : 2, name: u.name, username: u.username, email: u.email, role: u.role, status: 'active', avatar: '', created_at: new Date().toISOString() };
}

export interface Toast { id: number; msg: string; type: 'success' | 'error' | 'info' }

interface AuthState {
  user: ApiUser | null;
  offline: boolean;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  toasts: Toast[];
  toast: (msg: string, type?: Toast['type']) => void;
}

const Ctx = createContext<AuthState>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((msg: string, type: Toast['type'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 3800);
  }, []);

  const refresh = useCallback(async () => {
    const localSess = localStorage.getItem(LS_LOCAL_SESSION);
    if (getToken() && getToken() !== 'local') {
      try {
        const { user: u } = await api.me();
        setUser(u); setOffline(false); setLoading(false);
        return;
      } catch (e) {
        if (e instanceof ApiOfflineError) { setOffline(true); }
        else { setToken(null); }
      }
    }
    if (localSess) {
      try {
        const u = JSON.parse(localSess);
        setUser(u); setOffline(true); setLoading(false);
        return;
      } catch { localStorage.removeItem(LS_LOCAL_SESSION); }
    }
    setUser(null); setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      const res = await api.login(identifier, password);
      setToken(res.token);
      setUser(res.user);
      setOffline(false);
      localStorage.removeItem(LS_LOCAL_SESSION);
    } catch (e) {
      if (e instanceof ApiOfflineError) {
        // وضع التجربة المحلي
        const u = localUsers().find((x) => (x.username === identifier || x.email === identifier) && x.password === password);
        if (!u) throw new Error('بيانات الدخول غير صحيحة (وضع التجربة)');
        const au = toApiUser(u);
        setToken('local');
        localStorage.setItem(LS_LOCAL_SESSION, JSON.stringify(au));
        setUser(au); setOffline(true);
      } else throw e;
    }
  }, []);

  const register = useCallback(async (name: string, username: string, email: string, password: string) => {
    try {
      const res = await api.register(name, username, email, password);
      setToken(res.token);
      setUser(res.user);
      setOffline(false);
    } catch (e) {
      if (e instanceof ApiOfflineError) {
        const users = localUsers();
        if (users.some((u) => u.username === username || u.email === email)) throw new Error('اسم المستخدم أو البريد مستعمل مسبقاً');
        const nu: LocalUser = { name, username, email, password, role: 'user' };
        users.push(nu);
        localStorage.setItem(LS_LOCAL_USERS, JSON.stringify(users));
        const au = toApiUser(nu);
        setToken('local');
        localStorage.setItem(LS_LOCAL_SESSION, JSON.stringify(au));
        setUser(au); setOffline(true);
      } else throw e;
    }
  }, []);

  const logout = useCallback(() => {
    if (!offline) api.logout().catch(() => null);
    setToken(null);
    localStorage.removeItem(LS_LOCAL_SESSION);
    setUser(null);
  }, [offline]);

  return (
    <Ctx.Provider value={{ user, offline, loading, login, register, logout, refresh, toasts, toast }}>
      {children}
    </Ctx.Provider>
  );
}
