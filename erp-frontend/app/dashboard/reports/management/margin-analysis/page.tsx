'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { RefreshCw, ArrowLeft, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { reportsApi } from '../../../../../lib/erp-api';
import { safeINR, safePctStr, safeNum, extractArray } from '../../../../../lib/report-utils';

const INR = safeINR;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.value > 1000 ? INR(p.value) : typeof p.value === 'number' ? `${p.value.toFixed(1)}%` : p.value}</p>
      ))}
    </div>
  );
};

const DIMENSIONS = [
  { id: 'item', label: 'By Product', fetch: 'getItemWiseProfit', nameKey: 'name', salesKey: 'totalSales', costKey: 'totalCost', profitKey: 'grossProfit', marginKey: 'marginPct' },
  { id: 'customer', label: 'By Customer', fetch: 'getCustomerWiseProfit', nameKey: 'customerName', salesKey: 'totalSales', costKey: 'totalCost', profitKey: 'grossProfit', marginKey: 'marginPct' },
  { id: 'brand', label: 'By Brand', fetch: 'getBrandWiseProfit', nameKey: 'brand', salesKey: 'totalSales', costKey: 'totalCost', profitKey: 'grossProfit', marginKey: 'marginPct' },
  { id: 'invoice', label: 'By Invoice', fetch: 'getInvoiceWiseProfit', nameKey: 'invoiceNumber', salesKey: 'totalSales', costKey: 'totalCost', profitKey: 'grossProfit', marginKey: 'marginPct' },
] as const;

export default function MarginAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [dim, setDim] = useState<typeof DIMENSIONS[number]>(DIMENSIONS[0]);
  const [data, setData] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'profit' | 'margin' | 'sales'>('profit');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: typeof DIMENSIONS[number]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await (reportsApi as any)[d.fetch]();
      setData(extractArray(res));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load report');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(dim); }, [dim, load]);

  const sorted = [...data].sort((a, b) => {
    if (sortBy === 'profit') return (b[dim.profitKey] || 0) - (a[dim.profitKey] || 0);
    if (sortBy === 'margin') return (b[dim.marginKey] || 0) - (a[dim.marginKey] || 0);
    return (b[dim.salesKey] || 0) - (a[dim.salesKey] || 0);
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-600">Management Analytics</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Margin Analysis</h1>
            </div>
          </div>
          <button onClick={() => load(dim)} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[1400px] mx-auto w-full space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1"><p className="font-semibold text-red-800 text-sm">Unable to load this report.</p><p className="text-red-600 text-xs mt-0.5">{error}</p></div>
            <button onClick={() => load(dim)} className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">Retry</button>
          </div>
        )}
        {/* Dimension Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
            {DIMENSIONS.map(d => (
              <button key={d.id} onClick={() => setDim(d)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${dim.id === d.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Sort by:</span>
            {([['profit', 'Gross Profit'], ['margin', 'Margin %'], ['sales', 'Revenue']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setSortBy(k)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all text-xs ${sortBy === k ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32"><RefreshCw className="w-8 h-8 text-sky-400 animate-spin" /></div>
        ) : (
          <>
            {/* KPI Summary */}
            {data.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: INR(data.reduce((s, r) => s + (r[dim.salesKey] || 0), 0)) },
                  { label: 'Total Cost', value: INR(data.reduce((s, r) => s + (r[dim.costKey] || 0), 0)) },
                  { label: 'Total Gross Profit', value: INR(data.reduce((s, r) => s + (r[dim.profitKey] || 0), 0)), positive: true },
                  { label: 'Overall Margin %', value: `${((data.reduce((s, r) => s + (r[dim.profitKey] || 0), 0) / Math.max(data.reduce((s, r) => s + (r[dim.salesKey] || 0), 0), 1)) * 100).toFixed(1)}%`, positive: true },
                ].map((c, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{c.label}</div>
                    <div className={`text-xl font-bold ${(c as any).positive ? 'text-emerald-700' : 'text-slate-900'}`}>{c.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Profit & Revenue — Top {Math.min(15, sorted.length)}</h3>
              {sorted.slice(0, 15).length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sorted.slice(0, 15)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey={dim.nameKey} tick={{ fontSize: 10 }} width={120} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey={dim.salesKey} name="Revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    <Bar dataKey={dim.profitKey} name="Gross Profit" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="text-center py-12 text-slate-400">No data</div>}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800">Margin Detail Table ({data.length} records)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-left">{dim.label.replace('By ', '')}</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Gross Profit</th>
                    <th className="px-4 py-3 text-right">Margin %</th>
                    <th className="px-4 py-3 text-center">Performance</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {sorted.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-slate-400">No data available</td></tr>
                    ) : sorted.map((r: any, i: number) => {
                      const margin = r[dim.marginKey] || ((r[dim.profitKey] / (r[dim.salesKey] || 1)) * 100);
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium">{r[dim.nameKey] || '—'}</td>
                          <td className="px-4 py-3 text-right">{INR(r[dim.salesKey])}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{INR(r[dim.costKey])}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${r[dim.profitKey] >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{INR(r[dim.profitKey])}</td>
                          <td className={`px-4 py-3 text-right font-bold ${margin >= 20 ? 'text-emerald-600' : margin >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                            {margin.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-center">
                            {margin >= 20 ? (
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Good</span>
                            ) : margin >= 10 ? (
                              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Average</span>
                            ) : (
                              <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">Low</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
