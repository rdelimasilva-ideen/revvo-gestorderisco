/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'revvo-blue': '#0066FF',
        'revvo-dark-blue': '#0047B3',
        'gray-2': '#E5E7EB',
        'gray-3': '#6B7280',
        'error': '#EF4444',
      },
      fontFamily: {
        'onest': ['Onest', 'sans-serif'],
      },
      height: {
        'input': '48px',
      },
      backgroundImage: {
        'gradient-left': 'linear-gradient(to bottom, #043D7F, #131E2E)'
      },
    },
  },
  plugins: [],
}
