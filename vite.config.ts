import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA plugin devre dışı - OneSignal Service Worker ile çakışmasın
  ],
  server: {
    port: 3000,
    open: true,
  },
})
