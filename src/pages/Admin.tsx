import { useCallback, useEffect, useState } from 'react';
import { api, ApiOfflineError } from '../lib/api';
import { useAuth } from '../store/auth';
import { AppNav, Btn, Empty, IconButton, Modal, Segmented, Select, Spinner, TextInput } from '../components/ui';
import { Icon } from '../lib/icons';
import { PRESETS, buildThemeFromPreset } from '../lib/presets';
import { makeTemplateDoc } from '../lib/defaults';
import type { TemplateDoc } from '../lib/types';
import { MiniTemplate } from '../components/MiniTemplate';
import { TemplateRenderer } from '../renderer/TemplateRenderer';

/* ============================================================
   لوحة تحكم المدير — القوالب والمستخدمون والثيمات
   ============================================================ */

export default function Admin() {
  const { toast, offline, user } = useAuth();
  const [tab, setTab] = useState<'overview' | 'users' | 'templates' | 'themes'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pv, setPv] = useState<{ name: string; doc: TemplateDoc } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, t, th] = await Promise.all([
        api.adminStats(), api.adminUsers(), api.adminTemplates(),
        fetch('/api/themes?all=1', { headers: { Authorization: `Bearer ${localStorage.getItem('rts_token') || ''}` } }).then((r) => r.json()),
      ]);
      setStats(s.stats); setUsers(u.users); setTemplates(t.templates); setThemes(th.themes || []);
    } catch (e: any) {
      if (e instanceof ApiOfflineError) {
        setStats(null); setUsers([]); setTemplates([]);
        setThemes(PRESETS.map((p, i) => ({ id: i + 1, key: p.key, name_ar: p.name_ar, name: p.name, category: p.category, layout: p.layout, published: 1 })));
      } else toast(e?.message || 'فشل التحميل', 'error');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function act(fn: () => Promise<any>, msg: string) {
    try { await fn(); toast(msg); load(); } catch (e: any) { toast(e?.message || 'فشل', 'error'); }
  }

  const CARDS = [
    { icon: 'Users', label: 'المستخدمون', value: stats?.users ?? '—', color: 'from-sky-500/20 to-blue-500/20 text-sky-300' },
    { icon: 'LayoutGrid', label: 'القوالب', value: stats?.templates ?? '—', color: 'from-violet-500/20 to-fuchsia-500/20 text-violet-300' },
    { icon: 'Palette', label: 'الثيمات', value: stats?.themes ?? themes.length, color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300' },
    { icon: 'Star', label: 'قوالب مميزة', value: stats?.featured ?? '—', color: 'from-amber-500/20 to-orange-500/20 text-amber-300' },
  ];

  return (
    <div className="min-h-screen grid-bg">
      <AppNav current="/admin" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-end gap-4 mb-7 animate-fade-up">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30"><Icon name="ShieldCheck" size={21} /></span>
              لوحة الإدارة
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-2">إدارة المستخدمين والقوالب والثيمات — {user?.username}</p>
          </div>
          <Btn size="sm" variant="ghost" icon="RefreshCw" onClick={load}>تحديث</Btn>
        </div>

        {offline ? (
          <div className="mb-6 flex items-center gap-3 bg-amber-400/8 border border-amber-400/25 rounded-2xl p-4 text-[12px] font-bold text-amber-200/90">
            <Icon name="WifiOff" size={17} className="shrink-0" />
            خادم PHP غير مشغّل — إدارة المستخدمين والقوالب تتطلب الخادم. المعروض الآن بيانات الثيمات المحلية فقط.
          </div>
        ) : null}

        <div className="max-w-xl mb-7">
          <Segmented value={tab} onChange={(v) => setTab(v as any)} options={[
            { value: 'overview', label: 'نظرة عامة', icon: 'Gauge' },
            { value: 'users', label: 'المستخدمون', icon: 'Users' },
            { value: 'templates', label: 'القوالب', icon: 'LayoutGrid' },
            { value: 'themes', label: 'الثيمات', icon: 'Palette' },
          ]} />
        </div>

        {loading ? <div className="flex justify-center py-24"><Spinner size={30} /></div> : (
          <>
            {tab === 'overview' ? (
              <div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {CARDS.map((c, i) => (
                    <div key={c.label} className={`glass-panel p-5 bg-gradient-to-b ${c.color} animate-fade-up`} style={{ animationDelay: `${i * 60}ms` }}>
                      <span className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center mb-3"><Icon name={c.icon} size={18} /></span>
                      <p className="text-2xl font-black">{String(c.value)}</p>
                      <p className="text-[11px] font-bold opacity-70 mt-0.5">{c.label}</p>
                    </div>
                  ))}
                </div>
                <div className="glass-panel p-6">
                  <h3 className="font-black text-sm mb-4 flex items-center gap-2"><Icon name="Activity" size={15} className="text-violet-300" /> أحدث القوالب</h3>
                  {templates.length === 0 ? <p className="text-xs text-slate-500 font-bold">لا توجد قوالب بعد</p> : (
                    <div className="flex flex-col gap-2">
                      {templates.slice(0, 5).map((t) => (
                        <div key={t.id} className="flex items-center gap-3 bg-white/[.03] rounded-xl px-4 py-3 border border-white/6">
                          <span className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-300 flex items-center justify-center"><Icon name="FileText" size={14} /></span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-xs font-black truncate">{t.name}</span>
                            <span className="block text-[10px] text-slate-500 font-bold">بواسطة {t.user_name || '—'} · {t.updated_at ? new Date(t.updated_at).toLocaleDateString('ar') : ''}</span>
                          </span>
                          <IconButton name="Eye" title="معاينة" onClick={() => setPv({ name: t.name, doc: typeof t.data === 'string' ? JSON.parse(t.data) : t.data })} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {tab === 'users' ? (
              offline ? <Empty icon="WifiOff" title="يتطلب الخادم" sub="شغّل خادم PHP لإدارة المستخدمين" /> : (
                <div className="glass-panel overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="bg-white/[.04] text-[10.5px] font-black text-slate-400">
                          <th className="text-right px-4 py-3">المستخدم</th>
                          <th className="text-right px-4 py-3">الدور</th>
                          <th className="text-right px-4 py-3">الحالة</th>
                          <th className="text-right px-4 py-3">القوالب</th>
                          <th className="text-right px-4 py-3">تاريخ الانضمام</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-t border-white/5 hover:bg-white/[.02] transition-colors">
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">{(u.name || '?')[0]}</span>
                                <span className="min-w-0">
                                  <span className="block text-xs font-black truncate">{u.name} {u.username === 'admin' ? <span className="text-[8.5px] text-amber-300 bg-amber-400/12 rounded px-1.5 py-0.5 font-black">المدير</span> : null}</span>
                                  <span className="block text-[10px] text-slate-500 font-bold" dir="ltr">@{u.username} · {u.email}</span>
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-3 w-28">
                              <Select value={u.role} onChange={(v) => act(() => api.adminUpdateUser(u.id, { role: v }), `تم تغيير دور ${u.name}`)}
                                options={[{ value: 'user', label: 'عضو' }, { value: 'admin', label: 'مدير' }]} />
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => act(() => api.adminUpdateUser(u.id, { status: u.status === 'active' ? 'banned' : 'active' }), u.status === 'active' ? 'تم الحظر' : 'تم رفع الحظر')}
                                className={`text-[10px] font-black rounded-full px-3 py-1.5 border transition-colors ${u.status === 'active' ? 'bg-emerald-400/12 text-emerald-300 border-emerald-400/25 hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-400/30' : 'bg-rose-500/12 text-rose-300 border-rose-400/25 hover:bg-emerald-400/15 hover:text-emerald-300'}`}>
                                {u.status === 'active' ? 'نشط ✓' : 'محظور ✕'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-xs font-black text-slate-300">{u.templates_count ?? 0}</td>
                            <td className="px-4 py-3 text-[10.5px] text-slate-500 font-bold">{u.created_at ? new Date(u.created_at).toLocaleDateString('ar') : '—'}</td>
                            <td className="px-4 py-3 text-left">
                              {u.username !== 'admin' ? (
                                <IconButton name="Trash2" title="حذف المستخدم" className="hover:!bg-rose-500/20 hover:!text-rose-300"
                                  onClick={() => { if (confirm(`حذف المستخدم ${u.name} وكل قوالبه؟`)) act(() => api.adminDeleteUser(u.id), 'تم حذف المستخدم'); }} />
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {users.length === 0 ? <Empty icon="Users" title="لا يوجد مستخدمون" /> : null}
                </div>
              )
            ) : null}

            {tab === 'templates' ? (
              offline ? <Empty icon="WifiOff" title="يتطلب الخادم" sub="شغّل خادم PHP لإدارة القوالب" /> : templates.length === 0 ? <Empty icon="LayoutGrid" title="لا توجد قوالب" /> : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((t) => {
                    const doc: TemplateDoc = typeof t.data === 'string' ? JSON.parse(t.data) : t.data;
                    return (
                      <div key={t.id} className="glass-panel overflow-hidden group hover:border-violet-400/35 transition-colors animate-fade-up">
                        <button className="block w-full aspect-[16/9] overflow-hidden" onClick={() => setPv({ name: t.name, doc })}>
                          <MiniTemplate doc={doc} className="w-full h-full group-hover:scale-[1.03] transition-transform duration-500" />
                        </button>
                        <div className="p-4">
                          <h3 className="font-black text-[13px] truncate">{t.name}</h3>
                          <p className="text-[10px] text-slate-500 font-bold mb-3">بواسطة {t.user_name || '—'} · #{t.id}</p>
                          <div className="flex gap-1.5">
                            <Btn size="xs" variant={t.featured ? 'gold' : 'ghost'} icon="Star" onClick={() => act(() => api.adminUpdateTemplate(t.id, { featured: t.featured ? 0 : 1 }), t.featured ? 'أُلغي التمييز' : 'تم التمييز ★')}>
                              {t.featured ? 'مميز' : 'تمييز'}
                            </Btn>
                            <Btn size="xs" variant="ghost" icon="Eye" onClick={() => setPv({ name: t.name, doc })}>معاينة</Btn>
                            <div className="flex-1" />
                            <Btn size="xs" variant="danger" icon="Trash2" className="!px-2" title="حذف"
                              onClick={() => { if (confirm(`حذف القالب «${t.name}»؟`)) act(() => api.adminDeleteTemplate(t.id), 'تم حذف القالب'); }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : null}

            {tab === 'themes' ? (
              <div>
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <p className="text-[11px] text-slate-500 font-bold flex-1">الثيمات المعروضة للأعضاء في الاستوديو — يمكنك إعادة التسمية أو الإخفاء أو الحذف</p>
                  {!offline ? (
                    <Btn size="xs" variant="ghost" icon="RotateCcw" onClick={() => { if (confirm('استعادة الثيمات الثلاثين الافتراضية؟ (سيحذف أي تعديلات عليها)')) act(() => api.adminResetThemes(), 'تمت الاستعادة'); }}>
                      استعادة الافتراضي
                    </Btn>
                  ) : null}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {themes.map((th: any) => {
                    const preset = PRESETS.find((p) => p.key === th.key);
                    const doc = th.data ? (typeof th.data === 'string' ? JSON.parse(th.data) : th.data)
                      : preset ? makeTemplateDoc(buildThemeFromPreset(preset), preset.layout) : null;
                    return (
                      <div key={th.id ?? th.key} className="glass-panel p-3.5 flex items-center gap-3 animate-fade-up">
                        {doc ? (
                          <button className="w-24 h-16 rounded-lg overflow-hidden border border-white/10 shrink-0" onClick={() => setPv({ name: `${th.name_ar} — ${th.name}`, doc })}>
                            <MiniTemplate doc={doc} className="w-full h-full" width={900} height={600} />
                          </button>
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <input defaultValue={th.name_ar}
                            onBlur={(e) => { if (!offline && e.target.value !== th.name_ar) act(() => api.adminSaveTheme({ id: th.id, name_ar: e.target.value }), 'تمت إعادة التسمية'); }}
                            className="w-full bg-transparent text-[12.5px] font-black outline-none border-b border-transparent focus:border-violet-400/50 transition-colors" />
                          <p className="text-[9.5px] text-slate-500 font-bold mt-0.5" dir="ltr">{th.key} · {th.category}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {!offline ? (
                            <>
                              <IconButton name={th.published ? 'Eye' : 'EyeOff'} active={!th.published} title={th.published ? 'إخفاء من الاستوديو' : 'نشر'}
                                onClick={() => act(() => api.adminSaveTheme({ id: th.id, published: th.published ? 0 : 1 }), th.published ? 'أُخفي' : 'نُشر')} />
                              <IconButton name="Trash2" title="حذف" className="hover:!bg-rose-500/20 hover:!text-rose-300"
                                onClick={() => { if (confirm(`حذف ثيم «${th.name_ar}»؟`)) act(() => api.adminDeleteTheme(th.id), 'تم الحذف'); }} />
                            </>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>

      <Modal open={!!pv} onClose={() => setPv(null)} title={pv?.name} icon="MonitorPlay" wide>
        {pv ? (
          <div className="rounded-2xl overflow-hidden border border-white/10 h-[520px] overflow-y-auto">
            <TemplatePreview doc={pv.doc} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function TemplatePreview({ doc }: { doc: TemplateDoc }) {
  return <TemplateRenderer doc={doc} mode="preview" device="desktop" />;
}
