'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import { RefreshCw, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { reportsApi } from '../../../../../lib/erp-api';

const INR = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-slate-700">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.value > 1000 ? INR(p.value) : p.value}</p>
      ))}
    </div>
  );
};

function KPICard({ title, value, sub, positive }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</div>
      <div className={`text-2xl font-bold ${positive ? 'text-emerald-700' : 'text-slate-900'}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function ProfitPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [pnlData, setPnlData] = useState<any>(null);
  const [profitTrend, setProfitTrend] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [tab, setTab] = useState<'trend' | 'category' | 'margin'>('trend');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pnlRes, trendRes, catRes] = await Promise.all([
        reportsApi.pnl(),
        reportsApi.getSalesTrend(),
        reportsApi.getCategoryWiseProfitAndLoss(),
      ]);
      setPnlData((pnlRes as any).data?.data || null);
      const t = (trendRes as any).data?.data?.data || [];
      setProfitTrend(Array.isArray(t) ? t : []);
      setCategoryData((catRes as any).data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grossProfit = (pnlData?.totalSales || 0) - (pnlData?.totalPurchases || 0);
  const netProfit = grossProfit - (pnlData?.totalExpenses || 0);
  const gpm = ((grossProfit / (pnlData?.totalSales || 1)) * 100).toFixed(1);
  const npm = ((netProfit / (pnlData?.totalSales || 1)) * 100).toFixed(1);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-600">Management Analytics</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Profit Performance</h1>
            </div>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[1400px] mx-auto w-full space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-32"><RefreshCw className="w-8 h-8 text-sky-400 animate-spin" /></div>
        ) : (
          <>
            {/* P&L Waterfall */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <KPICard title="Total Sales"     value={INR(pnlData?.totalSales)}     sub="Revenue" />
              <KPICard title="Total Purchases" value={INR(pnlData?.totalPurchases)} sub="COGS" />
              <KPICard title="Gross Profit"    value={INR(grossProfit)}             sub={`GPM: ${gpm}%`} positive={grossProfit > 0} />
              <KPICard title="Total Expenses"  value={INR(pnlData?.totalExpenses)}  sub="Operating" />
              <KPICard title="Net Profit"      value={INR(netProfit)}               sub={`NPM: ${npm}%`} positive={netProfit > 0} />
              <KPICard title="Net Margin %"    value={`${npm}%`}                    sub="After expenses" positive={parseFloat(npm) > 0} />
            </div>

            {/* P&L visual breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-5">Profit & Loss Breakdown</h3>
              {pnlData && (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { label: 'Sales', value: pnlData.totalSales, fill: '#10b981' },
                    { label: 'Purchases', value: pnlData.totalPurchases, fill: '#ef4444' },
                    { label: 'Gross Profit', value: grossProfit, fill: '#6366f1' },
                    { label: 'Expenses', value: pnlData.totalExpenses, fill: '#f59e0b' },
                    { label: 'Net Profit', value: netProfit, fill: netProfit >= 0 ? '#0ea5e9' : '#ef4444' },
                  ]} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]}>
                      {[
                        { fill: '#10b981' }, { fill: '#ef4444' }, { fill: '#6366f1' },
                        { fill: '#f59e0b' }, { fill: netProfit >= 0 ? '#0ea5e9' : '#ef4444' }
                      ].map((entry, index) => (
                        <rect key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
              {(['trend', 'category', 'margin'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-lg capitalize transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {t === 'trend' ? 'Profit Trend' : t === 'category' ? 'Category P&L' : 'Margin Details'}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              {tab === 'trend' && (
                <>
                  <h3 className="font-semibold text-slate-800 mb-4">Monthly Profit Trend</h3>
                  {profitTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={profitTrend}>
                        <defs>
                          <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} dot={false} fill="none" />
                        <Area type="monotone" dataKey="profit" name="Est. Profit" stroke="#6366f1" fill="url(#pg)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center py-12 text-slate-400">No trend data</div>}
                </>
              )}
              {tab === 'category' && (
                <>
                  <h3 className="font-semibold text-slate-800 mb-4">Category-wise P&L</h3>
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-slate-500 uppercase bg-slate-50">
                      <th className="px-4 py-2.5 text-left">Category</th>
                      <th className="px-4 py-2.5 text-right">Revenue</th>
                      <th className="px-4 py-2.5 text-right">COGS</th>
                      <th className="px-4 py-2.5 text-right">Gross Profit</th>
                      <th className="px-4 py-2.5 text-right">Margin %</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoryData.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-12 text-slate-400">No category data</td></tr>
                      ) : categoryData.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-medium">{r.category || r._id || '—'}</td>
                          <td className="px-4 py-2.5 text-right">{INR(r.totalSales || r.revenue)}</td>
                          <td className="px-4 py-2.5 text-right">{INR(r.totalCost || r.cogs)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">{INR(r.grossProfit || (r.totalSales - r.totalCost))}</td>
                          <td className="px-4 py-2.5 text-right">{r.marginPct ? `${r.marginPct.toFixed(1)}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              {tab === 'margin' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-800">Margin Summary</h3>
                  {[
                    { label: 'Revenue', value: INR(pnlData?.totalSales), pct: '100%', bar: 100, color: 'bg-emerald-500' },
                    { label: 'COGS (Purchases)', value: INR(pnlData?.totalPurchases), pct: `${((pnlData?.totalPurchases / (pnlData?.totalSales || 1)) * 100).toFixed(1)}%`, bar: (pnlData?.totalPurchases / (pnlData?.totalSales || 1)) * 100, color: 'bg-red-500' },
                    { label: 'Gross Profit', value: INR(grossProfit), pct: `${gpm}%`, bar: parseFloat(gpm), color: 'bg-indigo-500' },
                    { label: 'Expenses', value: INR(pnlData?.totalExpenses), pct: `${((pnlData?.totalExpenses / (pnlData?.totalSales || 1)) * 100).toFixed(1)}%`, bar: (pnlData?.totalExpenses / (pnlData?.totalSales || 1)) * 100, color: 'bg-orange-500' },
                    { label: 'Net Profit', value: INR(netProfit), pct: `${npm}%`, bar: Math.max(0, parseFloat(npm)), color: 'bg-sky-500' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                      <div className="w-36 text-sm font-medium text-slate-700 shrink-0">{row.label}</div>
                      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full ${row.color} transition-all`} style={{ width: `${Math.min(100, row.bar || 0)}%` }} />
                      </div>
                      <div className="text-sm font-bold text-slate-900 w-28 text-right">{row.value}</div>
                      <div className="text-xs text-slate-400 w-12 text-right">{row.pct}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
