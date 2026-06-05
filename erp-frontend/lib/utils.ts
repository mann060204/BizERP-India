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
    colorClass: isDebit ? 'text-emerald-600' : 'text-red-600',
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

export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh', '05': 'Uttarakhand',
  '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar',
  '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
  '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat', '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra', '28': 'Andhra Pradesh (Old)', '29': 'Karnataka', '30': 'Goa',
  '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh'
};

export function getGSTStateName(gstinOrCode: string | null | undefined): string {
  if (!gstinOrCode) return '—';
  const code = gstinOrCode.substring(0, 2);
  const stateName = GST_STATE_CODES[code];
  return stateName ? `${stateName} (${code})` : `Unknown (${code})`;
}
