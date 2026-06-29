import React from 'react';
import ReactDOM from 'react-dom/client';
import './style/index.css';
import App from './App';

// Apply saved theme synchronously before React renders to prevent flash
const savedTheme = localStorage.getItem('cookbook-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// Block pinch-zoom. iOS Safari ignores maximum-scale/user-scalable in the
// viewport meta, so the only reliable way is to cancel the gesture in JS.
// (Double-tap zoom is handled by `touch-action: manipulation` in the CSS.)
['gesturestart', 'gesturechange', 'gestureend'].forEach((type) =>
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false })
);
// Fallback for engines that report a scaled multi-touch move rather than firing
// the Safari-only gesture events. Single-finger scrolling (scale === 1) is left
// untouched so the recipe list still scrolls normally.
document.addEventListener(
  'touchmove',
  (e) => { if (e.scale !== undefined && e.scale !== 1) e.preventDefault(); },
  { passive: false }
);
// Desktop trackpad / Ctrl+wheel pinch-zoom.
document.addEventListener(
  'wheel',
  (e) => { if (e.ctrlKey) e.preventDefault(); },
  { passive: false }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
