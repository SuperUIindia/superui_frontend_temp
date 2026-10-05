/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: {
          soft: '#FAFAFA',
          border: '#EDEDED'
        },
        body: '#111111',
        muted: '#6B6B6B',
        brand: {
          orange: '#FF5E00',
          orangeGlow: 'rgba(255, 94, 0, 0.35)',
          orangeTint: '#FFF1E8',
          violet: '#7C3AED',
          violetGlow: 'rgba(124, 58, 237, 0.30)',
          violetTint: '#F3EEFF'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        claude: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'marquee-left': 'marqueeLeft 35s linear infinite',
        'marquee-right': 'marqueeRight 35s linear infinite',
        'float-slow': 'floatSlow 14s ease-in-out infinite alternate',
        'float-reverse': 'floatReverse 16s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        marqueeLeft: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        marqueeRight: {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' }
        },
        floatSlow: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(35px, 25px) scale(1.08)' },
          '100%': { transform: 'translate(-20px, 40px) scale(0.95)' }
        },
        floatReverse: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(-35px, -20px) scale(1.06)' },
          '100%': { transform: 'translate(25px, -35px) scale(0.92)' }
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      }
    },
  },
  plugins: [],
};
