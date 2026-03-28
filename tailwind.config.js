/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#1a7f5a',
          light: '#e6f5ef',
          dark: '#0f5c40',
        },
      },
    },
  },
  plugins: [],
}
