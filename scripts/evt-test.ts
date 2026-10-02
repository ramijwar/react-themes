import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body><div id="root"></div></body>', { url: 'http://localhost/' });
const w: any = dom.window;
const g: any = globalThis;
g.window = w; g.document = w.document; Object.defineProperty(g, 'navigator', { value: w.navigator, configurable: true });
g.HTMLElement = w.HTMLElement; g.Element = w.Element; g.Node = w.Node; g.Event = w.Event;
g.IS_REACT_ACT_ENVIRONMENT = true;
async function main() {
  const React = (await import('react')).default;
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react-dom/test-utils');
  let clicks = 0, submits = 0, changes = 0;
  function C() {
    return React.createElement('form', { onSubmit: (e: any) => { e.preventDefault(); submits++; } },
      React.createElement('input', { onChange: () => changes++ }),
      React.createElement('button', { type: 'submit', onClick: () => clicks++ }, 'go'));
  }
  const root = createRoot(document.getElementById('root')!);
  await act(async () => { root.render(React.createElement(C)); });
  const btn = document.querySelector('button')!;
  const form = document.querySelector('form')!;
  const input = document.querySelector('input')!;
  await act(async () => { btn.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); });
  console.log('clicks:', clicks, 'submits(after click):', submits);
  await act(async () => { form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); });
  console.log('submits(after dispatch):', submits);
  const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value')!.set!;
  await act(async () => { setter.call(input, 'x'); input.dispatchEvent(new w.Event('input', { bubbles: true })); });
  console.log('changes:', changes);
  process.exit(0);
}
main();
