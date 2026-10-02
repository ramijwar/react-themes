import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CompNode, CompType, TemplateDoc, ThemeCfg, AnimCfg, StyleCfg, TemplateMeta } from '../lib/types';
import { makeNode, makeTemplateDoc } from '../lib/defaults';
import { PRESETS, buildThemeFromPreset } from '../lib/presets';
import { uid } from '../lib/types';
import { api, ApiOfflineError, isOffline } from '../lib/api';
import { localGet, localUpsert } from '../lib/local';
import { navigate } from '../router';
import { useAuth } from '../store/auth';
import { TemplateRenderer } from '../renderer/TemplateRenderer';
import { templateCss } from '../renderer/css';
import Layers from '../builder/Layers';
import Inspector, { type InspectorHandlers } from '../builder/Inspector';
import ThemePanel from '../builder/ThemePanel';
import AddModal from '../builder/AddModal';
import ExportModal from '../builder/ExportModal';
import { Btn, IconButton, Segmented, Spinner } from '../components/ui';
import { Icon } from '../lib/icons';

/* ============================================================
   المحرر الرئيسي — الاستوديو الكامل
   ============================================================ */

interface Meta { id: number | string | undefined; name: string; description: string; theme_key: string; }

function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

function findNode(doc: TemplateDoc, id: string): CompNode | null {
  const l = doc.layout;
  if (l.topbar?.id === id) return l.topbar;
  if (l.sidebar?.id === id) return l.sidebar;
  if (l.bottombar?.id === id) return l.bottombar;
  return l.sections.find((s) => s.id === id) || null;
}

