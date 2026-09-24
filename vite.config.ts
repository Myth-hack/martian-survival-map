import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'vendor-three';
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('leaflet')) return 'vendor-leaflet';
            return 'vendor'; // Groups the rest of your dependencies
          }
        }
      }
    }
  }
})