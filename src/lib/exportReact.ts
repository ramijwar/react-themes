import type { TemplateDoc } from './types';
import { buildHtml, RUNTIME_JS, esc } from './exportHtml';
import { templateCss } from '../renderer/css';

/* ============================================================
   التصدير إلى مشروع React (TSX + CSS + JS تفاعلات)
   ============================================================ */

const VOID_TAGS = new Set(['input', 'br', 'img', 'hr', 'meta', 'link', 'source', 'area', 'col', 'embed', 'track', 'wbr']);

function cssNameToJs(name: string): string {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function styleStringToJsx(cssText: string): string {
  const parts = cssText.split(';').map((s) => s.trim()).filter(Boolean);
  const obj: string[] = [];
  for (const p of parts) {
    const idx = p.indexOf(':');
    if (idx < 0) continue;
    const k = cssNameToJs(p.slice(0, idx).trim());
    const v = p.slice(idx + 1).trim();
    obj.push(`${JSON.stringify(k)}: ${JSON.stringify(v)}`);
  }
  return `{{ ${obj.join(', ')} }}`;
}

function attrToJsx(name: string, value: string | null): string {
  const v = value ?? '';
  if (name === 'class') return `className=${JSON.stringify(v)}`;
  if (name === 'style') return `style=${styleStringToJsx(v)}`;
  if (name === 'hidden') return v === '' || v === 'true' ? 'hidden' : `hidden={${v}}`;
  if (/^(data-|aria-)/.test(name)) return `${name}=${JSON.stringify(v)}`;
  if (v === '') return name;
  return `${name}=${JSON.stringify(v)}`;
}

function escapeJsxText(s: string): string {
  return s.replace(/\{/g, "{'{'}").replace(/\}/g, "{'}'}");
}

function elToJsx(el: Element, depth: number): string {
  const pad = '  '.repeat(depth);
  const tag = el.tagName.toLowerCase();
  const attrs = Array.from(el.attributes).map((a) => attrToJsx(a.name, a.value)).filter(Boolean);
  const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
  if (VOID_TAGS.has(tag)) return `${pad}<${tag}${attrStr} />`;
  const kids = Array.from(el.childNodes);
  const hasEl = kids.some((k) => k.nodeType === 1);
  if (!hasEl) {
    const text = escapeJsxText(el.textContent || '');
    if (!text.trim() && !text) return `${pad}<${tag}${attrStr}></${tag}>`;
    return `${pad}<${tag}${attrStr}>${text.includes('\n') ? `\n${kids.map((k) => k.nodeType === 3 ? pad + '  ' + escapeJsxText(k.textContent || '') : elToJsx(k as Element, depth + 1)).join('\n')}\n${pad}` : text}</${tag}>`;
  }
  const inner = kids
    .map((k) => {
      if (k.nodeType === 3) {
        const t = escapeJsxText(k.textContent || '');
        return t.trim() ? `${'  '.repeat(depth + 1)}${t.trim()}` : '';
      }
      if (k.nodeType === 1) return elToJsx(k as Element, depth + 1);
      return '';
    })
    .filter(Boolean)
    .join('\n');
  return `${pad}<${tag}${attrStr}>\n${inner}\n${pad}</${tag}>`;
}

export function markupToJsx(markup: string): string {
  const parsed = new DOMParser().parseFromString(`<div id="__r">${markup}</div>`, 'text/html');
  const root = parsed.getElementById('__r')!;
  return Array.from(root.children).map((el) => elToJsx(el, 1)).join('\n');
}

export interface ReactExport {
  files: Record<string, string>;
}

export function buildReactExport(doc: TemplateDoc, name: string): ReactExport {
  const { html, css } = buildHtml(doc, name);
  // استخرج جسم الصفحة فقط
  const body = html.slice(html.indexOf('<body'));
  const inner = body.slice(body.indexOf('>') + 1, body.lastIndexOf('<script'));
  const jsx = markupToJsx(inner.trim());
  const compName = 'TemplateApp';

  const tsx = `import { useEffect } from 'react';
import { initInteractions } from './interactions';
import './template.css';

/**
 * ${name}
 * قالب React مُولَّد بواسطة ستوديو القوالب — React Themes Studio
 * الأنماط الرئيسية في template.css ومتغيرات الثيم معرّفة على .tpl-root
 */
export default function ${compName}() {
  useEffect(() => {
    initInteractions();
  }, []);

  return (
    <>
${jsx}
    </>
  );
}
`;

  const interactionsClean = `/**
 * تفاعلات القالب: التبويبات، القوائم الجانبية والسفلية، الحركات، النماذج
 * مُولَّدة بواسطة ستوديو القوالب — React Themes Studio
 */
export function initInteractions(scope: ParentNode = document): void {
  const q = <T extends Element>(sel: string): T[] => Array.prototype.slice.call(scope.querySelectorAll(sel));

  /* حركات الظهور عند التمرير */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('a-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    q('.anim-scroll').forEach((el) => io.observe(el));
  } else {
    q('.anim-scroll').forEach((el) => el.classList.add('a-visible'));
  }

  /* التبويبات */
  q<HTMLElement>('[data-tabs]').forEach((box) => {
    const wrap = box.closest('[data-cid]') || box.parentElement!;
    const tabs = Array.prototype.slice.call(box.querySelectorAll('[data-tab-index]')) as HTMLElement[];
    const panels = Array.prototype.slice.call(wrap.querySelectorAll('[data-tab-panel]')) as HTMLElement[];
    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = btn.getAttribute('data-tab-index');
        tabs.forEach((b) => b.classList.toggle('tab-on', b === btn));
        panels.forEach((p) => { p.style.display = p.getAttribute('data-tab-panel') === i ? '' : 'none'; });
      });
    });
  });

  /* الشريط السفلي */
  q<HTMLElement>('[data-bottom-item]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const bar = btn.parentElement!;
      Array.prototype.slice.call(bar.querySelectorAll('[data-bottom-item]')).forEach((b: HTMLElement) => b.classList.toggle('bb-on', b === btn));
    });
  });

  /* طيّ القائمة الجانبية */
  q<HTMLElement>('[data-action="toggle-sidebar"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sb = scope.querySelector('[data-sidebar="' + btn.getAttribute('data-target') + '"]');
      if (sb) sb.classList.toggle('sb-collapsed');
    });
  });

  /* إغلاق التنبيهات */
  q<HTMLElement>('[data-action="dismiss"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const al = btn.closest('[data-alert]') as HTMLElement | null;
      if (al) {
        al.style.transition = 'opacity .3s, transform .3s';
        al.style.opacity = '0';
        setTimeout(() => { al.style.display = 'none'; }, 300);
      }
    });
  });

  /* مفاتيح التبديل */
  q<HTMLElement>('[data-switch]').forEach((sw) => {
    sw.addEventListener('click', () => sw.classList.toggle('sw-on'));
  });

  /* النماذج */
  q<HTMLFormElement>('[data-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.classList.add('tpl-form-sent');
      const btn = form.querySelector('.tpl-btn') as HTMLElement | null;
      if (btn) {
        const old = btn.innerHTML;
        btn.innerHTML = '✓ تم الإرسال بنجاح';
        setTimeout(() => { btn.innerHTML = old; form.classList.remove('tpl-form-sent'); }, 2200);
      }
    });
  });
}
`;

  const readme = `# ${name} — قالب React

قالب مُولَّد بواسطة **ستوديو القوالب (React Themes Studio)**.

## الملفات
| الملف | الوصف |
|---|---|
| \`TemplateApp.tsx\` | مكوّن القالب الكامل (JSX + أنماط مضمّنة) |
| \`template.css\` | متغيرات الثيم + الحركات + أنماط التفاعل |
| \`interactions.ts\` | منطق التفاعلات (تبويبات، قوائم، حركات التمرير، نماذج) |
| \`theme.json\` | بيانات الثيم والتخطيط الأصلية (يمكن إعادة استيرادها للستوديو) |

## الاستخدام
\`\`\`tsx
import TemplateApp from './TemplateApp';

export default function Page() {
  return <TemplateApp />;
}
\`\`\`

## تخصيص الثيم
كل الألوان معرّفة كمتغيرات CSS على \`.tpl-root\` في \`template.css\` — عدّلها وسيتغير القالب بالكامل:
\`\`\`css
.tpl-root { --c-primary: #6d5efc; --c-bg: #fff; /* ... */ }
\`\`\`

> لا يحتاج أي مكتبات خارجية — React 18+ فقط.
`;

  return {
    files: {
      'TemplateApp.tsx': tsx,
      'template.css': css,
      'interactions.ts': interactionsClean,
      'theme.json': JSON.stringify(doc, null, 2),
      'README.md': readme,
    },
  };
}

export { esc };
