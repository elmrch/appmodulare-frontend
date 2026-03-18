import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    port: 4173,
    host: true,
    allowedHosts: ['resourceful-kindness-production-0d89.up.railway.app']
  },
  server: {
    port: 5173,
    host: true
  }
})