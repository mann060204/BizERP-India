'use client';
import { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../../../../../lib/erp-api';
import DateRangeFilter from '../../../../../components/reports/DateRangeFilter';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

export default function Page() {
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(lastDay);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getIndirectExpenses({ from, to });
      setData(res.data?.data);
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, []);

  const summary: any[] = data?.summary || [];
  const grandTotal: number = data?.grandTotal || 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-rose-700 uppercase bg-rose-50 px-2 py-0.5 rounded">Expenses Report</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Indirect Expenses</h1>
            </div>
          </div>
        </div>
      </header>
      <div className="bg-white border-b border-slate-100 px-6 py-3 max-w-7xl mx-auto w-full">
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onRefresh={load} loading={loading} />
      </div>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-5">
        {/* Grand total card */}
        <div className="glass rounded-2xl p-6 border border-rose-100 bg-gradient-to-r from-rose-50 to-white flex items-center justify-between">
          <div>
            <p className="text-sm text-rose-600 font-semibold uppercase tracking-wider mb-1">Total Indirect Expenses</p>
            <p className="text-3xl font-bold text-rose-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(grandTotal))}</p>
          </div>
          <div className="text-rose-200">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="glass rounded-2xl border border-slate-200 overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Expenses by Category</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Category', 'Transactions', 'Base Amount', 'GST Amount', 'Total (incl. GST)', '% of Total'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td colSpan={6} className="px-4 py-10 text-center">Loading...</td></tr>
                  : summary.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No expenses found</td></tr>
                  : summary.map((row: any, i: number) => {
                    const pct = grandTotal > 0 ? ((row.totalWithTax / grandTotal) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-medium text-slate-900">{row._id || 'Uncategorized'}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{row.count}</td>
                        <td className="px-4 py-3 text-right">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(row.totalAmount||0))}</td>
                        <td className="px-4 py-3 text-right text-orange-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(row.totalGST||0))}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(row.totalWithTax||0))}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                              <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, parseFloat(pct))}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 min-w-[40px] text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              {!loading && summary.length > 0 && (
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr>
                    <td className="px-4 py-3 font-bold text-slate-900">Total</td>
                    <td className="px-4 py-3 text-center font-bold">{summary.reduce((s: number, r: any) => s + (r.count || 0), 0)}</td>
                    <td className="px-4 py-3 text-right font-bold">₹{summary.reduce((s: number, r: any) => s + (r.totalAmount || 0), 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600">₹{summary.reduce((s: number, r: any) => s + (r.totalGST || 0), 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(grandTotal)}</td>
                    <td className="px-4 py-3 text-center font-bold">100%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
