/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brandPrimary: '#2563EB',
        brandSecondary: '#0B1329',
        brandLight: '#F8FAFC',
        brandWhite: '#FFFFFF',
        brandAccent: '#0EA5E9',
        brandNavy: '#0B1329',
        brandBlue: '#2563EB',
        brandTeal: '#0EA5E9',
        brandCardLight: '#F8FAFC',
        brandCardDark: '#1E293B',
      }
    },
  },
  plugins: [],
}