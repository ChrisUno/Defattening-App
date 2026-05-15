import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    dedupe: [
      'react', 'react-dom', 'react-router',
      'zustand', 'framer-motion', 'clsx',
      '@tanstack/react-query', 'recharts', 'lucide-react'
    ],
  },
  build: {
    minify: 'esbuild',
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.code === 'UNRESOLVED_IMPORT' &&
          typeof warning.exporter === 'string' &&
          ['cookie', 'set-cookie-parser', 'turbo-stream'].includes(warning.exporter)
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
})