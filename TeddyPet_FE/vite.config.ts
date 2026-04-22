import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const GOOGLE_CLIENT_ID_FALLBACK =
  '422567263716-9j7coeuir10hurql2akp21c3dpmtki0q.apps.googleusercontent.com'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const googleClientId =
    env.VITE_GOOGLE_CLIENT_ID?.trim() || GOOGLE_CLIENT_ID_FALLBACK

  return {
    base: '/',
    resolve: {
      dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: false,
      cors: true,
    },
    preview: {
      port: 4173,
      strictPort: false,
    },
    /** Luôn nhúng client_id vào bundle (Docker/CI hay quên env) — tránh lỗi Google "Missing client_id" */
    define: {
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
    },
  }
})
