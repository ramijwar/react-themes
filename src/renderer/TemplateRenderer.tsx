import { useState, type CSSProperties, type ReactNode } from 'react';
import type { CompNode, FieldDef, ListItem, PlanDef, StyleCfg, TemplateDoc, ThemeCfg } from '../lib/types';
import { Icon } from '../lib/icons';
import { radiusFor, shadowCss, pad, readableOn, rgba, mix, DENSITY, varsStyle } from '../lib/theme';
import { animClass, animStyle } from '../lib/anim';

/* ============================================================
   مُصيّر القوالب — يحوّل TemplateDoc إلى واجهة حقيقية
   الأوضاع: edit (تحرير) | preview (معاينة تفاعلية) | static (تصدير)
   ============================================================ */

export interface RenderCtx {
  t: ThemeCfg;
  mode: 'edit' | 'preview' | 'static';
  device: 'desktop' | 'tablet' | 'mobile';
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  ui: Record<string, any>;
  set: (k: string, v: any) => void;
  replayKey?: number;
}

type P = { node: CompNode; ctx: RenderCtx };

/* ---------- أدوات ---------- */

const Ico = ({ n, s = 18, c, w = 2 }: { n?: string; s?: number; c?: string; w?: number }) =>
  n ? <Icon name={n} size={s} strokeWidth={w} style={c ? { color: c } : undefined} /> : null;

function nodeRadius(style: StyleCfg, t: ThemeCfg): number {
  const rs = style.radiusStyle || 'theme';
  if (rs === 'custom') return style.radius ?? 12;
  const shape = rs === 'theme' ? t.radiusStyle : rs;
  return radiusFor(shape, t.radius);
}

function surfaceStyle(n: CompNode, t: ThemeCfg, fallback?: string): CSSProperties {
  const s = n.style;
  const glass = s.glass === true || (s.glass === 'theme' && t.glass);
  const bg = s.bg || fallback || t.colors.surface;
  const st: CSSProperties = {
    background: glass ? rgba(bg, 0.7) : bg,
    backdropFilter: glass ? 'blur(14px)' : undefined,
    WebkitBackdropFilter: glass ? 'blur(14px)' : undefined,
    borderRadius: nodeRadius(s, t),
    padding: pad(s, t),
    color: s.color || undefined,
    opacity: (s.opacity ?? 100) / 100,
    boxShadow: s.shadow === 'none' ? 'none' : shadowCss(t, s.shadow),
  };
  if (s.border && s.border !== 'none') st.border = `${s.border === 'thick' ? 2 : 1}px solid ${s.borderColor || t.colors.border}`;
  if (s.gradient) {
    st.background = `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})`;
    st.color = readableOn(t.colors.primary);
  }
  return st;
}

function gridCols(n: CompNode, ctx: RenderCtx, def = 3, max = 4): number {
  const c = Math.min(max, Math.max(1, n.style.columns ?? def));
  if (ctx.device === 'mobile') return c >= 4 ? 2 : 1;
  if (ctx.device === 'tablet') return Math.min(c, 2);
  return c;
}

function Btn({ label, icon, variant, size = 'md', full, shape, style, ctx, onLight }: {
  label?: string; icon?: string; variant?: string; size?: 'sm' | 'md' | 'lg'; full?: boolean;
  shape?: string; style?: CSSProperties; ctx: RenderCtx; onLight?: boolean;
}) {
  const t = ctx.t;
  const v = variant || t.buttonStyle;
  const r = shape && shape !== 'theme' ? radiusFor(shape as any, t.radius) : radiusFor(t.buttonShape, t.radius);
  const sz: any = { sm: [7, 13, 12.5], md: [10.5, 20, 14], lg: [14, 28, 15.5] }[size];
  let bg: string, color: string, border: string | undefined;
  if (onLight) {
    bg = v === 'outline' ? 'transparent' : '#ffffff';
    color = v === 'outline' ? '#ffffff' : t.colors.primary;
    border = v === 'outline' ? '2px solid rgba(255,255,255,.7)' : undefined;
  } else {
    switch (v) {
      case 'outline': bg = 'transparent'; color = t.colors.primary; border = `2px solid ${t.colors.primary}`; break;
      case 'soft': bg = rgba(t.colors.primary, 0.13); color = t.colors.primary; break;
      case 'gradient': bg = `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})`; color = readableOn(t.colors.primary); break;
      default: bg = t.colors.primary; color = readableOn(t.colors.primary);
    }
  }
  return (
    <button className="tpl-btn" style={{
      background: bg, color, border, borderRadius: r,
      padding: `${sz[0]}px ${sz[1]}px`, fontSize: sz[2],
      width: full ? '100%' : undefined,
      boxShadow: (v === 'solid' || v === 'gradient' || onLight) && t.shadow !== 'none' ? shadowCss(t, t.shadow === 'glow' ? 'md' : t.shadow) : undefined,
      ...style,
    }}>
      {icon ? <Ico n={icon} s={sz[2] + 3} /> : null}
      {label}
    </button>
  );
}

function IconTile({ icon, size = 42, bg, color, radius, ctx }: {
  icon?: string; size?: number; bg?: string; color?: string; radius?: number; ctx: RenderCtx;
}) {
  const t = ctx.t;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      width: size, height: size, borderRadius: radius ?? Math.max(8, radiusFor(t.radiusStyle, t.radius) * 0.75),
      background: bg ?? rgba(t.colors.primary, 0.12), color: color ?? t.colors.primary,
    }}>
      <Ico n={icon} s={size * 0.5} w={2.2} />
    </span>
  );
}

function Badge({ text, color, ctx, pill = true }: { text?: string; color?: string; ctx: RenderCtx; pill?: boolean }) {
  if (!text) return null;
  const t = ctx.t;
  const c = color || t.colors.primary;
  return (
    <span className="tpl-chip" style={{
      fontSize: 10.5, fontWeight: 800, padding: '2px 8px', lineHeight: 1.6,
      borderRadius: pill ? 999 : 6, background: rgba(c, 0.14), color: c,
    }}>{text}</span>
  );
}

function SectionTitle({ title, sub, align, ctx, color }: { title?: string; sub?: string; align?: string; ctx: RenderCtx; color?: string }) {
  const t = ctx.t;
  if (!title) return null;
  return (
    <div style={{ textAlign: (align as any) || 'start', marginBottom: 18 }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: color || t.colors.text, lineHeight: 1.3 }}>{title}</h2>
      {sub ? <p style={{ fontSize: 13.5, color: rgba(color || t.colors.muted, 1), marginTop: 6 }}>{sub}</p> : null}
    </div>
  );
}

