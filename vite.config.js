import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    hmr: { overlay: true },
    proxy: {
      '/tpms': {
        target: 'https://tpms.solonet.net.id',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep the /tpms prefix
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🔄 Proxying:', req.method, req.url, '→', options.target + req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('📡 Proxy Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err) => {
            console.error('❌ Proxy Error:', err.message);
          });
        },
      },
    },
  },
});
