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
