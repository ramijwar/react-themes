import { useMemo, useState } from 'react';
import type { TemplateDoc } from '../lib/types';
import { buildHtml } from '../lib/exportHtml';
import { buildReactExport } from '../lib/exportReact';
import { downloadBlob, downloadZip, safeName } from '../lib/download';
import { Btn, Modal, Segmented } from '../components/ui';
import { Icon } from '../lib/icons';
import { useAuth } from '../store/auth';

/* ============================================================
   نافذة التصدير — HTML مفرد / مشروع HTML / حزمة React
   ============================================================ */

export default function ExportModal({ open, onClose, doc, name }: {
  open: boolean; onClose: () => void; doc: TemplateDoc; name: string;
}) {
  const { toast } = useAuth();
  const [view, setView] = useState<'html' | 'css' | 'js' | 'tsx'>('html');
  const safe = safeName(name);

  const out = useMemo(() => {
    if (!open) return null;
    const h = buildHtml(doc, name);
    const r = buildReactExport(doc, name);
    return { html: h.html, css: h.css, js: h.js, splitHtml: buildHtml(doc, name, { split: true }).html, react: r };
  }, [open, doc, name]);

  if (!out) return null;

  const code = view === 'html' ? out.html : view === 'css' ? out.css : view === 'js' ? out.js : out.react.files['TemplateApp.tsx'];

  const actions = [
    {
      icon: 'FileCode2', title: 'صفحة HTML واحدة', desc: 'ملف واحد مكتفٍ ذاتياً — CSS و JS مضمّنان. يفتح بأي متصفح مباشرة.',
      btn: 'تنزيل index.html', color: 'from-sky-500/20 to-cyan-500/20 border-sky-400/25 text-sky-300',
      run: () => { downloadBlob(out.html, `${safe}.html`, 'text/html;charset=utf-8'); toast('تم تنزيل صفحة HTML ⬇'); },
    },
    {
      icon: 'FolderArchive', title: 'مشروع HTML مفصول', desc: 'ZIP يحتوي index.html + assets/style.css + assets/script.js.',
      btn: 'تنزيل ZIP', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-400/25 text-emerald-300',
      run: async () => {
        await downloadZip({ 'index.html': out.splitHtml, 'assets/style.css': out.css, 'assets/script.js': out.js, 'README.md': `# ${name}\n\nصفحة HTML مولدة بواسطة ستوديو القوالب.\nافتح index.html مباشرة في المتصفح.\n` }, `${safe}-html.zip`);
        toast('تم تنزيل مشروع HTML ⬇');
      },
    },
    {
      icon: 'CodeXml', title: 'حزمة React (TSX)', desc: 'TemplateApp.tsx + template.css + interactions.ts + theme.json — لمشروع React/Vite.',
      btn: 'تنزيل ZIP', color: 'from-violet-500/20 to-fuchsia-500/20 border-violet-400/25 text-violet-300',
      run: async () => { await downloadZip(out.react.files, `${safe}-react.zip`); toast('تم تنزيل حزمة React ⬇'); },
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="تصدير القالب" icon="Share2" wide>
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        {actions.map((a) => (
          <div key={a.title} className={`rounded-2xl border bg-gradient-to-b p-4 flex flex-col gap-2 ${a.color.split(' ').slice(0, 3).join(' ')} ${a.color.split(' ').slice(3).join(' ')}`}>
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/8 ${a.color.split(' ').pop()}`}><Icon name={a.icon} size={19} /></span>
            <h4 className="font-black text-[13px] text-slate-100">{a.title}</h4>
            <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed flex-1">{a.desc}</p>
            <Btn size="xs" variant="ghost" icon="Download" onClick={a.run} className="w-full">{a.btn}</Btn>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-black text-slate-400 flex items-center gap-1.5"><Icon name="Eye" size={13} /> معاينة الكود المُولَّد:</span>
        <div className="flex-1" />
        <div className="w-72">
          <Segmented size="sm" value={view} onChange={(v) => setView(v as any)} options={[
            { value: 'html', label: 'HTML' }, { value: 'css', label: 'CSS' }, { value: 'js', label: 'JS' }, { value: 'tsx', label: 'TSX' },
          ]} />
        </div>
      </div>
      <div className="relative rounded-xl overflow-hidden border border-white/8 bg-black/40">
        <textarea readOnly dir="ltr" value={code}
          className="w-full h-72 p-4 text-[10.5px] leading-relaxed font-mono text-emerald-200/80 bg-transparent outline-none resize-none"
          style={{ direction: 'ltr' }} />
        <button
          onClick={() => { navigator.clipboard?.writeText(code); toast('تم نسخ الكود 📋'); }}
          className="absolute top-2.5 left-2.5 bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-slate-200 flex items-center gap-1.5 transition-colors">
          <Icon name="Copy" size={12} /> نسخ
        </button>
      </div>
      <p className="text-[10px] text-slate-600 font-bold mt-3 leading-relaxed">
        ✦ الصفحة المصدّرة مستقلة تماماً: متغيرات الثيم، الحركات (load/scroll/hover)، التفاعلات (تبويبات، قوائم، نماذج) ومتجاوبة مع الجوال — ولا تحتاج أي مكتبات خارجية.
      </p>
    </Modal>
  );
}
