/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        'mzansi-sand': { 900: '#1c1917', 800: '#292524', 700: '#44403c' },
        'mzansi-gold': { 500: '#f59e0b', 400: '#facc15' },
        'mzansi-ocean': { 600: '#0f766e', 700: '#1d4ed8' },
        'mzansi-flag': { green: '#047857', orange: '#fb923c', red: '#be123c' },
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(-4px)' }, to: { opacity: 1, transform: 'none' } },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
        'dice-roll': {
          '0%': { transform: 'rotate(0) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.25)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .25s ease-out',
        shake: 'shake .35s ease-in-out',
        'dice-roll': 'dice-roll .5s ease-in-out',
      },
    },
  },
  plugins: [],
}
