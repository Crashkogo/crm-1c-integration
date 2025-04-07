/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // Жёлтые цвета (акценты 1С)
          '1c-yellow': '#FFCC33',
          '1c-yellow-light': '#FFF9E5',
          '1c-yellow-dark': '#E6B800',
          // Серые цвета
          '1c-gray-dark': '#333333',
          '1c-gray': '#666666',
          '1c-gray-light': '#CCCCCC',
          '1c-form-bg': '#F5F5F5',
          // Красные цвета
          '1c-red': '#FF3333',
          '1c-red-light': '#FFEBEB',
          // Дополнительные цвета
          '1c-blue': '#3366CC',
          '1c-green': '#66CC66',
        },
        fontFamily: {
          sans: ['Arial', 'sans-serif'],
        },
        boxShadow: {
          '1c': '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    plugins: [],
  };