import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAccountingBalance(value: number, type: 'customer' | 'supplier') {
  const numValue = value || 0;
  const absValue = Math.abs(numValue);
  const formattedAmount = `₹${absValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  if (numValue === 0) {
    return { text: formattedAmount, colorClass: 'text-slate-900', isDebit: false, isCredit: false };
  }

  let isDebit = false;
  let isCredit = false;

  if (type === 'customer') {
    if (numValue > 0) isDebit = true; // Customer owes us (Dr)
    else isCredit = true; // We owe customer / Advance (Cr)
  } else { // supplier
    if (numValue > 0) isCredit = true; // We owe supplier (Cr)
    else isDebit = true; // Supplier owes us / Advance (Dr)
  }

  return {
    text: `${formattedAmount} ${isDebit ? 'Dr' : 'Cr'}`,
    colorClass: isDebit ? 'text-red-500' : 'text-emerald-500',
    isDebit,
    isCredit
  };
}

export const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const;
export type DateFormat = typeof DATE_FORMATS[number];

export function getStoredDateFormat(): DateFormat {
  if (typeof window === 'undefined') return 'DD/MM/YYYY';
  const stored = localStorage.getItem('erp_date_format') as DateFormat;
  return DATE_FORMATS.includes(stored) ? stored : 'DD/MM/YYYY';
}

export function applyDateFormat(format: DateFormat) {
  localStorage.setItem('erp_date_format', format);
  // Dispatch custom event so components can update if needed
  window.dispatchEvent(new Event('erp_date_format_changed'));
}

export function formatDateGlobal(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const format = getStoredDateFormat();
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();

  switch (format) {
    case 'MM/DD/YYYY': return `${m}/${d}/${y}`;
    case 'YYYY-MM-DD': return `${y}-${m}-${d}`;
    case 'DD/MM/YYYY':
    default: return `${d}/${m}/${y}`;
  }
}

