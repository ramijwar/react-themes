import type { CSSProperties } from 'react';
import type { ThemeCfg, ShapeKind } from './types';

/* ---------------- الخطوط ---------------- */
export const FONTS: Record<string, { label: string; stack: string; google?: string }> = {
  cairo: { label: 'القاهرة Cairo', stack: "'Cairo','Tajawal',system-ui,sans-serif", google: 'Cairo:wght@300..900' },
  tajawal: { label: 'تجول Tajawal', stack: "'Tajawal',system-ui,sans-serif", google: 'Tajawal:wght@300..800' },
  almarai: { label: 'المرعى Almarai', stack: "'Almarai','Tajawal',sans-serif", google: 'Almarai:wght@300..800' },
  ibm: { label: 'IBM Plex Arabic', stack: "'IBM Plex Sans Arabic',sans-serif", google: 'IBM+Plex+Sans+Arabic:wght@300..700' },
  inter: { label: 'Inter', stack: "'Inter',system-ui,sans-serif", google: 'Inter:wght@300..800' },
  poppins: { label: 'Poppins', stack: "'Poppins',sans-serif", google: 'Poppins:wght@300..700' },
  mono: { label: 'JetBrains Mono', stack: "'JetBrains Mono',monospace", google: 'JetBrains+Mono:wght@300..700' },
  system: { label: 'خط النظام', stack: "system-ui,-apple-system,'Segoe UI',sans-serif" },
};

/* ---------------- ألوان مساعدة ---------------- */
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h || '000000', 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function mix(hex: string, target: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(target);
  const f = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `#${[f(r1, r2), f(g1, g2), f(b1, b2)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function readableOn(bg: string, light = '#ffffff', dark = '#0a0a0a'): string {
  return luminance(bg) > 0.45 ? dark : light;
}

/** لون متناسق للقراءة على خلفية الثيم */
export function onPrimary(t: ThemeCfg): string {
  return readableOn(t.colors.primary);
}

/* ---------------- الحواف ---------------- */
export function radiusFor(kind: ShapeKind, base: number): number {
  switch (kind) {
    case 'sharp': return 0;
    case 'pill': return 999;
    default: return base;
  }
}

export const RADIUS_CHOICES: { id: ShapeKind; label: string }[] = [
  { id: 'sharp', label: 'مربع' },
  { id: 'rounded', label: 'دائري' },
  { id: 'pill', label: 'كبسولة' },
];

/* ---------------- الظلال ---------------- */
export function shadowCss(t: ThemeCfg, level?: string): string {
  const l = level && level !== 'theme' ? level : t.shadow;
  const dark = t.mode === 'dark';
  switch (l) {
    case 'none': return 'none';
    case 'sm': return dark ? '0 1px 4px rgba(0,0,0,.4)' : '0 1px 4px rgba(15,23,42,.08)';
    case 'md': return dark ? '0 6px 18px rgba(0,0,0,.45)' : '0 6px 18px rgba(15,23,42,.1)';
    case 'lg': return dark ? '0 16px 44px rgba(0,0,0,.55)' : '0 16px 44px rgba(15,23,42,.14)';
    case 'glow': return `0 8px 34px ${rgba(t.colors.primary, 0.35)}`;
    default: return shadowCss(t, 'md');
  }
}

/* ---------------- الكثافة ---------------- */
export const DENSITY: Record<string, number> = { compact: 0.8, normal: 1, relaxed: 1.25 };

export const PAD_STEPS = [4, 10, 16, 24, 34, 48];
export function pad(node: { padding?: number }, t: ThemeCfg): number {
  const i = Math.max(0, Math.min(5, node.padding ?? 2));
  return Math.round(PAD_STEPS[i] * DENSITY[t.density]);
}

/* ---------------- متغيرات CSS للثيم ---------------- */
export function themeVars(t: ThemeCfg): Record<string, string> {
  const c = t.colors;
  return {
    '--c-primary': c.primary,
    '--c-primary-soft': rgba(c.primary, 0.12),
    '--c-primary-mid': rgba(c.primary, 0.28),
    '--c-secondary': c.secondary,
    '--c-accent': c.accent,
    '--c-bg': c.bg,
    '--c-surface': c.surface,
    '--c-surface2': c.surface2,
    '--c-text': c.text,
    '--c-muted': c.muted,
    '--c-border': c.border,
    '--grad-main': `linear-gradient(135deg, ${c.primary} 0%, ${c.secondary} 100%)`,
    '--grad-hot': `linear-gradient(135deg, ${c.primary} 0%, ${c.accent} 100%)`,
    '--r-base': `${t.radius}px`,
    '--font-main': FONTS[t.font]?.stack || FONTS.system.stack,
    '--shadow-card': shadowCss(t, 'md'),
    '--on-primary': readableOn(c.primary),
  };
}

export function varsStyle(t: ThemeCfg): CSSProperties {
  return themeVars(t) as unknown as CSSProperties;
}

/* ---------------- اقتراحات ألوان جاهزة ---------------- */
export const SWATCHES = [
  '#6d5efc', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#78716c',
  '#0f172a', '#1e293b', '#f8fafc', '#ffffff', '#fbbf24', '#a3e635',
];
