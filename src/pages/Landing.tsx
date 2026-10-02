import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../lib/icons';
import { PRESETS, buildThemeFromPreset, CATEGORIES } from '../lib/presets';
import { makeTemplateDoc } from '../lib/defaults';
import { TemplateRenderer } from '../renderer/TemplateRenderer';
import type { TemplateDoc } from '../lib/types';
import { useAuth } from '../store/auth';

/* ============================================================
   الصفحة التعريفية
   ============================================================ */

function useDoc(presetIdx: number): TemplateDoc {
  return useMemo(() => {
    const p = PRESETS[presetIdx % PRESETS.length];
    return makeTemplateDoc(buildThemeFromPreset(p), p.layout);
  }, [presetIdx]);
}

function BrowserMock({ idx }: { idx: number }) {
  const doc = useDoc(idx);
  return (
    <div className="glass-panel !rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border-white/10">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/[.03]">
        <span className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
        </span>
        <span className="flex-1 mx-6 bg-white/5 rounded-md py-1 text-center text-[10px] text-slate-500 font-mono" dir="ltr">
          your-template.studio.app
        </span>
        <span className="text-emerald-300"><Icon name="CircleCheck" size={14} /></span>
      </div>
      <div className="h-[340px] sm:h-[420px] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[1400px] origin-top-right" style={{ transform: 'scale(.42)' }}>
          <div style={{ width: 1400, height: 1000 }}>
            <TemplateRenderer key={idx} doc={doc} mode="preview" device="desktop" />
          </div>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: 'Palette', title: '30 ثيماً جاهزاً', desc: 'لوحات ألوان احترافية وتصاميم متنوعة تنطلق منها بنقرة واحدة — داكنة، فاتحة، زجاجية، متدرجة والمزيد.' },
  { icon: 'MousePointerClick', title: 'تخصيص مباشر', desc: 'غيّر الألوان والحواف والأزرار والحقول وشاهد النتيجة لحظياً على القالب الحقيقي — بدون كود.' },
  { icon: 'Shapes', title: '1700+ أيقونة ديناميكية', desc: 'مكتبة أيقونات ضخمة مع بحث فوري — بدّل أيقونة أي عنصر بقائمتين متخصصتين لكل مكوّن.' },
  { icon: 'MoveVertical', title: 'سحب وإفلات كامل', desc: 'انقل أي مكوّن من مكان لآخر، أضف شريطاً علوياً أو قائمة جانبية أو شريط تبويب سفلي بحرية تامة.' },
  { icon: 'Zap', title: 'حركات لكل عنصر', desc: 'أكثر من 20 حركة انسيابية مع تحكم كامل بالسرعة والتأخير والتوقيت ونوع التشغيل لكل مكوّن.' },
  { icon: 'FileCode2', title: 'تصدير HTML + React', desc: 'صدّر صفحة HTML مستقلة بكل مكوناتها (CSS/JS) أو حزمة React نظيفة جاهزة لمشروعك.' },
];

const STEPS = [
  { icon: 'LayoutTemplate', n: '01', title: 'اختر ثيماً', desc: 'تصفح 30 ثيماً جاهزاً بمعاينات حية واختر نقطة انطلاقك.' },
  { icon: 'SlidersHorizontal', n: '02', title: 'خصّص كل شيء', desc: 'الألوان، الحواف، الأيقونات، الحقول، المكونات والحركات — بواجهة سحب وإفلات.' },
  { icon: 'Rocket', n: '03', title: 'صدّر وانطلق', desc: 'احصل على صفحة HTML كاملة أو حزمة React نظيفة في ثوانٍ.' },
];

