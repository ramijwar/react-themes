import type { TemplateMeta } from './types';

/* ============================================================
   تخزين محلي للقوالب (وضع التجربة بدون خادم + مسودات)
   ============================================================ */

const LS_TEMPLATES = 'rts_local_templates';

export function localTemplates(): TemplateMeta[] {
  try {
    return JSON.parse(localStorage.getItem(LS_TEMPLATES) || '[]');
  } catch { return []; }
}

export function saveLocalTemplates(list: TemplateMeta[]) {
  localStorage.setItem(LS_TEMPLATES, JSON.stringify(list));
}

export function localUpsert(tpl: TemplateMeta): TemplateMeta {
  const list = localTemplates();
  if (!tpl.id) tpl.id = `local-${Date.now()}`;
  const i = list.findIndex((x) => x.id === tpl.id);
  tpl.updated_at = new Date().toISOString();
  if (i >= 0) list[i] = tpl;
  else { tpl.created_at = tpl.updated_at; list.unshift(tpl); }
  saveLocalTemplates(list);
  return tpl;
}

export function localGet(id: string | number): TemplateMeta | undefined {
  return localTemplates().find((t) => String(t.id) === String(id));
}

export function localRemove(id: string | number) {
  saveLocalTemplates(localTemplates().filter((t) => String(t.id) !== String(id)));
}
