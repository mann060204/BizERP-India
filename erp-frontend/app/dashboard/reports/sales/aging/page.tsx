'use client';
import { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../../../../../lib/erp-api';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import DateRangeFilter from '../../../../../components/reports/DateRangeFilter';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

const statusColors: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  partial: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
};

export default function SalesAgingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getSalesAging();
      setData(res.data?.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const summary: any[] = data?.summary || [];
  const allItems: any[] = data?.allItems || [];
  const displayItems = activeTab === 'all' ? allItems : (summary.find((s: any) => s.range === activeTab)?.items || []);
  const totalBalance = allItems.reduce((s: number, i: any) => s + (i.balance || 0), 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded">Sales Report</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Sales Aging</h1>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-5">
        {/* Summary buckets */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div onClick={() => setActiveTab('all')} className={`glass rounded-2xl p-4 border cursor-pointer transition ${activeTab === 'all' ? 'border-slate-600 bg-slate-800 text-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">All Outstanding</p>
            <p className="text-xl font-bold">₹{totalBalance.toFixed(0)}</p>
            <p className="text-xs opacity-60 mt-1">{allItems.length} invoices</p>
          </div>
          {summary.map((s: any) => (
            <div key={s.range} onClick={() => setActiveTab(s.range)}
              className={`glass rounded-2xl p-4 border cursor-pointer transition ${activeTab === s.range
                ? 'border-orange-500 bg-orange-500 text-white'
                : s.range === '90+' ? 'border-red-200 bg-red-50 hover:border-red-300' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{s.range} Days</p>
              <p className="text-xl font-bold">₹{(s.totalBalance || 0).toFixed(0)}</p>
              <p className="text-xs opacity-60 mt-1">{s.count} invoice(s)</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="glass rounded-2xl border border-slate-200 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{['Invoice #', 'Date', 'Due Date', 'Customer', 'Total', 'Received', 'Balance', 'Days Overdue', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">Loading...</td></tr>
                ) : displayItems.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">No outstanding invoices found</td></tr>
                ) : displayItems.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{new Date(row.invoiceDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.customer || row.customerSnapshot?.name || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">₹{Number(row.grandTotal || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-green-600">₹{Number(row.amountReceived || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">₹{Number(row.balance || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${(row.daysOverdue || 0) > 60 ? 'bg-red-100 text-red-700' : (row.daysOverdue || 0) > 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                        {row.daysOverdue || 0} days
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[row.status] || 'bg-slate-100 text-slate-600'}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {!loading && displayItems.length > 0 && (
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-bold text-slate-700">Total ({displayItems.length})</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">₹{displayItems.reduce((s: number, r: any) => s + (r.grandTotal || 0), 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">₹{displayItems.reduce((s: number, r: any) => s + (r.amountReceived || 0), 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">₹{displayItems.reduce((s: number, r: any) => s + (r.balance || 0), 0).toFixed(2)}</td>
                    <td colSpan={2}></td>
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
