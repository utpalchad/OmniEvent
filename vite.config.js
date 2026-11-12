import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/OmniEvent/' : '/',
  plugins: [react(), tailwindcss()],
  optimizeDeps: { include: ['@bryntum/scheduler-react-community'] },
  server: { host: '0.0.0.0', port: 5173 },
  preview: { host: '0.0.0.0', port: 4173 },
});