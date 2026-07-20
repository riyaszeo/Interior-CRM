/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6D28D9',
          dark: '#5B21B6',
          light: '#F3E8FF',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
        },
        accent: {
          DEFAULT: '#F59E0B',
        },
        slatebg: {
          DEFAULT: '#F8FAFC',
        },
        headings: {
          DEFAULT: '#111827',
        },
        bodytext: {
          DEFAULT: '#4B5563',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        playfair: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(109, 40, 217, 0.05), 0 2px 12px -1px rgba(0, 0, 0, 0.03)',
        'premium-lg': '0 10px 30px -5px rgba(109, 40, 217, 0.08), 0 4px 18px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
