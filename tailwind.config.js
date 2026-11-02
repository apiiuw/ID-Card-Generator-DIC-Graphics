/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dic: {
          blue: '#0054A6',
          darkBlue: '#003366',
          lightBlue: '#E6F0FA',
          red: '#ED1C24',
          darkRed: '#C41219',
          green: '#00953B',
          yellow: '#FFD100',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