const initials = (s: string) => (s || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('');

function Avatar({ name, size = 40, ctx }: { name: string; size?: number; ctx: RenderCtx }) {
  const t = ctx.t;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      width: size, height: size, borderRadius: '50%', fontSize: size * 0.36, fontWeight: 800,
      background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})`,
      color: readableOn(t.colors.primary),
    }}>{initials(name)}</span>
  );
}

/** غلاف المكوّن: التحديد + الحركة */
function Comp({ node, ctx, children, style, className }: P & { children: ReactNode; style?: CSSProperties; className?: string }) {
  if (node.hidden) return null;
  const cls = ['tpl-comp'];
  if (ctx.mode === 'edit') cls.push('tpl-editable');
  if (ctx.selectedId === node.id) cls.push('is-selected');
  const ac = animClass(node.anim);
  if (ac) cls.push(ac);
  if (className) cls.push(className);
  return (
    <div
      data-cid={node.id}
      data-type={node.type}
      data-title={ctx.mode === 'edit' ? node.title : undefined}
      className={cls.join(' ')}
      style={{ ...animStyle(node.anim), position: 'relative', ...style }}
      onClick={ctx.mode === 'edit' ? (e) => { e.stopPropagation(); ctx.onSelect?.(node.id); } : undefined}
    >
      {children}
    </div>
  );
}

/* ============================================================
   الشريط العلوي
   ============================================================ */
function Topbar({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const grad = p.variant === 'gradient';
  const glass = p.variant === 'glass' || (p.variant === 'solid' && t.glass);
  const fg = grad ? readableOn(t.colors.primary) : t.colors.text;
  const mutedFg = grad ? rgba(readableOn(t.colors.primary), 0.8) : t.colors.muted;
  const links: ListItem[] = p.links || [];
  return (
    <Comp node={node} ctx={ctx} className={ctx.mode === 'static' && p.sticky ? 'tpl-sticky-top' : ''}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 16, height: p.height || 64, padding: '0 20px',
        background: grad ? `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})` : glass ? rgba(t.colors.surface, 0.72) : t.colors.surface,
        backdropFilter: glass ? 'blur(14px)' : undefined, WebkitBackdropFilter: glass ? 'blur(14px)' : undefined,
        borderBottom: grad ? 'none' : `1px solid ${t.colors.border}`,
        color: fg,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, fontSize: 16.5 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36,
            borderRadius: radiusFor(t.radiusStyle, t.radius) * 0.8 || 8,
            background: grad ? rgba('#ffffff', 0.22) : `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})`,
            color: grad ? '#fff' : readableOn(t.colors.primary),
          }}><Ico n={p.brandIcon} s={19} /></span>
          {p.brand}
        </span>
        <nav className="tpl-scroll-x" style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
          {links.map((l) => (
            <span key={l.id} className="tpl-nav-item" style={{
              padding: '7px 13px', fontSize: 13, fontWeight: 700, borderRadius: radiusFor(t.radiusStyle, 10),
              background: l.active ? (grad ? rgba('#fff', 0.2) : rgba(t.colors.primary, 0.12)) : 'transparent',
              color: l.active ? (grad ? '#fff' : t.colors.primary) : mutedFg,
            }}>
              {l.icon ? <Ico n={l.icon} s={15} /> : null}{l.label}
            </span>
          ))}
        </nav>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {p.showSearch ? <button className="tpl-iconbtn" style={{ width: 36, height: 36, color: fg }}><Ico n="Search" s={18} /></button> : null}
          {p.showActions ? (
            <>
              <button className="tpl-iconbtn" style={{ width: 36, height: 36, color: fg, position: 'relative' }}>
                <Ico n="Bell" s={18} />
                <span style={{ position: 'absolute', top: 7, insetInlineEnd: 8, width: 7, height: 7, borderRadius: 9, background: t.colors.accent }} />
              </button>
              <Avatar name={p.brand || 'U'} size={34} ctx={ctx} />
            </>
          ) : null}
        </span>
      </header>
    </Comp>
  );
}

/* ============================================================
   القائمة الجانبية
   ============================================================ */
function Sidebar({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const key = `sb-${node.id}`;
  const collapsed = ctx.mode !== 'static' && !!ctx.ui[key];
  const glass = p.variant === 'glass' || (p.variant === 'solid' && t.glass);
  const items: ListItem[] = p.items || [];
  const itemR = radiusFor(p.itemShape === 'pill' ? 'pill' : p.itemShape === 'sharp' ? 'sharp' : 'rounded', Math.max(8, t.radius * 0.7));
  const side = p.position === 'left' ? 'left' : 'right';
  return (
    <Comp node={node} ctx={ctx} style={{ flexShrink: 0 }}>
      <aside data-sidebar={node.id} style={{
        width: collapsed ? 74 : p.width || 250, minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 5,
        padding: '16px 12px', transition: 'width .25s cubic-bezier(.22,1,.36,1)',
        background: glass ? rgba(t.colors.surface, 0.72) : t.colors.surface,
        backdropFilter: glass ? 'blur(14px)' : undefined, WebkitBackdropFilter: glass ? 'blur(14px)' : undefined,
        borderInlineStart: side === 'left' ? 'none' : `1px solid ${t.colors.border}`,
        borderInlineEnd: side === 'left' ? `1px solid ${t.colors.border}` : 'none',
      }}>
        {p.showLogo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px 14px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, flexShrink: 0,
              borderRadius: radiusFor(t.radiusStyle, t.radius) * 0.8 || 10,
              background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})`, color: readableOn(t.colors.primary),
            }}><Ico n="Sparkles" s={20} /></span>
            {!collapsed && <span style={{ fontWeight: 900, fontSize: 15.5 }}>القائمة</span>}
          </div>
        ) : null}
        {p.collapsible ? (
          <button
            className="tpl-iconbtn" data-action="toggle-sidebar" data-target={node.id}
            style={{ width: 34, height: 34, marginBottom: 6, color: t.colors.muted, alignSelf: collapsed ? 'center' : 'flex-end' }}
            onClick={ctx.mode === 'preview' ? () => ctx.set(key, !collapsed) : undefined}
          ><Ico n={collapsed ? 'ChevronLeft' : 'ChevronsRight'} s={17} /></button>
        ) : null}
        {items.map((it) => (
          <span key={it.id} className="tpl-nav-item" data-nav-item={it.id} style={{
            padding: collapsed ? '10px 0' : '9.5px 12px', justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: itemR, fontSize: 13.5, fontWeight: 700, position: 'relative',
            background: it.active ? rgba(t.colors.primary, 0.12) : 'transparent',
            color: it.active ? t.colors.primary : t.colors.muted,
          }}>
            {it.active ? <span style={{ position: 'absolute', insetInlineStart: collapsed ? '50%' : 0, top: '25%', bottom: '25%', width: 3, borderRadius: 3, background: t.colors.primary, transform: collapsed ? 'translateX(50%)' : undefined }} /> : null}
            <Ico n={it.icon} s={18} />
            <span className="sb-label" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: collapsed ? 'none' : undefined }}>{it.label}</span>
            {!collapsed && it.badge ? <span className="sb-badge"><Badge text={it.badge} ctx={ctx} /></span> : null}
          </span>
        ))}
        <div style={{ flex: 1 }} />
        {p.showUser ? (
          <div className="tpl-nav-item" style={{
            gap: 10, padding: collapsed ? '8px 0' : '10px', justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: itemR, background: t.colors.surface2,
          }}>
            <Avatar name="زائر كريم" size={32} ctx={ctx} />
            {!collapsed && (
              <span className="sb-user-meta" style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, lineHeight: 1.3 }}>زائر كريم</span>
                <span style={{ display: 'block', fontSize: 10.5, color: t.colors.muted }}>حساب مميز ★</span>
              </span>
            )}
          </div>
        ) : null}
      </aside>
    </Comp>
  );
}

/* ============================================================
   شريط التبويب السفلي
   ============================================================ */
