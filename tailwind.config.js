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
        base: {
          dark: '#2A2527',
          light: '#F1ECE6',
        },
        surface: {
          dark: '#302A2C',
          light: '#FAF7F2',
        },
        primary: {
          dark: '#F5EFE9',
          light: '#2A2527',
        },
        muted: {
          dark: '#B8A9A0',
          light: '#7A6E67',
        },
        accent: {
          peach: '#F0A9A0',
          peachHover: '#E5988F',
        },
        card: {
          sand: '#D9CBB5',
          blush: '#F7E3DE',
          cream: '#FAF8F4',
        },
        status: {
          safe: '#9CCDB0',
          info: '#A9C8E3',
          warning: '#F0A9A0',
          critical: '#E57373',
          offline: '#8E8585',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neu-flat-dark': '8px 8px 16px #1F1B1C, -8px -8px 16px #382F32',
        'neu-pressed-dark': 'inset 6px 6px 12px #1F1B1C, inset -6px -6px 12px #382F32',
        'neu-sm-dark': '4px 4px 10px #1F1B1C, -4px -4px 10px #382F32',
        'neu-flat-light': '8px 8px 16px #D4CEC6, -8px -8px 16px #FFFFFF',
        'neu-pressed-light': 'inset 6px 6px 12px #D4CEC6, inset -6px -6px 12px #FFFFFF',
        'neu-sm-light': '4px 4px 10px #D4CEC6, -4px -4px 10px #FFFFFF',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '40px',
      }
    },
  },
  plugins: [],
}