export default function Builder({ path }: { path: string }) {
  const { toast, offline } = useAuth();
  const segs = path.split('/').filter(Boolean); // ['builder', ...]

  const [doc, setDoc] = useState<TemplateDoc | null>(null);
  const [meta, setMeta] = useState<Meta>({ id: undefined, name: 'قالب جديد', description: '', theme_key: '' });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>('');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [preview, setPreview] = useState(false);
  const [pvDevice, setPvDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showAdd, setShowAdd] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [drawer, setDrawer] = useState<'none' | 'layers' | 'inspector'>('none');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const hist = useRef<{ stack: TemplateDoc[]; idx: number }>({ stack: [], idx: -1 });
  const styleRef = useRef<HTMLStyleElement | null>(null);

  /* ---------- تحميل القالب ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const what = segs[1];
        if (!what || what === 'new') {
          let seed: { presetKey?: string; name?: string; data?: any } = {};
          try { seed = JSON.parse(localStorage.getItem('rts_seed') || '{}'); } catch { /* ignore */ }
          localStorage.removeItem('rts_seed');
          const p = PRESETS.find((x) => x.key === seed.presetKey) || PRESETS[0];
          if (!cancelled) {
            setDoc(seed.data && seed.data.layout ? clone(seed.data) : makeTemplateDoc(buildThemeFromPreset(p), p.layout));
            setMeta({ id: undefined, name: seed.name || `قالب ${p.name_ar}`, description: '', theme_key: p.key });
          }
        } else if (what === 'local') {
          const t = localGet(segs[2]);
          if (!t) throw new Error('القالب غير موجود');
          if (!cancelled) { setDoc(clone(t.data)); setMeta({ id: t.id, name: t.name, description: t.description, theme_key: t.theme_key }); }
        } else {
          // قالب محفوظ على الخادم
          try {
            const res = await api.template(what);
            const t = res.template;
            if (!cancelled) {
              setDoc(typeof t.data === 'string' ? JSON.parse(t.data) : t.data);
              setMeta({ id: t.id, name: t.name, description: t.description || '', theme_key: t.theme_key || '' });
            }
          } catch (e) {
            const t = localGet(what);
            if (t && !cancelled) { setDoc(clone(t.data)); setMeta({ id: t.id, name: t.name, description: t.description, theme_key: t.theme_key }); }
            else throw e;
          }
        }
      } catch (e: any) {
        if (e instanceof ApiOfflineError) toast('الخادم غير متاح — فُتح قالب محلي للتجربة', 'info');
        else toast(e?.message || 'تعذر فتح القالب', 'error');
        const p = PRESETS[0];
        if (!cancelled) { setDoc(makeTemplateDoc(buildThemeFromPreset(p), p.layout)); setMeta({ id: undefined, name: `قالب ${p.name_ar}`, description: '', theme_key: p.key }); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [path]);

  /* ---------- حقن CSS الثيم الحي ---------- */
  useEffect(() => {
    if (!doc) return;
    if (!styleRef.current) {
      const st = document.createElement('style');
      st.id = 'tpl-live-css';
      document.head.appendChild(st);
      styleRef.current = st;
    }
    styleRef.current.textContent = templateCss(doc.theme);
    return () => { };
  }, [doc]);
  useEffect(() => () => { styleRef.current?.remove(); styleRef.current = null; }, []);

  /* ---------- السجل (تراجع/إعادة) ---------- */
  const commit = useCallback((next: TemplateDoc) => {
    setDoc((cur) => {
      const h = hist.current;
      if (cur) {
        h.stack = h.stack.slice(0, h.idx + 1);
        h.stack.push(clone(cur));
        if (h.stack.length > 60) h.stack.shift();
        h.idx = h.stack.length - 1;
      }
      return next;
    });
    setDirty(true);
  }, []);

  const undo = useCallback(() => {
    const h = hist.current;
    if (h.idx < 0) return;
    const prev = h.stack[h.idx];
    h.idx -= 1;
    setDoc(clone(prev));
    setDirty(true);
  }, []);

  const redo = useCallback(() => {
    const h = hist.current;
    setDoc((cur) => {
      if (!cur) return cur;
      if (h.idx >= 0 && h.idx + 1 < h.stack.length) { h.idx += 1; return clone(h.stack[h.idx]); }
      return cur;
    });
  }, []);

  const mutate = useCallback((fn: (d: TemplateDoc) => void) => {
    setDoc((cur) => {
      if (!cur) return cur;
      const next = clone(cur);
      fn(next);
      const h = hist.current;
      h.stack = h.stack.slice(0, h.idx + 1);
      h.stack.push(clone(cur));
      if (h.stack.length > 60) h.stack.shift();
      h.idx = h.stack.length - 1;
      setDirty(true);
      return next;
    });
  }, []);

  /* ---------- عمليات المكوّنات ---------- */
  const patchNode = (id: string, fn: (n: CompNode) => void) => mutate((d) => {
    const n = findNode(d, id); if (n) fn(n);
  });

  const handlers: Omit<InspectorHandlers, 'replay'> & { replay: () => void } = useMemo(() => ({
    patchProps: (id, patch) => patchNode(id, (n) => { n.props = { ...n.props, ...patch }; }),
    patchStyle: (id, patch) => patchNode(id, (n) => { n.style = { ...n.style, ...patch }; }),
    patchAnim: (id, patch) => {
      patchNode(id, (n) => { n.anim = { ...n.anim, ...patch }; });
      setReplayKey((k) => k + 1);
    },
    setTitle: (id, title) => patchNode(id, (n) => { n.title = title; }),
    remove: (id) => { mutate((d) => removeNodeIn(d, id)); setSelected(''); },
    duplicate: (id) => { mutate((d) => duplicateNodeIn(d, id)); },
    toggleHidden: (id) => patchNode(id, (n) => { n.hidden = !n.hidden; }),
    replay: () => setReplayKey((k) => k + 1),
  }), [mutate]);

  const patchTheme = (patch: Partial<ThemeCfg>) => mutate((d) => { d.theme = { ...d.theme, ...patch }; });

  function removeNodeIn(d: TemplateDoc, id: string) {
    if (d.layout.topbar?.id === id) d.layout.topbar = null;
    else if (d.layout.sidebar?.id === id) d.layout.sidebar = null;
    else if (d.layout.bottombar?.id === id) d.layout.bottombar = null;
    else d.layout.sections = d.layout.sections.filter((s) => s.id !== id);
  }

  function duplicateNodeIn(d: TemplateDoc, id: string) {
    const n = findNode(d, id); if (!n) return;
    const copy: CompNode = { ...clone(n), id: uid(), title: `${n.title} (نسخة)` };
    if (['topbar', 'sidebar', 'bottombar'].includes(n.type)) {
      d.layout.sections.unshift(copy);
    } else {
      const i = d.layout.sections.findIndex((s) => s.id === id);
      d.layout.sections.splice(i + 1, 0, copy);
    }
    setSelected(copy.id);
  }

  const addNode = useCallback((type: CompType, index?: number) => {
    mutate((d) => {
      if (type === 'topbar' || type === 'sidebar' || type === 'bottombar') {
        if (!d.layout[type]) d.layout[type] = makeNode(type);
        setSelected(d.layout[type]!.id);
        return;
      }
      const n = makeNode(type);
      const at = index === undefined ? d.layout.sections.length : Math.max(0, Math.min(index, d.layout.sections.length));
      d.layout.sections.splice(at, 0, n);
      setSelected(n.id);
    });
    setReplayKey((k) => k + 1);
  }, [mutate]);

  const onDropAt = useCallback((index: number, raw?: string) => {
    let payload: any = null;
    try { payload = JSON.parse(raw || 'null'); } catch { /* ignore */ }
    if (!payload) return;
    if (payload.kind === 'add') { addNode(payload.type as CompType, index); return; }
    if (payload.kind === 'move') {
      mutate((d) => {
        const i = d.layout.sections.findIndex((s) => s.id === payload.id);
        if (i < 0) return;
        const [n] = d.layout.sections.splice(i, 1);
        let at = index;
        if (i < index) at -= 1;
        at = Math.max(0, Math.min(at, d.layout.sections.length));
        d.layout.sections.splice(at, 0, n);
      });
    }
  }, [addNode, mutate]);

  const moveNode = (id: string, dir: -1 | 1) => mutate((d) => {
    const i = d.layout.sections.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= d.layout.sections.length) return;
    [d.layout.sections[i], d.layout.sections[j]] = [d.layout.sections[j], d.layout.sections[i]];
  });

  /* ---------- الحفظ ---------- */
  const save = useCallback(async (silent = false) => {
    if (!doc) return;
    setSaving(true);
    try {
      if (!offline && !isOffline()) {
        if (typeof meta.id === 'number') {
          await api.updateTemplate(meta.id, { name: meta.name, description: meta.description, data: doc });
        } else {
          const res = await api.createTemplate({ name: meta.name, description: meta.description, theme_key: meta.theme_key, data: doc });
          setMeta((m) => ({ ...m, id: res.template?.id ?? res.id }));
          if (res.template?.id) navigate(`/builder/${res.template.id}`, );
        }
      } else {
        const t: TemplateMeta = { id: meta.id as any, user_id: 0, name: meta.name, description: meta.description, theme_key: meta.theme_key, featured: 0, data: clone(doc) };
        const saved = localUpsert(t);
        setMeta((m) => ({ ...m, id: saved.id }));
        navigate(`/builder/local/${saved.id}`);
      }
      setDirty(false);
      hist.current = { stack: [], idx: -1 };
      if (!silent) toast('تم حفظ القالب ✦');
    } catch (e: any) {
      toast(e?.message || 'فشل الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  }, [doc, meta, offline, toast]);

  /* ---------- اختصارات لوحة المفاتيح ---------- */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName || '';
      const typing = /INPUT|TEXTAREA|SELECT/.test(tag) || (e.target as HTMLElement)?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && !typing && selected) { e.preventDefault(); handlers.remove(selected); }
      else if (e.key === 'Escape' && !typing) { setSelected(''); setDrawer('none'); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [save, undo, redo, selected, handlers]);

  /* ---------- تحذير المغادرة ---------- */
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const selNode = doc && selected ? findNode(doc, selected) : null;
  const canUndo = hist.current.idx >= 0;
  const canRedo = hist.current.idx >= 0 && hist.current.idx + 1 < hist.current.stack.length;

  if (loading || !doc) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Spinner size={34} />
        <p className="text-xs text-slate-500 font-black">جارٍ تجهيز المحرر…</p>
      </div>
    );
  }

  const frameW = device === 'mobile' ? 390 : device === 'tablet' ? 820 : undefined;

  const LayersPanel = (
    <Layers
      doc={doc} selected={selected} onSelect={(id) => setSelected(id)}
      onDropAt={onDropAt} onDragRowStart={() => {}}
      onChromeAdd={(ty) => { addNode(ty); }}
      onNodeRemove={(id) => { mutate((d) => removeNodeIn(d, id)); if (selected === id) setSelected(''); }}
      onNodeHide={(id) => patchNode(id, (n) => { n.hidden = !n.hidden; })}
      onNodeMove={moveNode}
      openAdd={() => setShowAdd(true)}
    />
  );

  const InspectorPanel = selNode ? (
    <Inspector node={selNode} {...handlers} />
  ) : (
    <ThemePanel theme={doc.theme} onChange={patchTheme} />
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-ink-950">
      {/* ======= شريط الأدوات ======= */}
      <header className="h-14 shrink-0 border-b border-white/7 bg-ink-900/85 backdrop-blur-xl flex items-center gap-2 px-3 z-40">
        <IconButton name="ArrowRight" title="العودة للاستوديو" onClick={() => { if (dirty && !confirm('هناك تغييرات غير محفوظة — مغادرة؟')) return; navigate('/studio'); }} />
        <div className="hidden sm:flex items-center gap-2 bg-white/[.04] border border-white/8 rounded-xl px-3 py-1.5 focus-within:border-violet-400/50 transition-colors">
          <Icon name="FileText" size={13} />
          <input value={meta.name} onChange={(e) => { setMeta((m) => ({ ...m, name: e.target.value })); setDirty(true); }}
            className="bg-transparent outline-none text-xs font-black w-36 lg:w-52" placeholder="اسم القالب" />
          {dirty ? <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="غير محفوظ" /> : <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="محفوظ" />}
        </div>
        <span className="flex items-center gap-1">
          <IconButton name="Undo2" title="تراجع (Ctrl+Z)" onClick={undo} className={canUndo ? '' : 'opacity-30'} />
          <IconButton name="Redo2" title="إعادة (Ctrl+Shift+Z)" onClick={redo} className={canRedo ? '' : 'opacity-30'} />
        </span>
        <div className="flex-1" />
        <div className="hidden md:block w-56">
          <Segmented size="sm" value={device} onChange={(v) => setDevice(v as any)} options={[
            { value: 'desktop', icon: 'Monitor', title: 'حاسوب' },
            { value: 'tablet', icon: 'Tablet', title: 'لوحي' },
            { value: 'mobile', icon: 'Smartphone', title: 'جوال' },
          ]} />
        </div>
        <button onClick={() => { setSelected(''); setDrawer('inspector'); }}
          className={`h-8 px-3 rounded-lg text-[11px] font-black flex items-center gap-1.5 transition-all border ${!selNode ? 'bg-violet-500/25 border-violet-400/40 text-violet-200' : 'bg-white/5 border-white/8 text-slate-400 hover:text-white'}`}>
          <Icon name="Palette" size={13} /> الثيم
        </button>
        <Btn size="sm" variant="ghost" icon="Play" onClick={() => { setPvDevice(device); setPreview(true); }} className="hidden sm:inline-flex">معاينة</Btn>
        <Btn size="sm" variant="ghost" icon="Plus" onClick={() => setShowAdd(true)} className="hidden lg:inline-flex">مكوّن</Btn>
        <Btn size="sm" variant="ghost" icon={saving ? 'LoaderCircle' : 'Save'} onClick={() => save()} disabled={saving} className="hidden sm:inline-flex">حفظ</Btn>
        <Btn size="sm" icon="Share2" onClick={() => setShowExport(true)}>تصدير</Btn>
        {/* أزرار الجوال */}
        <IconButton name="Layers" title="الطبقات" className="md:hidden" active={drawer === 'layers'} onClick={() => setDrawer(drawer === 'layers' ? 'none' : 'layers')} />
        <IconButton name="SlidersHorizontal" title="الإعدادات" className="md:hidden" active={drawer === 'inspector'} onClick={() => setDrawer(drawer === 'inspector' ? 'none' : 'inspector')} />
      </header>

      {/* ======= الجسم ======= */}
      <div className="flex-1 flex min-h-0 relative">
        {/* الطبقات — سطح المكتب */}
        <aside className="hidden md:flex w-60 lg:w-64 shrink-0 border-l border-white/7 bg-ink-900/55 p-3 overflow-hidden flex-col">
          {LayersPanel}
        </aside>

        {/* اللوحة */}
        <main className="flex-1 min-w-0 overflow-auto p-3 sm:p-5" style={{ background: 'radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '22px 22px', backgroundColor: '#080a11' }}>
          <div className="mx-auto transition-all duration-300" style={{ width: frameW ? `${frameW}px` : '100%', maxWidth: '100%' }}>
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 min-h-[70vh]" style={{ direction: doc.theme.rtl ? 'rtl' : 'ltr' }}>
              <TemplateRenderer
                doc={doc} mode="edit" device={device} selectedId={selected}
                onSelect={(id) => setSelected(id)}
                onDropSection={(i, data) => onDropAt(i, data)}
                replayKey={replayKey}
              />
            </div>
            <p className="text-center text-[10px] text-slate-600 font-bold mt-3 pb-6">
              انقر أي مكوّن لتحديده وتحريره · اسحب الأقسام لإعادة ترتيبها · {doc.layout.sections.length} قسمًا في القالب
            </p>
          </div>
        </main>

        {/* المفتش — سطح المكتب */}
        <aside className="hidden md:flex w-80 lg:w-96 shrink-0 border-r border-white/7 bg-ink-900/55 overflow-y-auto p-3">
          <div className="w-full">{InspectorPanel}</div>
        </aside>

        {/* أدراج الجوال */}
        {drawer !== 'none' ? (
          <div className="md:hidden fixed inset-0 z-50" onClick={() => setDrawer('none')}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
            <div className={`absolute top-0 bottom-0 w-[86%] max-w-sm bg-ink-900 border-white/10 p-3 overflow-y-auto pop-in shadow-2xl ${drawer === 'layers' ? 'right-0 border-l' : 'left-0 border-r'}`}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-slate-300">{drawer === 'layers' ? 'طبقات القالب' : selNode ? `إعدادات: ${selNode.title}` : 'الثيم العام'}</span>
                <IconButton name="X" onClick={() => setDrawer('none')} />
              </div>
              {drawer === 'layers' ? LayersPanel : InspectorPanel}
            </div>
          </div>
        ) : null}
      </div>

      {/* ======= المعاينة الكاملة ======= */}
      {preview ? (
        <div className="fixed inset-0 z-[95] bg-ink-950 flex flex-col animate-fade-in">
          <div className="h-13 shrink-0 border-b border-white/8 bg-ink-900/90 backdrop-blur flex items-center gap-2 px-4 py-2.5">
            <span className="text-xs font-black flex items-center gap-2 text-emerald-300"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> معاينة حية تفاعلية</span>
            <div className="flex-1" />
            <div className="w-56">
              <Segmented size="sm" value={pvDevice} onChange={(v) => setPvDevice(v as any)} options={[
                { value: 'desktop', icon: 'Monitor', title: 'حاسوب' },
                { value: 'tablet', icon: 'Tablet', title: 'لوحي' },
                { value: 'mobile', icon: 'Smartphone', title: 'جوال' },
              ]} />
            </div>
            <Btn size="sm" variant="danger" icon="X" onClick={() => setPreview(false)}>إغلاق</Btn>
          </div>
          <div className="flex-1 overflow-auto p-4" style={{ background: '#04050a' }}>
            <div className="mx-auto rounded-2xl overflow-hidden border border-white/12 shadow-2xl transition-all duration-300"
              style={{ width: pvDevice === 'mobile' ? 390 : pvDevice === 'tablet' ? 820 : '100%', maxWidth: '100%', minHeight: '80vh' }}>
              <TemplateRenderer doc={doc} mode="preview" device={pvDevice} />
            </div>
          </div>
        </div>
      ) : null}

      <AddModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={(ty) => addNode(ty)}
        existing={{ topbar: !!doc.layout.topbar, sidebar: !!doc.layout.sidebar, bottombar: !!doc.layout.bottombar }} />
      <ExportModal open={showExport} onClose={() => setShowExport(false)} doc={doc} name={meta.name} />
    </div>
  );
}
