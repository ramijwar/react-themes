import type { AnimCfg, CompNode, FieldDef, ListItem, PlanDef, StyleCfg } from '../lib/types';
import { COMP_ICONS, COMP_LABELS, uid } from '../lib/types';
import { ANIMS, EASINGS } from '../lib/anim';
import { Icon } from '../lib/icons';
import {
  Btn, Collapse, ColorField, IconButton, IconPicker, ItemListEditor, Segmented, Select, Slider, Toggle,
} from '../components/ui';

/* ============================================================
   المفتش — قوائم ديناميكية متخصصة لكل نوع مكوّن
   ============================================================ */

export interface InspectorHandlers {
  patchProps: (id: string, patch: Record<string, any>) => void;
  patchStyle: (id: string, patch: Partial<StyleCfg>) => void;
  patchAnim: (id: string, patch: Partial<AnimCfg>) => void;
  setTitle: (id: string, title: string) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  toggleHidden: (id: string) => void;
  replay: () => void;
}

type P = { node: CompNode } & InspectorHandlers;

/* ------- أدوات مساعدة ------- */

const item = (): ListItem => ({ id: uid(), label: 'عنصر جديد', icon: 'Sparkles' });

const FIELD_KINDS = [
  { value: 'text', label: 'نص' }, { value: 'email', label: 'بريد إلكتروني' }, { value: 'password', label: 'كلمة مرور' },
  { value: 'number', label: 'رقم' }, { value: 'date', label: 'تاريخ' }, { value: 'select', label: 'قائمة اختيار' },
  { value: 'textarea', label: 'نص طويل' }, { value: 'checkbox', label: 'مربع اختيار' }, { value: 'switch', label: 'مفتاح تبديل' },
];

function Tiny({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><span className="label-sm">{label}</span>{children}</div>;
}

function OnOff({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <Toggle label={label} checked={!!value} onChange={onChange} />;
}

/* ------- محرر حقول النموذج ------- */

function FieldsEditor({ fields, onChange }: { fields: FieldDef[]; onChange: (f: FieldDef[]) => void }) {
  const set = (i: number, patch: Partial<FieldDef>) => onChange(fields.map((f, x) => (x === i ? { ...f, ...patch } : f)));
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= fields.length) return;
    const arr = [...fields]; [arr[i], arr[j]] = [arr[j], arr[i]]; onChange(arr);
  };
  return (
    <div className="flex flex-col gap-2">
      {fields.map((f, i) => (
        <div key={f.id} className="bg-white/[.03] border border-white/7 rounded-xl p-2.5 flex flex-col gap-2 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <span className="text-[9.5px] font-black text-violet-300 bg-violet-500/12 rounded-md px-2 py-1">{FIELD_KINDS.find((k) => k.value === f.kind)?.label}</span>
            <div className="flex-1" />
            <IconButton name="ArrowUp" title="أعلى" className="!w-6 !h-6" onClick={() => move(i, -1)} />
            <IconButton name="ArrowDown" title="أسفل" className="!w-6 !h-6" onClick={() => move(i, 1)} />
            <IconButton name="Trash2" title="حذف" className="!w-6 !h-6 hover:!bg-rose-500/20 hover:!text-rose-300" onClick={() => onChange(fields.filter((_, x) => x !== i))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Tiny label="نوع الحقل">
              <Select value={f.kind} onChange={(v) => set(i, { kind: v as any })} options={FIELD_KINDS} />
            </Tiny>
            <div className="pt-4"><OnOff label="مطلوب *" value={!!f.required} onChange={(v) => set(i, { required: v })} /></div>
          </div>
          {f.kind !== 'checkbox' && f.kind !== 'switch' ? (
            <Tiny label="التسمية"><input className="app-input !py-1.5 text-xs" value={f.label} onChange={(e) => set(i, { label: e.target.value })} /></Tiny>
          ) : (
            <Tiny label="النص"><input className="app-input !py-1.5 text-xs" value={f.label} onChange={(e) => set(i, { label: e.target.value })} /></Tiny>
          )}
          {['text', 'email', 'password', 'number', 'date', 'textarea'].includes(f.kind) ? (
            <Tiny label="نص توضيحي"><input className="app-input !py-1.5 text-xs" value={f.placeholder || ''} onChange={(e) => set(i, { placeholder: e.target.value })} /></Tiny>
          ) : null}
          {f.kind === 'select' ? (
            <Tiny label="الخيارات (سطر لكل خيار)">
              <textarea className="app-input !py-1.5 text-xs min-h-16" value={(f.options || []).join('\n')}
                onChange={(e) => set(i, { options: e.target.value.split('\n').filter(Boolean) })} />
            </Tiny>
          ) : null}
          {f.kind !== 'checkbox' && f.kind !== 'switch' && f.kind !== 'textarea' ? (
            <div className="grid grid-cols-2 gap-2">
              <IconPicker label="أيقونة الحقل" value={f.icon} onChange={(v) => set(i, { icon: v })} />
              <Tiny label="حواف الحقل">
                <Segmented size="sm" value={f.radiusStyle || 'theme'} onChange={(v) => set(i, { radiusStyle: v as any })}
                  options={[{ value: 'theme', label: 'الثيم' }, { value: 'sharp', label: 'مربع' }, { value: 'rounded', label: 'دائري' }, { value: 'pill', label: 'كبسولة' }]} />
              </Tiny>
            </div>
          ) : null}
        </div>
      ))}
      <button onClick={() => onChange([...fields, { id: uid(), kind: 'text', label: 'حقل جديد', placeholder: '', icon: 'Pencil' }])}
        className="border-2 border-dashed border-white/12 hover:border-violet-400/50 hover:bg-violet-500/8 text-slate-400 hover:text-violet-200 rounded-xl py-2.5 text-xs font-extrabold transition-all flex items-center justify-center gap-2">
        <Icon name="Plus" size={15} /> إضافة حقل
      </button>
    </div>
  );
}

/* ------- محرر الجدول ------- */

function TableEditor({ columns, rows, onChange }: { columns: string[]; rows: string[][]; onChange: (cols: string[], rows: string[][]) => void }) {
  const setCell = (r: number, c: number, v: string) => onChange(columns, rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)));
  const setCol = (c: number, v: string) => onChange(columns.map((x, i) => (i === c ? v : x)), rows);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {columns.map((c, i) => (
          <div key={i} className="flex-1 relative">
            <input className="app-input !py-1.5 !px-2 text-[10.5px] font-black text-center" value={c} onChange={(e) => setCol(i, e.target.value)} />
            {columns.length > 2 ? (
              <button onClick={() => onChange(columns.filter((_, x) => x !== i), rows.map((r) => r.filter((_, x) => x !== i)))}
                className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-rose-500/80 text-white text-[9px] flex items-center justify-center hover:bg-rose-500">×</button>
            ) : null}
          </div>
        ))}
        <button onClick={() => onChange([...columns, 'عمود'], rows.map((r) => [...r, '—']))}
          className="w-8 shrink-0 rounded-lg border-2 border-dashed border-white/12 hover:border-violet-400/50 text-slate-400 hover:text-violet-200 transition-colors"><Icon name="Plus" size={13} /></button>
      </div>
      {rows.map((r, ri) => (
        <div key={ri} className="flex gap-1.5 items-center">
          <span className="text-[9px] font-black text-slate-600 w-4 text-center">{ri + 1}</span>
          {r.slice(0, columns.length).map((cell, ci) => (
            <input key={ci} className="app-input !py-1.5 !px-2 text-[10.5px] flex-1" value={cell} onChange={(e) => setCell(ri, ci, e.target.value)} />
          ))}
          <button onClick={() => onChange(columns, rows.filter((_, x) => x !== ri))}
            className="w-6 h-6 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-rose-500/15 flex items-center justify-center transition-colors shrink-0"><Icon name="X" size={12} /></button>
        </div>
      ))}
      <button onClick={() => onChange(columns, [...rows, columns.map(() => '—')])}
        className="border-2 border-dashed border-white/12 hover:border-violet-400/50 text-slate-400 hover:text-violet-200 rounded-lg py-1.5 text-[10.5px] font-extrabold transition-all flex items-center justify-center gap-1.5">
        <Icon name="Plus" size={12} /> إضافة صف
      </button>
    </div>
  );
}

