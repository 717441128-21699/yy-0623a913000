/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF9800',
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100',
        },
        success: {
          50: '#E8F5E9',
          500: '#4CAF50',
          600: '#16A34A',
          700: '#2E7D32',
        },
        danger: {
          50: '#FFEBEE',
          500: '#F44336',
          600: '#DC2626',
          700: '#C62828',
        },
        warning: {
          50: '#FFF8E1',
          500: '#FFC107',
          600: '#CA8A04',
        },
        darkblue: {
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      fontSize: {
        'display': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'heading': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        'subheading': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['18px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      boxShadow: {
        'card': '0 4px 16px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12)',
        'btn': '0 4px 0 rgba(0,0,0,0.15)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'bounce-in': 'bounce-in 0.4s ease-out',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '60%': { transform: 'scale(1.03)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
};
