'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { reportsApi } from '../../../../lib/erp-api';
import { Loader2, ArrowUpRight, ArrowDownRight, BookOpen, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DaybookPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.daybook({ date: targetDate });
      // daybook returns { date, transactions, totalInflow, totalOutflow, netCashFlow } directly (no sendSuccess wrapper)
      setData(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load daybook');
    } finally {
      setLoading(false);
    }
  }, [targetDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Use backend-computed totals for accuracy; fallback to client-side computation
  const transactions: any[] = data?.transactions || [];
  const totalInflow = data?.totalInflow ?? transactions
    .filter((t: any) => t.type === 'Sale')
    .reduce((s: number, t: any) => s + (Number(t.received) || 0), 0);
  const totalOutflow = data?.totalOutflow ?? transactions
    .filter((t: any) => t.type !== 'Sale')
    .reduce((s: number, t: any) => s + (Number(t.paid) || 0), 0);
  const netCashFlow = totalInflow - totalOutflow;

  const typeColor: Record<string, string> = {
    Sale: 'bg-green-400/10 text-green-600',
    Purchase: 'bg-red-400/10 text-red-600',
    Expense: 'bg-orange-400/10 text-orange-600',
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Daybook Ledger" />
      <main className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Daily Transaction Ledger</h2>
            <p className="text-slate-600 text-sm mt-0.5">Chronological record of all sales, purchases & expenses</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-orange-300 transition"
            />
            <button
              onClick={fetchReport}
              disabled={loading}
              className="erp-button-outline"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Summary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-5 border border-green-200 bg-green-50/40">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownRight className="w-4 h-4 text-green-500" />
                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Total Receipts (Inflow)</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(totalInflow))}</p>
                <p className="text-xs text-slate-500 mt-1">{transactions.filter((t: any) => t.type === 'Sale').length} sale(s)</p>
              </div>
              <div className="glass rounded-2xl p-5 border border-red-200 bg-red-50/40">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Total Payments (Outflow)</p>
                </div>
                <p className="text-2xl font-bold text-red-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(totalOutflow))}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {transactions.filter((t: any) => t.type === 'Purchase').length} purchase(s),&nbsp;
                  {transactions.filter((t: any) => t.type === 'Expense').length} expense(s)
                </p>
              </div>
              <div className={`glass rounded-2xl p-5 border ${netCashFlow >= 0 ? 'border-blue-200 bg-blue-50/40' : 'border-red-200 bg-red-50/40'}`}>
                <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {netCashFlow >= 0 ? '+' : ''}{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(netCashFlow))}
                </p>
                <p className="text-xs text-slate-500 mt-1">{transactions.length} total transaction(s)</p>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center">
                <BookOpen className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-900 font-semibold text-lg">No transactions on this date</p>
                <p className="text-slate-500 text-sm mt-1">Try selecting a different date</p>
              </div>
            ) : (
              <div className="glass rounded-2xl overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {['Time', 'Type', 'Reference', 'Party / Details', 'Mode', 'Inflow (+)', 'Outflow (-)'].map(h => (
                          <th key={h} className="text-left px-5 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((t: any, idx: number) => {
                        const isInflow = t.type === 'Sale';
                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-4 text-slate-500 text-xs">
                              {new Date(t.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeColor[t.type] || 'bg-slate-100 text-slate-600'}`}>
                                {isInflow ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                {t.type}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-900 font-mono text-xs">{t.ref || '—'}</td>
                            <td className="px-5 py-4 text-slate-900 font-medium">{t.party || '—'}</td>
                            <td className="px-5 py-4 text-slate-500 text-xs">{t.mode || 'Cash'}</td>
                            <td className="px-5 py-4 font-semibold text-green-600">
                              {isInflow ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(t.received || 0)) : '—'}
                            </td>
                            <td className="px-5 py-4 font-semibold text-red-600">
                              {!isInflow ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(t.paid || 0)) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-300 bg-slate-50">
                      <tr>
                        <td colSpan={5} className="px-5 py-3 font-bold text-slate-700 text-sm">
                          Total ({transactions.length} transactions)
                        </td>
                        <td className="px-5 py-3 font-bold text-green-600 text-sm">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(totalInflow))}
                        </td>
                        <td className="px-5 py-3 font-bold text-red-600 text-sm">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(totalOutflow))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass rounded-2xl p-16 text-center">
            <p className="text-slate-500">Failed to load data. Please try again.</p>
          </div>
        )}
      </main>
    </div>
  );
}
