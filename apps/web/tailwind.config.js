/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        google: {
          blue: '#4285F4',
          red: '#EA4335',
          yellow: '#FBBC04',
          green: '#34A853',
          dark: '#202124',
          grey: '#5F6368',
          light: '#F8F9FA'
        },
        tile: {
          yellow: '#FEE7A6',
          pink: '#FBD3CF',
          blue: '#CEEEF8',
          green: '#C9F4CA',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Google Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #202124',
        'brutal-lg': '6px 6px 0px 0px #202124',
        'brutal-active': '2px 2px 0px 0px #202124',
      }
    },
  },
  plugins: [],
}
