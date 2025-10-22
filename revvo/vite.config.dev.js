import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuração do Vite para desenvolvimento com Docker
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite acesso externo no Docker
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
      host: 'localhost'
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  }
})

