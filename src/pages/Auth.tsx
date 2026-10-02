import { useState, type FormEvent } from 'react';
import { Icon } from '../lib/icons';
import { useAuth } from '../store/auth';
import { navigate } from '../router';
import { Btn, Spinner } from '../components/ui';

/* ============================================================
   صفحتا الدخول والتسجيل — نظام العضوية
   ============================================================ */

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register, offline } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ identifier: '', name: '', username: '', email: '', password: '', confirm: '' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    if (mode === 'register') {
      if (!f.name.trim() || !f.username.trim() || !f.email.trim()) return setErr('جميع الحقول مطلوبة');
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(f.username)) return setErr('اسم المستخدم: أحرف إنجليزية وأرقام 3-20');
      if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('البريد الإلكتروني غير صالح');
      if (f.password.length < 6) return setErr('كلمة المرور 6 أحرف على الأقل');
      if (f.password !== f.confirm) return setErr('كلمتا المرور غير متطابقتين');
    } else {
      if (!f.identifier.trim() || !f.password) return setErr('أدخل بيانات الدخول');
    }
    setBusy(true);
    try {
      if (mode === 'login') await login(f.identifier.trim(), f.password);
      else await register(f.name.trim(), f.username.trim(), f.email.trim().toLowerCase(), f.password);
      navigate('/studio');
    } catch (e: any) {
      setErr(e?.message || 'حدث خطأ — حاول مجدداً');
    } finally {
      setBusy(false);
    }
  }

  const bullets = [
    { icon: 'LayoutGrid', t: '30 ثيماً احترافياً جاهزاً' },
    { icon: 'SlidersHorizontal', t: 'محرر تخصيص كامل لكل مكوّن' },
    { icon: 'Shapes', t: 'مكتبة أيقونات ضخمة + حركات' },
    { icon: 'FileDown', t: 'تصدير HTML و React فوري' },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-2 grid-bg">
      {/* اللوحة الجانبية */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, rgba(91,75,214,.28), rgba(10,12,20,.2) 55%), radial-gradient(500px 300px at 80% 20%, rgba(124,108,247,.25), transparent)' }}>
        <a href="#/" className="flex items-center gap-2.5 w-fit">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Icon name="Sparkles" size={19} />
          </span>
          <span className="font-black text-base">ستوديو <span className="text-grad">القوالب</span></span>
        </a>
        <div className="relative">
          <h2 className="text-4xl font-black leading-snug max-w-md">
            membership بسيطة،
            <br /><span className="text-grad">إمكانيات بلا حدود</span>
          </h2>
          <p className="text-slate-400 text-sm font-semibold mt-5 max-w-md leading-loose">
            حساب واحد يفصلك عن بناء قوالب وثيمات React كاملة — صمم، خصّص، وصدّر.
          </p>
          <div className="flex flex-col gap-3.5 mt-9 max-w-sm">
            {bullets.map((b) => (
              <span key={b.t} className="flex items-center gap-3 text-[13px] font-bold text-slate-300 glass-panel px-4 py-3 hover:border-violet-400/30 transition-colors">
                <span className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-300 flex items-center justify-center shrink-0"><Icon name={b.icon} size={15} /></span>
                {b.t}
              </span>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-slate-600 font-bold">© 2026 ستوديو القوالب — React · TypeScript · PHP · SQLite</p>
      </div>

      {/* النموذج */}
      <div className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md animate-fade-up">
          <a href="#/" className="lg:hidden flex items-center gap-2.5 mb-8 w-fit mx-auto">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"><Icon name="Sparkles" size={17} /></span>
            <span className="font-black">ستوديو <span className="text-grad">القوالب</span></span>
          </a>
          <div className="glass-panel p-7 sm:p-9 shadow-2xl">
            <h1 className="text-2xl font-black">{mode === 'login' ? 'أهلاً بعودتك 👋' : 'انضم إلينا ✦'}</h1>
            <p className="text-xs text-slate-500 font-bold mt-2">
              {mode === 'login' ? 'سجّل دخولك لمتابعة قوالبك وثيماتك' : 'أنشئ عضويتك المجانية وابدأ التصميم فوراً'}
            </p>

            {offline ? (
              <div className="mt-5 flex items-start gap-2.5 bg-amber-400/8 border border-amber-400/25 rounded-xl p-3.5 text-[11px] font-bold text-amber-200/90 leading-relaxed">
                <span className="mt-0.5 shrink-0"><Icon name="WifiOff" size={14} /></span>
                خادم PHP غير مشغّل — سيتم التحقق محلياً (وضع التجربة). الدخول متاح بـ admin/admin123
              </div>
            ) : null}

            <form onSubmit={submit} className="flex flex-col gap-4 mt-7">
              {mode === 'login' ? (
                <div>
                  <span className="label-sm">اسم المستخدم أو البريد</span>
                  <div className="relative">
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"><Icon name="User" size={15} /></span>
                    <input className="app-input !pr-10" dir="ltr" placeholder="admin" value={f.identifier} onChange={set('identifier')} autoFocus />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="label-sm">الاسم الكامل</span>
                      <input className="app-input" placeholder="محمد أحمد" value={f.name} onChange={set('name')} />
                    </div>
                    <div>
                      <span className="label-sm">اسم المستخدم</span>
                      <input className="app-input" dir="ltr" placeholder="mohammed" value={f.username} onChange={set('username')} />
                    </div>
                  </div>
                  <div>
                    <span className="label-sm">البريد الإلكتروني</span>
                    <div className="relative">
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"><Icon name="Mail" size={15} /></span>
                      <input className="app-input !pr-10" dir="ltr" type="email" placeholder="name@example.com" value={f.email} onChange={set('email')} />
                    </div>
                  </div>
                </>
              )}
              <div>
                <span className="label-sm">كلمة المرور</span>
                <div className="relative">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"><Icon name="Lock" size={15} /></span>
                  <input className="app-input !pr-10" dir="ltr" type="password" placeholder="••••••••" value={f.password} onChange={set('password')} autoFocus={mode === 'login'} />
                </div>
              </div>
              {mode === 'register' ? (
                <div>
                  <span className="label-sm">تأكيد كلمة المرور</span>
                  <input className="app-input" dir="ltr" type="password" placeholder="••••••••" value={f.confirm} onChange={set('confirm')} />
                </div>
              ) : null}

              {err ? (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-400/25 rounded-xl px-4 py-3 text-[11.5px] font-bold text-rose-300 animate-scale-in">
                  <Icon name="CircleAlert" size={15} /> {err}
                </div>
              ) : null}

              <Btn type="submit" size="lg" disabled={busy} className="mt-1 w-full">
                {busy ? <Spinner size={17} /> : <Icon name={mode === 'login' ? 'LogIn' : 'UserPlus'} size={17} />}
                {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
              </Btn>
            </form>

            <p className="text-center text-xs text-slate-500 font-bold mt-6">
              {mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}
              <a href={mode === 'login' ? '#/register' : '#/login'} className="text-violet-300 hover:text-violet-200 font-black transition-colors">
                {mode === 'login' ? 'أنشئ عضوية مجانية' : 'سجّل الدخول'}
              </a>
            </p>
          </div>

          <div className="mt-5 glass-panel px-5 py-4 text-[11px] font-bold text-slate-500 leading-relaxed">
            <p className="flex items-center gap-2 text-slate-400 font-black mb-1.5"><Icon name="KeyRound" size={13} className="text-amber-300" /> حسابات للتجربة:</p>
            <p>المدير: <code dir="ltr" className="text-violet-300 bg-violet-500/10 rounded px-1.5 py-0.5 mx-0.5">admin / admin123</code></p>
            <p className="mt-1">عضو: <code dir="ltr" className="text-sky-300 bg-sky-500/10 rounded px-1.5 py-0.5 mx-0.5">demo / demo123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
