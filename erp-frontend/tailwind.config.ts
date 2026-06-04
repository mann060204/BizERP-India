import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          light: "var(--primary-light)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          light: "var(--accent-light)",
        },
        // Keep old `action` for backward-compat with existing pages
        action: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3',
          800: '#312e81',
          900: '#1e1b4b',
        },
        brand: {
          50:  '#f1f5f9',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
          500: '#1E3A5F',
          600: '#1a3353',
          700: '#152943',
          800: '#112034',
          900: '#0c1827',
        },
        slate: {
          50: 'var(--bg)',
          100: 'var(--bg-elevated)',
          200: 'var(--border)',
          300: 'var(--border-focus)',
          400: 'var(--text-subtle)',
          500: 'var(--text-muted)',
          600: 'var(--text-muted)',
          700: 'var(--text)',
          800: 'var(--text)',
          900: 'var(--text)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar-bg)',
          active: 'var(--sidebar-active-bg)',
        },
        semantic: {
          success:      '#10b981',
          successLight: '#d1fae5',
          successText:  '#065f46',
          warning:      '#f59e0b',
          warningLight: '#fef3c7',
          warningText:  '#78350f',
          error:        '#f43f5e',
          errorLight:   '#ffe4e6',
          errorText:    '#881337',
          info:         '#06b6d4',
          infoLight:    '#ecfeff',
          infoText:     '#164e63',
        },
      },
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
        '14': 'repeat(14, minmax(0, 1fr))',
      },
      boxShadow: {
        'glow-primary': '0 0 24px -4px var(--primary-ring)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
export default config;
