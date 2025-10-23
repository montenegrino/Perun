/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
      }
    },
  },
  plugins: [],
}
