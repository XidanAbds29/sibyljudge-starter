// frontend/client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // forward any request from /api/* → http://localhost:5000/api/*
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // remove the rewrite so /api stays intact:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
