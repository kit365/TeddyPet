import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './ErrorBoundary';
import './i18n';

import { GoogleOAuthProvider } from '@react-oauth/google';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0
    }
  }
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div style={{ padding: 24, fontFamily: 'system-ui', textAlign: 'center' }}>Đang tải...</div>}>
        <QueryClientProvider client={queryClient}>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <App />
          </GoogleOAuthProvider>
        </QueryClientProvider>
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
)
