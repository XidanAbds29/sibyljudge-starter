import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // No proxy needed when using Supabase client directly
    // You can remove the proxy configuration entirely
  }
})
