import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the Node API (backend/, port 1502) handles /api and /uploads.
const api = 'http://127.0.0.1:1502';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': api, '/uploads': api } },
  build: { outDir: 'dist', emptyOutDir: true },
});
