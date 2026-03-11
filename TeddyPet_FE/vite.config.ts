import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    // Prevent duplicate React/Emotion copies (fixes "Invalid hook call" + Emotion double-load warnings)
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
  },
  plugins: [
    react(),
    tailwindcss()
  ]
})
