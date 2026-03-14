/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 'media'도 가능하지만 class 추천
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",  // app router
    "./pages/**/*.{js,ts,jsx,tsx}", // pages router
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}