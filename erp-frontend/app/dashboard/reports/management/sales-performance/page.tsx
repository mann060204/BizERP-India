'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { RefreshCw, ArrowLeft, TrendingUp, TrendingDown, Minus, Users, Package, BarChart3, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { reportsApi } from '../../../../../lib/erp-api';
import { safeINR, safePctStr, safeNum } from '../../../../../lib/report-utils';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

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

function KPICard({ title, value, sub, icon: Icon, color, growth }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {growth !== undefined && growth !== null && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${growth > 0 ? 'bg-emerald-50 text-emerald-700' : growth < 0 ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500'}`}>
            {growth > 0 ? <TrendingUp className="w-3 h-3" /> : growth < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {`${growth > 0 ? '+' : ''}${safeNum(growth).toFixed(1)}%`}
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
  const [error, setError] = useState<string | null>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesperson, setSalesperson] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [tab, setTab] = useState<'trend' | 'customers' | 'products' | 'salesperson'>('trend');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
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

      // Top customers: backend returns { customer, revenue, orders, outstanding }
      const custRaw = (custRes as any).data?.data?.data || (custRes as any).data?.data || (custRes as any).data || [];
      setTopCustomers(Array.isArray(custRaw) ? custRaw : []);

      // Top products: backend returns { product, revenue, quantitySold, margin }
      const prodRaw = (prodRes as any).data?.data?.data || (prodRes as any).data?.data || (prodRes as any).data || [];
      setTopProducts(Array.isArray(prodRaw) ? prodRaw : []);

      // Salesperson: backend returns { salesperson, orders, revenue, profit, collectionPct }
      const spRaw = (spRes as any).data?.data?.data || (spRes as any).data?.data || (spRes as any).data || [];
      setSalesperson(Array.isArray(spRaw) ? spRaw : []);
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
        {/* Error state */}
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
          <div className="flex items-center justify-center py-32"><RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" /></div>
        ) : !error && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard title="Avg Monthly Revenue" value={safeINR(summary?.monthlyRevenue)} icon={BarChart3} color="bg-emerald-500" growth={summary?.growthPct} />
              <KPICard title="Total Orders" value={new Intl.NumberFormat('en-IN').format(safeNum(summary?.ordersCount))} icon={Package} color="bg-indigo-500" />
              <KPICard title="Avg Order Value" value={safeINR(summary?.averageOrderValue)} icon={TrendingUp} color="bg-blue-500" />
              <KPICard title="Growth Rate" value={safePctStr(summary?.growthPct)} icon={safeNum(summary?.growthPct) >= 0 ? TrendingUp : TrendingDown} color={safeNum(summary?.growthPct) >= 0 ? 'bg-emerald-500' : 'bg-red-500'} />
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
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" fill="url(#sg)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center py-12 text-slate-400">No sales trend data available</div>}
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
                            <td className="px-4 py-2.5 text-right">{safeINR(r.revenue)}</td>
                            <td className="px-4 py-2.5 text-right">{safeNum(r.orders)}</td>
                            <td className="px-4 py-2.5 text-right">{safeINR(safeNum(r.revenue) / (safeNum(r.orders) || 1))}</td>
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

              {tab === 'customers' && (
                <>
                  <h3 className="font-semibold text-slate-800 mb-4">Top Customers by Revenue</h3>
                  {topCustomers.slice(0, 10).length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={topCustomers.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                        {/* Backend field: customer (not customerName) */}
                        <YAxis type="category" dataKey="customer" tick={{ fontSize: 10 }} width={110} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center py-12 text-slate-400">No customer data available</div>}
                  <table className="w-full text-sm mt-6 border-t border-slate-100">
                    <thead><tr className="text-xs text-slate-500 uppercase bg-slate-50">
                      <th className="px-4 py-2.5 text-left">Customer</th>
                      <th className="px-4 py-2.5 text-right">Total Sales</th>
                      <th className="px-4 py-2.5 text-right">Orders</th>
                      <th className="px-4 py-2.5 text-right">Avg Value</th>
                      <th className="px-4 py-2.5 text-right">Outstanding</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {topCustomers.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-slate-400">No data available</td></tr>
                      ) : topCustomers.slice(0, 20).map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          {/* Backend field: customer */}
                          <td className="px-4 py-2.5 font-medium">{r.customer || r.customerName || r.name || '—'}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">{safeINR(r.revenue || r.totalSales)}</td>
                          <td className="px-4 py-2.5 text-right">{safeNum(r.orders || r.invoiceCount)}</td>
                          <td className="px-4 py-2.5 text-right">{safeINR(safeNum(r.revenue || r.totalSales) / (safeNum(r.orders || r.invoiceCount) || 1))}</td>
                          <td className={`px-4 py-2.5 text-right ${safeNum(r.outstanding) > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                            {safeNum(r.outstanding) > 0 ? safeINR(r.outstanding) : '—'}
                          </td>
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
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                        {/* Backend field: product (not name) */}
                        <YAxis type="category" dataKey="product" tick={{ fontSize: 10 }} width={120} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
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
                      {topProducts.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-8 text-slate-400">No data available</td></tr>
                      ) : topProducts.slice(0, 20).map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          {/* Backend field: product (not name/totalRevenue) */}
                          <td className="px-4 py-2.5 font-medium">{r.product || r.name || '—'}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">{safeINR(r.revenue || r.totalRevenue)}</td>
                          <td className="px-4 py-2.5 text-right">{safeNum(r.quantitySold || r.totalQty || r.qtySold).toFixed(0)}</td>
                          <td className="px-4 py-2.5 text-right">{safeNum(r.margin) > 0 ? safePctStr(r.margin) : '—'}</td>
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
                      <th className="px-4 py-2.5 text-right">Orders</th>
                      <th className="px-4 py-2.5 text-right">Avg Value</th>
                      <th className="px-4 py-2.5 text-right">Collection %</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {salesperson.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-12 text-slate-400">No salesperson data available</td></tr>
                      ) : salesperson.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          {/* Backend field: salesperson (not name) */}
                          <td className="px-4 py-2.5 font-medium">{r.salesperson || r.name || '—'}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">{safeINR(r.revenue || r.totalSales)}</td>
                          <td className="px-4 py-2.5 text-right">{safeNum(r.orders || r.invoiceCount)}</td>
                          <td className="px-4 py-2.5 text-right">{safeINR(safeNum(r.revenue || r.totalSales) / (safeNum(r.orders || r.invoiceCount) || 1))}</td>
                          <td className="px-4 py-2.5 text-right">{safeNum(r.collectionPct) > 0 ? safePctStr(r.collectionPct) : '—'}</td>
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
