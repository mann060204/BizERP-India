// @ts-nocheck
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../components/layout/Topbar';
import { useAppSelector } from '../../hooks/useRedux';
import { invoicesApi, purchasesApi, inventoryApi, dashboardApi } from '../../lib/erp-api';
import {
  TrendingUp, TrendingDown, CreditCard, Wallet, AlertTriangle,
  ArrowUpRight, ShoppingCart, Loader2, FilePlus, PackagePlus,
  UserPlus, SlidersHorizontal, BarChart2, Package, Users,
  AlertCircle, Receipt, FileText, Wrench, ChevronRight, IndianRupee
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const QUICK_ACTIONS = [
  { label: 'New Invoice',      href: '/dashboard/sales/new',      icon: FilePlus,       color: 'text-indigo-600',  bg: 'bg-indigo-50',  desc: 'Create GST invoice' },
  { label: 'Add Purchase',     href: '/dashboard/purchases/new',  icon: PackagePlus,    color: 'text-blue-600',    bg: 'bg-blue-50',    desc: 'Record a purchase bill' },
  { label: 'Add Customer',     href: '/dashboard/customers/new',  icon: UserPlus,       color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Add new customer' },
  { label: 'Stock Adjust',     href: '/dashboard/inventory',      icon: SlidersHorizontal, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Manage inventory' },
  { label: 'New Expense',      href: '/dashboard/expenses',       icon: Receipt,        color: 'text-red-600',     bg: 'bg-red-50',     desc: 'Record an expense' },
  { label: 'View Reports',     href: '/dashboard/reports',        icon: FileText,       color: 'text-purple-600',  bg: 'bg-purple-50',  desc: 'Check business reports' },
  { label: 'Tools',            href: '/dashboard/tools',          icon: Wrench,         color: 'text-slate-600',   bg: 'bg-slate-100',  desc: 'Utilities & tools' },
];

const DONUT_COLORS = ['#6366f1', '#f97316'];
const TOP_COLORS   = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
const BOT_COLORS   = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#94a3b8'];

const fmt = (n: number) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
    ? `₹${(n / 1000).toFixed(1)}k`
    : `₹${(n || 0).toFixed(0)}`;

const fmtFull = (n: number) =>
  `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ── Compact Date Filter ─────────────────────────────────────────────────────
function MiniFilter({ onChange, defaultPeriod = 'month' }: { onChange: (p: any) => void; defaultPeriod?: string }) {
  const [active, setActive] = useState(defaultPeriod);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const pick = (p: string) => {
    setActive(p);
    if (p === 'custom') { setShowCustom(true); return; }
    setShowCustom(false);
    onChange({ period: p });
  };

  const apply = () => { if (from && to) { setActive('custom'); onChange({ from, to }); setShowCustom(false); } };

  const btn = (p: string, label: string) => (
    <button key={p} onClick={() => pick(p)}
      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${active === p ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
      {label}
    </button>
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-0.5">
        {btn('week', 'W')}
        {btn('month', 'M')}
        {btn('year', 'Y')}
        {btn('custom', '⋯')}
      </div>
      {showCustom && (
        <div className="absolute right-0 top-7 z-50 bg-white border border-slate-200 shadow-xl rounded-xl p-3 flex flex-col gap-2 w-52">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs" />
          <button onClick={apply} className="w-full py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold">Apply</button>
        </div>
      )}
    </div>
  );
}

// ── Small Chart Card ────────────────────────────────────────────────────────
function ChartCard({ title, icon, filter, loading, children, span = 1 }: any) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition ${span === 2 ? 'col-span-2' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{icon}</span>
          <h3 className="text-xs font-bold text-slate-700">{title}</h3>
        </div>
        {filter}
      </div>
      {loading
        ? <div className="h-36 flex items-center justify-center"><Loader2 className="w-5 h-5 text-slate-300 animate-spin" /></div>
        : children}
    </div>
  );
}

const CustomTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-xs">
      <p className="font-semibold text-slate-600 mb-1">{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} style={{ color: e.color }} className="font-medium">
          {e.name}: {typeof e.value === 'number' && e.value > 999 ? fmtFull(e.value) : e.value}
        </p>
      ))}
    </div>
  );
};

// ── Main Page ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  const [kpiLoading, setKpiLoading] = useState(true);
  const [stats, setStats] = useState({ sales: 0, received: 0, salesOutstanding: 0, purchases: 0, paid: 0, lowStock: 0 });

  const [trendData, setTrendData] = useState<any[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<{ high: any[]; low: any[] }>({ high: [], low: [] });
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [topProfit, setTopProfit] = useState<any[]>([]);
  const [topProfitLoading, setTopProfitLoading] = useState(true);
  const [bottomProfit, setBottomProfit] = useState<any[]>([]);
  const [bottomProfitLoading, setBottomProfitLoading] = useState(true);
  const [stockMovement, setStockMovement] = useState<any>({ summary: [], deadItems: [] });
  const [stockLoading, setStockLoading] = useState(true);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [topCustLoading, setTopCustLoading] = useState(true);
  const [pendingCustomers, setPendingCustomers] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

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

    dashboardApi.customerPending()
      .then(d => setPendingCustomers(d.data || []))
      .catch(() => {})
      .finally(() => setPendingLoading(false));
  }, []);

  const fetchAll = useCallback((params: any) => {
    setTrendLoading(true); setInventoryLoading(true); setTopProfitLoading(true);
    setBottomProfitLoading(true); setStockLoading(true); setTopCustLoading(true);

    dashboardApi.businessTrend(params).then(d => setTrendData(d.data || [])).catch(() => setTrendData([])).finally(() => setTrendLoading(false));
    dashboardApi.inventoryVolume().then(d => setInventoryData(d.data || { high: [], low: [] })).catch(() => {}).finally(() => setInventoryLoading(false));
    dashboardApi.topItemsProfit(params).then(d => setTopProfit(d.data || [])).catch(() => setTopProfit([])).finally(() => setTopProfitLoading(false));
    dashboardApi.bottomItemsProfit(params).then(d => setBottomProfit(d.data || [])).catch(() => setBottomProfit([])).finally(() => setBottomProfitLoading(false));
    dashboardApi.stockMovement(params).then(d => setStockMovement(d.data || { summary: [], deadItems: [] })).catch(() => {}).finally(() => setStockLoading(false));
    dashboardApi.topCustomers(params).then(d => setTopCustomers(d.data || [])).catch(() => setTopCustomers([])).finally(() => setTopCustLoading(false));
  }, []);

  useEffect(() => { fetchAll({ period: 'month' }); }, []);

  const KPI_CARDS = [
    { label: 'Sales (Month)', value: fmt(stats.sales), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Purchases',     value: fmt(stats.purchases), icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Received',      value: fmt(stats.received), icon: Wallet, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Outstanding',   value: fmt(stats.salesOutstanding), icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Paid Out',      value: fmt(stats.paid), icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Low Stock',     value: `${stats.lowStock}`, icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Topbar title="Dashboard" />

      <main className="flex-1 p-5 overflow-auto">
        {/* Greeting */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">Good {greeting}, {user?.name?.split(' ')[0] || 'Admin'} 👋</h2>
          <p className="text-slate-500 text-sm mt-0.5">Here's your business snapshot.</p>
        </div>

        {/* ── Two-column layout ────────────────────────────────────────────── */}
        <div className="flex gap-5 items-start">

          {/* LEFT: KPIs + Charts (main area) */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* KPI Strip */}
            {kpiLoading
              ? <div className="h-20 flex items-center justify-center"><Loader2 className="w-5 h-5 text-slate-300 animate-spin" /></div>
              : (
                <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
                  {KPI_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-1.5 shadow-sm hover:shadow-md transition">
                      <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                      </div>
                      <p className="text-slate-900 text-base font-bold">{value}</p>
                      <p className="text-slate-400 text-[10px] font-medium leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
              )}

            {/* Chart Grid */}
            <div className="grid grid-cols-2 gap-4">

              {/* Business Trend — full width */}
              <ChartCard span={2} title="Business Trend — Revenue vs Purchases" icon="📈"
                filter={<MiniFilter onChange={p => { setTrendLoading(true); dashboardApi.businessTrend(p).then(d => setTrendData(d.data || [])).finally(() => setTrendLoading(false)); }} />}
                loading={trendLoading}>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" minTickGap={24} />
                      <YAxis fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={v => fmt(v)} />
                      <Tooltip content={<CustomTip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="purchases" name="Purchases" stroke="#f97316" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* High Volume Inventory */}
              <ChartCard title="High Volume Inventory" icon="📦"
                filter={<MiniFilter onChange={p => { setInventoryLoading(true); dashboardApi.inventoryVolume(p).then(d => setInventoryData(d.data || { high: [], low: [] })).finally(() => setInventoryLoading(false)); }} />}
                loading={inventoryLoading}>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryData.high.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 4, left: 55, bottom: 0 }}>
                      <XAxis type="number" fontSize={8} tickLine={false} axisLine={false} stroke="#94a3b8" />
                      <YAxis type="category" dataKey="name" fontSize={8} tickLine={false} axisLine={false} stroke="#94a3b8" width={54} />
                      <Tooltip content={<CustomTip />} />
                      <Bar dataKey="stock" name="Stock" fill="#6366f1" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Low Volume Inventory */}
              <ChartCard title="Low Volume Inventory" icon="📉" filter={null} loading={inventoryLoading}>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryData.low.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 4, left: 55, bottom: 0 }}>
                      <XAxis type="number" fontSize={8} tickLine={false} axisLine={false} stroke="#94a3b8" />
                      <YAxis type="category" dataKey="name" fontSize={8} tickLine={false} axisLine={false} stroke="#94a3b8" width={54} />
                      <Tooltip content={<CustomTip />} />
                      <Bar dataKey="stock" name="Stock" fill="#f97316" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Top 5 by Revenue */}
              <ChartCard title="Top 5 Items by Revenue" icon="🏆"
                filter={<MiniFilter onChange={p => { setTopProfitLoading(true); dashboardApi.topItemsProfit(p).then(d => setTopProfit(d.data || [])).finally(() => setTopProfitLoading(false)); }} />}
                loading={topProfitLoading}>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProfit} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
                      <XAxis dataKey="name" fontSize={8} tickLine={false} axisLine={false} stroke="#94a3b8" />
                      <YAxis fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={v => fmt(v)} />
                      <Tooltip content={<CustomTip />} />
                      <Bar dataKey="revenue" name="Revenue" radius={[3, 3, 0, 0]}>
                        {topProfit.map((_, i) => <Cell key={i} fill={TOP_COLORS[i % TOP_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Bottom 5 by Revenue */}
              <ChartCard title="Bottom 5 Items by Revenue" icon="⚠️"
                filter={<MiniFilter onChange={p => { setBottomProfitLoading(true); dashboardApi.bottomItemsProfit(p).then(d => setBottomProfit(d.data || [])).finally(() => setBottomProfitLoading(false)); }} />}
                loading={bottomProfitLoading}>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bottomProfit} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
                      <XAxis dataKey="name" fontSize={8} tickLine={false} axisLine={false} stroke="#94a3b8" />
                      <YAxis fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={v => fmt(v)} />
                      <Tooltip content={<CustomTip />} />
                      <Bar dataKey="revenue" name="Revenue" radius={[3, 3, 0, 0]}>
                        {bottomProfit.map((_, i) => <Cell key={i} fill={BOT_COLORS[i % BOT_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Dead vs Fast Moving */}
              <ChartCard title="Dead vs Fast Moving Stock" icon="🔄"
                filter={<MiniFilter onChange={p => { setStockLoading(true); dashboardApi.stockMovement(p).then(d => setStockMovement(d.data || { summary: [], deadItems: [] })).finally(() => setStockLoading(false)); }} />}
                loading={stockLoading}>
                <div className="flex items-center gap-3 h-36">
                  <div className="w-32 h-full flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stockMovement.summary} cx="50%" cy="50%" innerRadius={28} outerRadius={48} dataKey="value" nameKey="name" paddingAngle={4}>
                          {stockMovement.summary.map((_: any, i: number) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                        </Pie>
                        <Tooltip content={<CustomTip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '9px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1 max-h-36 pr-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dead Stock</p>
                    {stockMovement.deadItems?.slice(0, 5).map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-0.5 border-b border-slate-50">
                        <span className="text-[10px] text-slate-600 truncate max-w-[90px]">{item.name}</span>
                        <span className="text-[10px] font-bold text-red-500 ml-1">{item.stock} u</span>
                      </div>
                    ))}
                    {(!stockMovement.deadItems || stockMovement.deadItems.length === 0) &&
                      <p className="text-[10px] text-emerald-500 font-medium">No dead stock 🎉</p>}
                  </div>
                </div>
              </ChartCard>

              {/* Top 5 Customers */}
              <ChartCard title="Top 5 Customers by Revenue" icon="🌟"
                filter={<MiniFilter onChange={p => { setTopCustLoading(true); dashboardApi.topCustomers(p).then(d => setTopCustomers(d.data || [])).finally(() => setTopCustLoading(false)); }} />}
                loading={topCustLoading}>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCustomers} layout="vertical" margin={{ top: 0, right: 4, left: 60, bottom: 0 }}>
                      <XAxis type="number" fontSize={8} tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={v => fmt(v)} />
                      <YAxis type="category" dataKey="name" fontSize={8} tickLine={false} axisLine={false} stroke="#94a3b8" width={60} />
                      <Tooltip content={<CustomTip />} />
                      <Bar dataKey="totalRevenue" name="Revenue" radius={[0, 3, 3, 0]}>
                        {topCustomers.map((_: any, i: number) => <Cell key={i} fill={TOP_COLORS[i % TOP_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Customer Pending — full width */}
              <ChartCard span={2} title="Customer Pending Payments" icon="⏳" filter={null} loading={pendingLoading}>
                {pendingCustomers.length === 0
                  ? <p className="text-xs text-emerald-600 font-medium py-2">All customers are settled — no pending dues! 🎉</p>
                  : (
                    <div className="overflow-x-auto max-h-40">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-1.5 px-2 text-[10px] text-slate-400 font-semibold uppercase">#</th>
                            <th className="text-left py-1.5 px-2 text-[10px] text-slate-400 font-semibold uppercase">Customer</th>
                            <th className="text-left py-1.5 px-2 text-[10px] text-slate-400 font-semibold uppercase">Mobile</th>
                            <th className="text-right py-1.5 px-2 text-[10px] text-slate-400 font-semibold uppercase">Pending</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingCustomers.map((c, i) => (
                            <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                              <td className="py-1.5 px-2 text-slate-400">{i + 1}</td>
                              <td className="py-1.5 px-2 font-semibold text-slate-700">{c.name}</td>
                              <td className="py-1.5 px-2 text-slate-400">{c.mobile || '—'}</td>
                              <td className="py-1.5 px-2 text-right font-bold text-orange-600">{fmtFull(c.currentBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-white">
                          <tr className="border-t-2 border-slate-200">
                            <td colSpan={3} className="py-1.5 px-2 text-[10px] font-bold text-slate-600 uppercase">Total Pending</td>
                            <td className="py-1.5 px-2 text-right font-bold text-red-600">
                              {fmtFull(pendingCustomers.reduce((s, c) => s + c.currentBalance, 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
              </ChartCard>

            </div>
          </div>

          {/* RIGHT: Quick Actions sidebar */}
          <div className="w-52 flex-shrink-0 space-y-3 sticky top-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Quick Actions</h3>
            {QUICK_ACTIONS.map(({ label, href, icon: Icon, color, bg, desc }) => (
              <button key={label} onClick={() => router.push(href)}
                className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition">{label}</p>
                  <p className="text-[10px] text-slate-400 truncate">{desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 ml-auto flex-shrink-0 transition" />
              </button>
            ))}

            {/* Mini KPI card below QA */}
            <div className="mt-2 pt-3 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 mb-2">Today's Snapshot</h3>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white space-y-3">
                <div>
                  <p className="text-indigo-200 text-[10px] font-medium uppercase tracking-wider">Month Sales</p>
                  <p className="text-white font-bold text-lg">{fmt(stats.sales)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/10 rounded-lg p-2">
                    <p className="text-indigo-200 text-[9px]">Outstanding</p>
                    <p className="text-white font-bold text-sm">{fmt(stats.salesOutstanding)}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <p className="text-indigo-200 text-[9px]">Low Stock</p>
                    <p className="text-white font-bold text-sm">{stats.lowStock}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
