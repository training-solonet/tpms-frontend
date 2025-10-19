import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    hmr: { overlay: true },
    proxy: {
      '/tpms/realtime': {
        target: 'https://tpms.solonet.net.id',
        changeOrigin: true,
        secure: true,
        rewrite: p => p.replace(/^\/tpms\/realtime/, '/api/tpms/realtime'),
      },
      '/tpms/location': {
        target: 'https://tpms.solonet.net.id',
        changeOrigin: true,
        secure: true,
        rewrite: p => p.replace(/^\/tpms\/location/, '/api/tpms/location'),
      },
    },
  },
});