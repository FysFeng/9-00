import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Increase chunk size limit to suppress warnings
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Mark html2canvas as external so Rollup ignores it during build
      // It will be resolved by the browser via the importmap in index.html
      external: ['html2canvas'],
      output: {
        // Manually separate large dependencies into a vendor chunk
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts'],
        },
      },
    },
  },
});
