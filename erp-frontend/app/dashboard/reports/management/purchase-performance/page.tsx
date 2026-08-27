'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { reportsApi } from '../../../../../lib/erp-api';
import { safeINR, safePctStr, safeNum } from '../../../../../lib/report-utils';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-slate-700">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? safeINR(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function PurchasePerformancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [tab, setTab] = useState<'trend' | 'suppliers'>('trend');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendRes, suppRes] = await Promise.all([
        reportsApi.getPurchaseTrend(),
        reportsApi.getSupplierPerformance(),
      ]);
      // Backend: { data: { summary: {...}, data: [...] } }
      const trendData = (trendRes as any).data?.data?.data || (trendRes as any).data?.data || [];
      const trendSum = (trendRes as any).data?.data?.summary || null;
      setTrend(Array.isArray(trendData) ? trendData : []);
      setSummary(trendSum);

      // Backend supplier fields: supplier, purchaseValue, deliveries, delayedDeliveries
      const suppRaw = (suppRes as any).data?.data?.data || (suppRes as any).data?.data || (suppRes as any).data || [];
      setSuppliers(Array.isArray(suppRaw) ? suppRaw : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load report');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-600">Management Analytics</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Purchase Performance</h1>
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
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-sm">Unable to load this report.</p>
              <p className="text-red-600 text-xs mt-0.5">{error}</p>
            </div>
            <button onClick={load} className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32"><RefreshCw className="w-8 h-8 text-red-400 animate-spin" /></div>
        ) : !error && (
          <>
            {/* KPIs */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Avg Monthly Purchase', value: safeINR(summary.monthlyPurchases || summary.monthlyRevenue) },
                  { label: 'Total Bills', value: String(safeNum(summary.billCount || summary.ordersCount)) },
                  { label: 'Avg Bill Value', value: safeINR(summary.averageOrderValue) },
                  { label: 'Growth %', value: safePctStr(summary.purchaseGrowthPct || summary.growthPct) },
                ].map((c, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">{c.label}</div>
                    <div className="text-2xl font-bold text-slate-900">{c.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
              {(['trend', 'suppliers'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-5 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {t === 'trend' ? '📈 Purchase Trend' : '🏭 Supplier Performance'}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              {tab === 'trend' && (
                <>
                  <h3 className="font-semibold text-slate-800 mb-4">Monthly Purchase Trend</h3>
                  {trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={trend}>
                        <defs>
                          <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="purchaseValue" name="Purchase Value" stroke="#ef4444" fill="url(#pg)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center py-12 text-slate-400">No purchase trend data available</div>}
                  {trend.length > 0 && (
                    <table className="w-full text-sm mt-6 border-t border-slate-100">
                      <thead><tr className="text-xs text-slate-500 uppercase bg-slate-50">
                        <th className="px-4 py-2.5 text-left">Month</th>
                        <th className="px-4 py-2.5 text-right">Purchase Value</th>
                        <th className="px-4 py-2.5 text-right">Suppliers</th>
                        <th className="px-4 py-2.5 text-right">Growth %</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {trend.map((r: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-medium">{r.month}</td>
                            <td className="px-4 py-2.5 text-right">{safeINR(r.purchaseValue)}</td>
                            <td className="px-4 py-2.5 text-right">{safeNum(r.supplierCount)}</td>
                            <td className={`px-4 py-2.5 text-right font-semibold ${safeNum(r.growthPct) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {safePctStr(r.growthPct)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}

              {tab === 'suppliers' && (
                <>
                  <h3 className="font-semibold text-slate-800 mb-4">Supplier-wise Purchase Performance</h3>
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                      <th className="px-4 py-2.5 text-left">Supplier</th>
                      <th className="px-4 py-2.5 text-right">Purchase Value</th>
                      <th className="px-4 py-2.5 text-right">Bills</th>
                      <th className="px-4 py-2.5 text-right">Delayed</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {suppliers.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-12 text-slate-400">No supplier data available</td></tr>
                      ) : suppliers.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          {/* Backend field: supplier (not name) */}
                          <td className="px-4 py-2.5 font-medium">{r.supplier || r.supplierName || r.name || '—'}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">{safeINR(r.purchaseValue || r.totalPurchase)}</td>
                          <td className="px-4 py-2.5 text-right">{safeNum(r.deliveries || r.billCount)}</td>
                          <td className={`px-4 py-2.5 text-right ${safeNum(r.delayedDeliveries) > 0 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                            {safeNum(r.delayedDeliveries) > 0 ? safeNum(r.delayedDeliveries) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
