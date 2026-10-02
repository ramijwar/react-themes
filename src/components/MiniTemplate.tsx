import { useEffect, useRef, useState } from 'react';
import type { TemplateDoc } from '../lib/types';
import { TemplateRenderer } from '../renderer/TemplateRenderer';

/* معاينة مصغّرة حية للقالب داخل البطاقات */
export function MiniTemplate({ doc, className = '', width = 1400, height = 950 }: {
  doc: TemplateDoc; className?: string; width?: number; height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setBox({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = box.w / width;
  return (
    <div ref={ref} className={`overflow-hidden relative ${className}`} style={{ direction: doc.theme.rtl ? 'rtl' : 'ltr' }}>
      {box.w > 0 ? (
        <div
          className="absolute top-0 right-0 origin-top-right pointer-events-none"
          style={{ width, height: box.h / scale, transform: `scale(${scale})` }}
        >
          <TemplateRenderer doc={doc} mode="static" device={scale < 0.35 ? 'tablet' : 'desktop'} />
        </div>
      ) : null}
    </div>
  );
}
