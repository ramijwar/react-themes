/* ============================================================
   نموذج البيانات الأساسي للاستوديو
   ============================================================ */

export type ShapeKind = 'sharp' | 'rounded' | 'pill';

export type CompType =
  | 'topbar' | 'sidebar' | 'bottombar'
  | 'hero' | 'stats' | 'cards' | 'form' | 'table' | 'tabs'
  | 'pricing' | 'testimonials' | 'gallery' | 'list' | 'cta'
  | 'footer' | 'search' | 'profile' | 'alert' | 'buttons' | 'text';

export const COMP_LABELS: Record<CompType, string> = {
  topbar: 'شريط علوي',
  sidebar: 'قائمة جانبية',
  bottombar: 'شريط تبويب سفلي',
  hero: 'واجهة رئيسية (Hero)',
  stats: 'إحصائيات',
  cards: 'بطاقات',
  form: 'نموذج / حقول',
  table: 'جدول بيانات',
  tabs: 'تبويبات',
  pricing: 'باقات وأسعار',
  testimonials: 'آراء العملاء',
  gallery: 'معرض',
  list: 'قائمة عناصر',
  cta: 'دعوة لإجراء (CTA)',
  footer: 'تذييل',
  search: 'شريط بحث',
  profile: 'بطاقة ملف شخصي',
  alert: 'تنبيه',
  buttons: 'أزرار',
  text: 'نص / قسم',
};

export const COMP_ICONS: Record<CompType, string> = {
  topbar: 'PanelTop', sidebar: 'PanelRight', bottombar: 'LayoutPanelTop',
  hero: 'Sparkles', stats: 'BarChart3', cards: 'LayoutGrid', form: 'TextCursorInput',
  table: 'Table', tabs: 'Folder', pricing: 'Tags', testimonials: 'Quote',
  gallery: 'Images', list: 'List', cta: 'Megaphone', footer: 'PanelBottom',
  search: 'Search', profile: 'UserRound', alert: 'BellRing', buttons: 'MousePointerClick',
  text: 'Type',
};

/** إعدادات حركة لعنصر */
export interface AnimCfg {
  type: string;            // مفتاح من ANIMS
  trigger: 'load' | 'scroll' | 'hover';
  duration: number;        // ms
  delay: number;           // ms
  easing: string;          // مفتاح من EASINGS
  loop: boolean;
}

/** overrides تصميم عامة لأي مكوّن */
export interface StyleCfg {
  bg?: string;             // '' = تلقائي من الثيم
  color?: string;
  radiusStyle?: 'theme' | 'sharp' | 'rounded' | 'pill' | 'custom';
  radius?: number;         // px عند custom
  padding?: number;        // 0..5 (مقياس)
  shadow?: 'none' | 'theme' | 'sm' | 'md' | 'lg' | 'glow';
  border?: 'none' | 'thin' | 'thick';
  borderColor?: string;
  opacity?: number;        // 30..100
  align?: 'start' | 'center' | 'end';
  columns?: number;        // للشبكات 1..4
  glass?: boolean | 'theme';
  gradient?: boolean;
}

export interface ListItem {
  id: string;
  label: string;
  icon?: string;
  value?: string;
  badge?: string;
  desc?: string;
  active?: boolean;
}

export type FieldKind = 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'switch';

export interface FieldDef {
  id: string;
  kind: FieldKind;
  label: string;
  placeholder?: string;
  required?: boolean;
  icon?: string;
  options?: string[];
  /** overrides خاصة بالحقل */
  radiusStyle?: 'theme' | 'sharp' | 'rounded' | 'pill';
}

export interface PlanDef {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  icon?: string;
  featured?: boolean;
  cta?: string;
}

export interface CompNode {
  id: string;
  type: CompType;
  title: string;
  props: Record<string, any>;
  style: StyleCfg;
  anim: AnimCfg;
  hidden?: boolean;
}

export interface ThemeCfg {
  name: string;
  mode: 'light' | 'dark';
  colors: {
    primary: string; secondary: string; accent: string;
    bg: string; surface: string; surface2: string;
    text: string; muted: string; border: string;
  };
  font: string;              // مفتاح من FONTS
  radius: number;            // نصف القطر الأساسي px
  radiusStyle: ShapeKind;    // الطابع العام للحواف
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'glow';
  density: 'compact' | 'normal' | 'relaxed';
  buttonShape: ShapeKind;
  buttonStyle: 'solid' | 'outline' | 'soft' | 'gradient';
  inputStyle: 'outlined' | 'filled' | 'underlined';
  inputShape: ShapeKind;
  glass: boolean;
  gradientBg: boolean;
  rtl: boolean;
}

export interface Layout {
  topbar: CompNode | null;
  sidebar: CompNode | null;
  bottombar: CompNode | null;
  sections: CompNode[];
}

export interface TemplateDoc {
  version: 1;
  theme: ThemeCfg;
  layout: Layout;
}

export interface TemplateMeta {
  id: number | string;
  user_id?: number;
  name: string;
  description: string;
  theme_key: string;
  featured: number | boolean;
  data: TemplateDoc;
  created_at?: string;
  updated_at?: string;
}

export type LayoutKind = 'dashboard' | 'landing' | 'mobile' | 'shop' | 'blog' | 'portfolio';

export interface ThemePreset {
  key: string;
  name: string;
  name_ar: string;
  category: string;
  layout: LayoutKind;
  theme: Omit<ThemeCfg, 'name'>;
  seed?: number;
}

export const uid = () => Math.random().toString(36).slice(2, 9);

export function defaultAnim(): AnimCfg {
  return { type: 'none', trigger: 'load', duration: 600, delay: 0, easing: 'smooth', loop: false };
}

export function defaultStyle(): StyleCfg {
  return { radiusStyle: 'theme', padding: 2, shadow: 'theme', border: 'none', opacity: 100, align: 'start', glass: 'theme', gradient: false };
}