/* ------- محرر الباقات ------- */

function PlansEditor({ plans, onChange }: { plans: PlanDef[]; onChange: (p: PlanDef[]) => void }) {
  const set = (i: number, patch: Partial<PlanDef>) => onChange(plans.map((p, x) => (x === i ? { ...p, ...patch } : p)));
  return (
    <div className="flex flex-col gap-2">
      {plans.map((p, i) => (
        <div key={p.id} className="bg-white/[.03] border border-white/7 rounded-xl p-2.5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[9.5px] font-black text-slate-500">باقة {i + 1}</span>
            <div className="flex-1" />
            <div className="scale-90 w-28"><OnOff label="مميزة ★" value={!!p.featured} onChange={(v) => set(i, { featured: v })} /></div>
            <IconButton name="Trash2" className="!w-6 !h-6 hover:!bg-rose-500/20 hover:!text-rose-300" onClick={() => onChange(plans.filter((_, x) => x !== i))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Tiny label="الاسم"><input className="app-input !py-1.5 text-xs" value={p.name} onChange={(e) => set(i, { name: e.target.value })} /></Tiny>
            <Tiny label="السعر"><input className="app-input !py-1.5 text-xs" value={p.price} onChange={(e) => set(i, { price: e.target.value })} /></Tiny>
            <Tiny label="الفترة"><input className="app-input !py-1.5 text-xs" value={p.period} onChange={(e) => set(i, { period: e.target.value })} /></Tiny>
          </div>
          <Tiny label="المزايا (سطر لكل ميزة)">
            <textarea className="app-input !py-1.5 text-xs min-h-16" value={(p.features || []).join('\n')} onChange={(e) => set(i, { features: e.target.value.split('\n').filter(Boolean) })} />
          </Tiny>
          <div className="grid grid-cols-2 gap-2">
            <IconPicker label="أيقونة" value={p.icon} onChange={(v) => set(i, { icon: v })} />
            <Tiny label="زر الإجراء"><input className="app-input !py-1.5 text-xs" value={p.cta || ''} onChange={(e) => set(i, { cta: e.target.value })} /></Tiny>
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...plans, { id: uid(), name: 'باقة جديدة', price: '0', period: 'شهرياً', features: ['ميزة أولى'], icon: 'Package', cta: 'اشترك' }])}
        className="border-2 border-dashed border-white/12 hover:border-violet-400/50 text-slate-400 hover:text-violet-200 rounded-xl py-2.5 text-xs font-extrabold transition-all flex items-center justify-center gap-2">
        <Icon name="Plus" size={15} /> إضافة باقة
      </button>
    </div>
  );
}

/* ============================================================
   المحتوى حسب النوع
   ============================================================ */

function Content({ node, patchProps }: { node: CompNode; patchProps: P['patchProps'] }) {
  const p = node.props;
  const set = (patch: Record<string, any>) => patchProps(node.id, patch);
  switch (node.type) {
    case 'topbar':
      return (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="اسم العلامة"><input className="app-input !py-1.5 text-xs" value={p.brand} onChange={(e) => set({ brand: e.target.value })} /></Tiny>
            <IconPicker label="أيقونة العلامة" value={p.brandIcon} onChange={(v) => set({ brandIcon: v })} />
          </div>
          <Tiny label="روابط القائمة">
            <ItemListEditor items={p.links} onChange={(v) => set({ links: v })} makeItem={() => ({ id: uid(), label: 'رابط', icon: 'Link' })}
              cols={[{ key: 'label', label: 'النص' }, { key: 'icon', label: 'أيقونة', type: 'icon' }, { key: 'active', label: 'نشط', type: 'toggle' }]} />
          </Tiny>
          <div>
            <span className="label-sm">نمط الشريط</span>
            <Segmented size="sm" value={p.variant} onChange={(v) => set({ variant: v })}
              options={[{ value: 'solid', label: 'مصمت' }, { value: 'glass', label: 'زجاجي' }, { value: 'gradient', label: 'متدرج' }]} />
          </div>
          <Slider label="الارتفاع" value={p.height} onChange={(v) => set({ height: v })} min={48} max={96} unit="px" />
          <OnOff label="إظهار البحث" value={p.showSearch} onChange={(v) => set({ showSearch: v })} />
          <OnOff label="إظهار الإجراءات (جرس + حساب)" value={p.showActions} onChange={(v) => set({ showActions: v })} />
          <OnOff label="ثابت عند التمرير (Sticky)" value={p.sticky} onChange={(v) => set({ sticky: v })} />
        </>
      );
    case 'sidebar':
      return (
        <>
          <Tiny label="عناصر القائمة">
            <ItemListEditor items={p.items} onChange={(v) => set({ items: v })} makeItem={() => ({ id: uid(), label: 'عنصر', icon: 'Circle' })}
              cols={[{ key: 'label', label: 'النص' }, { key: 'icon', label: 'أيقونة', type: 'icon' }, { key: 'badge', label: 'شارة' }, { key: 'active', label: 'نشط', type: 'toggle' }]} />
          </Tiny>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="الجهة">
              <Segmented size="sm" value={p.position} onChange={(v) => set({ position: v })} options={[{ value: 'right', label: 'يمين' }, { value: 'left', label: 'يسار' }]} />
            </Tiny>
            <Tiny label="شكل العنصر">
              <Segmented size="sm" value={p.itemShape} onChange={(v) => set({ itemShape: v })} options={[{ value: 'sharp', label: 'مربع' }, { value: 'rounded', label: 'دائري' }, { value: 'pill', label: 'كبسولة' }]} />
            </Tiny>
          </div>
          <Slider label="العرض" value={p.width} onChange={(v) => set({ width: v })} min={180} max={340} unit="px" />
          <div>
            <span className="label-sm">النمط</span>
            <Segmented size="sm" value={p.variant} onChange={(v) => set({ variant: v })} options={[{ value: 'solid', label: 'مصمت' }, { value: 'glass', label: 'زجاجي' }]} />
          </div>
          <OnOff label="قابل للطي" value={p.collapsible} onChange={(v) => set({ collapsible: v })} />
          <OnOff label="إظهار الشعار" value={p.showLogo} onChange={(v) => set({ showLogo: v })} />
          <OnOff label="إظهار بطاقة المستخدم" value={p.showUser} onChange={(v) => set({ showUser: v })} />
        </>
      );
    case 'bottombar':
      return (
        <>
          <Tiny label="عناصر التبويب (حتى 5)">
            <ItemListEditor items={p.items} onChange={(v) => set({ items: v.slice(0, 5) })} makeItem={() => ({ id: uid(), label: 'تبويب', icon: 'Circle' })} max={5}
              cols={[{ key: 'label', label: 'النص' }, { key: 'icon', label: 'أيقونة', type: 'icon' }, { key: 'badge', label: 'شارة' }, { key: 'active', label: 'نشط', type: 'toggle' }]} />
          </Tiny>
          <Tiny label="شكل العنصر النشط">
            <Segmented size="sm" value={p.activeStyle} onChange={(v) => set({ activeStyle: v })} options={[{ value: 'pill', label: 'خلفية كبسولة' }, { value: 'color', label: 'لون فقط' }]} />
          </Tiny>
          <OnOff label="عائم (Floating)" value={p.floating} onChange={(v) => set({ floating: v })} />
          <OnOff label="إظهار التسميات" value={p.showLabels} onChange={(v) => set({ showLabels: v })} />
        </>
      );
    case 'hero':
      return (
        <>
          <Tiny label="العنوان الرئيسي"><textarea className="app-input !py-2 text-xs min-h-14 font-black" value={p.title} onChange={(e) => set({ title: e.target.value })} /></Tiny>
          <Tiny label="الوصف"><textarea className="app-input !py-2 text-xs min-h-16" value={p.subtitle} onChange={(e) => set({ subtitle: e.target.value })} /></Tiny>
          <Tiny label="شارة علوية"><input className="app-input !py-1.5 text-xs" value={p.badge || ''} onChange={(e) => set({ badge: e.target.value })} /></Tiny>
          <div className="bg-white/[.03] rounded-xl p-2.5 flex flex-col gap-2 border border-white/6">
            <span className="text-[10px] font-black text-violet-300">الزر الأساسي</span>
            <div className="grid grid-cols-2 gap-2">
              <Tiny label="النص"><input className="app-input !py-1.5 text-xs" value={p.cta1?.label || ''} onChange={(e) => set({ cta1: { ...p.cta1, label: e.target.value } })} /></Tiny>
              <IconPicker label="أيقونة" value={p.cta1?.icon} onChange={(v) => set({ cta1: { ...p.cta1, icon: v } })} />
            </div>
            <OnOff label="إظهار" value={p.cta1?.show} onChange={(v) => set({ cta1: { ...p.cta1, show: v } })} />
          </div>
          <div className="bg-white/[.03] rounded-xl p-2.5 flex flex-col gap-2 border border-white/6">
            <span className="text-[10px] font-black text-sky-300">الزر الثانوي</span>
            <div className="grid grid-cols-2 gap-2">
              <Tiny label="النص"><input className="app-input !py-1.5 text-xs" value={p.cta2?.label || ''} onChange={(e) => set({ cta2: { ...p.cta2, label: e.target.value } })} /></Tiny>
              <IconPicker label="أيقونة" value={p.cta2?.icon} onChange={(v) => set({ cta2: { ...p.cta2, icon: v } })} />
            </div>
            <OnOff label="إظهار" value={p.cta2?.show} onChange={(v) => set({ cta2: { ...p.cta2, show: v } })} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="الخلفية">
              <Segmented size="sm" value={p.bgStyle} onChange={(v) => set({ bgStyle: v })} options={[{ value: 'solid', label: 'سادة' }, { value: 'gradient', label: 'متدرجة' }]} />
            </Tiny>
            <Tiny label="نقش الخلفية">
              <Segmented size="sm" value={p.pattern} onChange={(v) => set({ pattern: v })} options={[{ value: 'none', label: 'بدون' }, { value: 'dots', label: 'نقاط' }, { value: 'grid', label: 'شبكة' }, { value: 'waves', label: 'موجات' }]} />
            </Tiny>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="المحاذاة">
              <Segmented size="sm" value={p.align} onChange={(v) => set({ align: v })} options={[{ value: 'start', label: 'بداية' }, { value: 'center', label: 'وسط' }, { value: 'end', label: 'نهاية' }]} />
            </Tiny>
            <div className="pt-4"><Slider label="أدنى ارتفاع" value={p.minHeight} onChange={(v) => set({ minHeight: v })} min={220} max={640} step={20} unit="px" /></div>
          </div>
        </>
      );
    case 'stats':
      return (
        <>
          <Tiny label="البطاقات">
            <ItemListEditor items={p.items} onChange={(v) => set({ items: v })} makeItem={() => ({ id: uid(), label: 'مؤشر', value: '0', icon: 'BarChart3' })}
              cols={[{ key: 'label', label: 'الاسم' }, { key: 'value', label: 'القيمة' }, { key: 'icon', label: 'أيقونة', type: 'icon' }, { key: 'desc', label: 'ملاحظة' }, { key: 'badge', label: 'شارة' }]} />
          </Tiny>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="نمط البطاقة">
              <Segmented size="sm" value={p.cardStyle} onChange={(v) => set({ cardStyle: v })} options={[{ value: 'surface', label: 'سطح' }, { value: 'glass', label: 'زجاج' }, { value: 'outlined', label: 'محدد' }]} />
            </Tiny>
            <div className="pt-4"><OnOff label="إظهار الأيقونات" value={p.showIcons} onChange={(v) => set({ showIcons: v })} /></div>
          </div>
        </>
      );
    case 'cards':
      return (
        <>
          <Tiny label="البطاقات">
            <ItemListEditor items={p.items} onChange={(v) => set({ items: v })} makeItem={() => ({ id: uid(), label: 'بطاقة', icon: 'Box', desc: 'وصف مختصر للبطاقة' })}
              cols={[{ key: 'label', label: 'العنوان' }, { key: 'icon', label: 'أيقونة', type: 'icon' }, { key: 'desc', label: 'الوصف', wide: true }, { key: 'badge', label: 'شارة' }]} />
          </Tiny>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="تأثير المرور">
              <Segmented size="sm" value={p.hoverEffect} onChange={(v) => set({ hoverEffect: v })} options={[{ value: 'lift', label: 'رفع' }, { value: 'grow', label: 'تكبير' }, { value: 'glow', label: 'توهج' }, { value: 'none', label: 'بدون' }]} />
            </Tiny>
            <div className="pt-4"><OnOff label="صورة علوية (تدرج)" value={p.showThumb} onChange={(v) => set({ showThumb: v })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div><OnOff label="زر إجراء" value={p.showAction} onChange={(v) => set({ showAction: v })} /></div>
            <Tiny label="نص الزر"><input className="app-input !py-1.5 text-xs" value={p.actionLabel || ''} onChange={(e) => set({ actionLabel: e.target.value })} /></Tiny>
          </div>
        </>
      );
    case 'form':
      return (
        <>
          <OnOff label="إظهار العنوان" value={p.showTitle} onChange={(v) => set({ showTitle: v })} />
          <Tiny label="العنوان"><input className="app-input !py-1.5 text-xs" value={p.title || ''} onChange={(e) => set({ title: e.target.value })} /></Tiny>
          <Tiny label="الوصف"><input className="app-input !py-1.5 text-xs" value={p.subtitle || ''} onChange={(e) => set({ subtitle: e.target.value })} /></Tiny>
          <Tiny label="الحقول">
            <FieldsEditor fields={p.fields} onChange={(v) => set({ fields: v })} />
          </Tiny>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="موضع التسمية">
              <Segmented size="sm" value={p.labelPosition} onChange={(v) => set({ labelPosition: v })} options={[{ value: 'top', label: 'أعلى' }, { value: 'inline', label: 'بجانب' }, { value: 'float', label: 'عائمة' }]} />
            </Tiny>
            <Tiny label="أعمدة">
              <Segmented size="sm" value={String(p.columns)} onChange={(v) => set({ columns: +v })} options={[{ value: '1', label: 'واحد' }, { value: '2', label: 'اثنان' }]} />
            </Tiny>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="زر الإرسال"><input className="app-input !py-1.5 text-xs" value={p.submitLabel || ''} onChange={(e) => set({ submitLabel: e.target.value })} /></Tiny>
            <IconPicker label="أيقونة الزر" value={p.submitIcon} onChange={(v) => set({ submitIcon: v })} />
          </div>
        </>
      );
    case 'table':
      return (
        <>
          <OnOff label="إظهار العنوان" value={p.showTitle} onChange={(v) => set({ showTitle: v })} />
          <Tiny label="العنوان"><input className="app-input !py-1.5 text-xs" value={p.title || ''} onChange={(e) => set({ title: e.target.value })} /></Tiny>
          <Tiny label="الأعمدة والصفوف">
            <TableEditor columns={p.columns} rows={p.rows} onChange={(cols, rows) => set({ columns: cols, rows })} />
          </Tiny>
          <OnOff label="رأس الجدول" value={p.showHeader} onChange={(v) => set({ showHeader: v })} />
          <OnOff label="تظليل بالتناوب" value={p.striped} onChange={(v) => set({ striped: v })} />
        </>
      );
    case 'tabs':
      return (
        <>
          <Tiny label="التبويبات">
            <ItemListEditor items={p.items} onChange={(v) => set({ items: v })} makeItem={() => ({ id: uid(), label: 'تبويب', icon: 'Folder', desc: 'محتوى التبويب' })}
              cols={[{ key: 'label', label: 'العنوان' }, { key: 'icon', label: 'أيقونة', type: 'icon' }, { key: 'desc', label: 'المحتوى', wide: true }]} />
          </Tiny>
          <Tiny label="شكل التبويبات">
            <Segmented size="sm" value={p.tabStyle} onChange={(v) => set({ tabStyle: v })} options={[{ value: 'pill', label: 'كبسولة' }, { value: 'underline', label: 'تسطير' }, { value: 'boxed', label: 'صناديق' }]} />
          </Tiny>
          <OnOff label="عرض كامل" value={p.fullWidth} onChange={(v) => set({ fullWidth: v })} />
        </>
      );
    case 'pricing':
      return (
        <>
          <OnOff label="إظهار العنوان" value={p.showTitle} onChange={(v) => set({ showTitle: v })} />
          <Tiny label="العنوان"><input className="app-input !py-1.5 text-xs" value={p.title || ''} onChange={(e) => set({ title: e.target.value })} /></Tiny>
          <Tiny label="الوصف"><input className="app-input !py-1.5 text-xs" value={p.subtitle || ''} onChange={(e) => set({ subtitle: e.target.value })} /></Tiny>
          <Tiny label="الباقات"><PlansEditor plans={p.plans} onChange={(v) => set({ plans: v })} /></Tiny>
        </>
      );
    case 'testimonials':
      return (
        <>
          <OnOff label="إظهار العنوان" value={p.showTitle} onChange={(v) => set({ showTitle: v })} />
          <Tiny label="العنوان"><input className="app-input !py-1.5 text-xs" value={p.title || ''} onChange={(e) => set({ title: e.target.value })} /></Tiny>
          <Tiny label="الآراء">
            <ItemListEditor items={p.items} onChange={(v) => set({ items: v })} makeItem={() => ({ id: uid(), label: 'الاسم', value: 'المنصب', desc: 'نص الرأي', badge: '5' })}
              cols={[{ key: 'label', label: 'الاسم' }, { key: 'value', label: 'المنصب' }, { key: 'desc', label: 'الرأي', wide: true }, { key: 'badge', label: 'التقييم 1-5' }]} />
          </Tiny>
          <Tiny label="الأسلوب">
            <Segmented size="sm" value={p.style} onChange={(v) => set({ style: v })} options={[{ value: 'card', label: 'بطاقات' }, { value: 'quote', label: 'اقتباس' }]} />
          </Tiny>
        </>
      );
    case 'gallery':
      return (
        <>
          <OnOff label="إظهار العنوان" value={p.showTitle} onChange={(v) => set({ showTitle: v })} />
          <Tiny label="العنوان"><input className="app-input !py-1.5 text-xs" value={p.title || ''} onChange={(e) => set({ title: e.target.value })} /></Tiny>
          <Tiny label="العناصر">
            <ItemListEditor items={p.items} onChange={(v) => set({ items: v })} makeItem={() => ({ id: uid(), label: 'عمل', icon: 'Image' })}
              cols={[{ key: 'label', label: 'العنوان' }, { key: 'icon', label: 'أيقونة', type: 'icon' }]} />
          </Tiny>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="الأبعاد">
              <Segmented size="sm" value={p.aspect} onChange={(v) => set({ aspect: v })} options={[{ value: 'square', label: 'مربع' }, { value: '4-3', label: '4:3' }, { value: '16-9', label: '16:9' }]} />
            </Tiny>
            <Tiny label="تأثير المرور">
              <Segmented size="sm" value={p.hoverEffect} onChange={(v) => set({ hoverEffect: v })} options={[{ value: 'zoom', label: 'تكبير' }, { value: 'none', label: 'بدون' }]} />
            </Tiny>
          </div>
        </>
      );
    case 'list':
      return (
        <>
          <OnOff label="إظهار العنوان" value={p.showTitle} onChange={(v) => set({ showTitle: v })} />
          <Tiny label="العنوان"><input className="app-input !py-1.5 text-xs" value={p.title || ''} onChange={(e) => set({ title: e.target.value })} /></Tiny>
          <Tiny label="العناصر">
            <ItemListEditor items={p.items} onChange={(v) => set({ items: v })} makeItem={() => ({ id: uid(), label: 'عنصر', icon: 'Circle', desc: 'وصف' })}
              cols={[{ key: 'label', label: 'العنوان' }, { key: 'icon', label: 'أيقونة', type: 'icon' }, { key: 'desc', label: 'الوصف', wide: true }, { key: 'badge', label: 'شارة' }]} />
          </Tiny>
          <Tiny label="شكل العنصر">
            <Segmented size="sm" value={p.itemShape} onChange={(v) => set({ itemShape: v })} options={[{ value: 'sharp', label: 'مربع' }, { value: 'rounded', label: 'دائري' }, { value: 'pill', label: 'كبسولة' }]} />
          </Tiny>
          <OnOff label="فواصل بين العناصر" value={p.divided} onChange={(v) => set({ divided: v })} />
          <OnOff label="أيقونات" value={p.showIcons} onChange={(v) => set({ showIcons: v })} />
          <OnOff label="شارات" value={p.showBadges} onChange={(v) => set({ showBadges: v })} />
        </>
      );
    case 'cta':
      return (
        <>
          <Tiny label="العنوان"><textarea className="app-input !py-2 text-xs min-h-14" value={p.title} onChange={(e) => set({ title: e.target.value })} /></Tiny>
          <Tiny label="الوصف"><textarea className="app-input !py-2 text-xs min-h-14" value={p.subtitle} onChange={(e) => set({ subtitle: e.target.value })} /></Tiny>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="الزر الرئيسي"><input className="app-input !py-1.5 text-xs" value={p.button?.label || ''} onChange={(e) => set({ button: { ...p.button, label: e.target.value, show: true } })} /></Tiny>
            <IconPicker label="أيقونة" value={p.button?.icon} onChange={(v) => set({ button: { ...p.button, icon: v } })} />
          </div>
          <OnOff label="زر ثانوي" value={p.secondary?.show} onChange={(v) => set({ secondary: { ...p.secondary, show: v, label: p.secondary?.label || 'تواصل معنا' } })} />
          <Tiny label="الخلفية">
            <Segmented size="sm" value={p.bgStyle} onChange={(v) => set({ bgStyle: v })} options={[{ value: 'gradient', label: 'متدرجة' }, { value: 'solid', label: 'سادة' }]} />
          </Tiny>
        </>
      );
    case 'footer':
      return (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="الاسم"><input className="app-input !py-1.5 text-xs" value={p.brand} onChange={(e) => set({ brand: e.target.value })} /></Tiny>
            <IconPicker label="أيقونة" value={p.brandIcon} onChange={(v) => set({ brandIcon: v })} />
          </div>
          <Tiny label="نبذة"><textarea className="app-input !py-1.5 text-xs min-h-14" value={p.about} onChange={(e) => set({ about: e.target.value })} /></Tiny>
          <OnOff label="أعمدة الروابط" value={p.showColumns} onChange={(v) => set({ showColumns: v })} />
          <Tiny label="الأعمدة">
            <ItemListEditor items={(p.columns || []).map((c: any) => ({ id: c.id, label: c.label, desc: (c.items || []).join('\n') }))}
              onChange={(v) => set({ columns: v.map((c: any) => ({ id: c.id, label: c.label, items: (c.desc || '').split('\n').filter(Boolean) })) })}
              makeItem={() => ({ id: uid(), label: 'عمود', desc: 'رابط أول\nرابط ثانٍ' })}
              cols={[{ key: 'label', label: 'عنوان العمود' }, { key: 'desc', label: 'الروابط (سطر لكل رابط)', wide: true }]} />
          </Tiny>
          <OnOff label="أيقونات التواصل" value={p.showSocials} onChange={(v) => set({ showSocials: v })} />
          <Tiny label="التواصل">
            <ItemListEditor items={p.socials} onChange={(v) => set({ socials: v })} makeItem={() => ({ id: uid(), label: 'شبكة', icon: 'Globe' })}
              cols={[{ key: 'label', label: 'الاسم' }, { key: 'icon', label: 'أيقونة', type: 'icon' }]} />
          </Tiny>
          <Tiny label="حقوق النشر"><input className="app-input !py-1.5 text-xs" value={p.copyright} onChange={(e) => set({ copyright: e.target.value })} /></Tiny>
        </>
      );
    case 'search':
      return (
        <>
          <Tiny label="النص التوضيحي"><input className="app-input !py-1.5 text-xs" value={p.placeholder} onChange={(e) => set({ placeholder: e.target.value })} /></Tiny>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="الحجم">
              <Segmented size="sm" value={p.size} onChange={(v) => set({ size: v })} options={[{ value: 'md', label: 'وسط' }, { value: 'lg', label: 'كبير' }]} />
            </Tiny>
            <div className="pt-4"><OnOff label="زر البحث" value={p.showButton} onChange={(v) => set({ showButton: v })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="نص الزر"><input className="app-input !py-1.5 text-xs" value={p.buttonLabel || ''} onChange={(e) => set({ buttonLabel: e.target.value })} /></Tiny>
            <IconPicker label="أيقونة الزر" value={p.buttonIcon} onChange={(v) => set({ buttonIcon: v })} />
          </div>
          <OnOff label="اقتراحات" value={p.showSuggestions} onChange={(v) => set({ showSuggestions: v })} />
          <Tiny label="الاقتراحات (مفصولة بفاصلة)">
            <input className="app-input !py-1.5 text-xs" value={(p.suggestions || []).join('، ')} onChange={(e) => set({ suggestions: e.target.value.split(/[،,]/).map((s: string) => s.trim()).filter(Boolean) })} />
          </Tiny>
        </>
      );
    case 'profile':
      return (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="الاسم"><input className="app-input !py-1.5 text-xs" value={p.name} onChange={(e) => set({ name: e.target.value })} /></Tiny>
            <Tiny label="المسمى"><input className="app-input !py-1.5 text-xs" value={p.role} onChange={(e) => set({ role: e.target.value })} /></Tiny>
          </div>
          <Tiny label="نبذة"><textarea className="app-input !py-1.5 text-xs min-h-16" value={p.bio} onChange={(e) => set({ bio: e.target.value })} /></Tiny>
          <Tiny label="الإحصائيات">
            <ItemListEditor items={p.stats} onChange={(v) => set({ stats: v })} makeItem={() => ({ id: uid(), label: 'مؤشر', value: '0' })}
              cols={[{ key: 'label', label: 'الاسم' }, { key: 'value', label: 'القيمة' }]} />
          </Tiny>
          <Tiny label="الأزرار">
            <ItemListEditor items={p.actions} onChange={(v) => set({ actions: v })} makeItem={() => ({ id: uid(), label: 'زر', icon: 'Zap' })}
              cols={[{ key: 'label', label: 'النص' }, { key: 'icon', label: 'أيقونة', type: 'icon' }]} />
          </Tiny>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="التخطيط">
              <Segmented size="sm" value={p.layout} onChange={(v) => set({ layout: v })} options={[{ value: 'centered', label: 'موسّط' }, { value: 'start', label: 'بداية' }]} />
            </Tiny>
            <Tiny label="الغلاف">
              <Segmented size="sm" value={p.cover} onChange={(v) => set({ cover: v })} options={[{ value: 'gradient', label: 'متدرج' }, { value: 'plain', label: 'سادة' }]} />
            </Tiny>
          </div>
        </>
      );
    case 'alert':
      return (
        <>
          <Tiny label="النوع">
            <Segmented size="sm" value={p.kind} onChange={(v) => set({ kind: v })}
              options={[{ value: 'info', label: 'معلومة' }, { value: 'success', label: 'نجاح' }, { value: 'warning', label: 'تحذير' }, { value: 'danger', label: 'خطر' }]} />
          </Tiny>
          <Tiny label="العنوان"><input className="app-input !py-1.5 text-xs" value={p.title || ''} onChange={(e) => set({ title: e.target.value })} /></Tiny>
          <Tiny label="النص"><textarea className="app-input !py-1.5 text-xs min-h-14" value={p.text} onChange={(e) => set({ text: e.target.value })} /></Tiny>
          <div className="grid grid-cols-2 gap-2.5">
            <IconPicker label="الأيقونة" value={p.icon} onChange={(v) => set({ icon: v })} />
            <div className="pt-4 flex flex-col gap-2">
              <OnOff label="أيقونة" value={p.showIcon} onChange={(v) => set({ showIcon: v })} />
              <OnOff label="زر إغلاق" value={p.closable} onChange={(v) => set({ closable: v })} />
            </div>
          </div>
        </>
      );
    case 'buttons':
      return (
        <>
          <Tiny label="الأزرار">
            <ItemListEditor items={p.items} onChange={(v) => set({ items: v })} makeItem={() => ({ id: uid(), label: 'زر', icon: 'Zap' })}
              cols={[{ key: 'label', label: 'النص' }, { key: 'icon', label: 'أيقونة', type: 'icon' }]} />
          </Tiny>
          <p className="text-[10px] text-slate-500 font-bold">💡 اكتب في حقل «شارة» أي عنصر أحد الأنماط: solid / outline / soft / gradient</p>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="الحجم">
              <Segmented size="sm" value={p.size} onChange={(v) => set({ size: v })} options={[{ value: 'sm', label: 'صغير' }, { value: 'md', label: 'وسط' }, { value: 'lg', label: 'كبير' }]} />
            </Tiny>
            <Tiny label="الحواف">
              <Segmented size="sm" value={p.shape} onChange={(v) => set({ shape: v })} options={[{ value: 'theme', label: 'الثيم' }, { value: 'sharp', label: 'مربع' }, { value: 'rounded', label: 'دائري' }, { value: 'pill', label: 'كبسولة' }]} />
            </Tiny>
          </div>
          <OnOff label="صف أفقي" value={p.row} onChange={(v) => set({ row: v })} />
        </>
      );
    case 'text':
      return (
        <>
          <OnOff label="إظهار العنوان" value={p.showHeading} onChange={(v) => set({ showHeading: v })} />
          <Tiny label="العنوان"><input className="app-input !py-1.5 text-xs" value={p.heading} onChange={(e) => set({ heading: e.target.value })} /></Tiny>
          <Tiny label="النص"><textarea className="app-input !py-2 text-xs min-h-24" value={p.body} onChange={(e) => set({ body: e.target.value })} /></Tiny>
          <div className="grid grid-cols-2 gap-2.5">
            <Tiny label="حجم العنوان">
              <Segmented size="sm" value={p.headingSize} onChange={(v) => set({ headingSize: v })} options={[{ value: 'sm', label: 'ص' }, { value: 'md', label: 'م' }, { value: 'lg', label: 'ك' }, { value: 'xl', label: 'ضخم' }]} />
            </Tiny>
            <Tiny label="المحاذاة">
              <Segmented size="sm" value={p.align} onChange={(v) => set({ align: v })} options={[{ value: 'start', label: 'بداية' }, { value: 'center', label: 'وسط' }, { value: 'end', label: 'نهاية' }]} />
            </Tiny>
          </div>
          <OnOff label="عمودان" value={p.twoColumns} onChange={(v) => set({ twoColumns: v })} />
        </>
      );
    default:
      return <p className="text-xs text-slate-500 font-bold">لا توجد خصائص محتوى لهذا المكوّن</p>;
  }
}

/* ============================================================
   التصميم العام + الحركة
   ============================================================ */

const GRID_TYPES = ['stats', 'cards', 'pricing', 'testimonials', 'gallery'];

function StyleSection({ node, patchStyle }: { node: CompNode; patchStyle: P['patchStyle'] }) {
  const s = node.style;
  const set = (patch: Partial<StyleCfg>) => patchStyle(node.id, patch);
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <ColorField label="الخلفية" value={s.bg || ''} onChange={(v) => set({ bg: v })} allowEmpty />
        <ColorField label="لون النص" value={s.color || ''} onChange={(v) => set({ color: v })} allowEmpty />
      </div>
      <Tiny label="الحواف">
        <Segmented size="sm" value={s.radiusStyle || 'theme'} onChange={(v) => set({ radiusStyle: v as any })}
          options={[{ value: 'theme', label: 'الثيم' }, { value: 'sharp', label: 'مربع' }, { value: 'rounded', label: 'دائري' }, { value: 'pill', label: 'كبسولة' }, { value: 'custom', label: 'مخصص' }]} />
      </Tiny>
      {s.radiusStyle === 'custom' ? <Slider label="نصف القطر" value={s.radius ?? 12} onChange={(v) => set({ radius: v })} min={0} max={48} unit="px" /> : null}
      <Slider label="الحشو الداخلي" value={s.padding ?? 2} onChange={(v) => set({ padding: v })} min={0} max={5} />
      <Tiny label="الظل">
        <Segmented size="sm" value={s.shadow || 'theme'} onChange={(v) => set({ shadow: v as any })}
          options={[{ value: 'theme', label: 'الثيم' }, { value: 'none', label: 'بدون' }, { value: 'sm', label: 'خفيف' }, { value: 'md', label: 'وسط' }, { value: 'lg', label: 'عميق' }, { value: 'glow', label: 'توهج' }]} />
      </Tiny>
      <div className="grid grid-cols-2 gap-2.5">
        <Tiny label="الحدود">
          <Segmented size="sm" value={s.border || 'none'} onChange={(v) => set({ border: v as any })} options={[{ value: 'none', label: 'بدون' }, { value: 'thin', label: 'رفيع' }, { value: 'thick', label: 'عريض' }]} />
        </Tiny>
        {s.border && s.border !== 'none' ? <ColorField label="لون الحد" value={s.borderColor || ''} onChange={(v) => set({ borderColor: v })} allowEmpty /> : null}
      </div>
      <Slider label="الشفافية" value={s.opacity ?? 100} onChange={(v) => set({ opacity: v })} min={20} max={100} unit="%" />
      {GRID_TYPES.includes(node.type) ? (
        <Slider label="عدد الأعمدة" value={node.style.columns ?? 3} onChange={(v) => set({ columns: v })} min={1} max={4} />
      ) : null}
      <Tiny label="التأثير الزجاجي">
        <Segmented size="sm" value={String(s.glass ?? 'theme')} onChange={(v) => set({ glass: v === 'theme' ? 'theme' : v === 'true' })}
          options={[{ value: 'theme', label: 'من الثيم' }, { value: 'true', label: 'مفعّل' }, { value: 'false', label: 'معطّل' }]} />
      </Tiny>
      <OnOff label="خلفية متدرجة (أساسي ← ثانوي)" value={!!s.gradient} onChange={(v) => set({ gradient: v })} />
    </>
  );
}

const EASING_LABELS: Record<string, string> = {
  smooth: 'انسيابي', ease: 'سهل', linear: 'خطي', in: 'تسارع', out: 'تباطؤ', 'in-out': 'تسارع وتباطؤ', spring: 'نابض', bounce: 'مرتد',
};

function AnimSection({ node, patchAnim, replay }: { node: CompNode; patchAnim: P['patchAnim']; replay: () => void }) {
  const a = node.anim;
  const set = (patch: Partial<AnimCfg>) => { patchAnim(node.id, patch); };
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="label-sm !mb-0">نوع الحركة</span>
          <Btn size="xs" variant="soft" icon="Play" onClick={replay}>تجربة</Btn>
        </div>
        <Select value={a.type} onChange={(v) => { set({ type: v }); setTimeout(replay, 30); }}
          options={ANIMS.map((x) => ({ value: x.id, label: x.label }))} />
      </div>
      <Tiny label="التشغيل">
        <Segmented size="sm" value={a.trigger} onChange={(v) => set({ trigger: v as any })}
          options={[{ value: 'load', label: 'عند التحميل' }, { value: 'scroll', label: 'عند التمرير' }, { value: 'hover', label: 'عند المرور' }]} />
      </Tiny>
      {a.type !== 'none' ? (
        <>
          <Slider label="المدة" value={a.duration} onChange={(v) => set({ duration: v })} min={100} max={3000} step={50} unit="ms" />
          <Slider label="التأخير" value={a.delay} onChange={(v) => set({ delay: v })} min={0} max={2000} step={50} unit="ms" />
          <Tiny label="منحنى السرعة">
            <Select value={a.easing} onChange={(v) => set({ easing: v })} options={Object.keys(EASINGS).map((k) => ({ value: k, label: EASING_LABELS[k] || k }))} />
          </Tiny>
          {a.trigger !== 'hover' ? <OnOff label="تكرار مستمر" value={a.loop} onChange={(v) => set({ loop: v })} /> : null}
        </>
      ) : (
        <p className="text-[10.5px] text-slate-600 font-bold">اختر حركة لعرض خيارات التوقيت</p>
      )}
    </>
  );
}

/* ============================================================
   المفتش الرئيسي
   ============================================================ */

export default function Inspector(props: P) {
  const { node, remove, duplicate, toggleHidden, setTitle } = props;
  return (
    <div className="flex flex-col gap-3">
      {/* رأس المكوّن */}
      <div className="glass-panel p-3.5 border-violet-400/25 sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/25 to-indigo-500/25 border border-violet-400/25 text-violet-200 flex items-center justify-center shrink-0">
            <Icon name={COMP_ICONS[node.type]} size={17} />
          </span>
          <div className="flex-1 min-w-0">
            <input value={node.title} onChange={(e) => setTitle(node.id, e.target.value)}
              className="w-full bg-transparent text-[13px] font-black outline-none border-b border-transparent focus:border-violet-400/50 transition-colors" />
            <p className="text-[9.5px] text-slate-500 font-bold">{COMP_LABELS[node.type]}</p>
          </div>
          <IconButton name={node.hidden ? 'EyeOff' : 'Eye'} title={node.hidden ? 'إظهار' : 'إخفاء'} active={!!node.hidden} onClick={() => toggleHidden(node.id)} />
          <IconButton name="Copy" title="تكرار" onClick={() => duplicate(node.id)} />
          <IconButton name="Trash2" title="حذف" className="hover:!bg-rose-500/20 hover:!text-rose-300" onClick={() => remove(node.id)} />
        </div>
      </div>

      <Collapse title="المحتوى والخصائص" icon="FileText" defaultOpen>
        <Content node={node} patchProps={props.patchProps} />
      </Collapse>

      <Collapse title="التصميم والشكل" icon="Paintbrush">
        <StyleSection node={node} patchStyle={props.patchStyle} />
      </Collapse>

      <Collapse title="الحركة والأنيميشن" icon="Zap">
        <AnimSection node={node} patchAnim={props.patchAnim} replay={props.replay} />
      </Collapse>
    </div>
  );
}
