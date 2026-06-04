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
