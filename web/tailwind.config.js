/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes')['light'],
          primary: '#007ACC',
          'primary-content': '#ffffff',
          'primary-focus': '#0066b3',
          'success': '#21883E',
          'success-content': '#ffffff',
          'warning': '#EAC650',
          'warning-content': '#ffffff',
          'error': '#D1242F',
          'error-content': '#ffffff',
        },
        dark: {
          ...require('daisyui/src/theming/themes')['dark'],
          primary: '#007ACC',
          'primary-content': '#ffffff',
          'primary-focus': '#3399cc',
          'success': '#21883E',
          'success-content': '#ffffff',
          'warning': '#EAC650',
          'warning-content': '#ffffff',
          'error': '#D1242F',
          'error-content': '#ffffff',
        },
      },
    ],
  },
};