function Bottombar({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const items: ListItem[] = p.items || [];
  const activeIdx = ctx.ui[`bb-${node.id}`] ?? items.findIndex((i) => i.active);
  const glass = t.glass;
  return (
    <Comp node={node} ctx={ctx} className={ctx.mode === 'static' ? 'tpl-fixed-bottom' : ''} style={{ marginTop: 'auto' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: 4, padding: '8px 12px',
        background: glass ? rgba(t.colors.surface, 0.8) : t.colors.surface,
        backdropFilter: glass ? 'blur(16px)' : undefined, WebkitBackdropFilter: glass ? 'blur(16px)' : undefined,
        borderTop: p.floating ? 'none' : `1px solid ${t.colors.border}`,
        borderRadius: p.floating ? 999 : 0,
        margin: p.floating ? '10px 14px 14px' : 0,
        boxShadow: p.floating ? shadowCss(t, 'lg') : undefined,
      }}>
        {items.map((it, i) => {
          const act = i === activeIdx;
          return (
            <button key={it.id} data-bottom-item={i} data-active-pill={p.activeStyle === 'pill' ? '1' : '0'}
              className={`tpl-nav-item${act ? ' bb-on' : ''}`}
              onClick={ctx.mode === 'preview' ? () => ctx.set(`bb-${node.id}`, i) : undefined}
              style={{
                flexDirection: 'column', gap: 3, border: 'none', background: act && p.activeStyle === 'pill' ? rgba(t.colors.primary, 0.12) : 'transparent',
                padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                color: act ? t.colors.primary : t.colors.muted, position: 'relative',
              }}>
              <Ico n={it.icon} s={21} w={act ? 2.6 : 2} />
              {p.showLabels ? <span style={{ fontSize: 10, fontWeight: 800 }}>{it.label}</span> : null}
              {it.badge ? <span style={{ position: 'absolute', top: 2, insetInlineEnd: 8, minWidth: 15, height: 15, padding: '0 4px', borderRadius: 9, background: t.colors.accent, color: readableOn(t.colors.accent), fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.badge}</span> : null}
            </button>
          );
        })}
      </div>
    </Comp>
  );
}

/* ============================================================
   الهيرو
   ============================================================ */
const PATTERNS: Record<string, string> = {
  none: '',
  dots: 'radial-gradient(rgba(255,255,255,.16) 1.4px, transparent 1.4px)',
  grid: 'linear-gradient(rgba(255,255,255,.09) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.09) 1px, transparent 1px)',
  waves: 'radial-gradient(600px 200px at 20% 20%, rgba(255,255,255,.14), transparent),radial-gradient(500px 240px at 85% 75%, rgba(255,255,255,.12), transparent)',
};

function Hero({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const grad = p.bgStyle === 'gradient' || node.style.gradient;
  const fg = grad ? readableOn(t.colors.primary) : t.colors.text;
  const muted = grad ? rgba(readableOn(t.colors.primary), 0.82) : t.colors.muted;
  const al = p.align === 'center' ? 'center' : p.align === 'end' ? 'flex-end' : 'flex-start';
  const pattern = PATTERNS[p.pattern] || '';
  return (
    <Comp node={node} ctx={ctx}>
      <section style={{
        minHeight: p.minHeight || 380, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: al,
        gap: 16, textAlign: p.align, padding: `${ctx.device === 'mobile' ? 34 : 56}px ${ctx.device === 'mobile' ? 18 : 40}px`,
        borderRadius: nodeRadius(node.style, t), overflow: 'hidden', position: 'relative',
        background: grad ? `linear-gradient(135deg, ${t.colors.primary} 0%, ${t.colors.secondary} 100%)` : (node.style.bg || t.colors.surface),
        boxShadow: node.style.shadow === 'none' ? 'none' : shadowCss(t, node.style.shadow),
        opacity: (node.style.opacity ?? 100) / 100,
      }}>
        {grad && pattern ? <span style={{ position: 'absolute', inset: 0, backgroundImage: pattern, backgroundSize: p.pattern === 'grid' ? '34px 34px' : '22px 22px' }} /> : null}
        <span style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: al, gap: 16, maxWidth: 720, width: '100%' }}>
          {p.badge ? (
            <span className="tpl-chip" style={{
              fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 999,
              background: grad ? rgba('#fff', 0.18) : rgba(t.colors.primary, 0.1), color: grad ? '#fff' : t.colors.primary,
              backdropFilter: grad ? 'blur(6px)' : undefined,
            }}>{p.badge}</span>
          ) : null}
          <h1 style={{ fontSize: ctx.device === 'mobile' ? 27 : 42, fontWeight: 900, lineHeight: 1.22, color: fg }}>{p.title}</h1>
          <p style={{ fontSize: ctx.device === 'mobile' ? 14 : 16, color: muted, lineHeight: 1.8, maxWidth: 620 }}>{p.subtitle}</p>
          <span style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
            {p.cta1?.show ? <Btn ctx={ctx} label={p.cta1.label} icon={p.cta1.icon} size="lg" onLight={grad} /> : null}
            {p.cta2?.show ? <Btn ctx={ctx} label={p.cta2.label} icon={p.cta2.icon} size="lg" variant={grad ? 'outline' : 'soft'} style={grad ? { color: '#fff', border: '2px solid rgba(255,255,255,.65)' } : undefined} /> : null}
          </span>
        </span>
      </section>
    </Comp>
  );
}

/* ============================================================
   الإحصائيات
   ============================================================ */
function Stats({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const items: ListItem[] = p.items || [];
  const c = gridCols(node, ctx, 4);
  return (
    <Comp node={node} ctx={ctx}>
      <div className="tpl-grid" data-cols={c} style={{ gridTemplateColumns: `repeat(${c},1fr)`, gap: 16 }}>
        {items.map((it, i) => (
          <div key={it.id} className="hover-lift" style={{
            ...surfaceStyle(node, t), padding: Math.max(14, pad(node.style, t) - 4),
            display: 'flex', flexDirection: 'column', gap: 8,
            background: p.cardStyle === 'glass' ? rgba(t.colors.surface, 0.6) : p.cardStyle === 'outlined' ? 'transparent' : (node.style.bg || t.colors.surface),
            border: p.cardStyle === 'outlined' ? `1px solid ${t.colors.border}` : node.style.border && node.style.border !== 'none' ? `1px solid ${t.colors.border}` : undefined,
            backdropFilter: p.cardStyle === 'glass' ? 'blur(12px)' : undefined,
            animationDelay: `${i * 60}ms`,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {p.showIcons !== false ? <IconTile icon={it.icon} size={42} ctx={ctx} /> : null}
              {it.badge ? <Badge text={it.badge} ctx={ctx} color={t.colors.accent} /> : null}
            </span>
            <span style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.1, color: node.style.color || t.colors.text }}>{it.value}</span>
            <span style={{ fontSize: 12.5, color: t.colors.muted, fontWeight: 600 }}>{it.label}</span>
            {it.desc ? <span style={{ fontSize: 11, fontWeight: 700, color: t.colors.primary }}>{it.desc}</span> : null}
          </div>
        ))}
      </div>
    </Comp>
  );
}

/* ============================================================
   البطاقات
   ============================================================ */
function Cards({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const items: ListItem[] = p.items || [];
  const c = gridCols(node, ctx, 3);
  const hoverCls = p.hoverEffect === 'grow' ? 'hover-grow' : p.hoverEffect === 'glow' ? 'hover-glow' : 'hover-lift';
  const grads = [
    `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})`,
    `linear-gradient(135deg, ${t.colors.secondary}, ${t.colors.accent})`,
    `linear-gradient(135deg, ${t.colors.accent}, ${t.colors.primary})`,
  ];
  return (
    <Comp node={node} ctx={ctx}>
      <div className="tpl-grid" data-cols={c} style={{ gridTemplateColumns: `repeat(${c},1fr)`, gap: 18 }}>
        {items.map((it, i) => (
          <article key={it.id} className={hoverCls} style={{ ...surfaceStyle(node, t), padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {p.showThumb !== false ? (
              <div style={{ height: 118, background: grads[i % 3], display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundImage: PATTERNS.dots, backgroundSize: '20px 20px', backgroundColor: t.colors.primary }}>
                <span style={{ color: '#fff', opacity: 0.92 }}><Ico n={it.icon || 'Sparkles'} s={38} w={1.8} /></span>
                {it.badge ? <span style={{ position: 'absolute', top: 10, insetInlineStart: 10 }}><Badge text={it.badge} ctx={ctx} color="#ffffff" /></span> : null}
              </div>
            ) : null}
            <div style={{ padding: Math.max(14, pad(node.style, t)), display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                {p.showThumb === false ? <IconTile icon={it.icon} size={38} ctx={ctx} /> : null}
                <h3 style={{ fontSize: 15.5, fontWeight: 800, color: node.style.color || t.colors.text }}>{it.label}</h3>
              </span>
              <p style={{ fontSize: 12.8, color: t.colors.muted, lineHeight: 1.75, flex: 1 }}>{it.desc}</p>
              {p.showAction !== false ? (
                <span className="tpl-link" style={{ fontSize: 12.5, fontWeight: 800, color: t.colors.primary, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {p.actionLabel || 'اعرف المزيد'} <Ico n="ArrowLeft" s={14} w={2.6} />
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </Comp>
  );
}

/* ============================================================
   النموذج والحقول
   ============================================================ */
function Field({ f, node, ctx }: { f: FieldDef; node: CompNode; ctx: RenderCtx }) {
  const t = ctx.t;
  const shape = f.radiusStyle && f.radiusStyle !== 'theme' ? f.radiusStyle : t.inputShape;
  const r = t.inputStyle === 'underlined' ? 0 : radiusFor(shape, Math.min(t.radius, 14));
  const base: CSSProperties = t.inputStyle === 'filled'
    ? { background: t.colors.surface2, border: '1.5px solid transparent' }
    : t.inputStyle === 'underlined'
      ? { background: 'transparent', border: 'none', borderBottom: `2px solid ${t.colors.border}`, borderRadius: 0, paddingInline: 4 }
      : { background: node.style.bg ? rgba('#ffffff', 0) : t.colors.surface, border: `1.5px solid ${t.colors.border}` };
  const inputStyle: CSSProperties = {
    ...base, borderRadius: r, padding: f.icon ? '11px 14px 11px 40px' : '11px 14px',
    fontSize: 13.5, fontFamily: 'inherit',
  };
  if (f.icon && t.inputStyle !== 'underlined') inputStyle.paddingInlineStart = 40;
  if (f.icon && t.inputStyle === 'underlined') inputStyle.paddingInlineStart = 30;
  const label = f.label + (f.required ? ' *' : '');
  const pos = node.props.labelPosition || 'top';

  const control = () => {
    const ico = f.icon ? <span style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: t.colors.muted, pointerEvents: 'none' }}><Ico n={f.icon} s={16} /></span> : null;
    switch (f.kind) {
      case 'textarea':
        return <textarea className="tpl-input" rows={4} placeholder={f.placeholder || ''} style={{ ...inputStyle, paddingInlineStart: f.icon ? 40 : 14, resize: 'vertical' }} defaultValue="" />;
      case 'select':
        return (
          <span style={{ position: 'relative', display: 'block' }}>
            {ico}
            <select className="tpl-input tpl-select" style={inputStyle} defaultValue={(f.options || [])[0] || ''}>
              {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </span>
        );
      case 'checkbox':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: t.colors.muted, cursor: 'pointer', fontWeight: 600 }}>
            <input type="checkbox" style={{ width: 17, height: 17, accentColor: t.colors.primary, borderRadius: 4 }} />
            {f.label}
          </label>
        );
      case 'switch': {
        const on = !!ctx.ui[`sw-${f.id}`];
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button data-switch={f.id} onClick={ctx.mode === 'preview' ? () => ctx.set(`sw-${f.id}`, !on) : undefined}
              style={{
                width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative', padding: 0,
                background: on ? t.colors.primary : t.colors.border, transition: 'background .2s',
              }}>
              <span className="sw-knob" style={{ position: 'absolute', top: 3, insetInlineStart: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'inset-inline-start .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: t.colors.text }}>{f.label}</span>
          </span>
        );
      }
      default:
        return (
          <span style={{ position: 'relative', display: 'block' }}>
            {ico}
            <input className="tpl-input" type={f.kind} placeholder={f.placeholder || ''} style={inputStyle} />
          </span>
        );
    }
  };

  if (f.kind === 'checkbox' || f.kind === 'switch') return <div key={f.id}>{control()}</div>;

  if (pos === 'inline') {
    return (
      <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: t.colors.text, width: 110, flexShrink: 0, textAlign: 'start' }}>{label}</label>
        <span style={{ flex: 1 }}>{control()}</span>
      </div>
    );
  }
  if (pos === 'float') {
    return (
      <div key={f.id} style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', top: 5, insetInlineStart: f.icon ? 40 : 14, fontSize: 9.5, fontWeight: 800, color: t.colors.muted, zIndex: 1, pointerEvents: 'none' }}>{label}</span>
        <span style={{ display: 'block', paddingTop: 8 }}>{control()}</span>
      </div>
    );
  }
  return (
    <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 800, color: t.colors.text }}>{label}</label>
      {control()}
    </div>
  );
}

function Form({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const fields: FieldDef[] = p.fields || [];
  const c = ctx.device === 'mobile' ? 1 : Math.min(2, p.columns || 1);
  const inner = (
    <>
      {p.showTitle !== false && (p.title || p.subtitle) ? (
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          {p.title ? <h3 style={{ fontSize: 20, fontWeight: 900, color: node.style.color || t.colors.text }}>{p.title}</h3> : null}
          {p.subtitle ? <p style={{ fontSize: 13, color: t.colors.muted, marginTop: 5 }}>{p.subtitle}</p> : null}
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${c},1fr)`, gap: 16 }}>
        {fields.map((f) => <Field key={f.id} f={f} node={node} ctx={ctx} />)}
      </div>
      <div style={{ marginTop: 20 }}>
        <Btn ctx={ctx} label={p.submitLabel || 'إرسال'} icon={p.submitIcon} size="lg" full style={ctx.mode === 'static' ? undefined : undefined} />
      </div>
    </>
  );
  return (
    <Comp node={node} ctx={ctx}>
      {ctx.mode === 'static' ? (
        <form data-form style={{ ...surfaceStyle(node, t), maxWidth: p.columns > 1 ? 780 : 520, margin: '0 auto', width: '100%' }}>
          {inner}
        </form>
      ) : (
        <div style={{ ...surfaceStyle(node, t), maxWidth: p.columns > 1 ? 780 : 520, margin: '0 auto', width: '100%' }}>
          {inner}
        </div>
      )}
    </Comp>
  );
}

/* ============================================================
   الجدول
   ============================================================ */
function statusColor(s: string, t: ThemeCfg): string {
  if (/مكتمل|ناجح|done|success|مفعل/i.test(s)) return '#10b981';
  if (/قيد|pending|progress|معالجة/i.test(s)) return '#f59e0b';
  if (/معلق|ملغي|fail|مرفوض|cancelled/i.test(s)) return '#ef4444';
  return t.colors.primary;
}

function Table({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const colsArr: string[] = p.columns || [];
  const rows: string[][] = p.rows || [];
  return (
    <Comp node={node} ctx={ctx}>
      <div style={{ ...surfaceStyle(node, t), padding: 0, overflow: 'hidden' }}>
        {p.showTitle !== false && p.title ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: node.style.color || t.colors.text }}>{p.title}</h3>
            <span className="tpl-link" style={{ fontSize: 12, fontWeight: 800, color: t.colors.primary, display: 'inline-flex', gap: 4, alignItems: 'center' }}>عرض الكل <Ico n="ArrowLeft" s={13} w={2.6} /></span>
          </div>
        ) : null}
        <div className="tpl-scroll-x">
          <table style={{ minWidth: 560 }}>
            {p.showHeader !== false ? (
              <thead>
                <tr style={{ background: t.colors.surface2 }}>
                  {colsArr.map((c, i) => <th key={i} style={{ padding: '10px 18px', fontSize: 11.5, fontWeight: 800, color: t.colors.muted, textAlign: 'start', whiteSpace: 'nowrap' }}>{c}</th>)}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="tpl-row" style={{ background: p.striped !== false && ri % 2 === 1 ? rgba(t.colors.surface2, 0.55) : 'transparent', borderTop: `1px solid ${t.colors.border}` }}>
                  {r.map((cell, ci) => (
                    <td key={ci} style={{ padding: '11px 18px', fontSize: 12.8, fontWeight: ci === 0 ? 700 : 500, color: t.colors.text, whiteSpace: 'nowrap' }}>
                      {colsArr[ci] === 'الحالة' ? (
                        <span className="tpl-chip" style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: rgba(statusColor(cell, t), 0.13), color: statusColor(cell, t), fontWeight: 700 }}>{cell}</span>
                      ) : ci === 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={cell} size={26} ctx={ctx} />{cell}
                        </span>
                      ) : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Comp>
  );
}

/* ============================================================
   التبويبات
   ============================================================ */
function Tabs({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const items: ListItem[] = p.items || [];
  const act = ctx.ui[`tabs-${node.id}`] ?? Math.max(0, items.findIndex((i) => i.active));
  const st = p.tabStyle || 'pill';
  const header = (
    <span data-tabs={node.id} data-tab-style={st} style={st === 'pill'
      ? { display: 'inline-flex', gap: 4, background: t.colors.surface2, padding: 4, borderRadius: 999 }
      : st === 'boxed'
        ? { display: 'inline-flex', gap: 8 }
        : { display: 'flex', gap: 22, borderBottom: `1px solid ${t.colors.border}` }}>
      {items.map((it, i) => {
        const on = i === act;
        const style: CSSProperties = {
          border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
          display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'all .2s',
          background: 'transparent', color: on ? t.colors.primary : t.colors.muted,
          padding: st === 'underline' ? '9px 2px' : '8px 16px',
          borderRadius: st === 'pill' ? 999 : st === 'boxed' ? radiusFor(t.radiusStyle, 10) : 0,
          boxShadow: st === 'pill' && on ? shadowCss(t, 'sm') : undefined,
          borderBottom: st === 'underline' && on ? `3px solid ${t.colors.primary}` : st === 'underline' ? '3px solid transparent' : undefined,
        };
        if (st === 'pill' && on) style.background = t.colors.surface;
        if (st === 'boxed' && on) style.background = rgba(t.colors.primary, 0.12);
        return (
          <button key={it.id} className={`tpl-tab${on ? ' tab-on' : ''}`} data-tab-index={i} style={style}
            onClick={ctx.mode === 'preview' ? () => ctx.set(`tabs-${node.id}`, i) : undefined}>
            <Ico n={it.icon} s={15} />{it.label}
          </button>
        );
      })}
    </span>
  );
  const Panel = ({ it, i }: { it: ListItem; i: number }) => (
    <div data-tab-panel={i} style={{ ...surfaceStyle(node, t), width: '100%', minHeight: 92, display: i === act ? undefined : 'none' }}>
      <h4 style={{ fontSize: 15, fontWeight: 800, color: node.style.color || t.colors.text, marginBottom: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Ico n={it.icon} s={17} c={t.colors.primary} />{it.label}
      </h4>
      <p style={{ fontSize: 13, color: t.colors.muted, lineHeight: 1.8 }}>{it.desc}</p>
    </div>
  );
  return (
    <Comp node={node} ctx={ctx}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: p.fullWidth ? 'stretch' : 'flex-start' }}>
        {header}
        {ctx.mode === 'static'
          ? items.map((it, i) => <Panel key={it.id} it={it} i={i} />)
          : <Panel it={items[act] || items[0]} i={act} />}
      </div>
    </Comp>
  );
}

/* ============================================================
   الباقات
   ============================================================ */
function Pricing({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const plans: PlanDef[] = p.plans || [];
  const c = gridCols(node, ctx, 3);
  return (
    <Comp node={node} ctx={ctx}>
      {p.showTitle !== false ? <SectionTitle title={p.title} sub={p.subtitle} align="center" ctx={ctx} /> : null}
      <div className="tpl-grid" data-cols={c} style={{ gridTemplateColumns: `repeat(${c},1fr)`, gap: 18, alignItems: 'stretch' }}>
        {plans.map((pl) => (
          <div key={pl.id} className="hover-lift" style={{
            ...surfaceStyle(node, t), display: 'flex', flexDirection: 'column', gap: 14, position: 'relative',
            border: pl.featured ? `2px solid ${t.colors.primary}` : node.style.border && node.style.border !== 'none' ? `1px solid ${t.colors.border}` : `1px solid ${t.colors.border}`,
            boxShadow: pl.featured ? shadowCss(t, 'lg') : surfaceStyle(node, t).boxShadow,
            background: pl.featured ? mix(t.colors.surface, t.colors.primary, t.mode === 'dark' ? 0.09 : 0.045) : surfaceStyle(node, t).background,
          }}>
            {pl.featured ? <span style={{ position: 'absolute', top: -12, insetInlineStart: '50%', transform: 'translateX(-50%)' }}><Badge text="★ الأكثر طلباً" ctx={ctx} /></span> : null}
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconTile icon={pl.icon || 'Package'} size={42} ctx={ctx} />
              <span style={{ fontSize: 15, fontWeight: 900, color: node.style.color || t.colors.text }}>{pl.name}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: t.colors.primary }}>$</span>
              <span style={{ fontSize: 34, fontWeight: 900, lineHeight: 1, color: node.style.color || t.colors.text }}>{pl.price}</span>
              <span style={{ fontSize: 12, color: t.colors.muted, fontWeight: 600 }}>/ {pl.period}</span>
            </span>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
              {(pl.features || []).map((f) => (
                <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.8, color: t.colors.muted, fontWeight: 600 }}>
                  <Ico n="CircleCheck" s={16} c={pl.featured ? t.colors.primary : t.colors.accent} w={2.4} />{f}
                </li>
              ))}
            </ul>
            <Btn ctx={ctx} label={pl.cta || 'اختر الباقة'} variant={pl.featured ? (t.buttonStyle === 'outline' ? 'solid' : undefined) : 'outline'} full size="md" />
          </div>
        ))}
      </div>
    </Comp>
  );
}

/* ============================================================
   آراء العملاء
   ============================================================ */
function Testimonials({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const items: ListItem[] = p.items || [];
  const c = gridCols(node, ctx, 3);
  return (
    <Comp node={node} ctx={ctx}>
      {p.showTitle !== false ? <SectionTitle title={p.title} align="center" ctx={ctx} /> : null}
      <div className="tpl-grid" data-cols={c} style={{ gridTemplateColumns: `repeat(${c},1fr)`, gap: 18 }}>
        {items.map((it) => {
          const rating = Math.max(1, Math.min(5, parseInt(it.badge || '5') || 5));
          if (p.style === 'quote') {
            return (
              <div key={it.id} style={{ textAlign: 'center', padding: 10, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: t.colors.primary, lineHeight: 0.6, fontFamily: 'serif' }}>"</span>
                <p style={{ fontSize: 13.5, color: t.colors.text, lineHeight: 1.9, fontStyle: 'italic' }}>{it.desc}</p>
                <span style={{ color: '#f59e0b', fontSize: 14, letterSpacing: 2 }}>{'★'.repeat(rating)}</span>
                <Avatar name={it.label} size={44} ctx={ctx} />
                <span style={{ fontSize: 13.5, fontWeight: 800 }}>{it.label}</span>
                <span style={{ fontSize: 11.5, color: t.colors.muted }}>{it.value}</span>
              </div>
            );
          }
          return (
            <div key={it.id} className="hover-lift" style={{ ...surfaceStyle(node, t), display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ color: '#f59e0b', fontSize: 14, letterSpacing: 2 }}>{'★'.repeat(rating)}<span style={{ color: t.colors.border }}>{'★'.repeat(5 - rating)}</span></span>
              <p style={{ fontSize: 13, color: t.colors.text, lineHeight: 1.85, flex: 1 }}>“{it.desc}”</p>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={it.label} size={40} ctx={ctx} />
                <span>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: node.style.color || t.colors.text }}>{it.label}</span>
                  <span style={{ display: 'block', fontSize: 11, color: t.colors.muted }}>{it.value}</span>
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </Comp>
  );
}

/* ============================================================
   المعرض
   ============================================================ */
function Gallery({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const items: ListItem[] = p.items || [];
  const c = gridCols(node, ctx, 3);
  const aspect = p.aspect === '4-3' ? '4/3' : p.aspect === '16-9' ? '16/9' : '1/1';
  return (
    <Comp node={node} ctx={ctx}>
      {p.showTitle !== false ? <SectionTitle title={p.title} ctx={ctx} /> : null}
      <div className="tpl-grid" data-cols={c} style={{ gridTemplateColumns: `repeat(${c},1fr)`, gap: 14 }}>
        {items.map((it, i) => {
          const g = [
            `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})`,
            `linear-gradient(135deg, ${mix(t.colors.primary, '#000000', 0.25)}, ${t.colors.accent})`,
            `linear-gradient(135deg, ${t.colors.secondary}, ${t.colors.accent})`,
          ][i % 3];
          return (
            <div key={it.id} className="hover-glow" style={{
              position: 'relative', aspectRatio: aspect, borderRadius: nodeRadius(node.style, t), overflow: 'hidden',
              background: g, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ position: 'absolute', inset: 0, backgroundImage: PATTERNS.dots, backgroundSize: '18px 18px' }} />
              <span className="hover-grow" style={{ color: '#fff', opacity: 0.9 }}><Ico n={it.icon || 'Image'} s={42} w={1.6} /></span>
              <span style={{
                position: 'absolute', bottom: 8, insetInlineStart: 8, fontSize: 11, fontWeight: 800, color: '#fff',
                background: rgba('#000000', 0.32), backdropFilter: 'blur(6px)', padding: '4px 10px', borderRadius: 999,
              }}>{it.label}</span>
            </div>
          );
        })}
      </div>
    </Comp>
  );
}

/* ============================================================
   القائمة
   ============================================================ */
function ListC({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const items: ListItem[] = p.items || [];
  const r = radiusFor(p.itemShape === 'pill' ? 'pill' : p.itemShape === 'sharp' ? 'sharp' : 'rounded', 10);
  return (
    <Comp node={node} ctx={ctx}>
      <div style={{ ...surfaceStyle(node, t), padding: p.showTitle !== false && p.title ? '16px 12px 10px' : 8 }}>
        {p.showTitle !== false && p.title ? <h3 style={{ fontSize: 16, fontWeight: 800, color: node.style.color || t.colors.text, padding: '0 8px 10px' }}>{p.title}</h3> : null}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((it, i) => (
            <div key={it.id} className="tpl-nav-item" style={{
              padding: '11px 10px', gap: 12, borderRadius: r,
              borderBottom: p.divided !== false && i < items.length - 1 ? `1px solid ${t.colors.border}` : 'none',
            }}>
              {p.showIcons !== false ? <IconTile icon={it.icon} size={38} ctx={ctx} /> : null}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: t.colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</span>
                {it.desc ? <span style={{ display: 'block', fontSize: 11.5, color: t.colors.muted, marginTop: 2 }}>{it.desc}</span> : null}
              </span>
              {p.showBadges !== false && it.badge ? <Badge text={it.badge} ctx={ctx} color={t.colors.secondary} /> : null}
              <Ico n="ChevronLeft" s={16} c={t.colors.muted} />
            </div>
          ))}
        </div>
      </div>
    </Comp>
  );
}

/* ============================================================
   CTA
   ============================================================ */
function Cta({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const grad = p.bgStyle === 'gradient';
  const fg = grad ? readableOn(t.colors.primary) : t.colors.text;
  return (
    <Comp node={node} ctx={ctx}>
      <section style={{
        ...surfaceStyle(node, t), textAlign: 'center', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 12, padding: `${ctx.device === 'mobile' ? 30 : 44}px 24px`, position: 'relative', overflow: 'hidden',
        background: grad ? `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})` : surfaceStyle(node, t).background,
        color: grad ? fg : undefined,
      }}>
        {grad ? <span style={{ position: 'absolute', inset: 0, backgroundImage: PATTERNS.dots, backgroundSize: '20px 20px' }} /> : null}
        <h2 style={{ fontSize: ctx.device === 'mobile' ? 20 : 26, fontWeight: 900, position: 'relative', color: grad ? fg : node.style.color || t.colors.text }}>{p.title}</h2>
        <p style={{ fontSize: 13.5, position: 'relative', color: grad ? rgba(fg, 0.85) : t.colors.muted, maxWidth: 520 }}>{p.subtitle}</p>
        <span style={{ display: 'flex', gap: 10, position: 'relative', marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {p.button?.show !== false ? <Btn ctx={ctx} label={p.button?.label} icon={p.button?.icon} size="lg" onLight={grad} /> : null}
          {p.secondary?.show ? <Btn ctx={ctx} label={p.secondary.label} icon={p.secondary.icon} size="lg" variant="outline" style={grad ? { color: '#fff', border: '2px solid rgba(255,255,255,.6)' } : undefined} /> : null}
        </span>
      </section>
    </Comp>
  );
}

/* ============================================================
   التذييل
   ============================================================ */
function Footer({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const fcols: { id: string; label: string; items: string[] }[] = p.columns || [];
  return (
    <Comp node={node} ctx={ctx}>
      <footer style={{ background: t.mode === 'dark' ? mix(t.colors.bg, '#000000', 0.35) : t.colors.surface2, marginTop: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: ctx.device === 'mobile' ? '1fr' : `1.4fr repeat(${Math.max(1, fcols.length)},1fr)`, gap: 26, padding: '34px 24px 22px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 900, fontSize: 16 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34,
                borderRadius: radiusFor(t.radiusStyle, t.radius) * 0.8 || 8,
                background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})`, color: readableOn(t.colors.primary),
              }}><Ico n={p.brandIcon} s={17} /></span>
              {p.brand}
            </span>
            <p style={{ fontSize: 12.5, color: t.colors.muted, lineHeight: 1.8, maxWidth: 280 }}>{p.about}</p>
            {p.showSocials !== false ? (
              <span style={{ display: 'flex', gap: 8 }}>
                {(p.socials || []).map((s: ListItem) => (
                  <button key={s.id} className="tpl-iconbtn" title={s.label} style={{ width: 34, height: 34, background: t.colors.surface, border: `1px solid ${t.colors.border}`, borderRadius: 999 }}>
                    <Ico n={s.icon} s={15} />
                  </button>
                ))}
              </span>
            ) : null}
          </div>
          {p.showColumns !== false ? fcols.map((col) => (
            <div key={col.id}>
              <h4 style={{ fontSize: 13.5, fontWeight: 900, marginBottom: 12, color: t.colors.text }}>{col.label}</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(col.items || []).map((it) => (
                  <li key={it}><span className="tpl-link" style={{ fontSize: 12.5, color: t.colors.muted }}>{it}</span></li>
                ))}
              </ul>
            </div>
          )) : null}
        </div>
        <div style={{ borderTop: `1px solid ${t.colors.border}`, padding: '14px 24px', textAlign: 'center', fontSize: 11.5, color: t.colors.muted }}>
          {p.copyright}
        </div>
      </footer>
    </Comp>
  );
}

/* ============================================================
   البحث
   ============================================================ */
function SearchBar({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const lg = p.size === 'lg';
  const r = radiusFor(t.inputShape, lg ? 18 : 12);
  return (
    <Comp node={node} ctx={ctx}>
      <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: lg ? '6px 6px 6px 18px' : '4px 4px 4px 14px',
          background: node.style.bg || t.colors.surface, border: `1.5px solid ${t.colors.border}`, borderRadius: r,
          boxShadow: shadowCss(t, 'sm'),
        }}>
          <Ico n="Search" s={lg ? 19 : 16} c={t.colors.muted} />
          <input className="tpl-input" placeholder={p.placeholder || 'ابحث…'} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: lg ? 14.5 : 13, padding: lg ? '10px 4px' : '8px 4px', boxShadow: 'none' }} />
          {p.showButton !== false ? <Btn ctx={ctx} label={p.buttonLabel || 'بحث'} icon={p.buttonIcon} size={lg ? 'md' : 'sm'} style={{ borderRadius: Math.max(6, r - 6) }} /> : null}
        </div>
        {p.showSuggestions !== false && (p.suggestions || []).length ? (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            {(p.suggestions as string[]).map((s) => (
              <span key={s} className="tpl-chip tpl-link" style={{ fontSize: 11.5, padding: '4px 12px', borderRadius: 999, background: t.colors.surface2, color: t.colors.muted, fontWeight: 600 }}>{s}</span>
            ))}
          </div>
        ) : null}
      </div>
    </Comp>
  );
}

