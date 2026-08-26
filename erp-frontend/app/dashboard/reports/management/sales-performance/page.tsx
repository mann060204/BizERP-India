'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { RefreshCw, ArrowLeft, TrendingUp, TrendingDown, Minus, Users, Package, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { reportsApi, dashboardApi } from '../../../../../lib/erp-api';

const INR = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

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

function KPICard({ title, value, sub, icon: Icon, color, growth }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5 text-white" /></div>
        {growth !== undefined && growth !== null && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${growth > 0 ? 'bg-emerald-50 text-emerald-700' : growth < 0 ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500'}`}>
            {growth > 0 ? <TrendingUp className="w-3 h-3" /> : growth < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {`${growth > 0 ? '+' : ''}${(growth || 0).toFixed(1)}%`}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{title}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function SalesPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesperson, setSalesperson] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [tab, setTab] = useState<'trend' | 'customers' | 'products' | 'salesperson'>('trend');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [trendRes, custRes, prodRes, spRes] = await Promise.all([
        reportsApi.getSalesTrend(),
        reportsApi.getTopCustomersAdvanced(),
        reportsApi.getTopSellingProducts(),
        reportsApi.getSalespersonPerformance(),
      ]);
      const trendData = (trendRes as any).data?.data?.data || (trendRes as any).data?.data || [];
      const trendSum = (trendRes as any).data?.data?.summary || null;
      setTrend(Array.isArray(trendData) ? trendData : []);
      setSummary(trendSum);
      setTopCustomers((custRes as any).data?.data || (custRes as any).data || []);
      setTopProducts((prodRes as any).data?.data || (prodRes as any).data || []);
      setSalesperson((spRes as any).data?.data || (spRes as any).data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-600">Management Analytics</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Sales Performance</h1>
            </div>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[1400px] mx-auto w-full space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-32"><RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" /></div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard title="Avg Monthly Revenue" value={INR(summary?.monthlyRevenue)} icon={BarChart3} color="bg-emerald-500" growth={summary?.growthPct} />
              <KPICard title="Total Orders" value={new Intl.NumberFormat('en-IN').format(summary?.ordersCount || 0)} icon={Package} color="bg-indigo-500" />
              <KPICard title="Avg Order Value" value={INR(summary?.averageOrderValue)} icon={TrendingUp} color="bg-blue-500" />
              <KPICard title="Growth Rate" value={`${(summary?.growthPct || 0).toFixed(1)}%`} icon={summary?.growthPct >= 0 ? TrendingUp : TrendingDown} color={summary?.growthPct >= 0 ? 'bg-emerald-500' : 'bg-red-500'} />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
              {(['trend', 'customers', 'products', 'salesperson'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-lg capitalize transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {t === 'salesperson' ? 'Salesperson' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              {tab === 'trend' && (
                <>
                  <h3 className="font-semibold text-slate-800 mb-4">Monthly Sales Trend</h3>
                  {trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={trend}>
                        <defs>
                          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" fill="url(#sg)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="orders" name="Orders" stroke="#6366f1" strokeWidth={2} dot={false} yAxisId={1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center py-12 text-slate-400">No sales trend data available</div>}
                  {/* Table */}
                  {trend.length > 0 && (
                    <table className="w-full text-sm mt-6 border-t border-slate-100">
                      <thead><tr className="text-xs text-slate-500 uppercase bg-slate-50">
                        <th className="px-4 py-2.5 text-left">Month</th>
                        <th className="px-4 py-2.5 text-right">Revenue</th>
                        <th className="px-4 py-2.5 text-right">Orders</th>
                        <th className="px-4 py-2.5 text-right">Avg Order</th>
                        <th className="px-4 py-2.5 text-right">Growth %</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {trend.map((r: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-medium">{r.month}</td>
                            <td className="px-4 py-2.5 text-right">{INR(r.revenue)}</td>
                            <td className="px-4 py-2.5 text-right">{r.orders}</td>
                            <td className="px-4 py-2.5 text-right">{INR(r.revenue / (r.orders || 1))}</td>
                            <td className={`px-4 py-2.5 text-right font-semibold ${(r.growthPct || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{(r.growthPct || 0).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}

              {tab === 'customers' && (
                <>
                  <h3 className="font-semibold text-slate-800 mb-4">Top Customers by Revenue</h3>
                  {topCustomers.slice(0, 10).length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={topCustomers.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                        <YAxis type="category" dataKey="customerName" tick={{ fontSize: 10 }} width={110} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="totalSales" name="Revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center py-12 text-slate-400">No customer data available</div>}
                  <table className="w-full text-sm mt-6 border-t border-slate-100">
                    <thead><tr className="text-xs text-slate-500 uppercase bg-slate-50">
                      <th className="px-4 py-2.5 text-left">Customer</th>
                      <th className="px-4 py-2.5 text-right">Total Sales</th>
                      <th className="px-4 py-2.5 text-right">Orders</th>
                      <th className="px-4 py-2.5 text-right">Avg Value</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {topCustomers.slice(0, 20).map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-medium">{r.customerName || r.name || '—'}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">{INR(r.totalSales || r.revenue)}</td>
                          <td className="px-4 py-2.5 text-right">{r.invoiceCount || r.orders || '—'}</td>
                          <td className="px-4 py-2.5 text-right">{INR((r.totalSales || r.revenue) / (r.invoiceCount || r.orders || 1))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {tab === 'products' && (
                <>
                  <h3 className="font-semibold text-slate-800 mb-4">Top Products by Revenue</h3>
                  {topProducts.slice(0, 10).length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={topProducts.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="totalRevenue" name="Revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center py-12 text-slate-400">No product data available</div>}
                  <table className="w-full text-sm mt-6 border-t border-slate-100">
                    <thead><tr className="text-xs text-slate-500 uppercase bg-slate-50">
                      <th className="px-4 py-2.5 text-left">Product</th>
                      <th className="px-4 py-2.5 text-right">Revenue</th>
                      <th className="px-4 py-2.5 text-right">Qty Sold</th>
                      <th className="px-4 py-2.5 text-right">Margin %</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {topProducts.slice(0, 20).map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-medium">{r.name || '—'}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">{INR(r.totalRevenue || r.revenue)}</td>
                          <td className="px-4 py-2.5 text-right">{r.totalQty || r.qtySold || '—'}</td>
                          <td className="px-4 py-2.5 text-right">{r.marginPct ? `${r.marginPct.toFixed(1)}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {tab === 'salesperson' && (
                <>
                  <h3 className="font-semibold text-slate-800 mb-4">Salesperson Performance</h3>
                  <table className="w-full text-sm border-t border-slate-100">
                    <thead><tr className="text-xs text-slate-500 uppercase bg-slate-50">
                      <th className="px-4 py-2.5 text-left">Salesperson</th>
                      <th className="px-4 py-2.5 text-right">Total Sales</th>
                      <th className="px-4 py-2.5 text-right">Invoices</th>
                      <th className="px-4 py-2.5 text-right">Avg Value</th>
                      <th className="px-4 py-2.5 text-right">Profit</th>
                      <th className="px-4 py-2.5 text-right">Margin %</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {salesperson.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-12 text-slate-400">No salesperson data available</td></tr>
                      ) : salesperson.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-medium">{r.salesperson || r.name || '—'}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">{INR(r.totalSales || r.revenue)}</td>
                          <td className="px-4 py-2.5 text-right">{r.invoiceCount || '—'}</td>
                          <td className="px-4 py-2.5 text-right">{INR(r.avgInvoiceValue)}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600">{INR(r.profit)}</td>
                          <td className="px-4 py-2.5 text-right">{r.marginPct ? `${r.marginPct.toFixed(1)}%` : '—'}</td>
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
