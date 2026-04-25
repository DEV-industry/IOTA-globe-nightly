/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        iota: {
          bg: '#050609',
          card: '#0F141C',
          border: '#1f2937',
          text: '#ffffff',
          label: '#94a3b8',
          muted: '#64748b',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          hover: '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'ring-pulse': 'ringPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ringPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 3px rgba(6,182,212,0.3))' },
          '50%': { filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.6))' },
        },
      },
    },
  },
  plugins: [],
};
