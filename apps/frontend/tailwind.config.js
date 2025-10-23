/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Perper Digital Brand Colors
        brand: {
          gold: '#F59E0B',        // Primary Gold/Amber
          orange: '#E95420',      // Secondary Orange Accent
          'dark-bg': '#1C1C1C',   // Dark Background
          'light-bg': '#FFFFFF',  // Light Background
          'text-dark': '#000000', // Dark Text
          'text-light': '#FFFFFF',// Light Text
          'text-muted': '#333333' // Muted Text
        },
        // Token-specific colors
        perper: {
          gold: '#F59E0B',
          black: '#000000'
        },
        perun: {
          silver: '#C0C0C0',
          black: '#000000'
        },
        zeta: {
          blue: '#3B82F6',
          black: '#000000'
        },
        adria: {
          teal: '#14B8A6',
          black: '#000000'
        }
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #F59E0B 0%, #E95420 100%)',
        'gradient-dark': 'linear-gradient(180deg, #1C1C1C 0%, #2B2B2B 100%)',
      },
      boxShadow: {
        'gold': '0 4px 14px 0 rgba(245, 158, 11, 0.39)',
        'orange': '0 4px 14px 0 rgba(233, 84, 32, 0.39)',
      }
    },
  },
  plugins: [],
}
