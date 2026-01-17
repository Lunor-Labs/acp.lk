export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary Color (Gold/Yellow)
        primary: {
          DEFAULT: '#f3b113',
          50: '#fef9e7',
          100: '#fdf0c4',
          200: '#fbe58d',
          300: '#f9d856',
          400: '#f3b113',
          500: '#e09d0a',
          600: '#c28507',
          700: '#9a6a06',
          800: '#7d5605',
          900: '#664603',
        },
        // Dark Theme Colors
        dark: {
          DEFAULT: '#383838',
          50: '#4a4a4a',
          100: '#383838',
          900: '#1a1a1a',
        },
        // Gray Scale
        gray: {
          DEFAULT: '#828282',
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#c2c2c2',
          300: '#a3a3a3',
          400: '#828282',
          500: '#6b6b6b',
          600: '#545454',
          700: '#3d3d3d',
          800: '#262626',
          900: '#0f0f0f',
        },
        // Neutral Colors
        neutral: {
          white: '#FFFFFF',
          black: '#000000',
        },
        // Status Colors
        success: '#00C853',
        warning: '#FFB300',
        error: '#D32F2F',
        info: '#0288D1',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'shine': 'shine 1.5s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
