import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './fonts.css';
import './index.css';
import './i18n';

// Restore "Large text" mode before the first render, so the page does not jump.
try {
  if (localStorage.getItem('bn.largeText') === '1') {
    document.documentElement.classList.add('large-text');
  }
} catch {
  /* storage blocked: default size */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
