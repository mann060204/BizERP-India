import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: '#f1f5f9',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
          500: '#1E3A5F', // Primary Navy
          600: '#1a3353',
          700: '#152943',
          800: '#112034',
          900: '#0c1827',
        },
        action: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563EB', // Action Royal Blue
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3a8a',
        },
        sidebar: {
          DEFAULT: '#1E293B',
          active: '#0F172A',
        },
        crm: '#0284C7',
        payroll: '#059669',
        billing: '#7C3AED',
        inventory: '#EA580C',
        semantic: {
          success: '#16A34A',
          successLight: '#DCFCE7',
          successText: '#14532D',
          warning: '#CA8A04',
          warningLight: '#FEF9C3',
          warningText: '#713F12',
          error: '#DC2626',
          errorLight: '#FEE2E2',
          errorText: '#7F1D1D',
          info: '#0284C7',
          infoLight: '#E0F2FE',
          infoText: '#0C4A6E',
        }
      },
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
        '14': 'repeat(14, minmax(0, 1fr))',
      },
    },
  },
  plugins: [],
};
export default config;
