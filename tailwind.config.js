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

        // abdelhay-branch branding & colors
        brandPrimary: 'var(--primary)',
        brandSecondary: 'var(--text-primary)',
        brandLight: 'var(--background)',
        brandWhite: 'var(--surface)',
        brandAccent: 'var(--border)',
        brandNavy: '#0B1329',
        brandBlue: '#2563EB',
        brandTeal: '#0EA5E9',
        brandCardLight: '#F8FAFC',
        brandCardDark: '#1E293B'
      }
    },
  },
  plugins: [],
}