export default function Landing() {
  const { user } = useAuth();
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => i + 7), 4200);
    return () => clearInterval(t);
  }, []);
  const doc = useDoc(idx);

  return (
    <div className="grid-bg">
      {/* الهيدر */}
      <header className="sticky top-0 z-50 border-b border-white/6 bg-ink-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <span className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Icon name="Sparkles" size={18} />
            </span>
            <span className="font-black text-[15px]">ستوديو <span className="text-grad">القوالب</span></span>
          </span>
          <nav className="hidden md:flex items-center gap-1 mx-4 text-xs font-extrabold text-slate-400">
            <a href="#features" className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">المزايا</a>
            <a href="#themes" className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">الثيمات</a>
            <a href="#steps" className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">كيف يعمل</a>
          </nav>
          <div className="flex-1" />
          {user ? (
            <a href="#/studio" className="app-btn-primary px-5 py-2 rounded-xl text-xs font-black">
              <Icon name="LayoutDashboard" size={14} /> افتح الاستوديو
            </a>
          ) : (
            <div className="flex items-center gap-2">
              <a href="#/login" className="app-btn-ghost px-4 py-2 rounded-xl text-xs font-black">دخول</a>
              <a href="#/register" className="app-btn-primary px-4 py-2 rounded-xl text-xs font-black">عضوية مجانية</a>
            </div>
          )}
        </div>
      </header>

      {/* الهيرو */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-10">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 text-[11px] font-black text-violet-200 bg-violet-500/12 border border-violet-400/25 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-300 animate-pulse" />
              نظام عضوية + 30 ثيماً + محرر كامل + تصدير فوري
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black leading-[1.18]">
              صمّم قوالب <span className="text-grad">React</span> وثيمات
              <br />احترافية… <span className="relative inline-block">
                بدوت كود
                <span className="absolute -bottom-1 right-0 left-0 h-1.5 rounded-full bg-gradient-to-l from-violet-500/70 to-sky-400/70" />
              </span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-[15px] leading-loose mt-6 max-w-xl font-semibold">
              استوديو متكامل لبناء القوالب: اختر من <b className="text-slate-200">30 ثيماً جاهزاً</b>، خصّص كل مكوّن —
              الألوان، الحواف الدائرية أو المربعة، الأيقونات من مكتبة ضخمة، الحقول والأزرار —
              انقل المكونات بالسحب، أضف قوائم جانبية وشرائط تبويب، وتحكم بحركة كل عنصر،
              ثم صدّر <b className="text-slate-200">صفحة HTML كاملة</b> أو <b className="text-slate-200">حزمة React</b>.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <a href={user ? '#/studio' : '#/register'} className="app-btn-primary px-7 py-3.5 rounded-2xl text-sm font-black">
                <Icon name="Rocket" size={17} /> ابدأ التصميم مجاناً
              </a>
              <a href="#themes" className="app-btn-ghost px-6 py-3.5 rounded-2xl text-sm font-black">
                <Icon name="LayoutGrid" size={16} /> تصفح الثيمات
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-3 mt-9 text-[11px] font-black text-slate-500">
              <span className="flex items-center gap-1.5"><Icon name="ShieldCheck" size={14} className="text-emerald-400" /> عضوية آمنة</span>
              <span className="flex items-center gap-1.5"><Icon name="Smartphone" size={14} className="text-sky-400" /> متجاوب بالكامل</span>
              <span className="flex items-center gap-1.5"><Icon name="CodeXml" size={14} className="text-violet-400" /> React + TS + PHP + SQLite</span>
              <span className="flex items-center gap-1.5"><Icon name="Infinity" size={14} className="text-amber-400" /> قوالب غير محدودة</span>
            </div>
          </div>
          <div className="relative animate-scale-in">
            <div className="absolute -inset-6 bg-gradient-to-tr from-violet-600/20 via-transparent to-sky-500/20 rounded-3xl blur-2xl" />
            <div className="relative">
              <BrowserMock idx={idx} />
              <div className="absolute -bottom-5 -right-3 sm:-right-6 glass-panel px-4 py-3 flex items-center gap-3 shadow-2xl animate-float">
                <span className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center"><Icon name="CircleCheck" size={18} /></span>
                <span>
                  <span className="block text-[11px] font-black text-slate-200">يُعرض الآن: {PRESETS[idx % PRESETS.length].name_ar}</span>
                  <span className="block text-[9.5px] font-bold text-slate-500">تبديل تلقائي كل 4 ثوانٍ — {PRESETS.length} ثيماً</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* الثيمات */}
      <section id="themes" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-end justify-between mb-7 gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black">‏<span className="text-grad">30</span> ثيماً جاهزاً للانطلاق</h2>
            <p className="text-xs text-slate-500 font-bold mt-2">كل ثيم = لوحة ألوان + طابع تصميم + تخطيط كامل — وجميعها قابلة للتخصيص 100%</p>
          </div>
          <a href={user ? '#/studio' : '#/login'} className="app-btn-ghost px-4 py-2 rounded-xl text-xs font-black shrink-0">
            عرض الكل <Icon name="ArrowLeft" size={13} />
          </a>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
          {PRESETS.slice(0, 14).map((p) => {
            const th = buildThemeFromPreset(p);
            return (
              <a key={p.key} href={user ? '#/studio' : '#/login'}
                className="shrink-0 w-40 glass-panel p-3.5 hover:border-violet-400/40 hover:-translate-y-1.5 transition-all duration-300 group">
                <span className="flex gap-1.5 mb-3">
                  {[th.colors.primary, th.colors.secondary, th.colors.accent].map((c, i) => (
                    <span key={i} className="w-6 h-6 rounded-lg border border-white/15 group-hover:scale-110 transition-transform" style={{ background: c }} />
                  ))}
                  <span className="flex-1" />
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: th.mode === 'dark' ? '#1a1f2e' : '#f3f4f6' }}>
                    <Icon name={th.mode === 'dark' ? 'Moon' : 'Sun'} size={12} />
                  </span>
                </span>
                <span className="block font-black text-[13px] text-slate-100">{p.name_ar}</span>
                <span className="block text-[10px] text-slate-500 font-bold mt-0.5">{p.category} · {p.name}</span>
              </a>
            );
          })}
          <a href={user ? '#/studio' : '#/login'} className="shrink-0 w-40 border-2 border-dashed border-white/12 hover:border-violet-400/50 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-violet-300 transition-colors">
            <Icon name="Plus" size={22} />
            <span className="text-[11px] font-black">+16 ثيماً آخر</span>
          </a>
        </div>
      </section>

      {/* المزايا */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-11">
          <h2 className="text-2xl sm:text-3xl font-black">كل ما تحتاجه في <span className="text-grad">استوديو واحد</span></h2>
          <p className="text-xs text-slate-500 font-bold mt-2.5">مبني بالكامل بـ React + TypeScript + Vite + Tailwind — والخادم PHP + SQLite</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="glass-panel p-6 hover:border-violet-400/30 hover:-translate-y-1 transition-all duration-300 group animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-400/20 text-violet-300 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <Icon name={f.icon} size={20} />
              </span>
              <h3 className="font-black text-[15px] mb-2">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* الخطوات */}
      <section id="steps" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative glass-panel p-7 overflow-hidden group hover:border-violet-400/30 transition-colors">
              <span className="absolute -top-3 -left-1 text-7xl font-black text-white/[.04] group-hover:text-violet-500/10 transition-colors select-none" dir="ltr">{s.n}</span>
              <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 mb-4 relative">
                <Icon name={s.icon} size={22} />
              </span>
              <h3 className="font-black text-base relative">{s.title}</h3>
              <p className="text-xs text-slate-500 font-semibold mt-2 leading-relaxed relative">{s.desc}</p>
              {i < 2 ? <span className="hidden md:block absolute top-1/2 -left-3 text-slate-700 z-10"><Icon name="ChevronLeft" size={20} /></span> : null}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="relative rounded-3xl overflow-hidden p-10 sm:p-14 text-center" style={{ background: 'linear-gradient(135deg, #5b4bd6 0%, #7c6cf7 45%, #4f8ff7 100%)' }}>
          <span className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.4) 1.3px, transparent 1.3px)', backgroundSize: '22px 22px' }} />
          <h2 className="text-2xl sm:text-4xl font-black text-white relative leading-snug">قالبك الاحترافي الأول يبعد عنك 3 دقائق</h2>
          <p className="text-white/75 text-sm font-semibold mt-4 relative max-w-lg mx-auto">سجّل الآن — احصل على عضوية كاملة، 30 ثيماً، محرراً غير محدود، وتصدير فوري.</p>
          <div className="flex justify-center gap-3 mt-8 relative flex-wrap">
            <a href={user ? '#/studio' : '#/register'} className="bg-white text-violet-700 px-8 py-3.5 rounded-2xl text-sm font-black hover:scale-105 transition-transform shadow-2xl inline-flex items-center gap-2">
              <Icon name="Rocket" size={17} /> {user ? 'افتح الاستوديو' : 'أنشئ حسابك مجاناً'}
            </a>
            <a href="#/login" className="border-2 border-white/40 text-white px-7 py-3.5 rounded-2xl text-sm font-black hover:bg-white/10 transition-colors inline-flex items-center gap-2">
              <Icon name="LogIn" size={16} /> تسجيل الدخول
            </a>
          </div>
        </div>
      </section>

      {/* الفوتر */}
      <footer className="border-t border-white/6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center gap-5">
          <span className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"><Icon name="Sparkles" size={15} /></span>
            <span className="font-black text-sm">ستوديو <span className="text-grad">القوالب</span></span>
          </span>
          <p className="text-[11px] text-slate-600 font-bold flex-1 text-center">
            React 18 · TypeScript · Vite · Tailwind — الخادم: PHP 8 · SQLite · REST API
          </p>
          <p className="text-[11px] text-slate-600 font-bold">© 2026 — صُنع بشغف ✦</p>
        </div>
      </footer>
    </div>
  );
}
