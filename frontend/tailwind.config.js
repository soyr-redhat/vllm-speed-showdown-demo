/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'redhat': {
          red: '#EE0000',
          dark: '#1A1A1A',
        }
      }
    },
  },
  plugins: [],
}
