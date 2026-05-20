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
        // Page surface — same hue as the logo's hexagonal backplate
        // (#D5DFDF) but lighter so it reads as a soft paper, not a heavy
        // panel. The bird's own backplate sits one step deeper inside it.
        parchment: {
          50: '#ECF0F0',       // body bg — soft paper
          100: '#DFE6E6',      // raised surface step / hover wash
          200: '#CFD9D9',      // borders / dividers
          300: '#B8C5C5',      // strong border / disabled
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
          // Surfaces — body sits on a soft paper one shade lighter than
          // the logo's own backplate
          'base-100': '#FFFFFF',
          'base-200': '#ECF0F0',
          'base-300': '#DFE6E6',
          'base-content': '#0F2A3D',
          neutral: '#1F3A47',
          'neutral-content': '#ECF0F0',
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
