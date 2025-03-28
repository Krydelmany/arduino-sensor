/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class', // Habilita o modo escuro baseado em classes
  theme: {
    extend: {
      colors: {
        // Cores personalizadas que podem ser usadas no dark mode
        'dark-surface': '#121212',
        'dark-surface-light': '#1E1E1E',
        'dark-surface-lighter': '#2C2C2C',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      }
    },
  },
  plugins: [],
}
