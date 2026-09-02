/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Brand / Accent ──────────────────────────
        brand: {
          50: '#f0f2ff',
          100: '#d8ddff',
          200: '#b1bbff',
          300: '#8B99FF',
          400: '#7288FF',
          500: '#637BFF',
          600: '#5568E6',
          700: '#4755CC',
          800: '#3A44B3',
          900: '#2D3399',
          950: '#1A1F5C',
        },
        // ── Surfaces ────────────────────────────────
        surface: {
          0: 'var(--bg-primary)',
          50: 'var(--bg-secondary)',
          100: 'var(--bg-tertiary)',
          200: 'var(--bg-elevated)',
          300: 'var(--border-subtle)',
          400: 'var(--border-default)',
          500: 'var(--border-hover)',
          600: 'var(--text-muted)',
          700: 'var(--text-secondary)',
          800: 'var(--text-secondary)',
          900: 'var(--text-secondary)',
          950: 'var(--text-primary)',
        },
        // ── Semantic ────────────────────────────────
        success: {
          50: '#f0fdf8',
          100: '#d1fae8',
          500: '#35C99A',
          600: '#2AAE84',
        },
        warning: {
          50: '#fefaf0',
          100: '#fef3d8',
          500: '#E8A94A',
          600: '#D09540',
        },
        danger: {
          50: '#fef2f4',
          100: '#fde2e6',
          500: '#EF6B7A',
          600: '#D65A68',
        },
        info: {
          50: '#f0f7ff',
          100: '#dbeeff',
          500: '#4EA7FF',
          600: '#3B94E6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 123, 255, 0.12)',
        'glow-lg': '0 0 40px rgba(99, 123, 255, 0.18)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.16)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.24)',
        'elevated': '0 12px 40px rgba(0, 0, 0, 0.32)',
        'premium': '0 8px 30px rgba(0, 0, 0, 0.18)',
        'modal': '0 20px 60px rgba(0, 0, 0, 0.40)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-slide-up': 'fadeSlideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
