import { useState } from 'react';
import type { ThemeCfg } from '../lib/types';
import { FONTS } from '../lib/theme';
import { PRESETS, buildThemeFromPreset, lightNeutrals, darkNeutrals } from '../lib/presets';
import { ColorField, Collapse, Segmented, Slider, Select, Toggle, Btn } from '../components/ui';
import { Icon } from '../lib/icons';

/* ============================================================
   لوحة إعدادات الثيم العامة
   ============================================================ */

export default function ThemePanel({ theme, onChange }: { theme: ThemeCfg; onChange: (patch: Partial<ThemeCfg>) => void }) {
  const [quick, setQuick] = useState(false);
  const c = theme.colors;
  const setColor = (k: keyof ThemeCfg['colors']) => (v: string) => onChange({ colors: { ...c, [k]: v } });

  function switchMode(mode: 'light' | 'dark') {
    const n = mode === 'dark' ? darkNeutrals(c.primary) : lightNeutrals(c.primary);
    onChange({ mode, colors: { ...c, ...n } });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-panel p-4 flex items-center gap-3 border-violet-400/25">
        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shrink-0"><Icon name="Palette" size={19} /></span>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-sm">الثيم العام</h3>
          <p className="text-[10px] text-slate-500 font-bold">يؤثر على كل المكوّنات دفعة واحدة</p>
        </div>
      </div>

      <Collapse title="الثيمات السريعة" icon="Zap" badge={<span className="text-[9.5px] font-black bg-violet-500/15 text-violet-300 rounded-full px-2 py-0.5">30</span>}>
        <p className="text-[10.5px] text-slate-500 font-bold -mt-1">طبّق لوحة ألوان وطابع أي ثيم جاهز على قالبك الحالي (بدون تغيير المكونات)</p>
        <div className="grid grid-cols-5 gap-1.5">
          {PRESETS.map((p) => {
            const th = buildThemeFromPreset(p);
            return (
              <button key={p.key} title={`${p.name_ar} — ${p.category}`}
                onClick={() => onChange({ ...th, name: theme.name || th.name, rtl: theme.rtl })}
                className="aspect-square rounded-lg border border-white/10 hover:scale-110 hover:border-violet-400/60 transition-all relative overflow-hidden">
                <span className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${th.colors.primary} 0 50%, ${th.mode === 'dark' ? '#141824' : '#f8fafc'} 50% 100%)` }} />
                <span className="absolute bottom-0.5 left-1 w-2 h-2 rounded-full border border-black/20" style={{ background: th.colors.accent }} />
              </button>
            );
          })}
        </div>
      </Collapse>

      <Collapse title="الهوية والألوان" icon="Droplets" defaultOpen>
        <div className="flex gap-2">
          <div className="flex-1"><span className="label-sm">الوضع</span>
            <Segmented value={theme.mode} onChange={(v) => switchMode(v as any)} options={[{ value: 'light', label: 'فاتح', icon: 'Sun' }, { value: 'dark', label: 'داكن', icon: 'Moon' }]} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <ColorField label="الأساسي" value={c.primary} onChange={setColor('primary')} />
          <ColorField label="الثانوي" value={c.secondary} onChange={setColor('secondary')} />
          <ColorField label="المميز" value={c.accent} onChange={setColor('accent')} />
          <ColorField label="الخلفية" value={c.bg} onChange={setColor('bg')} />
          <ColorField label="السطح" value={c.surface} onChange={setColor('surface')} />
          <ColorField label="سطح ثانٍ" value={c.surface2} onChange={setColor('surface2')} />
          <ColorField label="النص" value={c.text} onChange={setColor('text')} />
          <ColorField label="نص خافت" value={c.muted} onChange={setColor('muted')} />
          <ColorField label="الحدود" value={c.border} onChange={setColor('border')} />
        </div>
        <Toggle label="خلفية متدرجة للصفحة" checked={theme.gradientBg} onChange={(v) => onChange({ gradientBg: v })} />
      </Collapse>

      <Collapse title="الخط والاتجاه" icon="Type">
        <Select value={theme.font} onChange={(v) => onChange({ font: v })}
          options={Object.entries(FONTS).map(([k, f]) => ({ value: k, label: f.label }))} />
        <Toggle label="اتجاه من اليمين لليسار (RTL)" checked={theme.rtl} onChange={(v) => onChange({ rtl: v })} />
      </Collapse>

      <Collapse title="الحواف والظلال والكثافة" icon="Square" defaultOpen>
        <div>
          <span className="label-sm">طابع الحواف العام</span>
          <Segmented value={theme.radiusStyle} onChange={(v) => onChange({ radiusStyle: v as any })}
            options={[{ value: 'sharp', label: 'مربع' }, { value: 'rounded', label: 'دائري' }, { value: 'pill', label: 'كبسولة' }]} />
        </div>
        <Slider label="درجة الاستدارة" value={theme.radius} onChange={(v) => onChange({ radius: v })} min={0} max={32} unit="px" />
        <div>
          <span className="label-sm">الظلال</span>
          <Segmented size="sm" value={theme.shadow} onChange={(v) => onChange({ shadow: v as any })}
            options={[{ value: 'none', label: 'بدون' }, { value: 'sm', label: 'خفيفة' }, { value: 'md', label: 'وسط' }, { value: 'lg', label: 'عميقة' }, { value: 'glow', label: 'توهج' }]} />
        </div>
        <div>
          <span className="label-sm">الكثافة</span>
          <Segmented size="sm" value={theme.density} onChange={(v) => onChange({ density: v as any })}
            options={[{ value: 'compact', label: 'مضغوط' }, { value: 'normal', label: 'عادي' }, { value: 'relaxed', label: 'مريح' }]} />
        </div>
        <Toggle label="تأثير زجاجي عام (Glassmorphism)" checked={theme.glass} onChange={(v) => onChange({ glass: v })} />
      </Collapse>

      <Collapse title="شكل الأزرار" icon="MousePointerClick" defaultOpen>
        <div>
          <span className="label-sm">حواف الأزرار</span>
          <Segmented value={theme.buttonShape} onChange={(v) => onChange({ buttonShape: v as any })}
            options={[{ value: 'sharp', label: 'مربعة' }, { value: 'rounded', label: 'دائرية' }, { value: 'pill', label: 'كبسولة' }]} />
        </div>
        <div>
          <span className="label-sm">نمط الأزرار</span>
          <Segmented value={theme.buttonStyle} onChange={(v) => onChange({ buttonStyle: v as any })}
            options={[{ value: 'solid', label: 'مصمت' }, { value: 'outline', label: 'محدد' }, { value: 'soft', label: 'ناعم' }, { value: 'gradient', label: 'متدرج' }]} />
        </div>
      </Collapse>

      <Collapse title="شكل الحقول" icon="TextCursorInput" defaultOpen>
        <div>
          <span className="label-sm">حواف الحقول</span>
          <Segmented value={theme.inputShape} onChange={(v) => onChange({ inputShape: v as any })}
            options={[{ value: 'sharp', label: 'مربعة' }, { value: 'rounded', label: 'دائرية' }, { value: 'pill', label: 'كبسولة' }]} />
        </div>
        <div>
          <span className="label-sm">نمط الحقول</span>
          <Segmented value={theme.inputStyle} onChange={(v) => onChange({ inputStyle: v as any })}
            options={[{ value: 'outlined', label: 'محددة' }, { value: 'filled', label: 'معبأة' }, { value: 'underlined', label: 'تسطير' }]} />
        </div>
      </Collapse>

      <Collapse title="اسم الثيم" icon="Tag">
        <input className="app-input text-xs" value={theme.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="اسم الثيم" />
      </Collapse>
    </div>
  );
}
