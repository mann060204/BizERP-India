'use client';
import { useState, useCallback } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import DateRangeFilter from '../../../../../components/reports/DateRangeFilter';
import { reportsApi } from '../../../../../lib/erp-api';

const now = new Date(); const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

export default function Page() {
  const [from, setFrom] = useState(firstDay); const [to, setTo] = useState(lastDay); const [key, setKey] = useState(0);
  const [category, setCategory] = useState('');

  const columns: any[] = [
    { key: 'date', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'category', label: 'Category' },
    { key: 'vendorName', label: 'Vendor' },
    { key: 'amount', label: 'Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'gstRate', label: 'GST %', align: 'center', format: (v: any) => `${v||0}%` },
    { key: 'gstTotal', label: 'GST Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'totalWithTax', label: 'Total (incl. GST)', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'paymentMode', label: 'Mode', align: 'center' },
    { key: 'notes', label: 'Notes' },
  ];

  const fetchData = useCallback(async () => {
    const res = await reportsApi.getExpensesSearch({ from, to, ...(category ? { category } : {}) });
    return res.data?.data || [];
  }, [from, to, category]);

  return (
    <ReportLayout title="Search Expenses" subtitle={`Filterable expense list • ${from} to ${to}`}
      category="Expenses" columns={columns} fetchData={fetchData} key={`${key}-${from}-${to}-${category}`}
      extraHeader={
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onRefresh={() => setKey(k => k + 1)} />
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Category</label>
            <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Rent, Utilities..."
              className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-300 transition w-40" />
          </div>
        </div>
      }
    />
  );
}
