/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#07090f',
          900: '#0b0e17',
          850: '#10141f',
          800: '#151a28',
          700: '#1e2536',
          600: '#2a3348',
          500: '#3b4661',
        },
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'gradient-move': {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-up': 'fade-up .5s cubic-bezier(.22,1,.36,1) both',
        'fade-in': 'fade-in .4s ease both',
        'scale-in': 'scale-in .25s cubic-bezier(.22,1,.36,1) both',
        shimmer: 'shimmer 6s linear infinite',
        float: 'float 4s ease-in-out infinite',
        'gradient-move': 'gradient-move 8s ease infinite',
      },
    },
  },
  plugins: [],
};
