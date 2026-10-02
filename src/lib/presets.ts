import type { LayoutKind, ThemeCfg, ThemePreset } from './types';
import { mix } from './theme';

/* ============================================================
   30 ثيماً جاهزاً — كل ثيم = لوحة ألوان + طابع تصميم + تخطيط
   ============================================================ */

type C = Partial<ThemeCfg['colors']>;

export const lightNeutrals = (tint: string): C => ({
  bg: mix('#ffffff', tint, 0.04),
  surface: '#ffffff',
  surface2: mix('#ffffff', tint, 0.08),
  text: mix('#111827', tint, 0.12),
  muted: mix('#6b7280', tint, 0.1),
  border: mix('#e5e7eb', tint, 0.12),
});

export const darkNeutrals = (tint: string): C => ({
  bg: mix('#0b0e16', tint, 0.1),
  surface: mix('#131826', tint, 0.1),
  surface2: mix('#1c2233', tint, 0.12),
  text: mix('#f3f4f6', tint, 0.04),
  muted: mix('#9aa3b5', tint, 0.08),
  border: mix('#2a3145', tint, 0.14),
});

interface PresetInput {
  key: string; name: string; name_ar: string; category: string; layout: LayoutKind;
  primary: string; secondary?: string; accent?: string;
  dark?: boolean;
  radius?: number; radiusStyle?: ThemeCfg['radiusStyle'];
  font?: string; shadow?: ThemeCfg['shadow']; density?: ThemeCfg['density'];
  buttonShape?: ThemeCfg['buttonShape']; buttonStyle?: ThemeCfg['buttonStyle'];
  inputStyle?: ThemeCfg['inputStyle']; inputShape?: ThemeCfg['inputShape'];
  glass?: boolean; gradientBg?: boolean;
}

function preset(p: PresetInput): ThemePreset {
  const secondary = p.secondary || mix(p.primary, '#ec4899', 0.45);
  const accent = p.accent || mix(p.primary, '#f59e0b', 0.5);
  const neutrals = p.dark ? darkNeutrals(p.primary) : lightNeutrals(p.primary);
  const theme: Omit<ThemeCfg, 'name'> = {
    mode: p.dark ? 'dark' : 'light',
    colors: {
      primary: p.primary, secondary, accent,
      bg: neutrals.bg!, surface: neutrals.surface!, surface2: neutrals.surface2!,
      text: neutrals.text!, muted: neutrals.muted!, border: neutrals.border!,
    },
    font: p.font || 'cairo',
    radius: p.radius ?? 14,
    radiusStyle: p.radiusStyle || 'rounded',
    shadow: p.shadow || 'md',
    density: p.density || 'normal',
    buttonShape: p.buttonShape || p.radiusStyle || 'rounded',
    buttonStyle: p.buttonStyle || 'solid',
    inputStyle: p.inputStyle || 'outlined',
    inputShape: p.inputShape || p.radiusStyle || 'rounded',
    glass: !!p.glass,
    gradientBg: !!p.gradientBg,
    rtl: true,
  };
  return { key: p.key, name: p.name, name_ar: p.name_ar, category: p.category, layout: p.layout, theme };
}

