'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { reportsApi } from '../../../../../lib/erp-api';
import { safeINR, safePctStr, safeNum, extractArray } from '../../../../../lib/report-utils';

const INR = safeINR;
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.value > 1000 ? INR(p.value) : p.value}</p>)}
    </div>
  );
};

export default function ProductPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [top100, setTop100] = useState<any[]>([]);
  const [bottom100, setBottom100] = useState<any[]>([]);
  const [abc, setAbc] = useState<any[]>([]);
  const [tab, setTab] = useState<'top' | 'bottom' | 'abc'>('top');

  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [topRes, botRes, abcRes] = await Promise.all([
        reportsApi.getTop100Products(),
        reportsApi.getBottom100Products(),
        reportsApi.getAbcAnalysis(),
      ]);
      setTop100(extractArray(topRes));
      setBottom100(extractArray(botRes));
      setAbc(extractArray(abcRes));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load report');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const abcSummary = ['A', 'B', 'C'].map(cls => ({
    class: cls, count: abc.filter((r: any) => r.abcClass === cls).length,
    revenue: abc.filter((r: any) => r.abcClass === cls).reduce((s: number, r: any) => s + (r.totalRevenue || 0), 0),
  }));

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-600">Management Analytics</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Product Performance</h1>
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
          <div className="flex items-center justify-center py-32"><RefreshCw className="w-8 h-8 text-purple-400 animate-spin" /></div>
        ) : !error && (
          <>
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
              {([['top', '🏆 Top 100 Products'], ['bottom', '📉 Bottom 100 Products'], ['abc', 'ABC Analysis']] as const).map(([t, label]) => (
                <button key={t} onClick={() => setTab(t as any)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {label}
                </button>
              ))}
            </div>

            {tab === 'top' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-4">Top Products by Revenue</h3>
                  {top100.slice(0, 12).length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={top100.slice(0, 12)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                        {/* Backend field: product (not name) */}
                        <YAxis type="category" dataKey="product" tick={{ fontSize: 10 }} width={130} />
                        <Tooltip content={<CustomTooltip />} />
                        {/* Backend field: revenue (not totalRevenue) */}
                        <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center py-12 text-slate-400">No data</div>}
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-slate-400 uppercase bg-slate-50 border-b">
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                      <th className="px-4 py-3 text-right">Qty Sold</th>
                      <th className="px-4 py-3 text-right">Margin %</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {top100.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-slate-400">No data available</td></tr> :
                      top100.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-400 text-xs font-bold">{i + 1}</td>
                          {/* Backend field: product */}
                          <td className="px-4 py-3 font-medium">{r.product || r.name || '—'}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{r.category || '—'}</td>
                          {/* Backend field: revenue */}
                          <td className="px-4 py-3 text-right font-semibold">{safeINR(r.revenue || r.totalRevenue)}</td>
                          {/* Backend field: quantitySold */}
                          <td className="px-4 py-3 text-right">{safeNum(r.quantitySold || r.totalQty || r.qtySold).toFixed(0) || '—'}</td>
                          <td className="px-4 py-3 text-right">{safeNum(r.margin || r.marginPct) > 0 ? safePctStr(r.margin || r.marginPct) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'bottom' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800">Bottom 100 Products — Slowest Movers</h3>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-slate-400 uppercase bg-slate-50 border-b">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">Qty Sold</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {bottom100.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-slate-400">No data</td></tr> :
                      bottom100.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-400 text-xs font-bold">{i + 1}</td>
                          <td className="px-4 py-3 font-medium">{r.product || r.name || '—'}</td>
                          <td className="px-4 py-3 text-right">{safeINR(r.revenue || r.totalRevenue)}</td>
                          <td className="px-4 py-3 text-right">{safeNum(r.quantitySold || r.totalQty || r.qtySold).toFixed(0) || '—'}</td>
                          <td className="px-4 py-3 text-right">{r.currentStock ?? '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'abc' && (
              <div className="space-y-6">
                {/* ABC Summary */}
                <div className="grid grid-cols-3 gap-4">
                  {abcSummary.map(cls => (
                    <div key={cls.class} className={`rounded-xl border p-5 ${cls.class === 'A' ? 'bg-emerald-50 border-emerald-200' : cls.class === 'B' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className={`text-2xl font-black mb-1 ${cls.class === 'A' ? 'text-emerald-700' : cls.class === 'B' ? 'text-amber-700' : 'text-slate-600'}`}>Class {cls.class}</div>
                      <div className="text-sm text-slate-600">{cls.count} products</div>
                      <div className="text-lg font-bold mt-2">{INR(cls.revenue)}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {cls.class === 'A' ? 'High value — top ~20% driving ~80% revenue' : cls.class === 'B' ? 'Mid value — moderate contributors' : 'Low value — slow movers'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-slate-400 uppercase bg-slate-50 border-b">
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-center">Class</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                      <th className="px-4 py-3 text-right">% Contribution</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {abc.length === 0 ? <tr><td colSpan={4} className="text-center py-12 text-slate-400">No ABC data</td></tr> :
                        abc.map((r: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium">{r.name || '—'}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.abcClass === 'A' ? 'bg-emerald-100 text-emerald-700' : r.abcClass === 'B' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                {r.abcClass || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">{INR(r.totalRevenue || r.revenue)}</td>
                            <td className="px-4 py-3 text-right">{r.pct ? `${r.pct.toFixed(1)}%` : '—'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
