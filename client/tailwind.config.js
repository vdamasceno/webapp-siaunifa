/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#003366',
        secondary: '#0066CC',
        background: '#F0F4F8',
        card: '#FFFFFF',
        'text-main': '#1A202C',
        'text-muted': '#6B7280',
        border: '#D1D5DB',
        success: '#16A34A', // Mantendo cores de feedback universais
        warning: '#FBBF24',
        danger: '#DC2626',
      },
    },
  },
  plugins: [],
}