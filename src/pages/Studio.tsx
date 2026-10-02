import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../lib/icons';
import { useAuth } from '../store/auth';
import { navigate } from '../router';
import { api, ApiOfflineError } from '../lib/api';
import { PRESETS, buildThemeFromPreset, LAYOUT_LABELS } from '../lib/presets';
import { makeTemplateDoc } from '../lib/defaults';
import type { TemplateDoc, TemplateMeta } from '../lib/types';
import { MiniTemplate } from '../components/MiniTemplate';
import { TemplateRenderer } from '../renderer/TemplateRenderer';
import { AppNav, Btn, Empty, Modal, Segmented, Spinner, TextInput } from '../components/ui';
import { localTemplates, localUpsert, localRemove } from '../lib/local';
import { buildHtml } from '../lib/exportHtml';
import { downloadBlob } from '../lib/download';

/* ============================================================
   الاستوديو — الثيمات الجاهزة + قوالب المستخدم
   ============================================================ */

function docOfPreset(key: string, data?: any): TemplateDoc {
  if (data) {
    try { return typeof data === 'string' ? JSON.parse(data) : data; } catch { /* ignore */ }
  }
  const p = PRESETS.find((x) => x.key === key) || PRESETS[0];
  return makeTemplateDoc(buildThemeFromPreset(p), p.layout);
}

interface ThemeRow { key: string; name: string; name_ar: string; category: string; layout: any; data?: any; }

export function startFromPreset(presetKey: string, name?: string, data?: any) {
  localStorage.setItem('rts_seed', JSON.stringify({ presetKey, name, data: data || undefined }));
  navigate('/builder/new');
}

