import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// __dirname here is web/ (the directory this config lives in)
export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  css: {
    // Explicitly point to web/ so postcss.config.js (and tailwind.config.js) are found
    postcss: path.resolve(__dirname),
  },
  build: {
    outDir: path.resolve(__dirname, '../build'),
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
