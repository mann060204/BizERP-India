'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { reportsApi } from '../../../../../lib/erp-api';
import { safeINR, safePctStr, safeNum } from '../../../../../lib/report-utils';

const INR = safeINR;
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.value > 1000 ? INR(p.value) : p.value}</p>
      ))}
    </div>
  );
};

export default function CategoryPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [catSales, setCatSales] = useState<any[]>([]);
  const [catPnl, setCatPnl] = useState<any[]>([]);
  const [catMargin, setCatMargin] = useState<any[]>([]);
  const [tab, setTab] = useState<'sales' | 'pnl' | 'margin'>('sales');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, pnlRes, marginRes] = await Promise.all([
        reportsApi.getCategoryWiseSales(),
        reportsApi.getCategoryWiseProfitAndLoss(),
        reportsApi.getCategoryWiseMargin(),
      ]);
      setCatSales((salesRes as any).data?.data || []);
      setCatPnl((pnlRes as any).data?.data || []);
      setCatMargin((marginRes as any).data?.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load report');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeData = tab === 'sales' ? catSales : tab === 'pnl' ? catPnl : catMargin;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-600">Management Analytics</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Category Performance</h1>
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
            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
              {([['sales', 'Category Sales'], ['pnl', 'Category P&L'], ['margin', 'Category Margin']] as const).map(([t, label]) => (
                <button key={t} onClick={() => setTab(t as any)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">
                  {tab === 'sales' ? 'Revenue by Category' : tab === 'pnl' ? 'Gross Profit by Category' : 'Margin % by Category'}
                </h3>
                {activeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={activeData.slice(0, 12)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => tab === 'margin' ? `${v}%` : `₹${(v/1000).toFixed(0)}K`} />
                      <YAxis type="category" dataKey={activeData[0]?.category ? 'category' : '_id'} tick={{ fontSize: 10 }} width={110} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey={tab === 'sales' ? 'totalSales' : tab === 'pnl' ? 'grossProfit' : 'marginPct'}
                        name={tab === 'sales' ? 'Revenue' : tab === 'pnl' ? 'Gross Profit' : 'Margin %'}
                        radius={[0, 4, 4, 0]}
                        fill="#6366f1"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data available</div>}
              </div>

              {/* Donut */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Distribution</h3>
                {activeData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={activeData.slice(0, 8)} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}
                          dataKey={tab === 'sales' ? 'totalSales' : tab === 'pnl' ? 'grossProfit' : 'marginPct'}>
                          {activeData.slice(0, 8).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => tab === 'margin' ? `${v}%` : INR(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                      {activeData.slice(0, 6).map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-slate-600 truncate max-w-[120px]">{c.category || c._id || 'Other'}</span>
                          </div>
                          <span className="font-semibold text-slate-800">
                            {tab === 'margin' ? `${(c.marginPct || 0).toFixed(1)}%` : INR(tab === 'sales' ? c.totalSales : c.grossProfit)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data</div>}
              </div>
            </div>

            {/* Detail Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800">Detailed Category Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">Qty Sold</th>
                    <th className="px-4 py-3 text-right">Gross Profit</th>
                    <th className="px-4 py-3 text-right">Margin %</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeData.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-12 text-slate-400">No category data available</td></tr>
                    ) : activeData.map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">{r.category || r._id || '—'}</td>
                        <td className="px-4 py-3 text-right">{INR(r.totalSales || r.revenue)}</td>
                        <td className="px-4 py-3 text-right">{r.totalQty || '—'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">{INR(r.grossProfit || 0)}</td>
                        <td className="px-4 py-3 text-right">{r.marginPct ? `${r.marginPct.toFixed(1)}%` : '—'}</td>
                      </tr>
                    ))}
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
