'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  RefreshCw, ArrowLeft, TrendingUp, TrendingDown, Minus,
  DollarSign, ShoppingCart, Package, Wallet, AlertTriangle,
  BarChart3, IndianRupee, Download
} from 'lucide-react';
import Link from 'next/link';
import { reportsApi, dashboardApi } from '../../../../../lib/erp-api';
import { extractArray } from '../../../../../lib/report-utils';

const INR = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
const NUM = (v: number) => new Intl.NumberFormat('en-IN').format(v || 0);
const PCT = (v: number) => `${v > 0 ? '+' : ''}${(v || 0).toFixed(1)}%`;

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

const PERIODS = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last 3 Months', value: 'last_3_months' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Last Year', value: 'last_year' },
];

function KPICard({ title, value, sub, icon: Icon, color, trend }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-700' : trend < 0 ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {PCT(trend)}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 leading-tight">{value}</div>
      <div className="text-sm font-medium text-slate-500 mt-1">{title}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

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

export default function BusinessHealthDashboard() {
  const [period, setPeriod] = useState('this_year');
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, trendRes, custRes, prodRes] = await Promise.all([
        reportsApi.getBusinessDashboardAdvanced(),
        dashboardApi.businessTrend({ period }),
        dashboardApi.topCustomers({ period }),
        reportsApi.getTopSellingProducts(),
      ]);
      setKpis((dashRes as any).data?.data?.kpis || (dashRes as any).data?.kpis || (dashRes as any).kpis || null);
      setTrend(extractArray((trendRes as any).trend || trendRes));
      setTopCustomers(extractArray((custRes as any).data?.customers || custRes));
      setTopProducts(extractArray(prodRes));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const kpiCards = kpis ? [
    { title: 'Total Revenue',      value: INR(kpis.revenue),       icon: TrendingUp,     color: 'bg-emerald-500', trend: null },
    { title: 'Total Purchases',    value: INR(kpis.purchases),     icon: ShoppingCart,   color: 'bg-red-500',     trend: null },
    { title: 'Profit Margin',       value: `${((kpis.profit / (kpis.revenue || 1)) * 100).toFixed(1)}%`,   icon: BarChart3,      color: 'bg-indigo-500',  trend: null },
    { title: 'Net Profit',         value: INR(kpis.profit),        icon: IndianRupee,    color: 'bg-blue-500',    trend: null, sub: `Margin: ${((kpis.profit / (kpis.revenue || 1)) * 100).toFixed(1)}%` },
    { title: 'Total Expenses',     value: INR(kpis.expenses),      icon: DollarSign,     color: 'bg-orange-500',  trend: null },
    { title: 'Receivables',        value: INR(kpis.receivables),   icon: AlertTriangle,  color: 'bg-amber-500',   trend: null },
    { title: 'Payables',           value: INR(kpis.payables),      icon: AlertTriangle,  color: 'bg-rose-500',    trend: null },
    { title: 'Stock Value',        value: INR(kpis.inventoryValue),icon: Package,        color: 'bg-purple-500',  trend: null },
    { title: 'Cash & Bank',        value: INR(kpis.cashBalance),   icon: Wallet,         color: 'bg-teal-500',    trend: null },
    { title: 'GST Liability',      value: INR(kpis.gstLiability),  icon: IndianRupee,    color: 'bg-slate-500',   trend: null },
  ] : [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-600">Management Analytics</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Business Health Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${period === p.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={loadAll} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[1400px] mx-auto w-full space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
            <p className="text-slate-500 text-sm">Loading business data...</p>
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Key Performance Indicators</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {kpiCards.map((c, i) => <KPICard key={i} {...c} />)}
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue vs Purchase Trend */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Revenue vs Purchase Trend</h3>
                {trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={trend} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="purGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="sales" name="Revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="purchases" name="Purchase" stroke="#ef4444" fill="url(#purGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No trend data available</div>
                )}
              </div>

              {/* Top Customers Donut */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Top Customers by Revenue</h3>
                {topCustomers.slice(0, 5).length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={topCustomers.slice(0, 5)} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="revenue">
                          {topCustomers.slice(0, 5).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => INR(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                      {topCustomers.slice(0, 5).map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-slate-600 truncate max-w-[130px]">{c.customer || c.customerName || c.name || 'Unknown'}</span>
                          </div>
                          <span className="font-semibold text-slate-800">{INR(c.revenue || c.totalSales)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No customer data</div>
                )}
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Top Products by Revenue</h3>
                {topProducts.slice(0, 7).length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topProducts.slice(0, 7)} layout="vertical" margin={{ left: 0, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                      <YAxis type="category" dataKey="product" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No product data</div>
                )}
              </div>

              {/* Quick Stats Table */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Financial Snapshot</h3>
                {kpis && (
                  <div className="space-y-0 divide-y divide-slate-100">
                    {[
                      { label: 'Net Profit Margin',      value: `${((kpis.profit / (kpis.revenue || 1)) * 100).toFixed(1)}%`, positive: kpis.profit > 0 },
                      { label: 'Working Capital',        value: INR((kpis.receivables || 0) + (kpis.inventoryValue || 0) + (kpis.cashBalance || 0) - (kpis.payables || 0)), positive: true },
                      { label: 'Receivables',            value: INR(kpis.receivables), positive: false },
                      { label: 'Payables',               value: INR(kpis.payables), positive: false },
                      { label: 'GST Liability',          value: INR(kpis.gstLiability), positive: false },
                      { label: 'Cash & Bank Balance',    value: INR(kpis.cashBalance), positive: kpis.cashBalance > 0 },
                      { label: 'Stock Value',            value: INR(kpis.inventoryValue), positive: true },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between py-2.5">
                        <span className="text-sm text-slate-600">{row.label}</span>
                        <span className={`text-sm font-bold ${row.positive ? 'text-emerald-700' : 'text-slate-900'}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick links to detailed reports */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-bold text-lg">Need more detail?</h3>
                <p className="text-indigo-200 text-sm mt-0.5">Drill down into specific performance areas</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Sales Performance', href: '/dashboard/reports/management/sales-performance' },
                  { label: 'Profit Performance', href: '/dashboard/reports/management/profit-performance' },
                  { label: 'Margin Analysis', href: '/dashboard/reports/management/margin-analysis' },
                  { label: 'Aging Summary', href: '/dashboard/reports/management/aging-summary' },
                ].map(l => (
                  <Link key={l.label} href={l.href} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg transition border border-white/20">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