export const PRESETS: ThemePreset[] = [
  // ——— لوحات تحكم ———
  preset({ key: 'fajr', name: 'Fajr', name_ar: 'فجر', category: 'لوحة تحكم', layout: 'dashboard', primary: '#6d5efc', secondary: '#0ea5e9', accent: '#f59e0b' }),
  preset({ key: 'midnight', name: 'Midnight', name_ar: 'ليل', category: 'لوحة تحكم', layout: 'dashboard', primary: '#60a5fa', secondary: '#818cf8', accent: '#34d399', dark: true, shadow: 'lg', glass: true }),
  preset({ key: 'minimal', name: 'Minimal', name_ar: 'بسيط', category: 'لوحة تحكم', layout: 'dashboard', primary: '#111827', secondary: '#4b5563', accent: '#f59e0b', radius: 4, radiusStyle: 'sharp', shadow: 'sm', density: 'compact', buttonStyle: 'outline', inputStyle: 'filled' }),
  preset({ key: 'tech', name: 'Tech', name_ar: 'تقنية', category: 'لوحة تحكم', layout: 'dashboard', primary: '#14b8a6', secondary: '#0ea5e9', accent: '#a3e635', dark: true, font: 'mono', radius: 8, shadow: 'glow', gradientBg: true }),
  preset({ key: 'slate', name: 'Slate Pro', name_ar: 'رمادي محترف', category: 'لوحة تحكم', layout: 'dashboard', primary: '#475569', secondary: '#0f172a', accent: '#38bdf8', radius: 10, shadow: 'sm', density: 'compact', buttonStyle: 'soft' }),
  preset({ key: 'azure', name: 'Azure', name_ar: 'سماوي', category: 'لوحة تحكم', layout: 'dashboard', primary: '#2563eb', secondary: '#06b6d4', accent: '#f97316', gradientBg: true }),
  preset({ key: 'polar', name: 'Polar', name_ar: 'قطبي', category: 'لوحة تحكم', layout: 'dashboard', primary: '#38bdf8', secondary: '#818cf8', accent: '#f472b6', glass: true, shadow: 'lg' }),
  preset({ key: 'cave', name: 'Cave', name_ar: 'كهف', category: 'لوحة تحكم', layout: 'dashboard', primary: '#d97706', secondary: '#a16207', accent: '#65a30d', dark: true, radius: 18 }),
  // ——— مواقع تعريفية ———
  preset({ key: 'glass', name: 'Glassy', name_ar: 'زجاجي', category: 'موقع تعريفي', layout: 'landing', primary: '#0ea5e9', secondary: '#8b5cf6', accent: '#f472b6', glass: true, gradientBg: true, shadow: 'lg', radius: 20 }),
  preset({ key: 'sahara', name: 'Sahara', name_ar: 'صحراء', category: 'موقع تعريفي', layout: 'landing', primary: '#d97706', secondary: '#ea580c', accent: '#84cc16', radius: 18, font: 'tajawal' }),
  preset({ key: 'sunset', name: 'Sunset', name_ar: 'غروب', category: 'موقع تعريفي', layout: 'landing', primary: '#f97316', secondary: '#ec4899', accent: '#facc15', dark: true, gradientBg: true, shadow: 'glow', buttonStyle: 'gradient' }),
  preset({ key: 'royal', name: 'Royal', name_ar: 'ملكي', category: 'موقع تعريفي', layout: 'landing', primary: '#8b5cf6', secondary: '#6d28d9', accent: '#fbbf24', dark: true, shadow: 'lg', font: 'almarai', radius: 16 }),
  preset({ key: 'violet', name: 'Violet Dream', name_ar: 'بنفسج حالم', category: 'موقع تعريفي', layout: 'landing', primary: '#a855f7', secondary: '#6366f1', accent: '#22d3ee', glass: true, gradientBg: true }),
  preset({ key: 'coral', name: 'Coral', name_ar: 'مرجان', category: 'موقع تعريفي', layout: 'landing', primary: '#fb7185', secondary: '#f97316', accent: '#2dd4bf', radius: 22, buttonStyle: 'soft' }),
  preset({ key: 'volcano', name: 'Volcano', name_ar: 'بركاني', category: 'موقع تعريفي', layout: 'landing', primary: '#ef4444', secondary: '#f97316', accent: '#fde047', dark: true, gradientBg: true, shadow: 'glow', buttonStyle: 'gradient' }),
  preset({ key: 'galaxy', name: 'Galaxy', name_ar: 'مجرة', category: 'موقع تعريفي', layout: 'landing', primary: '#818cf8', secondary: '#e879f9', accent: '#38bdf8', dark: true, glass: true, gradientBg: true, shadow: 'glow', radius: 20 }),
  // ——— تطبيقات جوال ———
  preset({ key: 'neon', name: 'Neon', name_ar: 'نيون', category: 'تطبيق جوال', layout: 'mobile', primary: '#22d3ee', secondary: '#e879f9', accent: '#a3e635', dark: true, shadow: 'glow', gradientBg: true, radius: 18 }),
  preset({ key: 'candy', name: 'Candy', name_ar: 'حلوى', category: 'تطبيق جوال', layout: 'mobile', primary: '#f472b6', secondary: '#c084fc', accent: '#fbbf24', radiusStyle: 'pill', radius: 24, buttonShape: 'pill', inputShape: 'pill', buttonStyle: 'gradient' }),
  preset({ key: 'rainbow', name: 'Rainbow', name_ar: 'قوس قزح', category: 'تطبيق جوال', layout: 'mobile', primary: '#6366f1', secondary: '#ec4899', accent: '#22c55e', gradientBg: true, radius: 20, buttonStyle: 'gradient' }),
  preset({ key: 'lavender', name: 'Lavender', name_ar: 'خزامى', category: 'تطبيق جوال', layout: 'mobile', primary: '#a78bfa', secondary: '#f0abfc', accent: '#67e8f9', radiusStyle: 'pill', buttonShape: 'pill', buttonStyle: 'soft' }),
  preset({ key: 'mint-app', name: 'Mint App', name_ar: 'نعناعي', category: 'تطبيق جوال', layout: 'mobile', primary: '#10b981', secondary: '#14b8a6', accent: '#f59e0b', radius: 16, density: 'compact' }),
  // ——— متاجر ———
  preset({ key: 'ocean', name: 'Ocean Store', name_ar: 'محيط', category: 'متجر', layout: 'shop', primary: '#0284c7', secondary: '#0891b2', accent: '#f59e0b', radius: 12 }),
  preset({ key: 'rose', name: 'Rose Boutique', name_ar: 'وردي', category: 'متجر', layout: 'shop', primary: '#e11d48', secondary: '#f472b6', accent: '#fbbf24', font: 'almarai', radius: 20, buttonStyle: 'gradient' }),
  preset({ key: 'amber', name: 'Amber Souk', name_ar: 'عنبر', category: 'متجر', layout: 'shop', primary: '#b45309', secondary: '#ca8a04', accent: '#0f766e', radius: 8, font: 'tajawal', shadow: 'sm' }),
  preset({ key: 'emerald', name: 'Emerald Lux', name_ar: 'زمرد فاخر', category: 'متجر', layout: 'shop', primary: '#059669', secondary: '#0d9488', accent: '#eab308', dark: true, shadow: 'lg', font: 'ibm' }),
  // ——— مدونات ———
  preset({ key: 'forest', name: 'Forest Blog', name_ar: 'غابة', category: 'مدونة', layout: 'blog', primary: '#16a34a', secondary: '#65a30d', accent: '#f97316', font: 'tajawal', radius: 12 }),
  preset({ key: 'olive', name: 'Olive Press', name_ar: 'زيتون', category: 'مدونة', layout: 'blog', primary: '#4d7c0f', secondary: '#a16207', accent: '#0f766e', radius: 6, radiusStyle: 'sharp', buttonStyle: 'outline', density: 'relaxed' }),
  preset({ key: 'pearl', name: 'Pearl', name_ar: 'لؤلؤة', category: 'مدونة', layout: 'blog', primary: '#0f766e', secondary: '#0e7490', accent: '#d97706', radius: 24, shadow: 'sm', font: 'ibm' }),
  // ——— محافظ أعمال ———
  preset({ key: 'luxury', name: 'Luxury Gold', name_ar: 'فخم ذهبي', category: 'محفظة أعمال', layout: 'portfolio', primary: '#d4a017', secondary: '#b45309', accent: '#e7e2d6', dark: true, font: 'almarai', radius: 2, radiusStyle: 'sharp', buttonStyle: 'outline', shadow: 'lg' }),
  preset({ key: 'charcoal', name: 'Charcoal', name_ar: 'فحم', category: 'محفظة أعمال', layout: 'portfolio', primary: '#f97316', secondary: '#fb923c', accent: '#a3a3a3', dark: true, radius: 10, buttonStyle: 'outline' }),
];

export const PRESET_MAP: Record<string, ThemePreset> = Object.fromEntries(PRESETS.map((p) => [p.key, p]));

export function buildThemeFromPreset(p: ThemePreset): ThemeCfg {
  return { name: p.name_ar, ...p.theme };
}

export const CATEGORIES = ['الكل', ...Array.from(new Set(PRESETS.map((p) => p.category)))];

export const LAYOUT_LABELS: Record<LayoutKind, string> = {
  dashboard: 'لوحة تحكم', landing: 'صفحة هبوط', mobile: 'تطبيق جوال',
  shop: 'متجر إلكتروني', blog: 'مدونة', portfolio: 'محفظة أعمال',
};
