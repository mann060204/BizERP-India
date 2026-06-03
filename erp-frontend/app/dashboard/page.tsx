// @ts-nocheck
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../components/layout/Topbar';
import { useAppSelector } from '../../hooks/useRedux';
import { invoicesApi, purchasesApi, inventoryApi, dashboardApi } from '../../lib/erp-api';
import {
  TrendingUp, TrendingDown, CreditCard, Wallet,
  AlertTriangle, ArrowUpRight, ShoppingCart, Loader2,
  FilePlus, PackagePlus, UserPlus, SlidersHorizontal,
  BarChart2, Package, Users, AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import DateRangeFilter from './components/DateRangeFilter';

const QUICK_ACTIONS = [
  { label: 'New Invoice', href: '/dashboard/sales/new', icon: FilePlus, desc: 'Create GST invoice' },
  { label: 'Add Purchase', href: '/dashboard/purchases/new', icon: PackagePlus, desc: 'Record a purchase bill' },
  { label: 'Add Customer', href: '/dashboard/customers/new', icon: UserPlus, desc: 'Add new customer' },
  { label: 'Stock Adjustment', href: '/dashboard/inventory', icon: SlidersHorizontal, desc: 'Manage inventory' },
];

const DONUT_COLORS = ['#6366f1', '#f97316'];
const TOP_COLORS = ['#34d399', '#a3e635', '#60a5fa', '#c084fc', '#f472b6'];
const BOT_COLORS = ['#f87171', '#fb923c', '#fbbf24', '#e879f9', '#94a3b8'];

const fmt = (n: number) => `₹${n?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}`;

const ChartCard = ({ title, children, filter, loading }: any) => (
  <div className="glass rounded-2xl p-5 flex flex-col gap-3">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <h3 className="text-slate-900 font-semibold text-sm">{title}</h3>
      {filter}
    </div>
    {loading
      ? <div className="h-52 flex items-center justify-center"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>
      : children}
  </div>
);

const CustomTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} style={{ color: e.color }} className="font-medium">
          {e.name}: {typeof e.value === 'number' && e.value > 100 ? fmt(e.value) : e.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  // KPI state
  const [kpiLoading, setKpiLoading] = useState(true);
  const [stats, setStats] = useState({ sales: 0, received: 0, salesOutstanding: 0, purchases: 0, paid: 0, lowStock: 0 });

  // Chart states
  const [trendData, setTrendData] = useState<any[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  const [inventoryData, setInventoryData] = useState<{ high: any[]; low: any[] }>({ high: [], low: [] });
  const [inventoryLoading, setInventoryLoading] = useState(true);

  const [topProfit, setTopProfit] = useState<any[]>([]);
  const [topProfitLoading, setTopProfitLoading] = useState(true);

  const [bottomProfit, setBottomProfit] = useState<any[]>([]);
  const [bottomProfitLoading, setBottomProfitLoading] = useState(true);

  const [stockMovement, setStockMovement] = useState<{ summary: any[]; deadItems: any[]; fastItems: any[] }>({ summary: [], deadItems: [], fastItems: [] });
  const [stockLoading, setStockLoading] = useState(true);

  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [topCustLoading, setTopCustLoading] = useState(true);

  const [pendingCustomers, setPendingCustomers] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  // KPIs load once
  useEffect(() => {
    Promise.all([
      invoicesApi.summary().catch(() => ({ data: {} })),
      purchasesApi.summary().catch(() => ({ data: {} })),
      inventoryApi.list({ lowStock: 'true', limit: 1 }).catch(() => ({ data: {} })),
    ]).then(([inv, pur, inven]) => {
      setStats({
        sales: inv.data.monthSales || 0,
        received: inv.data.totalReceived || 0,
        salesOutstanding: inv.data.totalOutstanding || 0,
        purchases: pur.data.monthPurchases || 0,
        paid: pur.data.totalPaid || 0,
        lowStock: inven.data.lowStockCount || 0,
      });
    }).finally(() => setKpiLoading(false));
  }, []);

  // Customer pending — no date filter
  useEffect(() => {
    dashboardApi.customerPending()
      .then(d => setPendingCustomers(d.data || []))
      .catch(() => {})
      .finally(() => setPendingLoading(false));
  }, []);

  // Parameterised fetches
  const fetchTrend = useCallback((params: any) => {
    setTrendLoading(true);
    dashboardApi.businessTrend(params)
      .then(d => setTrendData(d.data || []))
      .catch(() => setTrendData([]))
      .finally(() => setTrendLoading(false));
  }, []);

  const fetchInventory = useCallback((_: any) => {
    setInventoryLoading(true);
    dashboardApi.inventoryVolume()
      .then(d => setInventoryData(d.data || { high: [], low: [] }))
      .catch(() => {})
      .finally(() => setInventoryLoading(false));
  }, []);

  const fetchTopProfit = useCallback((params: any) => {
    setTopProfitLoading(true);
    dashboardApi.topItemsProfit(params)
      .then(d => setTopProfit(d.data || []))
      .catch(() => setTopProfit([]))
      .finally(() => setTopProfitLoading(false));
  }, []);

  const fetchBottomProfit = useCallback((params: any) => {
    setBottomProfitLoading(true);
    dashboardApi.bottomItemsProfit(params)
      .then(d => setBottomProfit(d.data || []))
      .catch(() => setBottomProfit([]))
      .finally(() => setBottomProfitLoading(false));
  }, []);

  const fetchStock = useCallback((params: any) => {
    setStockLoading(true);
    dashboardApi.stockMovement(params)
      .then(d => setStockMovement(d.data || { summary: [], deadItems: [], fastItems: [] }))
      .catch(() => {})
      .finally(() => setStockLoading(false));
  }, []);

  const fetchTopCustomers = useCallback((params: any) => {
    setTopCustLoading(true);
    dashboardApi.topCustomers(params)
      .then(d => setTopCustomers(d.data || []))
      .catch(() => setTopCustomers([]))
      .finally(() => setTopCustLoading(false));
  }, []);

  // Initial load with month
  useEffect(() => {
    const p = { period: 'month' };
    fetchTrend(p);
    fetchInventory(p);
    fetchTopProfit(p);
    fetchBottomProfit(p);
    fetchStock(p);
    fetchTopCustomers(p);
  }, []);

  const KPI_CARDS = [
    { label: 'Total Sales (Month)', value: fmt(stats.sales), sub: 'Taxable value of sales', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Total Purchases (Month)', value: fmt(stats.purchases), sub: 'Taxable value of purchases', icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Amount Received', value: fmt(stats.received), sub: 'Total payments in', icon: Wallet, color: 'text-violet-500', bg: 'bg-violet-50' },
    { label: 'Outstanding (Customers)', value: fmt(stats.salesOutstanding), sub: 'Pending from customers', icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Amount Paid', value: fmt(stats.paid), sub: 'Total payments out', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Low Stock Alerts', value: `${stats.lowStock}`, sub: 'Products below reorder level', icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Dashboard" />

      <main className="flex-1 p-6 space-y-8 overflow-auto">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Good {greeting},{' '}
            <span className="text-slate-900">{user?.name?.split(' ')[0] || 'Admin'}</span> 👋
          </h2>
          <p className="text-slate-600 mt-1 text-sm">Here's your business snapshot.</p>
        </div>

        {/* KPI Grid */}
        {kpiLoading
          ? <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {KPI_CARDS.map(({ label, value, sub, icon: Icon, color, bg }) => (
                <div key={label} className="glass rounded-2xl p-5 hover:shadow-md transition group cursor-default">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
                  </div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-slate-900 text-2xl font-bold">{value}</p>
                  <p className="text-slate-400 text-xs mt-1">{sub}</p>
                </div>
              ))}
            </div>
          )}

        {/* ── ANALYTICS SECTION ─────────────────────────────────────────── */}
        <div className="space-y-6">
          <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" /> Business Analytics
          </h3>

          {/* Row 1: Business Trend (full width) */}
          <ChartCard
            title="📈 Business Trend — Revenue vs Purchases"
            loading={trendLoading}
            filter={<DateRangeFilter onChange={fetchTrend} />}
          >
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" minTickGap={20} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="purchases" name="Purchases" stroke="#f97316" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Row 2: High vs Low Inventory */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="📦 High Volume Inventory (Top 10)"
              loading={inventoryLoading}
              filter={<DateRangeFilter onChange={fetchInventory} />}
            >
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryData.high} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }}>
                    <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="name" fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" width={60} />
                    <Tooltip content={<CustomTip />} />
                    <Bar dataKey="stock" name="Stock" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="📉 Low Volume Inventory (Bottom 10)"
              loading={inventoryLoading}
              filter={null}
            >
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryData.low} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }}>
                    <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="name" fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" width={60} />
                    <Tooltip content={<CustomTip />} />
                    <Bar dataKey="stock" name="Stock" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Row 3: Top 5 & Bottom 5 by Profit */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="🏆 Top 5 Items by Revenue"
              loading={topProfitLoading}
              filter={<DateRangeFilter onChange={fetchTopProfit} />}
            >
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProfit} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTip />} />
                    <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                      {topProfit.map((_, i) => <Cell key={i} fill={TOP_COLORS[i % TOP_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="⚠️ Bottom 5 Items by Revenue"
              loading={bottomProfitLoading}
              filter={<DateRangeFilter onChange={fetchBottomProfit} />}
            >
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bottomProfit} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTip />} />
                    <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                      {bottomProfit.map((_, i) => <Cell key={i} fill={BOT_COLORS[i % BOT_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Row 4: Dead vs Fast Stock + Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="🔄 Dead Stock vs Fast Moving"
              loading={stockLoading}
              filter={<DateRangeFilter onChange={fetchStock} />}
            >
              <div className="flex items-start gap-4">
                <div className="h-48 w-48 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stockMovement.summary} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" nameKey="name" paddingAngle={4}>
                        {stockMovement.summary.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                      </Pie>
                      <Tooltip content={<CustomTip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 mt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dead Stock Items</p>
                  {stockMovement.deadItems.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-xs text-slate-700 truncate max-w-[120px]">{item.name}</span>
                      <span className="text-xs font-semibold text-red-500 ml-2">{item.stock} units</span>
                    </div>
                  ))}
                  {stockMovement.deadItems.length === 0 && <p className="text-xs text-slate-400">No dead stock 🎉</p>}
                </div>
              </div>
            </ChartCard>

            <ChartCard
              title="🌟 Top 5 Customers by Revenue"
              loading={topCustLoading}
              filter={<DateRangeFilter onChange={fetchTopCustomers} />}
            >
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCustomers} layout="vertical" margin={{ top: 0, right: 10, left: 70, bottom: 0 }}>
                    <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" width={70} />
                    <Tooltip content={<CustomTip />} />
                    <Bar dataKey="totalRevenue" name="Revenue" radius={[0, 4, 4, 0]}>
                      {topCustomers.map((_, i) => <Cell key={i} fill={TOP_COLORS[i % TOP_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Row 5: Customer Pending List */}
          <ChartCard title="⏳ Customer Pending Payments" loading={pendingLoading} filter={null}>
            {pendingCustomers.length === 0
              ? <div className="flex items-center gap-2 text-emerald-600 py-4"><AlertCircle className="w-4 h-4" /><span className="text-sm font-medium">All customers are settled! No pending dues.</span></div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 px-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">#</th>
                        <th className="text-left py-2 px-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">Customer</th>
                        <th className="text-left py-2 px-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">Mobile</th>
                        <th className="text-right py-2 px-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingCustomers.map((c, i) => (
                        <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 text-slate-400 text-xs">{i + 1}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{c.name}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-xs">{c.mobile || '—'}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="font-bold text-orange-600">{fmt(c.currentBalance)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="py-2.5 px-3 text-xs font-bold text-slate-700 uppercase">Total Pending</td>
                        <td className="py-2.5 px-3 text-right font-bold text-red-600">
                          {fmt(pendingCustomers.reduce((s, c) => s + c.currentBalance, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
          </ChartCard>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-slate-900 font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map(({ label, href, icon: ActionIcon, desc }) => (
              <div key={label} onClick={() => router.push(href)}
                className="group p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-200 transition">
                    {ActionIcon && <ActionIcon className="w-5 h-5 text-slate-500 group-hover:text-indigo-500 transition" />}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition" />
                </div>
                <p className="text-slate-900 text-sm font-semibold group-hover:text-indigo-600 transition">{label}</p>
                <p className="text-slate-400 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
