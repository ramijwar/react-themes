import { createElement, type ReactNode } from 'react';
import { icons } from 'lucide';

/* ============================================================
   سجل الأيقونات الديناميكي — 1700+ أيقونة من Lucide
   ============================================================ */

export type IconNode = any;
const RAW: Record<string, IconNode> = icons as any;

export interface IconEntry {
  name: string;
  keywords: string;
}

function splitName(n: string): string {
  return n
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .toLowerCase();
}

export const ICON_ENTRIES: IconEntry[] = Object.keys(RAW)
  .sort()
  .map((name) => ({ name, keywords: `${name} ${splitName(name)}`.toLowerCase() }));

/* أيقونات شائعة للعرض السريع */
export const POPULAR_ICONS = [
  'House', 'LayoutDashboard', 'Settings', 'User', 'Users', 'Bell', 'Search', 'Mail',
  'Heart', 'Star', 'ShoppingCart', 'Store', 'CreditCard', 'Wallet', 'ChartLine', 'ChartColumnBig',
  'BarChart3', 'PieChart', 'Calendar', 'CalendarDays', 'Clock', 'Timer', 'Camera', 'Image',
  'Images', 'Video', 'Music', 'Mic', 'Headphones', 'Smartphone', 'Laptop', 'Monitor',
  'Cpu', 'Code', 'CodeXml', 'Terminal', 'Database', 'Cloud', 'CloudUpload', 'Download',
  'Upload', 'Share2', 'Link', 'Globe', 'MapPin', 'Navigation', 'Compass', 'Flag',
  'Bookmark', 'Tag', 'Tags', 'Gift', 'Trophy', 'Award', 'Medal', 'Crown',
  'Zap', 'Sparkles', 'Flame', 'Sun', 'Moon', 'CloudSun', 'Snowflake', 'Umbrella',
  'TreePine', 'Leaf', 'Flower', 'Apple', 'Coffee', 'Pizza', 'IceCreamCone', 'Cake',
  'Car', 'Plane', 'Bike', 'Truck', 'Rocket', 'Ship', 'Bus', 'TrainFront',
  'GraduationCap', 'BookOpen', 'Library', 'NotebookPen', 'FileText', 'Files', 'Folder', 'FolderOpen',
  'ClipboardList', 'ListTodo', 'ListChecks', 'CheckCircle2', 'CircleCheck', 'XCircle', 'Info', 'HelpCircle',
  'Shield', 'ShieldCheck', 'Lock', 'Unlock', 'KeyRound', 'Fingerprint', 'Eye', 'EyeOff',
  'MessageCircle', 'MessagesSquare', 'Send', 'Inbox', 'Archive', 'Trash2', 'Pencil', 'Eraser',
  'Brush', 'Palette', 'PaintBucket', 'Droplet', 'Shapes', 'Box', 'Package', 'Layers',
  'Grid2x2', 'LayoutGrid', 'Menu', 'MoreHorizontal', 'MoreVertical', 'Plus', 'Minus', 'X',
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown',
  'RefreshCw', 'RotateCw', 'Maximize2', 'Minimize2', 'ExternalLink', 'Copy', 'Scissors', 'Filter',
  'SlidersHorizontal', 'Wrench', 'Hammer', 'Cog', 'Gauge', 'Activity', 'Pulse', 'Stethoscope',
  'Briefcase', 'Building2', 'Factory', 'Handshake', 'Target', 'Crosshair', 'Telescope', 'Lightbulb',
  'Battery', 'BatteryCharging', 'Plug', 'PlugZap', 'Wifi', 'Bluetooth', 'Signal', 'RadioTower',
  'Gem', 'Diamond', 'Coins', 'Banknote', 'PiggyBank', 'Percent', 'TrendingUp', 'TrendingDown',
  'ThumbsUp', 'ThumbsDown', 'Smile', 'Laugh', 'Frown', 'PartyPopper', 'Quote', 'AtSign',
  'Hash', 'Sigma', 'Infinity', 'Puzzle', 'Blocks', 'Component', 'GitBranch', 'Bug',
  'TestTube2', 'Microscope', 'Atom', 'Orbit', 'Globe', 'Star', 'MoonStar', 'Eclipse',
];

export function searchIcons(q: string, limit = 400): IconEntry[] {
  const s = q.trim().toLowerCase();
  if (!s) return POPULAR_ICONS.map((n) => ({ name: n, keywords: n.toLowerCase() }));
  const starts: IconEntry[] = [];
  const contains: IconEntry[] = [];
  for (const e of ICON_ENTRIES) {
    if (starts.length + contains.length >= limit) break;
    const nm = e.name.toLowerCase();
    if (nm.startsWith(s)) starts.push(e);
    else if (e.keywords.includes(s)) contains.push(e);
  }
  return [...starts, ...contains];
}

export function hasIcon(name?: string): boolean {
  return !!name && !!RAW[name];
}

const CAMEL: Record<string, string> = {
  'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
  'fill-rule': 'fillRule', 'clip-rule': 'clipRule', 'clip-path': 'clipPath', 'fill-opacity': 'fillOpacity',
  'stroke-opacity': 'strokeOpacity', 'stroke-dasharray': 'strokeDasharray', 'stroke-dashoffset': 'strokeDashoffset',
};
const camelize = (a: Record<string, any>): Record<string, any> => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(a || {})) out[CAMEL[k] || k] = v;
  return out;
};

/** عرض أيقونة كمكوّن React */
export function Icon({ name, size = 20, strokeWidth = 2, className, style }: {
  name?: string; size?: number; strokeWidth?: number; className?: string; style?: React.CSSProperties;
}): ReactNode {
  const node = name ? RAW[name] : undefined;
  if (!node) return null;
  // node = ['svg', attrs, children[]]
  const attrs = camelize(node[1] || {});
  const children: any[] = node[2] || [];
  const render = (kids: any[]): ReactNode[] =>
    kids.map((c: any, i: number) =>
      Array.isArray(c[0])
        ? createElement(c[0][0], { ...camelize(c[0][1]), key: i }, ...render(c.slice(1)))
        : createElement(c[0], { ...camelize(c[1]), key: i }),
    );
  return createElement(
    'svg',
    { ...attrs, width: size, height: size, strokeWidth, className, style, 'aria-hidden': true },
    ...render(children),
  );
}

/** توليد نص SVG لأيقونة (للتصدير) */
export function iconSvg(name: string | undefined, size = 24, strokeWidth = 2, color = 'currentColor'): string {
  const node = name ? RAW[name] : undefined;
  if (!node) return '';
  const attrs = node[1] || {};
  const children: any[] = node[2] || [];
  const serialize = (kids: any[]): string =>
    kids
      .map((c: any) => {
        if (Array.isArray(c[0])) {
          const a = attrStr(c[0][1]);
          return `<${c[0][0]} ${a}>${serialize(c.slice(1))}</${c[0][0]}>`;
        }
        const a = attrStr(c[1]);
        return `<${c[0]} ${a}/>`;
      })
      .join('');
  const attrStr = (o: Record<string, any>) =>
    Object.entries(o || {})
      .map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`)
      .join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${attrs.viewBox || '0 0 24 24'}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${serialize(children)}</svg>`;
}

export const ICON_COUNT = ICON_ENTRIES.length;
