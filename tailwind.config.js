/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Dynamic theme variables
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-dark': 'var(--primary-dark)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        background: 'var(--background)',
        surface: 'var(--surface)',
        card: 'var(--card)',
        sidebar: 'var(--sidebar)',
        border: 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        info: 'var(--info)',

        // Backward compatibility mappings
        brandPrimary: 'var(--primary)',
        brandSecondary: 'var(--text-primary)',
        brandLight: 'var(--background)',
        brandWhite: 'var(--surface)',
        brandAccent: 'var(--border)'
      }
    },
  },
  plugins: [],
}