/* اختبار دخان: توليد HTML لكل الثيمات الثلاثين والتحقق من سلامته */
import { PRESETS, buildThemeFromPreset } from '../src/lib/presets';
import { makeTemplateDoc } from '../src/lib/defaults';
import { buildHtml } from '../src/lib/exportHtml';
import { iconSvg, searchIcons } from '../src/lib/icons';

let fails = 0;
for (const p of PRESETS) {
  const doc = makeTemplateDoc(buildThemeFromPreset(p), p.layout);
  const { html, css, js } = buildHtml(doc, `قالب ${p.name_ar}`);
  const checks: [string, boolean][] = [
    ['doctype', html.startsWith('<!DOCTYPE html>')],
    ['tpl-root', html.includes('tpl-root')],
    ['keyframes', css.includes('@keyframes')],
    ['runtime', js.includes('IntersectionObserver')],
    ['sections>0', doc.layout.sections.length > 0],
    ['size>10k', html.length > 10000],
  ];
  const bad = checks.filter(([, ok]) => !ok).map(([n]) => n);
  if (bad.length) { fails++; console.log(`✘ ${p.key}: ${bad.join(', ')}`); }
  else console.log(`✔ ${p.key.padEnd(12)} ${p.name_ar.padEnd(12)} ${(html.length / 1024).toFixed(0)}KB  sections=${doc.layout.sections.length}`);
}
// أيقونات
const svg = iconSvg('House', 24);
if (!svg.startsWith('<svg') || !svg.includes('</svg>')) { fails++; console.log('✘ iconSvg'); }
else console.log('✔ iconSvg ok,', searchIcons('cart').length, 'results for "cart"');

console.log(fails === 0 ? '\n✅ ALL PASSED' : `\n❌ ${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
