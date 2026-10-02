/* يولّد server/seed/themes.seed.json من تعريفات الثيمات (مصدر الحقيقة الوحيد) */
import { writeFileSync, mkdirSync } from 'node:fs';
import { PRESETS, buildThemeFromPreset } from './presets';
import { makeTemplateDoc } from './defaults';

const out = PRESETS.map((p) => ({
  key: p.key,
  name: p.name,
  name_ar: p.name_ar,
  category: p.category,
  layout: p.layout,
  data: makeTemplateDoc(buildThemeFromPreset(p), p.layout),
}));

mkdirSync('server/seed', { recursive: true });
writeFileSync('server/seed/themes.seed.json', JSON.stringify(out));
console.log('✔ themes.seed.json —', out.length, 'themes');
