import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['react-is', 'recharts'],
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        // react-is কে external থেকে সরিয়ে দেওয়া হলো যাতে ব্রাউজারে মডিউল মিসিং এরর না আসে
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('three')) return 'vendor-three';
              if (id.includes('recharts')) return 'vendor-recharts';
              if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
              return 'vendor';
            }
          }
        }
      }
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});