import type { CSSProperties } from 'react';
import type { AnimCfg } from './types';

/* ============================================================
   مكتبة الحركات — توليد keyframes + classes
   ============================================================ */

export const EASINGS: Record<string, string> = {
  smooth: 'cubic-bezier(.22,1,.36,1)',
  ease: 'ease',
  linear: 'linear',
  in: 'ease-in',
  out: 'ease-out',
  'in-out': 'ease-in-out',
  spring: 'cubic-bezier(.34,1.56,.64,1)',
  bounce: 'cubic-bezier(.68,-0.55,.27,1.55)',
};

interface AnimDef { id: string; label: string; kf: string; hoverable?: boolean }

const KF = (name: string, frames: string) => `@keyframes ${name}{${frames}}`;

export const ANIMS: AnimDef[] = [
  { id: 'none', label: 'بدون حركة', kf: '' },
  { id: 'fade', label: 'تلاشٍ', kf: KF('a-fade', 'from{opacity:0}to{opacity:1}') },
  { id: 'fade-up', label: 'صعود مع تلاشي', kf: KF('a-fade-up', 'from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}') },
  { id: 'fade-down', label: 'هبوط مع تلاشي', kf: KF('a-fade-down', 'from{opacity:0;transform:translateY(-26px)}to{opacity:1;transform:none}') },
  { id: 'fade-side', label: 'انزلاق جانبي', kf: KF('a-fade-side', 'from{opacity:0;transform:translateX(-34px)}to{opacity:1;transform:none}') },
  { id: 'zoom-in', label: 'تكبير', kf: KF('a-zoom-in', 'from{opacity:0;transform:scale(.82)}to{opacity:1;transform:scale(1)}') },
  { id: 'zoom-out', label: 'تصغير', kf: KF('a-zoom-out', 'from{opacity:0;transform:scale(1.18)}to{opacity:1;transform:scale(1)}') },
  { id: 'slide-up', label: 'انزلاق لأعلى', kf: KF('a-slide-up', 'from{transform:translateY(100%)}to{transform:none}') },
  { id: 'slide-down', label: 'انزلاق لأسفل', kf: KF('a-slide-down', 'from{transform:translateY(-100%)}to{transform:none}') },
  { id: 'bounce-in', label: 'ارتداد دخول', kf: KF('a-bounce-in', '0%{opacity:0;transform:scale(.3)}50%{transform:scale(1.08)}70%{transform:scale(.95)}100%{opacity:1;transform:scale(1)}') },
  { id: 'flip-x', label: 'قلب أفقي', kf: KF('a-flip-x', 'from{opacity:0;transform:perspective(600px) rotateX(80deg)}to{opacity:1;transform:perspective(600px) rotateX(0)}') },
  { id: 'flip-y', label: 'قلب رأسي', kf: KF('a-flip-y', 'from{opacity:0;transform:perspective(600px) rotateY(80deg)}to{opacity:1;transform:perspective(600px) rotateY(0)}') },
  { id: 'rotate-in', label: 'دوران دخول', kf: KF('a-rotate-in', 'from{opacity:0;transform:rotate(-12deg) scale(.8)}to{opacity:1;transform:none}') },
  { id: 'blur-in', label: 'ظهور ضبابي', kf: KF('a-blur-in', 'from{opacity:0;filter:blur(12px)}to{opacity:1;filter:blur(0)}') },
  { id: 'pulse', label: 'نبض (مستمر)', kf: KF('a-pulse', '0%,100%{transform:scale(1)}50%{transform:scale(1.045)}'), hoverable: true },
  { id: 'float', label: 'طفو (مستمر)', kf: KF('a-float', '0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}'), hoverable: true },
  { id: 'shake', label: 'اهتزاز', kf: KF('a-shake', '0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}'), hoverable: true },
  { id: 'swing', label: 'تأرجح', kf: KF('a-swing', '0%,100%{transform:rotate(0)}25%{transform:rotate(5deg)}75%{transform:rotate(-5deg)}'), hoverable: true },
  { id: 'glow-pulse', label: 'توهج نابض', kf: KF('a-glow-pulse', '0%,100%{filter:drop-shadow(0 0 2px var(--c-primary))}50%{filter:drop-shadow(0 0 16px var(--c-primary))}'), hoverable: true },
  { id: 'jelly', label: 'جيلي', kf: KF('a-jelly', '0%,100%{transform:scale(1)}30%{transform:scale(1.12,.88)}45%{transform:scale(.9,1.1)}60%{transform:scale(1.05,.95)}'), hoverable: true },
  { id: 'heart-beat', label: 'نبض قلب', kf: KF('a-heart-beat', '0%,100%{transform:scale(1)}14%{transform:scale(1.15)}28%{transform:scale(1)}42%{transform:scale(1.15)}70%{transform:scale(1)}'), hoverable: true },
];

export const ANIM_MAP: Record<string, AnimDef> = Object.fromEntries(ANIMS.map((a) => [a.id, a]));

export function animsCss(used?: Set<string>): string {
  const list = used ? ANIMS.filter((a) => used.has(a.id)) : ANIMS;
  return list.map((a) => a.kf).filter(Boolean).join('\n');
}

/** classes + style لعنصر بحركة معينة */
export function animClass(a: AnimCfg): string {
  if (!a || a.type === 'none') return '';
  const parts: string[] = [];
  if (a.trigger === 'scroll') parts.push(`anim anim-scroll a-${a.type}`);
  else if (a.trigger === 'hover') parts.push(`anim a-hover a-hover-${a.type}`);
  else parts.push(`anim a-run a-${a.type}`);
  if (a.loop && a.trigger !== 'hover') parts.push('a-loop');
  return parts.join(' ');
}

export function animStyle(a: AnimCfg): CSSProperties {
  if (!a || a.type === 'none') return {};
  return {
    animationDuration: `${a.duration}ms`,
    animationDelay: `${a.delay}ms`,
    animationTimingFunction: EASINGS[a.easing] || EASINGS.smooth,
    animationFillMode: 'both',
  } as CSSProperties;
}

/** CSS كامل للحركات (يُضمّن في المعاينة والتصدير) */
export function animRuntimeCss(): string {
  return `
${animsCss()}
.anim{will-change:transform,opacity}
.a-run{animation-name:var(--anim-name)}
${ANIMS.filter((a) => a.id !== 'none').map((a) => `.a-${a.id}{--anim-name:a-${a.id};animation-name:a-${a.id}}`).join('\n')}
.a-loop{animation-iteration-count:infinite}
.anim-scroll{opacity:0}
.anim-scroll.a-visible{animation-name:var(--anim-name)}
${ANIMS.filter((a) => a.hoverable).map((a) => `.a-hover-${a.id}:hover{animation:a-${a.id} .7s cubic-bezier(.22,1,.36,1)}`).join('\n')}
.hover-lift{transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s}
.hover-lift:hover{transform:translateY(-5px)}
.hover-grow{transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
.hover-grow:hover{transform:scale(1.05)}
.hover-glow{transition:box-shadow .3s}
.hover-glow:hover{box-shadow:0 0 0 3px var(--c-primary-mid),0 10px 30px rgba(0,0,0,.18)}
`;
}
