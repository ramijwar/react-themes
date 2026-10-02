import { AuthProvider, useAuth } from './store/auth';
import { useRoute, navigate } from './router';
import { Toaster, Spinner } from './components/ui';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth';
import Studio from './pages/Studio';
import Builder from './pages/Builder';
import Admin from './pages/Admin';
import { useEffect } from 'react';
import { Icon } from './lib/icons';

function Guard({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  const { path } = useRoute();
  useEffect(() => {
    if (!loading && !user) navigate('/login');
    else if (!loading && adminOnly && user?.role !== 'admin') navigate('/studio');
  }, [user, loading, adminOnly]);
  if (loading || !user || (adminOnly && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Spinner size={30} />
        <p className="text-xs text-slate-500 font-bold">جارٍ التحقق من الصلاحيات… ({path})</p>
      </div>
    );
  }
  return <>{children}</>;
}

function Routes() {
  const { path } = useRoute();
  if (path === '/' || path === '') return <Landing />;
  if (path === '/login') return <AuthPage mode="login" />;
  if (path === '/register') return <AuthPage mode="register" />;
  if (path.startsWith('/studio')) return <Guard><Studio /></Guard>;
  if (path.startsWith('/builder')) return <Guard><Builder path={path} /></Guard>;
  if (path.startsWith('/admin')) return <Guard adminOnly><Admin /></Guard>;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5">
      <span className="text-slate-600"><Icon name="Compass" size={54} /></span>
      <h1 className="font-black text-xl">الصفحة غير موجودة</h1>
      <a href="#/" className="app-btn-primary px-6 py-2.5 rounded-xl text-sm font-bold">العودة للرئيسية</a>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="relative min-h-screen">
        <div className="aurora" />
        <div className="relative z-10">
          <Routes />
        </div>
      </div>
      <Toaster />
    </AuthProvider>
  );
}
