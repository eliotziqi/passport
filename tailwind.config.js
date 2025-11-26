export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'brand-ride': '#f97316',
        'brand-run': '#3b82f6',
        'brand-hike': '#22c55e',
        'map-stroke': '#e5e7eb',
      },
      animation: {
        breathe: 'breathe 2s infinite ease-in-out',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.5)', opacity: '0.4' },
        }
      }
    }
  },
  plugins: [],
};
