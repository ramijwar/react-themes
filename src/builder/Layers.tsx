import { useState } from 'react';
import type { CompNode, CompType, TemplateDoc } from '../lib/types';
import { COMP_ICONS, COMP_LABELS } from '../lib/types';
import { Icon } from '../lib/icons';
import { IconButton } from '../components/ui';

/* ============================================================
   لوحة الطبقات — شجرة القالب مع السحب والإفلات
   ============================================================ */

export interface DragPayload { kind: 'move'; id: string }

interface Props {
  doc: TemplateDoc;
  selected: string;
  onSelect: (id: string) => void;
  onDropAt: (index: number, data?: string) => void;   // إفلات عنصر مسحوب/مضاف عند فهرس
  onDragRowStart: (id: string) => void;
  onChromeAdd: (type: CompType) => void;
  onNodeRemove: (id: string) => void;
  onNodeHide: (id: string) => void;
  onNodeMove: (id: string, dir: -1 | 1) => void;
  openAdd: () => void;
}

function Row({ node, selected, onSelect, onDragStart, onRemove, onHide, children }: {
  node: CompNode; selected: boolean; onSelect: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onRemove?: () => void; onHide?: () => void; children?: React.ReactNode;
}) {
  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onClick={onSelect}
      className={`group flex items-center gap-2 px-2.5 py-2 rounded-xl border text-[11.5px] font-bold transition-all cursor-pointer ${
        selected
          ? 'bg-violet-500/18 border-violet-400/50 text-white shadow-lg shadow-violet-500/10'
          : 'bg-white/[.03] border-white/6 text-slate-300 hover:border-violet-400/30 hover:bg-white/[.06]'
      } ${onDragStart ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {onDragStart ? <span className="text-slate-600 group-hover:text-slate-400 transition-colors"><Icon name="GripVertical" size={13} /></span> : null}
      <span className={selected ? 'text-violet-200' : 'text-slate-500'}><Icon name={COMP_ICONS[node.type]} size={14} /></span>
      <span className="flex-1 truncate">{node.title}</span>
      {node.hidden ? <span className="text-[8.5px] font-black text-slate-500 bg-white/6 rounded px-1.5">مخفي</span> : null}
      <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        {children}
        {onHide ? <IconButton name={node.hidden ? 'EyeOff' : 'Eye'} title={node.hidden ? 'إظهار' : 'إخفاء'} onClick={onHide} className="!w-6 !h-6" /> : null}
        {onRemove ? <IconButton name="Trash2" title="حذف" onClick={onRemove} className="!w-6 !h-6 hover:!bg-rose-500/20 hover:!text-rose-300" /> : null}
      </span>
    </div>
  );
}

export default function Layers({ doc, selected, onSelect, onDropAt, onDragRowStart, onChromeAdd, onNodeRemove, onNodeHide, onNodeMove, openAdd }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const chrome: { key: 'topbar' | 'sidebar' | 'bottombar'; label: string; icon: string }[] = [
    { key: 'topbar', label: 'شريط علوي', icon: 'PanelTop' },
    { key: 'sidebar', label: 'قائمة جانبية', icon: 'PanelRight' },
    { key: 'bottombar', label: 'شريط تبويب سفلي', icon: 'LayoutPanelTop' },
  ];

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setHoverIdx(null);
    onDropAt(idx, e.dataTransfer.getData('text/plain'));
  };

  const DropLine = ({ idx }: { idx: number }) => (
    <div
      onDragOver={(e) => { e.preventDefault(); setHoverIdx(idx); }}
      onDragLeave={() => setHoverIdx((h) => (h === idx ? null : h))}
      onDrop={(e) => handleDrop(e, idx)}
      className={`rounded-lg transition-all mx-1 ${hoverIdx === idx ? 'h-9 bg-violet-500/20 border-2 border-dashed border-violet-400' : 'h-1.5 border-2 border-transparent'}`}
    />
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* الهيكل */}
      <div>
        <h4 className="text-[10.5px] font-black text-slate-500 mb-2 px-1 flex items-center gap-1.5">
          <Icon name="LayoutTemplate" size={12} /> هيكل الصفحة
        </h4>
        <div className="flex flex-col gap-1.5">
          {chrome.map((ch) => {
            const node = doc.layout[ch.key];
            return node ? (
              <Row key={ch.key} node={node} selected={selected === node.id} onSelect={() => onSelect(node.id)}
                onRemove={() => onNodeRemove(node.id)} onHide={() => onNodeHide(node.id)}>
                {ch.key === 'sidebar' ? (
                  <IconButton name={node.props.position === 'left' ? 'AlignStartHorizontal' : 'AlignEndHorizontal'}
                    title="تبديل الجهة" className="!w-6 !h-6"
                    onClick={() => { /* يدار من المفتش */ onSelect(node.id); }} />
                ) : null}
              </Row>
            ) : (
              <button key={ch.key} onClick={() => onChromeAdd(ch.key)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl border-2 border-dashed border-white/10 hover:border-violet-400/50 hover:bg-violet-500/8 text-slate-500 hover:text-violet-200 text-[11px] font-bold transition-all">
                <Icon name={ch.icon} size={13} /> إضافة {ch.label} <Icon name="Plus" size={12} className="mr-auto" />
              </button>
            );
          })}
        </div>
      </div>

      {/* الأقسام */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2 px-1">
          <h4 className="text-[10.5px] font-black text-slate-500 flex items-center gap-1.5">
            <Icon name="Blocks" size={12} /> الأقسام <span className="bg-white/8 rounded-full px-1.5 text-[9px]">{doc.layout.sections.length}</span>
          </h4>
          <button onClick={openAdd} className="w-6 h-6 rounded-lg bg-violet-500/20 hover:bg-violet-500/35 text-violet-200 flex items-center justify-center transition-colors" title="إضافة مكوّن">
            <Icon name="Plus" size={13} />
          </button>
        </div>
        <div className="flex flex-col overflow-y-auto flex-1 min-h-0 pl-1 gap-0">
          <DropLine idx={0} />
          {doc.layout.sections.map((n, i) => (
            <div key={n.id}>
              <Row node={n} selected={selected === n.id} onSelect={() => onSelect(n.id)}
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'move', id: n.id })); e.dataTransfer.effectAllowed = 'move'; onDragRowStart(n.id); }}
                onRemove={() => onNodeRemove(n.id)} onHide={() => onNodeHide(n.id)}>
                <IconButton name="ArrowUp" title="أعلى" className="!w-6 !h-6" onClick={() => onNodeMove(n.id, -1)} />
                <IconButton name="ArrowDown" title="أسفل" className="!w-6 !h-6" onClick={() => onNodeMove(n.id, 1)} />
              </Row>
              <DropLine idx={i + 1} />
            </div>
          ))}
        </div>
      </div>

      <p className="text-[9.5px] text-slate-600 font-bold px-1 leading-relaxed">
        ✦ اسحب أي قسم وأفلته بين الأقسام أو داخل لوحة التصميم لإعادة ترتيبه
      </p>
    </div>
  );
}
