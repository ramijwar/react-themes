import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { templateCss } from './renderer/css';
import { PRESETS } from './lib/presets';
import { buildThemeFromPreset } from './lib/presets';

/* حقن ورقة أنماط القوالب الأساسية (للمعاينات المصغّرة في المعرض) */
if (!document.getElementById('tpl-base-css')) {
  const st = document.createElement('style');
  st.id = 'tpl-base-css';
  st.textContent = templateCss(buildThemeFromPreset(PRESETS[0]));
  document.head.appendChild(st);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
