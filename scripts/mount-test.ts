/* اختبار تركيب كامل للتطبيق في jsdom: هبوط ← دخول ← استوديو ← محرر */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html dir="rtl"><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});
const w: any = dom.window;
class RO { observe() {} unobserve() {} disconnect() {} }
class IO { constructor(_cb: any) {} observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
w.ResizeObserver = RO;
w.IntersectionObserver = IO;
const g: any = globalThis;
g.window = w; g.document = w.document; Object.defineProperty(g, "navigator", { value: w.navigator, configurable: true });
g.HTMLElement = w.HTMLElement; g.Element = w.Element; g.Node = w.Node; g.Event = w.Event;
g.ResizeObserver = RO; g.IntersectionObserver = IO;
g.localStorage = w.localStorage;
g.requestAnimationFrame = (cb: any) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = clearTimeout;
g.IS_REACT_ACT_ENVIRONMENT = true;
// الشبكة مقطوعة → وضع التجربة المحلي
const noFetch = () => Promise.reject(new TypeError('Failed to fetch'));
g.fetch = noFetch; w.fetch = noFetch;
g.DOMParser = w.DOMParser;

async function main() {
const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react-dom/test-utils');
const App = (await import('../src/App')).default;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log('✔', name);
  else { fails++; console.log('✘', name); }
}
const html = () => document.getElementById('root')!.innerHTML;
const text = () => document.getElementById('root')!.textContent || '';

const root = createRoot(document.getElementById('root')!);
await act(async () => { root.render(React.createElement(App)); await sleep(60); });
check('Landing renders', text().includes('ستوديو') && text().includes('ثيماً جاهزاً'));
check('Browser mock template rendered', html().includes('tpl-root'));

// → صفحة الدخول
await act(async () => { w.location.hash = '#/login'; w.dispatchEvent(new w.HashChangeEvent('hashchange')); await sleep(60); });
check('Login page renders', text().includes('أهلاً بعودتك'));

// دخول admin (محلي)
const inputs = [...document.querySelectorAll('input')] as any[];
const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value')!.set!;
await act(async () => {
  setter.call(inputs[0], 'admin'); inputs[0].dispatchEvent(new w.Event('input', { bubbles: true }));
  setter.call(inputs[1], 'admin123'); inputs[1].dispatchEvent(new w.Event('input', { bubbles: true }));
  await sleep(20);
});
const form = document.querySelector('form') as any;
check('login form found', !!form);
await act(async () => { form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); });
await act(async () => { await sleep(250); });
check('logged in → studio', text().includes('أهلاً') && (w.location.hash.includes('/studio')));
if (!(w.location.hash.includes('/studio'))) { console.log('DEBUG hash:', w.location.hash); console.log('DEBUG text tail:', text().slice(-300)); console.log('DEBUG has error?', text().includes('أدخل بيانات الدخول'), text().includes('غير صحيحة')); console.log('DEBUG inputs were:', inputs.map(i=>i.value).join(' | ')); console.log('DEBUG ls:', w.localStorage.getItem('rts_local_users')?.slice(0,120)); }

// الاستوديو: الثيمات + تبويب قوالبی
check('studio shows presets', text().includes('فجر') || text().includes('خصّص'));
const customize = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('خصّص')) as any;
check('customize button found', !!customize);

// → المحرر
await act(async () => { customize.click(); await sleep(250); });
check('builder route', w.location.hash.includes('/builder'));
check('builder toolbar', text().includes('تصدير') && text().includes('الثيم'));
check('layers panel', text().includes('هيكل الصفحة') && text().includes('الأقسام'));
check('theme panel shown when nothing selected', text().includes('الثيم العام') && text().includes('الثيمات السريعة'));
check('canvas renders template', html().includes('tpl-editable') && html().includes('data-cid'));

// تحديد مكوّن ← ظهور المفتش
const comp = document.querySelector('[data-cid]') as any;
await act(async () => { comp.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); });
await act(async () => { await sleep(120); });
check('inspector appears for component', text().includes('المحتوى والخصائص') && text().includes('الحركة والأنيميشن'));

// تصدير ← فتح النافذة
const exportBtn = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('تصدير')) as any;
await act(async () => { exportBtn.click(); });
await act(async () => { await sleep(400); });
check('export modal open', text().includes('صفحة HTML واحدة') && text().includes('حزمة React'));
check('export modal shows code', html().includes('<textarea') && (document.querySelector('textarea')?.value || '').includes('<!DOCTYPE html>'));

console.log(fails === 0 ? '\n✅ MOUNT TEST PASSED' : `\n❌ ${fails} FAILURES`);


}
main().then((f: any)=>process.exit(f?1:0)).catch(e=>{console.error('FATAL',e);process.exit(2)});
