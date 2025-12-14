import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    allowedHosts: ['79dc932aff74.ngrok-free.app','chair-orders-discussed-controllers.trycloudflare.com']
  }
})