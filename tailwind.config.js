// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './src/features/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'ping-slow': 'ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        wave: 'wave 1s ease-in-out infinite',
      },
      keyframes: {
        'ping-slow': {
          '75%, 100%': {
            transform: 'scale(2)',
            opacity: '0',
          },
        },
        wave: {
          '0%': { transform: 'rotate(0deg)' },
          '10%': { transform: 'rotate(-15deg)' },
          '20%': { transform: 'rotate(15deg)' },
          '30%': { transform: 'rotate(-10deg)' },
          '40%': { transform: 'rotate(10deg)' },
          '50%': { transform: 'rotate(-5deg)' },
          '60%': { transform: 'rotate(5deg)' },
          '70%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
}
