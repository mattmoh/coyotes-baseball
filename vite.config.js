import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    mimeTypes: {
      '.md': 'text/markdown',
    },
    port: 3000, // Match the port with Docker
    host: '0.0.0.0', // Listen on all network interfaces
    watch: {
      usePolling: true, // Use polling to detect file changes
    },
    proxy: {
      '/api': {
        target: 'https://api.team-manager.gc.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  publicDir: 'public', // Default is 'public', ensure it's not misconfigured
})
