/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Logo-derived palette.
        ink: '#0F2A3D',        // deep navy-teal — outlines / body text
        teal: {
          50: '#ECF7F4',
          100: '#D0EBE6',
          400: '#2BA3A0',
          500: '#1F8A86',
          600: '#0F766E',      // primary: bird body
          700: '#0E5F58',
        },
        ember: {
          400: '#F08A4A',
          500: '#EA580C',      // accent: wings / nut
          600: '#C2410C',
        },
        parchment: {
          50: '#FBF7EE',       // page background
          100: '#F5EFDF',
          200: '#EAE3D2',
          300: '#D9D0BB',
        },
        // Cool panel surface — sampled from the logo's hexagonal backplate.
        // Used for sidebars and other "framing" surfaces so they read as part
        // of the same paper the bird sits on.
        frame: {
          50: '#EDF1F1',       // hover wash
          100: '#DEE6E6',
          200: '#D5DFDF',      // logo backplate — sidebar bg
          300: '#BDC9C9',      // panel border
        },
      },
      fontFamily: {
        // Inter handles latin, system CJK fallback for 中文.
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes')['light'],
          // Brand
          primary: '#0F766E',
          'primary-content': '#FFFFFF',
          'primary-focus': '#0E5F58',
          secondary: '#1F8A86',
          'secondary-content': '#FFFFFF',
          accent: '#EA580C',
          'accent-content': '#FFFFFF',
          // Surfaces — warm ivory matching the logo's parchment backdrop
          'base-100': '#FFFFFF',
          'base-200': '#FBF7EE',
          'base-300': '#F5EFDF',
          'base-content': '#0F2A3D',
          neutral: '#1F3A47',
          'neutral-content': '#FBF7EE',
          // Semantics
          info: '#0EA5E9',
          'info-content': '#FFFFFF',
          success: '#16A34A',
          'success-content': '#FFFFFF',
          warning: '#D97706',
          'warning-content': '#FFFFFF',
          error: '#B42318',
          'error-content': '#FFFFFF',
          // Tokens
          '--rounded-box': '0.75rem',
          '--rounded-btn': '0.5rem',
          '--rounded-badge': '0.375rem',
        },
      },
    ],
    logs: false,
  },
};
