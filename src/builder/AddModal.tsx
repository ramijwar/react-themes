import type { CompType } from '../lib/types';
import { COMP_LABELS, COMP_ICONS } from '../lib/types';
import { Icon } from '../lib/icons';
import { Modal } from '../components/ui';

/* مكتبة المكوّنات — إضافة بالأقسام */

const GROUPS: { title: string; icon: string; types: CompType[] }[] = [
  { title: 'الهيكلة والقوائم', icon: 'LayoutTemplate', types: ['topbar', 'sidebar', 'bottombar'] },
  { title: 'الأقسام الرئيسية', icon: 'Blocks', types: ['hero', 'cta', 'text', 'search'] },
  { title: 'البيانات والعرض', icon: 'BarChart3', types: ['stats', 'cards', 'table', 'list', 'gallery', 'tabs'] },
  { title: 'النماذج والتفاعل', icon: 'TextCursorInput', types: ['form', 'buttons', 'alert', 'profile'] },
  { title: 'التسويق', icon: 'Megaphone', types: ['pricing', 'testimonials', 'footer'] },
];

export default function AddModal({ open, onClose, onAdd, existing }: {
  open: boolean; onClose: () => void;
  onAdd: (type: CompType, drag?: boolean) => void;
  existing: Record<string, boolean>;
}) {
  return (
    <Modal open={open} onClose={onClose} title="إضافة مكوّن إلى القالب" icon="PlusCircle" wide>
      <p className="text-[11px] text-slate-500 font-bold mb-4 -mt-1">
        انقر للإضافة في الأسفل — أو اسحب المكوّن وأفلته في المكان الدقيق داخل اللوحة أو بين الأقسام
      </p>
      <div className="flex flex-col gap-5">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <h4 className="text-[11px] font-black text-slate-400 mb-2.5 flex items-center gap-2">
              <Icon name={g.icon} size={13} className="text-violet-300" /> {g.title}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {g.types.map((ty) => {
                const uniq = ['topbar', 'sidebar', 'bottombar'].includes(ty);
                const disabled = uniq && existing[ty];
                return (
                  <button
                    key={ty}
                    disabled={disabled}
                    draggable={!disabled}
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'add', type: ty })); e.dataTransfer.effectAllowed = 'copy'; }}
                    onClick={() => { if (!disabled) { onAdd(ty); onClose(); } }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-right transition-all ${
                      disabled
                        ? 'border-white/5 bg-white/[.02] opacity-40 cursor-not-allowed'
                        : 'border-white/8 bg-white/[.03] hover:border-violet-400/50 hover:bg-violet-500/10 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing'
                    }`}
                    title={disabled ? 'موجود بالفعل (مكوّن وحيد)' : `إضافة ${COMP_LABELS[ty]}`}
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${disabled ? 'bg-white/5 text-slate-600' : 'bg-violet-500/15 text-violet-300'}`}>
                      <Icon name={COMP_ICONS[ty]} size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11.5px] font-black truncate">{COMP_LABELS[ty]}</span>
                      <span className="block text-[9px] text-slate-600 font-bold">{disabled ? 'مضاف ✓' : 'اسحب أو انقر'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
