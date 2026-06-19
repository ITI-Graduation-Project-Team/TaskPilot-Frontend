/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brandPrimary: '#D51C39',
        brandSecondary: '#121338',
        brandLight: '#F6F6F6',
        brandWhite: '#FAFAFA',
        brandAccent: '#DECCCC'
      }
    },
  },
  plugins: [],
}