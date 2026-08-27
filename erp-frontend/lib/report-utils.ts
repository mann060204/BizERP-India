/**
 * report-utils.ts
 * ─────────────────────────────────────────────────────────────────
 * Shared safe-access utilities for all report pages.
 * Never throws on null / undefined / NaN / "" / 0.
 * ─────────────────────────────────────────────────────────────────
 */

/** Returns a safe finite number (0 if null / undefined / NaN / Infinity). */
export function safeNum(v: unknown): number {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

/** Formats a number as Indian Rupee currency string safely. */
export const safeINR = (v: unknown): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safeNum(v));

/** Returns a safe percentage number (0–100). */
export function safePct(v: unknown): number {
  const n = safeNum(v);
  return isFinite(n) ? n : 0;
}

/** Returns a formatted percentage string like "12.3%". */
export function safePctStr(v: unknown, decimals = 1): string {
  return `${safePct(v).toFixed(decimals)}%`;
}

/** Formats a date safely. Returns '—' for invalid dates. */
export function safeDate(v: unknown, locale = 'en-IN'): string {
  if (!v) return '—';
  try {
    const d = new Date(v as any);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(locale);
  } catch {
    return '—';
  }
}

/** Converts a Date to "YYYY-MM-DD" string for API params. */
export function formatDateForAPI(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns current financial year start (April 1). */
export function currentFYStart(): Date {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 3, 1); // April 1
}

/** Returns current financial year end (March 31). */
export function currentFYEnd(): Date {
  const start = currentFYStart();
  return new Date(start.getFullYear() + 1, 2, 31); // March 31 next year
}

/** Returns previous financial year start. */
export function prevFYStart(): Date {
  const start = currentFYStart();
  return new Date(start.getFullYear() - 1, 3, 1);
}

/** Returns previous financial year end. */
export function prevFYEnd(): Date {
  const start = currentFYStart();
  return new Date(start.getFullYear(), 2, 31);
}

/** Preset date ranges for reports. */
export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'this_month'
  | 'last_month'
  | 'this_fy'
  | 'prev_fy'
  | 'custom';

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export function getPresetRange(preset: DatePreset): DateRange {
  const now = new Date();
  const today = formatDateForAPI(now);

  switch (preset) {
    case 'today':
      return { from: today, to: today };

    case 'yesterday': {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      const s = formatDateForAPI(d);
      return { from: s, to: s };
    }

    case 'this_month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: formatDateForAPI(first), to: formatDateForAPI(last) };
    }

    case 'last_month': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: formatDateForAPI(first), to: formatDateForAPI(last) };
    }

    case 'this_fy':
      return {
        from: formatDateForAPI(currentFYStart()),
        to: formatDateForAPI(currentFYEnd()),
      };

    case 'prev_fy':
      return {
        from: formatDateForAPI(prevFYStart()),
        to: formatDateForAPI(prevFYEnd()),
      };

    default:
      return { from: formatDateForAPI(currentFYStart()), to: today };
  }
}

/** Compact number formatter (1.2K, 3.4L, 1.2Cr). */
export function compactINR(v: unknown): string {
  const n = safeNum(v);
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

/** Safely extracts an array from various API response shapes. */
export function extractArray(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (Array.isArray(res.items)) return res.items;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  return [];
}
