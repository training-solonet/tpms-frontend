/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    // Custom scrollbar utilities
    function ({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-none': {
          'scrollbar-width': 'none',
          '-ms-overflow-style': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scrollbar-track-slate-100::-webkit-scrollbar-track': {
          'background-color': '#f1f5f9',
        },
        '.scrollbar-thumb-slate-400::-webkit-scrollbar-thumb': {
          'background-color': '#94a3b8',
          'border-radius': '0.25rem',
        },
        '.scrollbar-thumb-slate-400::-webkit-scrollbar-thumb:hover': {
          'background-color': '#64748b',
        },
      };
      addUtilities(newUtilities, ['responsive', 'hover']);
    },
  ],
  corePlugins: {
    preflight: true,
  },
};
