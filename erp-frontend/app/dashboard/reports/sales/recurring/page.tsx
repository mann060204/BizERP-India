'use client';
import { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../../../../../lib/erp-api';
import { ArrowLeft, RefreshCw, Loader2, ClipboardList, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  partial: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
};

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getActiveRecurring();
      setData(res.data?.data || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const totalBalance = data.reduce((s, r) => s + (r.balance || 0), 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-green-700 uppercase bg-green-50 px-2 py-0.5 rounded">Sales Report</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Active Recurring Invoices</h1>
            </div>
          </div>
          <button onClick={load} disabled={loading} className="erp-button-outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-5 border border-slate-200 bg-white">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-600">₹{totalBalance.toFixed(2)}</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-slate-200 bg-white">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Invoices Pending</p>
            <p className="text-2xl font-bold text-slate-900">{data.length}</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-red-200 bg-red-50/40">
            <p className="text-xs text-red-600 font-semibold uppercase tracking-wider mb-1">Overdue</p>
            <p className="text-2xl font-bold text-red-700">{data.filter(r => r.status === 'overdue').length}</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-yellow-200 bg-yellow-50/40">
            <p className="text-xs text-yellow-700 font-semibold uppercase tracking-wider mb-1">Partial Paid</p>
            <p className="text-2xl font-bold text-yellow-700">{data.filter(r => r.status === 'partial').length}</p>
          </div>
        </div>
        <div className="glass rounded-2xl border border-slate-200 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{['Invoice #', 'Date', 'Due Date', 'Customer', 'Mode', 'Total', 'Received', 'Balance', 'Days Overdue', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td colSpan={10} className="px-4 py-10 text-center">Loading...</td></tr>
                  : data.length === 0 ? <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-500">No outstanding invoices</td></tr>
                  : data.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono text-xs">{row.invoiceNumber}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{new Date(row.invoiceDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3 font-medium">{row.customerSnapshot?.name || 'Cash'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{row.paymentMode || 'Cash'}</td>
                      <td className="px-4 py-3 text-right">₹{Number(row.grandTotal||0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-green-600">₹{Number(row.amountReceived||0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">₹{Number(row.balance||0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${(row.daysOverdue||0) > 30 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {row.daysOverdue || 0}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[row.status] || 'bg-slate-100 text-slate-600'}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
