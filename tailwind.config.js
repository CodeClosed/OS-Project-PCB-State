/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        os: {
          bg: '#090D16',
          card: '#0F172A',
          cardBorder: '#1E293B',
          cardHover: '#1E293B',
          accent: '#3B82F6',
          cyan: '#06B6D4',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
          purple: '#8B5CF6',
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', 'Consolas', 'Monaco', 'monospace'],
        sans: ['"Fira Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px -5px rgba(59, 130, 246, 0.5)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.5)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.5)',
        'glow-rose': '0 0 20px -5px rgba(239, 68, 68, 0.5)',
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.5)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'beam': 'beam 2s linear infinite',
      },
      keyframes: {
        beam: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}
