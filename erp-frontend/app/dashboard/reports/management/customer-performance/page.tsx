'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { reportsApi } from '../../../../../lib/erp-api';
import { safeINR, safePctStr, safeNum } from '../../../../../lib/report-utils';

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

export default function CustomerPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [topCust, setTopCust] = useState<any[]>([]);
  const [clv, setClv] = useState<any[]>([]);
  const [repeat, setRepeat] = useState<any[]>([]);
  const [freq, setFreq] = useState<any[]>([]);
  const [tab, setTab] = useState<'top' | 'clv' | 'repeat' | 'freq'>('top');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [topRes, clvRes, repeatRes, freqRes] = await Promise.all([
        reportsApi.getTopCustomersAdvanced(),
        reportsApi.getCustomerLifetimeValue(),
        reportsApi.getRepeatCustomerReport(),
        reportsApi.getCustomerPurchaseFrequency(),
      ]);
      setTopCust((topRes as any).data?.data?.data || (topRes as any).data?.data || (topRes as any).data || []);
      setClv((clvRes as any).data?.data || []);
      setRepeat((repeatRes as any).data?.data || []);
      setFreq((freqRes as any).data?.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load report');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tabs = [
    { id: 'top', label: 'Top 50 Customers' },
    { id: 'clv', label: 'Lifetime Value' },
    { id: 'repeat', label: 'Repeat Customers' },
    { id: 'freq', label: 'Purchase Frequency' },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-600">Management Analytics</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Customer Performance</h1>
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
          <div className="flex items-center justify-center py-32"><RefreshCw className="w-8 h-8 text-blue-400 animate-spin" /></div>
        ) : (
          <>
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id as any)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'top' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-4">Top Customers by Revenue</h3>
                  {topCust.slice(0, 10).length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={topCust.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                        <YAxis type="category" dataKey="customerName" tick={{ fontSize: 10 }} width={120} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="totalSales" name="Revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center py-12 text-slate-400">No data</div>}
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-slate-400 uppercase bg-slate-50 border-b">
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-right">Total Sales</th>
                      <th className="px-4 py-3 text-right">Invoices</th>
                      <th className="px-4 py-3 text-right">Avg Invoice</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {topCust.slice(0, 50).map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-400 text-xs font-bold">{i + 1}</td>
                          <td className="px-4 py-3 font-medium">{r.customerName || r.name || '—'}</td>
                          <td className="px-4 py-3 text-right font-semibold">{INR(r.totalSales || r.revenue)}</td>
                          <td className="px-4 py-3 text-right">{r.invoiceCount || '—'}</td>
                          <td className="px-4 py-3 text-right">{INR((r.totalSales || r.revenue) / (r.invoiceCount || 1))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'clv' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800">Customer Lifetime Value</h3>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-slate-400 uppercase bg-slate-50 border-b">
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-right">Lifetime Value</th>
                    <th className="px-4 py-3 text-right">Avg Order Value</th>
                    <th className="px-4 py-3 text-right">Orders</th>
                    <th className="px-4 py-3 text-right">First Purchase</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {clv.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-slate-400">No CLV data</td></tr> :
                      clv.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium">{r.customerName || r.name || '—'}</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-700">{INR(r.lifetimeValue || r.totalSales)}</td>
                          <td className="px-4 py-3 text-right">{INR(r.avgOrderValue)}</td>
                          <td className="px-4 py-3 text-right">{r.totalOrders || r.invoiceCount || '—'}</td>
                          <td className="px-4 py-3 text-right text-xs text-slate-500">{r.firstPurchase ? new Date(r.firstPurchase).toLocaleDateString('en-IN') : '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'repeat' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800">Repeat Customers</h3>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-slate-400 uppercase bg-slate-50 border-b">
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-right">Orders</th>
                    <th className="px-4 py-3 text-right">Total Revenue</th>
                    <th className="px-4 py-3 text-right">Last Purchase</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {repeat.length === 0 ? <tr><td colSpan={4} className="text-center py-12 text-slate-400">No repeat customer data</td></tr> :
                      repeat.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium">{r.customerName || r.name || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2 py-0.5 rounded-full">{r.totalOrders || r.invoiceCount}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">{INR(r.totalRevenue || r.totalSales)}</td>
                          <td className="px-4 py-3 text-right text-xs text-slate-500">{r.lastPurchase ? new Date(r.lastPurchase).toLocaleDateString('en-IN') : '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'freq' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800">Purchase Frequency Analysis</h3>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-slate-400 uppercase bg-slate-50 border-b">
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-right">Purchases</th>
                    <th className="px-4 py-3 text-right">Avg Days Between Orders</th>
                    <th className="px-4 py-3 text-right">Total Spend</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {freq.length === 0 ? <tr><td colSpan={4} className="text-center py-12 text-slate-400">No frequency data</td></tr> :
                      freq.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium">{r.customerName || r.name || '—'}</td>
                          <td className="px-4 py-3 text-right">{r.totalPurchases || r.invoiceCount}</td>
                          <td className="px-4 py-3 text-right">{r.avgDaysBetween ? `${r.avgDaysBetween.toFixed(0)} days` : '—'}</td>
                          <td className="px-4 py-3 text-right font-semibold">{INR(r.totalSpend || r.totalSales)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
