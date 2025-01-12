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
  },
  publicDir: 'public', // Default is 'public', ensure it's not misconfigured
})
