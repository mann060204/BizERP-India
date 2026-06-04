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

import { getStoredDateFormat, formatDateGlobal } from '../lib/utils';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const theme = getStoredTheme();
    document.documentElement.setAttribute('data-theme', theme);

    // Global Date Format Override
    const originalToLocaleDateString = Date.prototype.toLocaleDateString;
    Date.prototype.toLocaleDateString = function(locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) {
      // Let standard formatting pass if options are explicitly provided (like short months)
      if (options && Object.keys(options).length > 0) {
        return originalToLocaleDateString.call(this, locales, options);
      }
      return formatDateGlobal(this);
    };

    const forceUpdate = () => { /* trigger re-render on listeners if needed, mostly router reload helps */ };
    window.addEventListener('erp_date_format_changed', forceUpdate);
    return () => {
      window.removeEventListener('erp_date_format_changed', forceUpdate);
      Date.prototype.toLocaleDateString = originalToLocaleDateString;
    };
  }, []);

  return <>{children}</>;
}
