import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import autoprefixer from 'autoprefixer';
// import tailwindPostcss from '@tailwindcss/postcss';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  css: {
    postcss: {
      plugins: [
        // tailwindPostcss(),
        autoprefixer,
      ],
    },
    modules: {
      // Exclude node_modules from CSS modules processing
      scopeBehaviour: 'local',
      globalModulePaths: [/node_modules/],
    },
  },
});
