import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../lib/icons';
import { searchIcons, POPULAR_ICONS, ICON_COUNT } from '../lib/icons';
import { SWATCHES } from '../lib/theme';
import { useAuth } from '../store/auth';

/* ============================================================
   مكوّنات الواجهة الأساسية للاستوديو
   ============================================================ */

export function Btn({ children, variant = 'primary', size = 'md', className = '', icon, ...rest }: {
  children?: ReactNode; variant?: 'primary' | 'ghost' | 'danger' | 'soft' | 'gold';
  size?: 'xs' | 'sm' | 'md' | 'lg'; icon?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes: any = {
    xs: 'text-[11px] px-2.5 py-1.5 rounded-lg gap-1.5',
    sm: 'text-xs px-3.5 py-2 rounded-xl gap-1.5',
    md: 'text-[13px] px-5 py-2.5 rounded-xl gap-2',
    lg: 'text-sm px-7 py-3 rounded-2xl gap-2.5',
  };
  const variants: any = {
    primary: 'app-btn-primary',
    ghost: 'app-btn-ghost',
    soft: 'app-btn bg-violet-500/15 text-violet-300 border border-violet-400/20 hover:bg-violet-500/25',
    danger: 'app-btn bg-rose-500/15 text-rose-300 border border-rose-400/25 hover:bg-rose-500/30',
    gold: 'app-btn bg-amber-400/15 text-amber-300 border border-amber-400/25 hover:bg-amber-400/25',
  };
  return (
    <button className={`${variants[variant]} ${sizes[size]} ${className}`} {...(rest as any)}>
      {icon ? <Icon name={icon} size={size === 'lg' ? 18 : size === 'xs' ? 12 : 15} /> : null}
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide, icon }: {
  open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean; icon?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-fade-in" />
      <div
        className={`glass-panel relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[88vh] flex flex-col pop-in shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
            <h3 className="font-extrabold text-[15px] flex items-center gap-2.5">
              {icon ? <span className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-300 flex items-center justify-center"><Icon name={icon} size={16} /></span> : null}
              {title}
            </h3>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-colors">
              <Icon name="X" size={15} />
            </button>
          </div>
        ) : null}
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function Toaster() {
  const { toasts } = useAuth();
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-in glass-panel px-5 py-3 text-[13px] font-bold flex items-center gap-2.5 shadow-2xl ${
          t.type === 'success' ? 'text-emerald-300' : t.type === 'error' ? 'text-rose-300' : 'text-sky-300'
        }`}>
          <Icon name={t.type === 'success' ? 'CircleCheck' : t.type === 'error' ? 'CircleX' : 'Info'} size={17} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ---------- حقول الإدخال ---------- */

export function Field({ label, children, hint }: { label?: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      {label ? <span className="label-sm">{label}</span> : null}
      {children}
      {hint ? <span className="text-[10px] text-slate-500 mt-1 block">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`app-input ${props.className || ''}`} />;
}

export function Select({ value, onChange, options, className = '' }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[]; className?: string;
}) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="app-input appearance-none pl-9 cursor-pointer"
      >
        {opts.map((o) => <option key={o.value} value={o.value} className="bg-ink-850">{o.label}</option>)}
      </select>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
        <Icon name="ChevronDown" size={15} />
      </span>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, size = 'md' }: {
  value: T; onChange: (v: T) => void;
  options: { value: T; label?: string; icon?: string; title?: string }[];
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`flex bg-white/5 border border-white/8 rounded-xl p-1 gap-1 ${size === 'sm' ? 'text-[11px]' : 'text-xs'}`}>
      {options.map((o) => (
        <button
          key={o.value}
          title={o.title || o.label}
          onClick={() => onChange(o.value)}
          className={`flex-1 flex items-center justify-center gap-1.5 font-bold rounded-lg px-2 py-1.5 transition-all ${
            value === o.value
              ? 'bg-gradient-to-br from-violet-500/90 to-indigo-500/90 text-white shadow-lg shadow-violet-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          {o.icon ? <Icon name={o.icon} size={13} /> : null}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1, label, unit = '' }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string; unit?: string;
}) {
  return (
    <div>
      {label ? (
        <div className="flex justify-between items-center mb-1.5">
          <span className="label-sm !mb-0">{label}</span>
          <span className="text-[11px] font-extrabold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-md">{value}{unit}</span>
        </div>
      ) : null}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full" />
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full gap-3 group"
    >
      {label ? <span className="label-sm !mb-0 group-hover:text-slate-200 transition-colors">{label}</span> : <span />}
      <span className={`relative w-11 h-6 rounded-full transition-all shrink-0 ${checked ? 'bg-gradient-to-r from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/30' : 'bg-white/12'}`}>
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'right-1' : 'right-6'}`} />
      </span>
    </button>
  );
}

export function ColorField({ label, value, onChange, allowEmpty }: {
  label?: string; value: string; onChange: (v: string) => void; allowEmpty?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isHex = /^#[0-9a-fA-F]{6}$/.test(value || '');
  return (
    <div className="relative">
      {label ? <span className="label-sm">{label}</span> : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-9 h-9 rounded-xl border-2 border-white/15 shrink-0 transition-transform hover:scale-105"
          style={{ background: isHex ? value : 'repeating-conic-gradient(#333 0% 25%, #555 0% 50%) 50%/12px 12px' }}
          title={value || 'تلقائي'}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="تلقائي"
          className="app-input !py-2 text-xs font-mono flex-1"
          dir="ltr"
        />
        {isHex ? (
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border-2 border-white/10" title="منتقي الألوان" />
        ) : null}
      </div>
      {open ? (
        <div className="absolute z-50 mt-2 glass-panel p-3 shadow-2xl w-64 pop-in">
          <div className="grid grid-cols-6 gap-2">
            {SWATCHES.map((c) => (
              <button key={c} onClick={() => { onChange(c); setOpen(false); }} className="w-8 h-8 rounded-lg border-2 border-white/10 hover:scale-110 transition-transform" style={{ background: c }} title={c} />
            ))}
          </div>
          {allowEmpty ? (
            <button onClick={() => { onChange(''); setOpen(false); }} className="mt-3 w-full text-[11px] font-bold text-slate-400 hover:text-white bg-white/5 rounded-lg py-1.5 transition-colors">
              إعادة للتلقائي (من الثيم)
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function Collapse({ title, icon, children, open: openProp, defaultOpen = false, badge }: {
  title: string; icon?: string; children: ReactNode; open?: boolean; defaultOpen?: boolean; badge?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = openProp ?? open;
  return (
    <div className="border border-white/7 rounded-xl overflow-hidden bg-white/[.02]">
      <button
        onClick={() => setOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 hover:bg-white/[.04] transition-colors text-right"
      >
        {icon ? <span className="text-violet-300"><Icon name={icon} size={15} /></span> : null}
        <span className="font-extrabold text-[12.5px] flex-1">{title}</span>
        {badge}
        <span className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}><Icon name="ChevronDown" size={15} /></span>
      </button>
      <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="p-3.5 pt-1 flex flex-col gap-3.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   منتقي الأيقونات الديناميكي
   ============================================================ */

export function IconButton({ name, onClick, title, active, className = '' }: {
  name?: string; onClick?: (e: React.MouseEvent) => void; title?: string; active?: boolean; className?: string;
}) {
  return (
    <button
      type="button" title={title} onClick={onClick}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${
        active ? 'bg-violet-500/25 text-violet-200 border border-violet-400/40' : 'bg-white/5 hover:bg-white/12 text-slate-300 border border-transparent'
      } ${className}`}
    >
      <Icon name={name} size={15} />
    </button>
  );
}

export function IconPicker({ value, onChange, label }: { value?: string; onChange: (name: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const results = useMemo(() => searchIcons(q), [q]);
  return (
    <>
      <div>
        {label ? <span className="label-sm">{label}</span> : null}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 w-full app-input !py-2 hover:border-violet-400/40 transition-colors"
        >
          <span className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-300 flex items-center justify-center shrink-0 border border-violet-400/20">
            <Icon name={value || 'MousePointerClick'} size={16} />
          </span>
          <span className="text-xs font-bold text-slate-200 flex-1 text-right truncate">{value || 'اختر أيقونة…'}</span>
          {value ? (
            <span role="button" tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onChange(''); } }}
              className="text-slate-500 hover:text-rose-400 transition-colors"><Icon name="X" size={14} /></span>
          ) : null}
          <span className="text-slate-500"><Icon name="ChevronDown" size={14} /></span>
        </button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={`مكتبة الأيقونات — ${ICON_COUNT.toLocaleString('ar')} أيقونة`} icon="Shapes" wide>
        <div className="sticky top-0 pb-3 -mt-1 bg-ink-900/95 backdrop-blur z-10">
          <div className="relative">
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"><Icon name="Search" size={16} /></span>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالإنجليزية: home, chart, user, cart…" className="app-input !pr-10" dir="ltr" />
          </div>
          {!q ? <p className="text-[10.5px] text-slate-500 mt-2 font-bold">الأيقونات الشائعة — ابحث لعرض المكتبة كاملة</p> : null}
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
          {results.map((r) => (
            <button
              key={r.name}
              title={r.name}
              onClick={() => { onChange(r.name); setOpen(false); }}
              className={`aspect-square rounded-xl flex items-center justify-center transition-all hover:scale-110 ${
                value === r.name ? 'bg-violet-500/30 text-violet-200 ring-2 ring-violet-400' : 'bg-white/[.04] text-slate-300 hover:bg-violet-500/15 hover:text-violet-200'
              }`}
            >
              <Icon name={r.name} size={19} />
            </button>
          ))}
        </div>
        {results.length === 0 ? <p className="text-center text-slate-500 text-sm py-10 font-bold">لا توجد نتائج لـ “{q}”</p> : null}
      </Modal>
    </>
  );
}

/* ============================================================
   محرر القوائم (عناصر قابلة للترتيب والإضافة)
   ============================================================ */

export interface ItemCol { key: string; label: string; type?: 'text' | 'icon' | 'toggle'; placeholder?: string; wide?: boolean }

export function ItemListEditor<T extends { id: string }>({ items, onChange, cols, addLabel = 'إضافة عنصر', makeItem, max }: {
  items: T[]; onChange: (items: T[]) => void; cols: ItemCol[]; addLabel?: string;
  makeItem: () => T; max?: number;
}) {
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const arr = [...items];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  };
  const set = (i: number, key: string, v: any) => {
    const arr = [...items];
    arr[i] = { ...arr[i], [key]: v };
    onChange(arr);
  };
  const remove = (i: number) => onChange(items.filter((_, x) => x !== i));
  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <div key={it.id} className="bg-white/[.03] border border-white/7 rounded-xl p-2.5 flex flex-col gap-2 group animate-fade-in">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-500 w-5 text-center">{i + 1}</span>
            <div className="flex-1" />
            <IconButton name="ArrowUp" title="أعلى" onClick={() => move(i, -1)} className={i === 0 ? 'opacity-30' : ''} />
            <IconButton name="ArrowDown" title="أسفل" onClick={() => move(i, 1)} className={i === items.length - 1 ? 'opacity-30' : ''} />
            <IconButton name="Trash2" title="حذف" onClick={() => remove(i)} className="hover:!bg-rose-500/20 hover:!text-rose-300" />
          </div>
          <div className="flex flex-wrap gap-2">
            {cols.map((c) => {
              if (c.type === 'icon') {
                return <div key={c.key} className="w-36"><IconPicker label={c.label} value={(it as any)[c.key]} onChange={(v) => set(i, c.key, v)} /></div>;
              }
              if (c.type === 'toggle') {
                return <div key={c.key} className="w-28 pt-4"><Toggle label={c.label} checked={!!(it as any)[c.key]} onChange={(v) => set(i, c.key, v)} /></div>;
              }
              return (
                <div key={c.key} className={c.wide ? 'w-full' : 'flex-1 min-w-28'}>
                  <span className="label-sm">{c.label}</span>
                  <input value={(it as any)[c.key] ?? ''} placeholder={c.placeholder} onChange={(e) => set(i, c.key, e.target.value)} className="app-input !py-1.5 text-xs" />
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={max ? items.length >= max : false}
        onClick={() => onChange([...items, makeItem()])}
        className="border-2 border-dashed border-white/12 hover:border-violet-400/50 hover:bg-violet-500/8 text-slate-400 hover:text-violet-200 rounded-xl py-2.5 text-xs font-extrabold transition-all flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <Icon name="Plus" size={15} />{addLabel}
      </button>
    </div>
  );
}

export function Spinner({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-block animate-spin rounded-full border-[2.5px] border-white/15 border-t-violet-400" style={{ width: size, height: size }} />
  );
}

export function Empty({ icon = 'Inbox', title, sub, action }: { icon?: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-14 px-6">
      <span className="inline-flex w-16 h-16 rounded-2xl bg-white/5 border border-white/8 items-center justify-center text-slate-500 mb-4">
        <Icon name={icon} size={28} />
      </span>
      <h3 className="font-black text-slate-200">{title}</h3>
      {sub ? <p className="text-xs text-slate-500 mt-1.5 font-semibold max-w-sm mx-auto leading-relaxed">{sub}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

/* شريط علوي موحد لصفحات التطبيق */
export function AppNav({ current }: { current: string }) {
  const { user, logout, offline } = useAuth();
  const [menu, setMenu] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const links = [
    { to: '/studio', label: 'الاستوديو', icon: 'LayoutDashboard' },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'الإدارة', icon: 'ShieldCheck' }] : []),
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-white/7 bg-ink-950/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
        <a href="#/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
            <Icon name="Sparkles" size={18} />
          </span>
          <span className="font-black text-[15px] hidden sm:block">ستوديو <span className="text-grad">القوالب</span></span>
        </a>
        <nav className="flex items-center gap-1 mx-2">
          {links.map((l) => (
            <a key={l.to} href={`#${l.to}`} className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              current.startsWith(l.to) ? 'bg-violet-500/15 text-violet-200 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}>
              <Icon name={l.icon} size={14} />{l.label}
            </a>
          ))}
        </nav>
        <div className="flex-1" />
        {offline ? (
          <span className="hidden md:flex items-center gap-1.5 text-[10.5px] font-black text-amber-300 bg-amber-400/10 border border-amber-400/25 rounded-full px-3 py-1.5" title="خادم PHP غير مشغل — البيانات محفوظة محلياً في المتصفح">
            <Icon name="WifiOff" size={12} /> وضع التجربة
          </span>
        ) : null}
        <div className="relative" ref={navRef}>
          <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl pl-2 pr-3 py-1.5 transition-colors">
            <span className="text-xs font-extrabold hidden sm:block max-w-28 truncate">{user?.name}</span>
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[11px] font-black text-white">
              {(user?.name || '?')[0]}
            </span>
            {user?.role === 'admin' ? <span className="text-[9px] font-black text-amber-300 bg-amber-400/15 rounded px-1.5 py-0.5">مدير</span> : null}
          </button>
          {menu ? (
            <div className="absolute left-0 mt-2 w-52 glass-panel p-1.5 pop-in shadow-2xl z-50">
              <div className="px-3 py-2.5 border-b border-white/7 mb-1.5">
                <p className="text-xs font-black truncate">{user?.name}</p>
                <p className="text-[10.5px] text-slate-500 truncate font-semibold" dir="ltr">{user?.email}</p>
              </div>
              <a href="#/studio" onClick={() => setMenu(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-white/6 hover:text-white transition-colors">
                <Icon name="LayoutDashboard" size={15} /> الاستوديو
              </a>
              {user?.role === 'admin' ? (
                <a href="#/admin" onClick={() => setMenu(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-white/6 hover:text-white transition-colors">
                  <Icon name="ShieldCheck" size={15} /> لوحة الإدارة
                </a>
              ) : null}
              <button onClick={() => { setMenu(false); logout(); window.location.hash = '/'; }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-rose-300 hover:bg-rose-500/15 transition-colors">
                <Icon name="LogOut" size={15} /> تسجيل الخروج
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
