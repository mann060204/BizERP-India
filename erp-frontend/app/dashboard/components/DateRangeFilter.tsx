'use client';
import { useState } from 'react';
import { CalendarRange } from 'lucide-react';

export type FilterParams = {
  period?: 'week' | 'month' | 'year';
  from?: string;
  to?: string;
};

interface Props {
  onChange: (params: FilterParams) => void;
  defaultPeriod?: 'week' | 'month' | 'year';
}

export default function DateRangeFilter({ onChange, defaultPeriod = 'month' }: Props) {
  const [active, setActive] = useState<'week' | 'month' | 'year' | 'custom'>(defaultPeriod);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const handlePeriod = (p: 'week' | 'month' | 'year') => {
    setActive(p);
    setFrom('');
    setTo('');
    onChange({ period: p });
  };

  const handleCustom = () => {
    if (!from || !to) return;
    setActive('custom');
    onChange({ from, to });
  };

  const btnBase = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition';
  const btnActive = 'bg-indigo-600 text-white shadow-sm';
  const btnInactive = 'bg-slate-100 text-slate-600 hover:bg-slate-200';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(['week', 'month', 'year'] as const).map(p => (
        <button key={p} onClick={() => handlePeriod(p)}
          className={`${btnBase} ${active === p ? btnActive : btnInactive}`}>
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      ))}
      <div className="flex items-center gap-1 ml-1">
        <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-indigo-300" />
        <span className="text-slate-400 text-xs">–</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-indigo-300" />
        <button onClick={handleCustom} disabled={!from || !to}
          className={`${btnBase} ${active === 'custom' ? btnActive : btnInactive} disabled:opacity-40`}>
          Apply
        </button>
      </div>
    </div>
  );
}
