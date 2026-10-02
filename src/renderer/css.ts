import type { ThemeCfg } from '../lib/types';
import { themeVars, rgba, readableOn } from '../lib/theme';
import { animRuntimeCss } from '../lib/anim';

/* ============================================================
   CSS الكامل للقالب — يُحقن في المعاينة ويُضمّن في التصدير
   ============================================================ */

export function templateCss(t: ThemeCfg, opts?: { forExport?: boolean }): string {
  const vars = Object.entries(themeVars(t))
    .map(([k, v]) => `${k}:${v};`)
    .join('');
  const dark = t.mode === 'dark';

  return `
/* ===== ستوديو القوالب — ثيم: ${t.name} ===== */
.tpl-root{${vars}
  direction:${t.rtl ? 'rtl' : 'ltr'};
  font-family:var(--font-main);
  background:${t.gradientBg
    ? `linear-gradient(180deg, ${rgba(t.colors.primary, dark ? 0.14 : 0.07)} 0%, ${t.colors.bg} 420px), ${t.colors.bg}`
    : t.colors.bg};
  color:var(--c-text);
  min-height:100%;
  font-size:15px;
  line-height:1.65;
}
.tpl-root *{box-sizing:border-box}
.tpl-root h1,.tpl-root h2,.tpl-root h3,.tpl-root h4,.tpl-root p,.tpl-root ul,.tpl-root ol{margin:0;padding:0}
.tpl-root ul{list-style:none}
.tpl-root table{border-collapse:collapse;width:100%}
.tpl-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;
  font-family:inherit;font-weight:700;transition:transform .2s cubic-bezier(.34,1.56,.64,1),filter .2s,box-shadow .25s;
  text-decoration:none;white-space:nowrap}
.tpl-btn:hover{filter:brightness(1.09);transform:translateY(-2px)}
.tpl-btn:active{transform:translateY(0) scale(.97)}
.tpl-chip{display:inline-flex;align-items:center;gap:6px;font-weight:600}
.tpl-nav-item{display:flex;align-items:center;gap:10px;cursor:pointer;text-decoration:none;
  transition:background .2s,color .2s,transform .2s;color:inherit}
.tpl-input{font-family:inherit;width:100%;transition:border-color .2s,box-shadow .2s,background .2s;color:var(--c-text)}
.tpl-input::placeholder{color:var(--c-muted);opacity:.75}
.tpl-input:focus{outline:none;border-color:var(--c-primary)!important;box-shadow:0 0 0 3px var(--c-primary-mid)}
.tpl-grid{display:grid;gap:18px}
@media(max-width:860px){.tpl-grid[data-cols="3"],.tpl-grid[data-cols="4"]{grid-template-columns:repeat(2,1fr)!important}}
@media(max-width:560px){.tpl-grid{grid-template-columns:1fr!important}.tpl-grid[data-cols="4"]{grid-template-columns:repeat(2,1fr)!important}}
.tpl-link{color:inherit;text-decoration:none;cursor:pointer;transition:color .2s,opacity .2s}
.tpl-link:hover{color:var(--c-primary)}
.tpl-iconbtn{display:inline-flex;align-items:center;justify-content:center;cursor:pointer;border:none;
  background:transparent;color:inherit;transition:background .2s,color .2s,transform .2s;border-radius:10px}
.tpl-iconbtn:hover{background:var(--c-primary-soft);color:var(--c-primary)}
.tpl-divider{border-top:1px solid var(--c-border)}
.tpl-select{appearance:none;-webkit-appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${encodeURIComponent(t.colors.muted)}" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>');background-repeat:no-repeat;background-position:left 12px center;padding-left:34px!important}
.tpl-root[dir="ltr"] .tpl-select{background-position:right 12px center;padding-left:12px!important;padding-right:34px!important}
.tpl-scroll-x{overflow-x:auto;scrollbar-width:thin}
.tpl-scroll-x::-webkit-scrollbar{height:4px}
.tpl-scroll-x::-webkit-scrollbar-thumb{background:var(--c-border);border-radius:4px}
${dark ? `.tpl-root ::selection{background:${rgba(t.colors.primary, 0.5)}}` : ''}
${opts?.forExport ? exportExtras(t) : editExtras()}
${animRuntimeCss()}
`.trim();
}