export default function Studio() {
  const { user, toast, offline } = useAuth();
  const [tab, setTab] = useState<'themes' | 'mine'>('themes');
  const [cat, setCat] = useState('الكل');
  const [q, setQ] = useState('');
  const [mine, setMine] = useState<TemplateMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{ name: string; doc: TemplateDoc } | null>(null);
  const [pvDevice, setPvDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [renaming, setRenaming] = useState<TemplateMeta | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [themeRows, setThemeRows] = useState<ThemeRow[]>(PRESETS.map((p) => ({ key: p.key, name: p.name, name_ar: p.name_ar, category: p.category, layout: p.layout })));

  useEffect(() => {
    api.themes()
      .then((res) => {
        if (Array.isArray(res.themes) && res.themes.length) {
          setThemeRows(res.themes.filter((t: any) => t.published).map((t: any) => ({ key: t.key, name: t.name, name_ar: t.name_ar || t.name, category: t.category, layout: t.layout, data: t.data })));
        }
      })
      .catch(() => { /* fallback = PRESETS */ });
  }, []);

  const loadMine = async () => {
    setLoading(true);
    try {
      const res = await api.templates();
      setMine(res.templates.map((t: any) => ({ ...t, data: typeof t.data === 'string' ? JSON.parse(t.data) : t.data })));
    } catch (e) {
      if (e instanceof ApiOfflineError) setMine(localTemplates());
      else setMine(localTemplates());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadMine(); }, [user?.id]);

  const presets = useMemo(() => themeRows.filter((p) =>
    (cat === 'الكل' || p.category === cat) &&
    (!q || `${p.name_ar} ${p.name} ${p.category}`.toLowerCase().includes(q.toLowerCase()))
  ), [cat, q, themeRows]);

  const categories = useMemo(() => ['الكل', ...Array.from(new Set(themeRows.map((p) => p.category)))], [themeRows]);

  async function remove(t: TemplateMeta) {
    if (!confirm(`حذف القالب «${t.name}» نهائياً؟`)) return;
    try {
      if (!offline && typeof t.id === 'number') await api.deleteTemplate(t.id);
      else localRemove(t.id);
      toast('تم حذف القالب', 'info');
      loadMine();
    } catch (e: any) { toast(e?.message || 'فشل الحذف', 'error'); }
  }

  async function duplicate(t: TemplateMeta) {
    const copy: TemplateMeta = { ...t, id: undefined as any, name: `${t.name} (نسخة)`, featured: 0 };
    try {
      if (!offline) {
        await api.createTemplate({ name: copy.name, description: t.description, theme_key: t.theme_key, data: t.data });
      } else {
        localUpsert(copy);
      }
      toast('تم تكرار القالب ✦');
      loadMine();
    } catch (e: any) { toast(e?.message || 'فشل التكرار', 'error'); }
  }

  function exportQuick(t: TemplateMeta) {
    try {
      const { html } = buildHtml(t.data, t.name);
      downloadBlob(html, `${t.name.replace(/\s+/g, '-')}.html`, 'text/html;charset=utf-8');
      toast('تم تصدير HTML ⬇');
    } catch { toast('تعذر التصدير', 'error'); }
  }

  function openTemplate(t: TemplateMeta) {
    if (!offline && typeof t.id === 'number') navigate(`/builder/${t.id}`);
    else navigate(`/builder/local/${t.id}`);
  }

  return (
    <div className="min-h-screen grid-bg">
      <AppNav current="/studio" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* الترويسة */}
        <div className="flex flex-wrap items-end gap-4 mb-7 animate-fade-up">
          <div className="flex-1 min-w-52">
            <h1 className="text-2xl sm:text-3xl font-black">
              أهلاً <span className="text-grad">{user?.name?.split(' ')[0]}</span> ✦
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1.5">
              {themeRows.length} ثيماً جاهزاً · {mine.length} قالباً محفوظاً — اختر ثيماً وابدأ التخصيص الفوري
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative w-44 sm:w-56">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"><Icon name="Search" size={14} /></span>
              <TextInput className="!pr-9 !py-2 text-xs" placeholder="ابحث…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Btn size="sm" icon="Plus" onClick={() => startFromPreset(PRESETS[0].key)}>قالب جديد</Btn>
          </div>
        </div>

        {/* التبويبات */}
        <div className="max-w-xs mb-6">
          <Segmented
            value={tab}
            onChange={(v) => setTab(v as any)}
            options={[
              { value: 'themes', label: `الثيمات الجاهزة (${themeRows.length})`, icon: 'LayoutGrid' },
              { value: 'mine', label: `قوالبی (${mine.length})`, icon: 'FolderHeart' },
            ]}
          />
        </div>

        {tab === 'themes' ? (
          <>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-6">
              {categories.map((c) => (
                <button key={c} onClick={() => setCat(c)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-[11.5px] font-black transition-all border ${
                    cat === c
                      ? 'bg-gradient-to-br from-violet-500/90 to-indigo-500/90 text-white border-transparent shadow-lg shadow-violet-500/25'
                      : 'bg-white/4 text-slate-400 border-white/8 hover:border-violet-400/40 hover:text-white'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {presets.map((p, i) => {
                const doc = docOfPreset(p.key, p.data);
                return (
                  <div key={p.key} className="glass-panel overflow-hidden group hover:border-violet-400/40 hover:-translate-y-1.5 transition-all duration-300 animate-fade-up" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
                    <button className="block w-full aspect-[16/9.2] relative overflow-hidden cursor-pointer" onClick={() => { setPreview({ name: `${p.name_ar} — ${p.name}`, doc }); setPvDevice('desktop'); }}>
                      <MiniTemplate doc={doc} className="w-full h-full group-hover:scale-[1.03] transition-transform duration-500" />
                      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/95 text-ink-900 text-[11px] font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xl scale-90 group-hover:scale-100">
                          <Icon name="Eye" size={13} /> معاينة حية
                        </span>
                      </span>
                      <span className="absolute top-2.5 right-2.5 flex gap-1.5">
                        <span className="text-[9.5px] font-black bg-ink-950/70 backdrop-blur text-slate-200 border border-white/10 rounded-full px-2.5 py-1">{p.category}</span>
                        <span className="text-[9.5px] font-black bg-ink-950/70 backdrop-blur text-slate-400 border border-white/10 rounded-full px-2.5 py-1 flex items-center gap-1">
                          <Icon name={doc.theme.mode === 'dark' ? 'Moon' : 'Sun'} size={9} /> {doc.theme.mode === 'dark' ? 'داكن' : 'فاتح'}
                        </span>
                      </span>
                    </button>
                    <div className="p-4 flex items-center gap-3">
                      <span className="flex gap-1">
                        {[doc.theme.colors.primary, doc.theme.colors.secondary, doc.theme.colors.accent].map((c, x) => (
                          <span key={x} className="w-4 h-4 rounded-md border border-white/20" style={{ background: c }} />
                        ))}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-[13.5px] truncate">{p.name_ar} <span className="text-slate-600 font-bold text-[10px]" dir="ltr">{p.name}</span></h3>
                        <p className="text-[10px] text-slate-500 font-bold">{LAYOUT_LABELS[p.layout as keyof typeof LAYOUT_LABELS] || p.layout}</p>
                      </div>
                      <Btn size="xs" icon="Wand2" onClick={() => startFromPreset(p.key, `قالب ${p.name_ar}`, p.data)}>خصّص</Btn>
                    </div>
                  </div>
                );
              })}
            </div>
            {presets.length === 0 ? <Empty icon="SearchX" title="لا توجد ثيمات مطابقة" sub="جرّب كلمة بحث أخرى أو category مختلف" /> : null}
          </>
        ) : (
          <>
            {loading ? (
              <div className="flex justify-center py-24"><Spinner size={30} /></div>
            ) : mine.length === 0 ? (
              <Empty icon="FolderPlus" title="لا توجد قوالب بعد" sub="ابدأ من أي ثيم جاهز وخصّصه كما تشاء — سيُحفظ هنا تلقائياً في مكتبتك"
                action={<Btn icon="Sparkles" onClick={() => startFromPreset(PRESETS[0].key)}>أنشئ أول قالب</Btn>} />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {mine.map((t, i) => (
                  <div key={String(t.id)} className="glass-panel overflow-hidden group hover:border-violet-400/40 hover:-translate-y-1 transition-all duration-300 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <button className="block w-full aspect-[16/9.2] relative overflow-hidden" onClick={() => { setPreview({ name: t.name, doc: t.data }); setPvDevice('desktop'); }}>
                      <MiniTemplate doc={t.data} className="w-full h-full group-hover:scale-[1.03] transition-transform duration-500" />
                      {t.featured ? <span className="absolute top-2.5 right-2.5 text-[9.5px] font-black bg-amber-400/20 backdrop-blur text-amber-200 border border-amber-300/30 rounded-full px-2.5 py-1">★ مميز</span> : null}
                      {String(t.id).startsWith('local') || typeof t.id === 'string' ? (
                        <span className="absolute top-2.5 left-2.5 text-[9.5px] font-black bg-sky-400/15 backdrop-blur text-sky-200 border border-sky-300/25 rounded-full px-2.5 py-1">محلي</span>
                      ) : null}
                    </button>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-[13.5px] truncate">{t.name}</h3>
                          <p className="text-[10px] text-slate-500 font-bold">{t.updated_at ? new Date(t.updated_at).toLocaleDateString('ar') : '—'} · {t.data?.layout?.sections?.length || 0} مكوّناً</p>
                        </div>
                        <button onClick={() => { setRenaming(t); setRenameVal(t.name); }} title="إعادة تسمية" className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/12 text-slate-400 flex items-center justify-center transition-colors"><Icon name="Pencil" size={13} /></button>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <Btn size="xs" icon="SlidersHorizontal" onClick={() => openTemplate(t)}>تحرير</Btn>
                        <Btn size="xs" variant="ghost" icon="Copy" onClick={() => duplicate(t)}>نسخة</Btn>
                        <Btn size="xs" variant="ghost" icon="FileDown" onClick={() => exportQuick(t)}>HTML</Btn>
                        <Btn size="xs" variant="danger" icon="Trash2" className="!px-2" onClick={() => remove(t)} title="حذف" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* نافذة المعاينة الحية */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name} icon="MonitorPlay" wide>
        {preview ? (
          <div>
            <div className="flex justify-center mb-4 max-w-sm mx-auto">
              <Segmented size="sm" value={pvDevice} onChange={(v) => setPvDevice(v as any)} options={[
                { value: 'desktop', icon: 'Monitor', title: 'حاسوب' },
                { value: 'tablet', icon: 'Tablet', title: 'tablet' },
                { value: 'mobile', icon: 'Smartphone', title: 'جوال' },
              ]} />
            </div>
            <div className="mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300"
              style={{ width: pvDevice === 'mobile' ? 390 : pvDevice === 'tablet' ? 780 : '100%', maxWidth: '100%', height: pvDevice === 'desktop' ? 560 : 640 }}>
              <div className="w-full h-full overflow-auto">
                <TemplateRenderer doc={preview.doc} mode="preview" device={pvDevice} />
              </div>
            </div>
            <p className="text-center text-[10.5px] text-slate-500 font-bold mt-3">معاينة تفاعلية حقيقية — التبويبات والقوائم والحركات تعمل تماماً كما في التصدير</p>
          </div>
        ) : null}
      </Modal>

      {/* إعادة تسمية */}
      <Modal open={!!renaming} onClose={() => setRenaming(null)} title="إعادة تسمية القالب" icon="Pencil">
        <div className="flex flex-col gap-4">
          <TextInput value={renameVal} onChange={(e) => setRenameVal(e.target.value)} autoFocus />
          <div className="flex gap-2 justify-end">
            <Btn variant="ghost" size="sm" onClick={() => setRenaming(null)}>إلغاء</Btn>
            <Btn size="sm" icon="Check" onClick={async () => {
              if (!renaming) return;
              const updated = { ...renaming, name: renameVal.trim() || renaming.name };
              try {
                if (!offline && typeof renaming.id === 'number') {
                  await api.updateTemplate(renaming.id, { name: updated.name, description: updated.description, data: updated.data });
                } else {
                  localUpsert(updated);
                }
                toast('تم التحديث ✦');
                setRenaming(null);
                loadMine();
              } catch (e: any) { toast(e?.message || 'فشل', 'error'); }
            }}>حفظ</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
