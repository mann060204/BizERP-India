'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { reportsApi } from '../../../../../lib/erp-api';
import { safeINR, extractArray } from '../../../../../lib/report-utils';

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
      const [topRes, clvRes, repeatRes, freqRes] = await Promise.allSettled([
        reportsApi.getTopCustomersAdvanced(),
        reportsApi.getCustomerLifetimeValue(),
        reportsApi.getRepeatCustomerReport(),
        reportsApi.getCustomerPurchaseFrequency(),
      ]);

      const rawTop = topRes.status === 'fulfilled' ? extractArray(topRes.value) : [];
      const rawClv = clvRes.status === 'fulfilled' ? extractArray(clvRes.value) : [];
      const rawRepeat = repeatRes.status === 'fulfilled' ? extractArray(repeatRes.value) : [];
      const rawFreq = freqRes.status === 'fulfilled' ? extractArray(freqRes.value) : [];

      const normalizedTop = rawTop.map((r: any) => {
        const customerName = r.customerName || r.customer || r.name || 'Cash Customer';
        const totalSales = Number(r.totalSales ?? r.revenue ?? r.totalRevenue ?? 0);
        const invoiceCount = Number(r.invoiceCount ?? r.ordersCount ?? r.orders ?? r.totalOrders ?? 1);
        const avgInvoice = invoiceCount > 0 ? totalSales / invoiceCount : totalSales;
        return {
          ...r,
          customerName,
          name: customerName,
          customer: customerName,
          totalSales,
          revenue: totalSales,
          invoiceCount,
          orders: invoiceCount,
          avgInvoice,
        };
      });
      setTopCust(normalizedTop);

      const normalizedClv = rawClv.map((r: any) => {
        const customerName = r.customerName || r.customer || r.name || 'Cash Customer';
        const lifetimeValue = Number(r.lifetimeValue ?? r.clv ?? r.totalSales ?? r.totalRevenue ?? r.revenue ?? 0);
        const totalOrders = Number(r.totalOrders ?? r.ordersCount ?? r.invoiceCount ?? r.orders ?? 1);
        const avgOrderValue = Number(r.avgOrderValue ?? r.averageOrderValue ?? (totalOrders > 0 ? lifetimeValue / totalOrders : lifetimeValue));
        const firstPurchase = r.firstPurchase || r.firstOrderDate || null;
        return {
          ...r,
          customerName,
          name: customerName,
          customer: customerName,
          lifetimeValue,
          clv: lifetimeValue,
          avgOrderValue,
          averageOrderValue: avgOrderValue,
          totalOrders,
          ordersCount: totalOrders,
          invoiceCount: totalOrders,
          firstPurchase,
          firstOrderDate: firstPurchase,
        };
      });
      setClv(normalizedClv);

      const normalizedRepeat = rawRepeat.map((r: any) => {
        const customerName = r.customerName || r.customer || r.name || 'Cash Customer';
        const totalOrders = Number(r.totalOrders ?? r.ordersCount ?? r.invoiceCount ?? r.orders ?? 0);
        const totalRevenue = Number(r.totalRevenue ?? r.totalSales ?? r.revenue ?? 0);
        const lastPurchase = r.lastPurchase || r.latestPurchase || r.lastOrderDate || null;
        const purchaseFrequency = Number(r.purchaseFrequency ?? r.avgDaysBetween ?? 0);
        return {
          ...r,
          customerName,
          name: customerName,
          customer: customerName,
          totalOrders,
          ordersCount: totalOrders,
          totalRevenue,
          totalSales: totalRevenue,
          lastPurchase,
          latestPurchase: lastPurchase,
          purchaseFrequency,
          avgDaysBetween: purchaseFrequency,
        };
      });
      setRepeat(normalizedRepeat);

      const normalizedFreq = rawFreq.map((r: any) => {
        const customerName = r.customerName || r.customer || r.name || 'Cash Customer';
        const totalPurchases = Number(r.totalPurchases ?? r.ordersCount ?? r.invoiceCount ?? r.orders ?? 0);
        const avgDaysBetween = Number(r.avgDaysBetween ?? r.purchaseFrequency ?? 0);
        const totalSpend = Number(r.totalSpend ?? r.revenue ?? r.totalRevenue ?? r.totalSales ?? 0);
        return {
          ...r,
          customerName,
          name: customerName,
          customer: customerName,
          totalPurchases,
          ordersCount: totalPurchases,
          avgDaysBetween,
          purchaseFrequency: avgDaysBetween,
          totalSpend,
          revenue: totalSpend,
        };
      });
      setFreq(normalizedFreq);
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
                        <YAxis type="category" dataKey="customerName" tick={{ fontSize: 10 }} width={130} />
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
                          <td className="px-4 py-3 font-medium">{r.customerName || r.customer || r.name || '—'}</td>
                          <td className="px-4 py-3 text-right font-semibold">{INR(r.totalSales ?? r.revenue ?? 0)}</td>
                          <td className="px-4 py-3 text-right">{r.invoiceCount ?? r.orders ?? '—'}</td>
                          <td className="px-4 py-3 text-right">{INR(r.avgInvoice ?? ((r.totalSales || r.revenue || 0) / (r.invoiceCount || r.orders || 1)))}</td>
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
                          <td className="px-4 py-3 font-medium">{r.customerName || r.customer || r.name || '—'}</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-700">{INR(r.lifetimeValue ?? r.clv ?? r.totalSales ?? 0)}</td>
                          <td className="px-4 py-3 text-right">{INR(r.avgOrderValue ?? r.averageOrderValue ?? 0)}</td>
                          <td className="px-4 py-3 text-right">{r.totalOrders ?? r.ordersCount ?? r.invoiceCount ?? '—'}</td>
                          <td className="px-4 py-3 text-right text-xs text-slate-500">{(r.firstPurchase || r.firstOrderDate) ? new Date(r.firstPurchase || r.firstOrderDate).toLocaleDateString('en-IN') : '—'}</td>
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
                          <td className="px-4 py-3 font-medium">{r.customerName || r.customer || r.name || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2 py-0.5 rounded-full">{r.totalOrders ?? r.ordersCount ?? r.invoiceCount ?? 0}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">{INR(r.totalRevenue ?? r.totalSales ?? r.revenue ?? 0)}</td>
                          <td className="px-4 py-3 text-right text-xs text-slate-500">{(r.lastPurchase || r.latestPurchase) ? new Date(r.lastPurchase || r.latestPurchase).toLocaleDateString('en-IN') : '—'}</td>
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
                          <td className="px-4 py-3 font-medium">{r.customerName || r.customer || r.name || '—'}</td>
                          <td className="px-4 py-3 text-right">{r.totalPurchases ?? r.ordersCount ?? r.invoiceCount ?? '—'}</td>
                          <td className="px-4 py-3 text-right">{r.avgDaysBetween != null && r.avgDaysBetween > 0 ? `${Number(r.avgDaysBetween).toFixed(0)} days` : '—'}</td>
                          <td className="px-4 py-3 text-right font-semibold">{INR(r.totalSpend ?? r.revenue ?? r.totalRevenue ?? r.totalSales ?? 0)}</td>
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
