import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { TemplateDoc } from './types';
import { FONTS } from './theme';
import { templateCss } from '../renderer/css';
import { TemplateRenderer } from '../renderer/TemplateRenderer';

/* ============================================================
   التصدير إلى صفحة HTML مستقلة (CSS + JS مضمّنة)
   ============================================================ */

export const RUNTIME_JS = `
(function () {
  "use strict";
  /* حركات الظهور عند التمرير */
  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("a-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".anim-scroll").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".anim-scroll").forEach(function (el) { el.classList.add("a-visible"); });
  }

  /* التبويبات */
  document.querySelectorAll("[data-tabs]").forEach(function (box) {
    var style = box.getAttribute("data-tab-style") || "pill";
    var tabs = Array.prototype.slice.call(box.querySelectorAll("[data-tab-index]"));
    var wrap = box.closest("[data-cid]") || box.parentElement;
    var panels = Array.prototype.slice.call(wrap.querySelectorAll("[data-tab-panel]"));
    tabs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = btn.getAttribute("data-tab-index");
        tabs.forEach(function (b) { b.classList.toggle("tab-on", b === btn); });
        panels.forEach(function (p) { p.style.display = p.getAttribute("data-tab-panel") === i ? "" : "none"; });
      });
    });
  });

  /* الشريط السفلي */
  document.querySelectorAll("[data-bottom-item]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var bar = btn.parentElement;
      bar.querySelectorAll("[data-bottom-item]").forEach(function (b) { b.classList.toggle("bb-on", b === btn); });
    });
  });

  /* طيّ القائمة الجانبية */
  document.querySelectorAll('[data-action="toggle-sidebar"]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      var sb = document.querySelector('[data-sidebar="' + btn.getAttribute("data-target") + '"]');
      if (sb) sb.classList.toggle("sb-collapsed");
    });
  });

  /* إغلاق التنبيهات */
  document.querySelectorAll('[data-action="dismiss"]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      var al = btn.closest("[data-alert]");
      if (al) { al.style.transition = "opacity .3s, transform .3s"; al.style.opacity = "0"; al.style.transform = "translateY(-6px)"; setTimeout(function () { al.style.display = "none"; }, 300); }
    });
  });

  /* مفاتيح التبديل */
  document.querySelectorAll("[data-switch]").forEach(function (sw) {
    sw.addEventListener("click", function () { sw.classList.toggle("sw-on"); });
  });

  /* النماذج — عرض حالة الإرسال */
  document.querySelectorAll("[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.classList.add("tpl-form-sent");
      var btn = form.querySelector(".tpl-btn");
      if (btn) { var old = btn.innerHTML; btn.innerHTML = "✓ تم الإرسال بنجاح"; setTimeout(function () { btn.innerHTML = old; form.classList.remove("tpl-form-sent"); }, 2200); }
    });
  });
})();
`.trim();

export function buildHtml(doc: TemplateDoc, name: string, opts?: { split?: boolean }): {
  html: string; css: string; js: string;
} {
  const t = doc.theme;
  const markup = renderToStaticMarkup(
    createElement(TemplateRenderer, { doc, mode: 'static', device: 'desktop' } as any),
  );
  const bodyClass = doc.layout.bottombar && !doc.layout.bottombar.hidden ? ' class="tpl-body-pad-bottom"' : '';
  const font = FONTS[t.font];
  const fontLink = font?.google
    ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=${font.google}&display=swap" rel="stylesheet">`
    : '';
  const css = templateCss(t, { forExport: true });
  const js = RUNTIME_JS;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="${t.rtl ? 'rtl' : 'ltr'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(name)}</title>
<meta name="description" content="قالب ${esc(name)} — صُمّم بواسطة ستوديو القوالب React Themes Studio">
<meta name="generator" content="React Themes Studio">
${fontLink}
${opts?.split ? '<link rel="stylesheet" href="assets/style.css">' : `<style>\n${css}\n</style>`}
</head>
<body${bodyClass}>
${markup}
${opts?.split ? '<script src="assets/script.js" defer></script>' : `<script>\n${js}\n</script>`}
</body>
</html>`;
  return { html, css, js };
}

export function esc(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
