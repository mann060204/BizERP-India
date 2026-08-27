'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ArrowLeft, AlertTriangle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { reportsApi } from '../../../../../lib/erp-api';
import { safeINR, safeNum } from '../../../../../lib/report-utils';

const INR = safeINR;

interface AgingBucket { label: string; key: string; color: string; headerColor: string }

const BUCKETS: AgingBucket[] = [
  { label: '0–30 days', key: 'b0_30', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', headerColor: 'text-emerald-700' },
  { label: '31–60 days', key: 'b31_60', color: 'bg-yellow-50 text-yellow-800 border-yellow-200', headerColor: 'text-yellow-700' },
  { label: '61–90 days', key: 'b61_90', color: 'bg-orange-50 text-orange-800 border-orange-200', headerColor: 'text-orange-700' },
  { label: '91–180 days', key: 'b91_180', color: 'bg-red-50 text-red-800 border-red-200', headerColor: 'text-red-700' },
  { label: '180+ days', key: 'b180plus', color: 'bg-red-100 text-red-900 border-red-300', headerColor: 'text-red-900' },
];

export default function AgingSummaryPage() {
  const [loading, setLoading] = useState(true);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [view, setView] = useState<'receivables' | 'payables'>('receivables');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recRes, payRes] = await Promise.all([
        reportsApi.getOutstandingReceivables(),
        reportsApi.getOutstandingPayables(),
      ]);
      setReceivables((recRes as any).data?.data?.data || (recRes as any).data?.data || []);
      setPayables((payRes as any).data?.data?.data || (payRes as any).data?.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load report');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeData = view === 'receivables' ? receivables : payables;

  const totals = BUCKETS.reduce((acc, b) => {
    acc[b.key] = activeData.reduce((s: number, r: any) => s + (r[b.key] || r[b.label] || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-600">Management Analytics</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Receivable & Payable Aging</h1>
            </div>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[1400px] mx-auto w-full space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1"><p className="font-semibold text-red-800 text-sm">Unable to load this report.</p><p className="text-red-600 text-xs mt-0.5">{error}</p></div>
            <button onClick={load} className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">Retry</button>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-32"><RefreshCw className="w-8 h-8 text-sky-400 animate-spin" /></div>
        ) : (
          <>
            {/* Toggle */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
              <button onClick={() => setView('receivables')} className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${view === 'receivables' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                📥 Outstanding Receivables
              </button>
              <button onClick={() => setView('payables')} className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${view === 'payables' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                📤 Outstanding Payables
              </button>
            </div>

            {/* Aging Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {BUCKETS.map(b => (
                <div key={b.key} className={`rounded-xl border p-4 shadow-sm ${b.color}`}>
                  <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${b.headerColor}`}>{b.label}</div>
                  <div className="text-xl font-bold">{INR(totals[b.key])}</div>
                  <div className="text-xs mt-1 opacity-70">
                    {grandTotal > 0 ? `${((totals[b.key] / grandTotal) * 100).toFixed(1)}% of total` : '—'}
                  </div>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div className={`rounded-xl border-2 p-5 flex items-center justify-between ${view === 'receivables' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${view === 'receivables' ? 'text-amber-600' : 'text-red-600'}`} />
                <span className="font-bold text-slate-800">
                  Total {view === 'receivables' ? 'Receivable' : 'Payable'} Outstanding
                </span>
              </div>
              <span className={`text-2xl font-bold ${view === 'receivables' ? 'text-amber-700' : 'text-red-700'}`}>{INR(grandTotal)}</span>
            </div>

            {/* Detail Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">
                  {view === 'receivables' ? 'Customer-wise Receivables' : 'Supplier-wise Payables'}
                  <span className="text-xs text-slate-400 ml-2">({activeData.length} records)</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-left">{view === 'receivables' ? 'Customer' : 'Supplier'}</th>
                      <th className="px-4 py-3 text-right">Total Outstanding</th>
                      {BUCKETS.map(b => <th key={b.key} className="px-4 py-3 text-right">{b.label}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeData.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                        {view === 'receivables' ? 'No outstanding receivables found' : 'No outstanding payables found'}
                      </td></tr>
                    ) : activeData.map((r: any, i: number) => {
                      const rowTotal = BUCKETS.reduce((s, b) => s + (r[b.key] || 0), 0);
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium">{r.customerName || r.supplierName || r.name || '—'}</td>
                          <td className="px-4 py-3 text-right font-bold">{INR(r.totalOutstanding || rowTotal)}</td>
                          {BUCKETS.map(b => (
                            <td key={b.key} className={`px-4 py-3 text-right ${(r[b.key] || 0) > 0 ? 'font-semibold' : 'text-slate-300'}`}>
                              {(r[b.key] || 0) > 0 ? INR(r[b.key]) : '—'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                  {activeData.length > 0 && (
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td className="px-4 py-3 font-bold text-xs text-slate-600 uppercase">Total</td>
                        <td className="px-4 py-3 text-right font-bold">{INR(grandTotal)}</td>
                        {BUCKETS.map(b => <td key={b.key} className="px-4 py-3 text-right font-bold">{INR(totals[b.key])}</td>)}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
