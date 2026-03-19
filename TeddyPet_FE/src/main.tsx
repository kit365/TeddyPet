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

/** Public Web client ID; env chỉ ghi đè khi build. Fallback tránh thiếu VITE_* lúc deploy. */
const GOOGLE_CLIENT_ID_FALLBACK =
  '422567263716-9j7coeuir10hurql2akp21c3dpmtki0q.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || GOOGLE_CLIENT_ID_FALLBACK;

if (import.meta.env.PROD) {
  console.log(
    'Google Client ID:',
    GOOGLE_CLIENT_ID === GOOGLE_CLIENT_ID_FALLBACK ? 'fallback' : 'from VITE_GOOGLE_CLIENT_ID'
  );
}

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
