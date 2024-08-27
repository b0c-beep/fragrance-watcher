// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests to the Express server
      '/api': {
        target: 'http://localhost:5000', // URL of your Express backend
        changeOrigin: true,
        //secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
