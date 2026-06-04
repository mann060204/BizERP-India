'use client';
import { useEffect } from 'react';

export const THEMES = ['indigo', 'emerald', 'slate', 'rose'] as const;
export type Theme = typeof THEMES[number];

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('erp_theme', theme);
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'indigo';
  const stored = localStorage.getItem('erp_theme') as Theme;
  return THEMES.includes(stored) ? stored : 'indigo';
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const theme = getStoredTheme();
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return <>{children}</>;
}
