/** @type {import('tailwindcss').Config} */
// M10.2 design tokens: every used color step is backed by a CSS variable
// (RGB triplet) defined in src/index.css with a `.dark` override. This makes
// the whole existing class vocabulary theme-aware without sweeping files.
// Opacity modifiers (bg-surface/95, bg-slate-500/10…) keep working via
// <alpha-value>. Steps NOT listed here fall back to Tailwind defaults
// (light-only) — extend the var set when adopting a new step.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--dm-surface) / <alpha-value>)',
        slate: {
          50: 'rgb(var(--dm-slate-50) / <alpha-value>)',
          100: 'rgb(var(--dm-slate-100) / <alpha-value>)',
          200: 'rgb(var(--dm-slate-200) / <alpha-value>)',
          300: 'rgb(var(--dm-slate-300) / <alpha-value>)',
          400: 'rgb(var(--dm-slate-400) / <alpha-value>)',
          500: 'rgb(var(--dm-slate-500) / <alpha-value>)',
          600: 'rgb(var(--dm-slate-600) / <alpha-value>)',
          700: 'rgb(var(--dm-slate-700) / <alpha-value>)',
          800: 'rgb(var(--dm-slate-800) / <alpha-value>)',
          900: 'rgb(var(--dm-slate-900) / <alpha-value>)',
        },
        indigo: {
          50: 'rgb(var(--dm-indigo-50) / <alpha-value>)',
          100: 'rgb(var(--dm-indigo-100) / <alpha-value>)',
          200: 'rgb(var(--dm-indigo-200) / <alpha-value>)',
          300: 'rgb(var(--dm-indigo-300) / <alpha-value>)',
          400: 'rgb(var(--dm-indigo-400) / <alpha-value>)',
          500: 'rgb(var(--dm-indigo-500) / <alpha-value>)',
          600: 'rgb(var(--dm-indigo-600) / <alpha-value>)',
          700: 'rgb(var(--dm-indigo-700) / <alpha-value>)',
          800: 'rgb(var(--dm-indigo-800) / <alpha-value>)',
        },
        emerald: {
          50: 'rgb(var(--dm-emerald-50) / <alpha-value>)',
          200: 'rgb(var(--dm-emerald-200) / <alpha-value>)',
          300: 'rgb(var(--dm-emerald-300) / <alpha-value>)',
          500: 'rgb(var(--dm-emerald-500) / <alpha-value>)',
          600: 'rgb(var(--dm-emerald-600) / <alpha-value>)',
          700: 'rgb(var(--dm-emerald-700) / <alpha-value>)',
          800: 'rgb(var(--dm-emerald-800) / <alpha-value>)',
        },
        red: {
          50: 'rgb(var(--dm-red-50) / <alpha-value>)',
          200: 'rgb(var(--dm-red-200) / <alpha-value>)',
          300: 'rgb(var(--dm-red-300) / <alpha-value>)',
          500: 'rgb(var(--dm-red-500) / <alpha-value>)',
          600: 'rgb(var(--dm-red-600) / <alpha-value>)',
          700: 'rgb(var(--dm-red-700) / <alpha-value>)',
          800: 'rgb(var(--dm-red-800) / <alpha-value>)',
        },
        amber: {
          50: 'rgb(var(--dm-amber-50) / <alpha-value>)',
          200: 'rgb(var(--dm-amber-200) / <alpha-value>)',
          300: 'rgb(var(--dm-amber-300) / <alpha-value>)',
          500: 'rgb(var(--dm-amber-500) / <alpha-value>)',
          600: 'rgb(var(--dm-amber-600) / <alpha-value>)',
          700: 'rgb(var(--dm-amber-700) / <alpha-value>)',
          800: 'rgb(var(--dm-amber-800) / <alpha-value>)',
        },
        sky: {
          50: 'rgb(var(--dm-sky-50) / <alpha-value>)',
          300: 'rgb(var(--dm-sky-300) / <alpha-value>)',
          600: 'rgb(var(--dm-sky-600) / <alpha-value>)',
          800: 'rgb(var(--dm-sky-800) / <alpha-value>)',
        },
        rose: {
          50: 'rgb(var(--dm-rose-50) / <alpha-value>)',
          400: 'rgb(var(--dm-rose-400) / <alpha-value>)',
          600: 'rgb(var(--dm-rose-600) / <alpha-value>)',
          700: 'rgb(var(--dm-rose-700) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