/* ============================================================
   الملف الشخصي
   ============================================================ */
function Profile({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const centered = (p.layout || 'centered') === 'centered';
  return (
    <Comp node={node} ctx={ctx}>
      <div style={{ ...surfaceStyle(node, t), padding: 0, overflow: 'hidden', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <div style={{ height: 108, background: p.cover === 'gradient' ? `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})` : t.colors.surface2, position: 'relative' }}>
          <span style={{ position: 'absolute', inset: 0, backgroundImage: PATTERNS.dots, backgroundSize: '20px 20px' }} />
        </div>
        <div style={{ padding: '0 24px 24px', textAlign: centered ? 'center' : 'start', marginTop: -40, position: 'relative' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 84, height: 84, borderRadius: '50%',
            background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})`, color: readableOn(t.colors.primary),
            border: `4px solid ${t.colors.surface}`, fontSize: 26, fontWeight: 900, boxShadow: shadowCss(t, 'md'),
          }}>{initials(p.name)}</span>
          <h3 style={{ fontSize: 20, fontWeight: 900, marginTop: 10, color: node.style.color || t.colors.text }}>{p.name}</h3>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: t.colors.primary, marginTop: 2 }}>{p.role}</p>
          <p style={{ fontSize: 13, color: t.colors.muted, lineHeight: 1.8, marginTop: 10, maxWidth: 420, marginInline: centered ? 'auto' : undefined }}>{p.bio}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: centered ? 'center' : 'flex-start', marginTop: 16 }}>
            {(p.stats || []).map((s: ListItem) => (
              <div key={s.id} style={{ background: t.colors.surface2, borderRadius: radiusFor(t.radiusStyle, 12), padding: '10px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 17, fontWeight: 900, color: t.colors.text }}>{s.value}</div>
                <div style={{ fontSize: 10.5, color: t.colors.muted, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: centered ? 'center' : 'flex-start', marginTop: 18 }}>
            {(p.actions || []).map((a: ListItem, i: number) => (
              <Btn key={a.id} ctx={ctx} label={a.label} icon={a.icon} variant={i === 0 ? undefined : 'outline'} />
            ))}
          </div>
        </div>
      </div>
    </Comp>
  );
}

/* ============================================================
   التنبيه
   ============================================================ */
function Alert({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const closed = ctx.mode === 'preview' && ctx.ui[`alert-${node.id}`];
  if (closed) return null;
  const color = p.kind === 'success' ? '#10b981' : p.kind === 'warning' ? '#f59e0b' : p.kind === 'danger' ? '#ef4444' : t.colors.primary;
  return (
    <Comp node={node} ctx={ctx}>
      <div data-alert={node.id} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
        background: rgba(color, 0.1), border: `1px solid ${rgba(color, 0.35)}`,
        borderInlineStart: `4px solid ${color}`, borderRadius: nodeRadius(node.style, t),
      }}>
        {p.showIcon !== false ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', background: color, color: '#fff', flexShrink: 0 }}>
            <Ico n={p.icon || 'Info'} s={17} />
          </span>
        ) : null}
        <span style={{ flex: 1 }}>
          {p.title ? <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: t.colors.text }}>{p.title}</span> : null}
          <span style={{ display: 'block', fontSize: 12.5, color: t.colors.muted, fontWeight: 500 }}>{p.text}</span>
        </span>
        {p.closable ? (
          <button className="tpl-iconbtn" data-action="dismiss" style={{ width: 30, height: 30, color: t.colors.muted }}
            onClick={ctx.mode === 'preview' ? () => ctx.set(`alert-${node.id}`, true) : undefined}>
            <Ico n="X" s={15} />
          </button>
        ) : null}
      </div>
    </Comp>
  );
}

/* ============================================================
   الأزرار
   ============================================================ */
function Buttons({ node, ctx }: P) {
  const p = node.props;
  const items: ListItem[] = p.items || [];
  return (
    <Comp node={node} ctx={ctx}>
      <div style={{ display: 'flex', flexDirection: p.row === false ? 'column' : 'row', flexWrap: 'wrap', gap: 12, alignItems: p.row === false ? 'flex-start' : 'center' }}>
        {items.map((it) => (
          <Btn key={it.id} ctx={ctx} label={it.label} icon={it.icon} variant={it.badge && ['solid', 'outline', 'soft', 'gradient'].includes(it.badge) ? it.badge : undefined} size={p.size || 'md'} shape={p.shape} />
        ))}
      </div>
    </Comp>
  );
}

/* ============================================================
   النص
   ============================================================ */
function TextC({ node, ctx }: P) {
  const t = ctx.t;
  const p = node.props;
  const size = p.headingSize === 'xl' ? 34 : p.headingSize === 'lg' ? 26 : p.headingSize === 'sm' ? 17 : 21;
  return (
    <Comp node={node} ctx={ctx}>
      <div style={{ ...surfaceStyle(node, t), textAlign: p.align || 'start', background: node.style.bg ? surfaceStyle(node, t).background : 'transparent', boxShadow: node.style.bg ? surfaceStyle(node, t).boxShadow : 'none', border: node.style.bg ? surfaceStyle(node, t).border : 'none' }}>
        {p.showHeading !== false && p.heading ? <h2 style={{ fontSize: ctx.device === 'mobile' ? size * 0.78 : size, fontWeight: 900, color: node.style.color || t.colors.text, marginBottom: 10, lineHeight: 1.3 }}>{p.heading}</h2> : null}
        <p style={{ fontSize: 14, color: t.colors.muted, lineHeight: 2, columnCount: p.twoColumns && ctx.device === 'desktop' ? 2 : 1, columnGap: 34 }}>{p.body}</p>
      </div>
    </Comp>
  );
}

/* ============================================================
   الموجّه الرئيسي
   ============================================================ */
export function RenderComp({ node, ctx }: P) {
  switch (node.type) {
    case 'topbar': return <Topbar node={node} ctx={ctx} />;
    case 'sidebar': return <Sidebar node={node} ctx={ctx} />;
    case 'bottombar': return <Bottombar node={node} ctx={ctx} />;
    case 'hero': return <Hero node={node} ctx={ctx} />;
    case 'stats': return <Stats node={node} ctx={ctx} />;
    case 'cards': return <Cards node={node} ctx={ctx} />;
    case 'form': return <Form node={node} ctx={ctx} />;
    case 'table': return <Table node={node} ctx={ctx} />;
    case 'tabs': return <Tabs node={node} ctx={ctx} />;
    case 'pricing': return <Pricing node={node} ctx={ctx} />;
    case 'testimonials': return <Testimonials node={node} ctx={ctx} />;
    case 'gallery': return <Gallery node={node} ctx={ctx} />;
    case 'list': return <ListC node={node} ctx={ctx} />;
    case 'cta': return <Cta node={node} ctx={ctx} />;
    case 'footer': return <Footer node={node} ctx={ctx} />;
    case 'search': return <SearchBar node={node} ctx={ctx} />;
    case 'profile': return <Profile node={node} ctx={ctx} />;
    case 'alert': return <Alert node={node} ctx={ctx} />;
    case 'buttons': return <Buttons node={node} ctx={ctx} />;
    case 'text': return <TextC node={node} ctx={ctx} />;
    default: return null;
  }
}

export function TemplateRenderer({ doc, mode = 'static', device = 'desktop', selectedId = null, onSelect, children, onDropSection, replayKey = 0 }: {
  doc: TemplateDoc;
  mode?: 'edit' | 'preview' | 'static';
  device?: 'desktop' | 'tablet' | 'mobile';
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  children?: ReactNode;
  onDropSection?: (index: number, data?: string) => void;
  replayKey?: number;
}) {
  const [ui, setUi] = useState<Record<string, any>>({});
  const ctx: RenderCtx = {
    t: doc.theme, mode, device, selectedId, onSelect, replayKey,
    ui, set: (k, v) => setUi((s) => ({ ...s, [k]: v })),
  };
  const { layout, theme } = doc;
  const rtl = theme.rtl;
  const showSb = layout.sidebar && !layout.sidebar.hidden;
  const sbLeft = showSb && layout.sidebar!.props.position === 'left';
  const domFirst = (rtl && !sbLeft) || (!rtl && sbLeft);
  const gap = Math.round(20 * DENSITY[theme.density]);
  const mainPad = device === 'mobile' ? '14px 12px' : `${gap}px ${Math.round(24 * DENSITY[theme.density])}px`;
  const sidebarEl = showSb ? <RenderComp key={`sb-${replayKey}`} node={layout.sidebar!} ctx={ctx} /> : null;

  const Slot = ({ i }: { i: number }) =>
    mode === 'edit' && onDropSection ? (
      <div className="drop-slot" data-slot={i}
        onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('hot'); }}
        onDragLeave={(e) => (e.currentTarget as HTMLElement).classList.remove('hot')}
        onDrop={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.remove('hot'); onDropSection(i, e.dataTransfer.getData('text/plain')); }} />
    ) : null;

  return (
    <div className={`tpl-root${theme.mode === 'dark' ? ' tpl-dark' : ''}`} data-mode={theme.mode} style={{
      minHeight: '100%', display: 'flex', flexDirection: 'column',
      ...varsStyle(theme),
      direction: theme.rtl ? 'rtl' : 'ltr',
      fontFamily: `var(--font-main)`,
      fontSize: 15, lineHeight: 1.65,
      color: theme.colors.text,
      background: theme.gradientBg
        ? `linear-gradient(180deg, ${rgba(theme.colors.primary, theme.mode === 'dark' ? 0.14 : 0.07)} 0%, ${theme.colors.bg} 420px), ${theme.colors.bg}`
        : theme.colors.bg,
    }}>
      {layout.topbar && !layout.topbar.hidden ? <RenderComp key={`tb-${replayKey}`} node={layout.topbar} ctx={ctx} /> : null}
      <div style={{ display: 'flex', flex: 1, alignItems: 'stretch', minWidth: 0 }}>
        {domFirst ? sidebarEl : null}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap, padding: mainPad }}
          onClick={mode === 'edit' ? () => onSelect?.('') : undefined}>
          {layout.sections.map((n, i) => (
            <div key={n.id} style={{ display: 'contents' }}>
              <Slot i={i} />
              <RenderComp key={`${n.id}-${replayKey}`} node={n} ctx={ctx} />
            </div>
          ))}
          <Slot i={layout.sections.length} />
          {children}
        </main>
        {!domFirst ? sidebarEl : null}
      </div>
      {layout.bottombar && !layout.bottombar.hidden ? <RenderComp key={`bb-${replayKey}`} node={layout.bottombar} ctx={ctx} /> : null}
    </div>
  );
}
