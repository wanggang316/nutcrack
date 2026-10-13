/** @type {import('tailwindcss').Config} */
const tokens = require('./theme/tokens.cjs');

const tok = (name) =>
  `color-mix(in srgb, var(--nc-${name}) calc(<alpha-value> * 100%), transparent)`;

const toVars = (t) =>
  Object.fromEntries(Object.entries(t).map(([k, v]) => [`--nc-${k}`, v]));

const daisyTheme = (t) => ({
  primary: t.primary,
  'primary-content': t['on-primary'],
  secondary: t['primary-hover'],
  'secondary-content': t['on-primary'],
  accent: t.primary,
  'accent-content': t['on-primary'],
  neutral: t.text,
  'neutral-content': t.bg,
  'base-100': t.surface,
  'base-200': t.bg,
  'base-300': t.raised,
  'base-content': t.text,
  info: t['tag-4-text'],
  'info-content': t.surface,
  success: t.success,
  'success-content': t.surface,
  warning: t.warn,
  'warning-content': t.surface,
  error: t.error,
  'error-content': t.surface,
  '--rounded-box': '0.75rem',
  '--rounded-btn': '0.5rem',
  '--rounded-badge': '0.375rem',
});

export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Every colour routes through the v3 palette C tokens (theme/tokens.cjs
        // → --nc-* CSS variables). color-mix keeps `/opacity` modifiers working.
        nc: {
          bg: tok('bg'),
          surface: tok('surface'),
          raised: tok('raised'),
          sunken: tok('sunken'),
          border: tok('border'),
          'border-strong': tok('border-strong'),
          text: tok('text'),
          muted: tok('muted'),
          subtle: tok('subtle'),
          primary: tok('primary'),
          'primary-hover': tok('primary-hover'),
          'primary-soft': tok('primary-soft'),
          'on-primary-soft': tok('on-primary-soft'),
          'on-primary': tok('on-primary'),
          success: tok('success'),
          warn: tok('warn'),
          error: tok('error'),
          scrim: tok('scrim'),
          'tag-1-bg': tok('tag-1-bg'),
          'tag-1-text': tok('tag-1-text'),
          'tag-2-bg': tok('tag-2-bg'),
          'tag-2-text': tok('tag-2-text'),
          'tag-3-bg': tok('tag-3-bg'),
          'tag-3-text': tok('tag-3-text'),
          'tag-4-bg': tok('tag-4-bg'),
          'tag-4-text': tok('tag-4-text'),
        },
        // Legacy names kept as aliases so the existing system extends
        // rather than breaks; all of them now resolve to tokens.
        ink: tok('text'),
        teal: {
          50: tok('primary-soft'),
          100: tok('primary-soft'),
          400: tok('primary'),
          500: tok('primary'),
          600: tok('primary'),
          700: tok('on-primary-soft'),
        },
        ember: {
          400: tok('primary'),
          500: tok('primary'),
          600: tok('primary-hover'),
        },
        parchment: {
          50: tok('bg'),
          100: tok('raised'),
          200: tok('border'),
          300: tok('border-strong'),
        },
        white: tok('surface'),
        black: tok('scrim'),
      },
      fontFamily: {
        // System grotesk for latin, native CJK fallback for 中文 — no
        // webfont body dependency, renders SF Pro / Segoe natively.
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
        // Editorial serif — masthead wordmark, date-lines, entry numerals.
        // Latin/digits only; CJK falls back to a system serif.
        display: [
          'Fraunces',
          'ui-serif',
          'Georgia',
          'Songti SC',
          'serif',
        ],
        // Reading serif — link summaries (16px / 1.8).
        serif: [
          '"Source Serif 4"',
          '"Noto Serif SC"',
          'ui-serif',
          'Georgia',
          'Songti SC',
          'serif',
        ],
        // Crafted meta — domains, dates, counts.
        mono: [
          'ui-monospace',
          'SF Mono',
          'JetBrains Mono',
          'Menlo',
          'monospace',
        ],
      },
    },
  },
  plugins: [
    require('daisyui'),
    ({ addBase }) =>
      addBase({
        ':root, [data-theme="light"]': toVars(tokens.light),
        '[data-theme="dark"]': { 'color-scheme': 'dark', ...toVars(tokens.dark) },
      }),
  ],
  daisyui: {
    themes: [{ light: daisyTheme(tokens.light) }, { dark: daisyTheme(tokens.dark) }],
    darkTheme: 'dark',
    logs: false,
  },
};
