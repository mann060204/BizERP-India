'use client';
import { RefreshCw } from 'lucide-react';

interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  showStatus?: boolean;
  status?: string;
  onStatusChange?: (v: string) => void;
  statusOptions?: { value: string; label: string }[];
}

export default function DateRangeFilter({
  from, to, onFromChange, onToChange, onRefresh, loading,
  showStatus, status, onStatusChange, statusOptions
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500 font-medium">From</label>
        <input type="date" value={from} onChange={e => onFromChange(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-300 transition" />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500 font-medium">To</label>
        <input type="date" value={to} onChange={e => onToChange(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-300 transition" />
      </div>
      {showStatus && onStatusChange && statusOptions && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Status</label>
          <select value={status} onChange={e => onStatusChange(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-300 transition">
            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      )}
      <button onClick={onRefresh} disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50">
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        Apply
      </button>
    </div>
  );
}