/* أنماط خاصة بالمحرر (تحديد المكوّنات) */
function editExtras(): string {
  return `
.tpl-editable{position:relative;cursor:pointer}
.tpl-editable::before{content:'';position:absolute;inset:2px;border:2px dashed transparent;border-radius:12px;pointer-events:none;transition:border-color .18s;z-index:5}
.tpl-editable:hover::before{border-color:rgba(124,108,247,.55)}
.tpl-editable.is-selected::before{border-color:#7c6cf7;border-style:solid}
.tpl-editable::after{content:attr(data-title);position:absolute;top:4px;inset-inline-start:8px;z-index:6;
  font:700 10px/1 system-ui,sans-serif;color:#fff;background:#7c6cf7;padding:4px 8px;border-radius:6px;
  opacity:0;transform:translateY(-4px);transition:.18s;pointer-events:none}
.tpl-editable:hover::after,.tpl-editable.is-selected::after{opacity:1;transform:none}
.drop-slot{height:10px;border-radius:8px;transition:.2s;margin:2px 0}
.drop-slot.hot{height:56px;background:rgba(124,108,247,.14);border:2px dashed #7c6cf7}
`;
}

/* إضافات خاصة بالتصدير */
function exportExtras(t: ThemeCfg): string {
  return `
html,body{margin:0;padding:0;background:${t.colors.bg}}
body{font-family:var(--font-main)}
.tpl-fixed-bottom{position:fixed;bottom:0;left:0;right:0;z-index:50}
.tpl-sticky-top{position:sticky;top:0;z-index:40}
.tpl-body-pad-bottom{padding-bottom:96px}
a{color:inherit}
.tpl-row{transition:background .15s}
.tpl-row:hover{background:var(--c-primary-soft)!important}
/* تبويبات */
[data-tabs] .tpl-tab.tab-on{color:var(--c-primary)!important}
[data-tabs][data-tab-style="pill"] .tpl-tab{background:transparent!important;box-shadow:none!important}
[data-tabs][data-tab-style="pill"] .tpl-tab.tab-on{background:var(--c-surface)!important;box-shadow:var(--shadow-card)!important}
[data-tabs][data-tab-style="boxed"] .tpl-tab{background:transparent!important}
[data-tabs][data-tab-style="boxed"] .tpl-tab.tab-on{background:var(--c-primary-soft)!important}
[data-tabs][data-tab-style="underline"] .tpl-tab{border-bottom:3px solid transparent!important}
[data-tabs][data-tab-style="underline"] .tpl-tab.tab-on{border-bottom-color:var(--c-primary)!important}
/* قائمة جانبية قابلة للطي */
[data-sidebar]{transition:width .25s cubic-bezier(.22,1,.36,1)}
[data-sidebar].sb-collapsed{width:74px!important}
[data-sidebar].sb-collapsed .sb-label,[data-sidebar].sb-collapsed .sb-badge,[data-sidebar].sb-collapsed .sb-user-meta{display:none!important}
[data-sidebar].sb-collapsed .tpl-nav-item{justify-content:center!important;padding-inline:0!important}
/* شريط سفلي */
[data-bottom-item]{transition:background .2s,color .2s}
[data-bottom-item].bb-on{color:var(--c-primary)!important}
[data-bottom-item][data-active-pill="1"].bb-on{background:var(--c-primary-soft)!important}
/* مفتاح تبديل */
[data-switch] .sw-knob{transition:inset-inline-start .2s}
[data-switch].sw-on{background:var(--c-primary)!important}
[data-switch].sw-on .sw-knob{inset-inline-start:23px!important}
/* نموذج */
.tpl-form-sent .tpl-btn{background:#10b981!important;color:#fff!important}
`;
}
