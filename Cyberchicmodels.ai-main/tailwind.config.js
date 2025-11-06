/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        rose: {
          50: '#fff1f2',
          300: '#fda4af',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};