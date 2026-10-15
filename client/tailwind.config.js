/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          electric: '#0000FF',
          vivid: '#0000D0',
          bright: '#0000A8',
          sapphire: '#090DC2',
          royal: '#0B0EA6',
          deep: '#060A8A',
          navy: '#000080',
          midnight: '#03096D',
          abyss: '#020950',
          dark: '#000057',
        },
        surface: {
          white: '#FFFFFF',
          soft: '#F5F7FF',
          pale: '#E8EDFF',
          border: '#D9E1FA',
          muted: '#64708A',
          text: '#101A38',
        },
        blue: {
          50: '#F5F7FF',
          100: '#E8EDFF',
          200: '#D9E1FA',
          300: '#B0C2F8',
          400: '#5479EE',
          500: '#0000FF',
          600: '#0000D0',
          700: '#090DC2',
          800: '#0B0EA6',
          900: '#060A8A',
          950: '#020950',
        },
        navy: {
          50: '#F5F7FF',
          100: '#E8EDFF',
          200: '#D9E1FA',
          300: '#B0C2F8',
          400: '#5479EE',
          500: '#0B0EA6',
          600: '#090DC2',
          700: '#060A8A',
          800: '#000080',
          900: '#03096D',
          950: '#020950',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-electric': '0 0 25px -4px rgba(0, 0, 255, 0.45)',
        'glow-subtle': '0 4px 20px -2px rgba(9, 13, 194, 0.15)',
        'card-soft': '0 10px 30px -5px rgba(2, 9, 80, 0.06)',
      }
    },
  },
  plugins: [],
}
