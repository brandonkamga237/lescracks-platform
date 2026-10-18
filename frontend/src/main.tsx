import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import { BrowserRouter } from 'react-router-dom';

import App from '@/App';
import { SessionProvider } from '@/contexts/AuthContext';
import { oidcConfig } from '@/services/auth';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <BrowserRouter>
        <SessionProvider>
          <App />
        </SessionProvider>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);

// The loader drawn by index.html covers the bundle download. A first visit in the session keeps it on
// screen long enough to be read as intentional; a reload within the session drops it at once.
function dismissBootLoader() {
  const loader = document.getElementById('boot-loader');
  if (!loader) return;
  let seen = false;
  try {
    seen = sessionStorage.getItem('boot-seen') === '1';
    sessionStorage.setItem('boot-seen', '1');
  } catch {
    // Storage blocked: behave as a first visit.
  }
  window.setTimeout(() => {
    loader.classList.add('is-done');
    window.setTimeout(() => loader.remove(), 450);
  }, seen ? 0 : Math.max(0, 1400 - performance.now()));
}

requestAnimationFrame(dismissBootLoader);
