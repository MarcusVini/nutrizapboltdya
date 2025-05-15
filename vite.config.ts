import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          polyfill: ['./src/lib/browser-polyfill.ts'],
          gtm: ['./src/lib/gtm.ts']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      '@fingerprintjs/fingerprintjs',
      './src/lib/gtm'
    ]
  },
});
