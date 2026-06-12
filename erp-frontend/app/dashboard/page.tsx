// @ts-nocheck
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatAccountingBalance } from '@/lib/utils';
import Topbar from '../../components/layout/Topbar';
import ProductQuickSearch from '../../components/shared/ProductQuickSearch';
import { useAppSelector } from '../../hooks/useRedux';
import QuickPaymentModal from './components/QuickPaymentModal';
import { invoicesApi, purchasesApi, inventoryApi, dashboardApi, businessApi, expensesApi } from '../../lib/erp-api';
import {
  TrendingUp, TrendingDown, CreditCard, Wallet, AlertTriangle,
  ArrowUpRight, ShoppingCart, Loader2, FilePlus, PackagePlus,
  UserPlus, SlidersHorizontal, BarChart2, Package, Users,
  AlertCircle, Receipt, FileText, Wrench, ChevronRight, IndianRupee, Eye, EyeOff, X
} from 'lucide-react';
import { banksApi, accountsApi, reportsApi } from '../../lib/erp-api';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const QUICK_ACTIONS = [
  { label: 'New Invoice',      href: '/dashboard/sales/new',      icon: FilePlus,       color: 'text-amber-700',   bg: 'bg-amber-50',   desc: 'Create GST invoice' },
  { label: 'Add Purchase',     href: '/dashboard/purchases/new',  icon: PackagePlus,    color: 'text-sky-700',     bg: 'bg-sky-50',     desc: 'Record a purchase bill' },
  { label: 'Add Customer',     href: '/dashboard/customers/new',  icon: UserPlus,       color: 'text-emerald-700', bg: 'bg-emerald-50', desc: 'Add new customer' },
  { label: 'Add Product',      href: '/dashboard/masters/items?action=add-product', icon: Package, color: 'text-purple-700', bg: 'bg-purple-50', desc: 'Add new product or service' },
  { label: 'Stock Adjust',     href: '/dashboard/inventory',      icon: SlidersHorizontal, color: 'text-orange-700', bg: 'bg-orange-50', desc: 'Manage inventory' },
  { label: 'New Expense',      href: '/dashboard/expenses',       icon: Receipt,        color: 'text-rose-700',    bg: 'bg-rose-50',    desc: 'Record an expense' },
];

const DONUT_COLORS = ['var(--primary)', 'var(--accent)'];
const TOP_COLORS   = ['var(--primary)', 'var(--accent)', 'var(--warning)', 'var(--text)', 'var(--bg-elevated)'];
const BOT_COLORS   = ['var(--danger)', 'var(--primary)', 'var(--accent)', 'var(--success)', 'var(--text-muted)'];

const fmt = (n: number) => {
  if (!n) return '₹0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  return `${sign}₹${abs.toFixed(0)}`;
};

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
      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${active === p ? 'text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
      style={active === p ? { background: 'var(--primary)' } : undefined}>
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
        <div className="absolute right-0 top-7 z-50 bg-white shadow-xl rounded-xl p-3 flex flex-col gap-2 w-52" style={{ border: '1px solid var(--border)' }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs" style={{ border: '1px solid var(--border)' }} />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs" style={{ border: '1px solid var(--border)' }} />
          <button onClick={apply} className="w-full py-1.5 rounded-lg text-white text-xs font-semibold" style={{ background: 'var(--primary)' }}>Apply</button>
        </div>
      )}
    </div>
  );
}

// ── Small Chart Card ────────────────────────────────────────────────────────
function ChartCard({ title, icon, filter, loading, children, span = 1 }: any) {
  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-3 transition ${span === 2 ? 'col-span-2' : ''}`}
      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '14px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{icon}</span>
          <h3 className="text-sm font-medium" style={{ color: 'var(--text)' }}>{title}</h3>
        </div>
        {filter}
      </div>
      {loading
        ? <div className="h-64 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-subtle)' }} /></div>
        : children}
    </div>
  );
}

const CustomTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-2.5 rounded-xl shadow-lg text-xs" style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)' }}>
      <p className="font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} style={{ color: e.color }} className="font-medium">
          {e.name}: {['Sales', 'Purchases', 'Expenses', 'Revenue'].includes(e.name) || e.name?.includes('Revenue') ? fmtFull(e.value) : (typeof e.value === 'number' ? e.value.toLocaleString('en-IN') : e.value)}
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
  const [businessName, setBusinessName] = useState('My Business');
  const [chartHeight, setChartHeight] = useState('h-64');
  const [privacyMode, setPrivacyMode] = useState(false);

  const [banks, setBanks] = useState<any[]>([]);
  const [cashInHand, setCashInHand] = useState(0);
  const [cashAccount, setCashAccount] = useState<any>(null);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [actions, setActions] = useState(QUICK_ACTIONS);
  const [paymentModalMode, setPaymentModalMode] = useState<'IN' | 'OUT' | null>(null);

  const dragKpiItem = useRef<number | null>(null);
  const dragOverKpiItem = useRef<number | null>(null);
  const defaultKpiOrder = [
    'Sales', 'Purchases', 'Expenses', 
    'Received', 'Outstanding', 'Paid Out', 'Low Stock'
  ];
  const [kpiOrder, setKpiOrder] = useState<string[]>(defaultKpiOrder);
  const [selectedKpi, setSelectedKpi] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('erp_kpi_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === defaultKpiOrder.length) {
          setKpiOrder(parsed);
        }
      }
    } catch {}
  }, []);

  const handleKpiSort = () => {
    let _order = [...kpiOrder];
    if (dragKpiItem.current !== null && dragOverKpiItem.current !== null && dragKpiItem.current !== dragOverKpiItem.current) {
      const draggedItem = _order.splice(dragKpiItem.current, 1)[0];
      _order.splice(dragOverKpiItem.current, 0, draggedItem);
      setKpiOrder(_order);
      try { localStorage.setItem('erp_kpi_order', JSON.stringify(_order)); } catch {}
    }
    dragKpiItem.current = null;
    dragOverKpiItem.current = null;
  };

  const handleSort = () => {
    let _actions = [...actions];
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const draggedItemContent = _actions.splice(dragItem.current, 1)[0];
      _actions.splice(dragOverItem.current, 0, draggedItemContent);
      setActions(_actions);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const [kpiLoading, setKpiLoading] = useState(true);
  const [stats, setStats] = useState({ sales: 0, received: 0, salesOutstanding: 0, purchases: 0, paid: 0, lowStock: 0, expenses: 0, todaySales: 0 });
  const [kpiPeriod, setKpiPeriod] = useState('month');

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
  const [pendingSuppliers, setPendingSuppliers] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  useEffect(() => {
    

    let baseCash = 0;
    businessApi.getProfile().then(res => {
      if (res.data.business?.name) setBusinessName(res.data.business.name);
      else if (res.data.business?.businessName) setBusinessName(res.data.business.businessName);
      if (res.data.business?.cashInHand) baseCash = res.data.business.cashInHand;
      setCashInHand(baseCash);
    }).catch(() => {
      setCashInHand(baseCash);
    });

    accountsApi.list().then(res => {
      const allAccounts = res.data?.accounts || [];
      const cash = allAccounts.find((a: any) => a.name === 'Cash');
      if (cash) setCashAccount(cash);
      setBanks(allAccounts.filter((a: any) => a.name !== 'Cash' && a.bankName));
    }).catch(console.error);

    Promise.all([
      dashboardApi.customerPending().catch(() => ({ data: [] })),
      dashboardApi.supplierPending().catch(() => ({ data: [] }))
    ]).then(([cust, supp]) => {
      setPendingCustomers(cust.data || []);
      setPendingSuppliers(supp.data || []);
    }).finally(() => setPendingLoading(false));
  }, []);

  useEffect(() => {
    setKpiLoading(true);
    Promise.all([
      invoicesApi.summary({ period: kpiPeriod }).catch(() => ({ data: {} })),
      purchasesApi.summary({ period: kpiPeriod }).catch(() => ({ data: {} })),
      inventoryApi.list({ lowStock: 'true', limit: 1 }).catch(() => ({ data: {} })),
      expensesApi.summary({ period: kpiPeriod }).catch(() => ({ data: {} })),
    ]).then(([inv, pur, inven, exp]) => {
      setStats({
        sales: inv.data.monthSales || 0,
        todaySales: inv.data.todaySales || 0,
        received: inv.data.totalReceived || 0,
        salesOutstanding: inv.data.outstanding || inv.data.totalOutstanding || 0,
        purchases: pur.data.monthPurchases || 0,
        paid: pur.data.totalPaid || 0,
        lowStock: inven.data.lowStockCount || 0,
        expenses: exp.data.monthTotal || 0,
      });
    }).finally(() => setKpiLoading(false));
  }, [kpiPeriod]);

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

  const renderAmount = (amount: any, formatter = fmtFull) => {
    if (privacyMode) return '****';
    return typeof amount === 'number' ? formatter(amount) : amount;
  };

  const ALL_KPI_CARDS = [
    { label: 'Sales', type: 'sales', value: renderAmount(stats.sales), icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Purchases', type: 'purchases', value: renderAmount(stats.purchases), icon: ShoppingCart, color: 'text-sky-700', bg: 'bg-sky-50' },
    { label: 'Expenses', type: 'expenses', value: renderAmount(stats.expenses), icon: Receipt, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Received', type: 'received', value: renderAmount(stats.received), icon: Wallet, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Outstanding', type: 'outstanding', value: renderAmount(stats.salesOutstanding), icon: CreditCard, color: 'text-orange-700', bg: 'bg-orange-50' },
    { label: 'Paid Out', type: 'paid', value: renderAmount(stats.paid), icon: TrendingDown, color: 'text-red-700', bg: 'bg-red-50' },
    { label: 'Low Stock', type: 'lowStock', value: `${stats.lowStock}`, icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50' },
  ];

  const orderedCards = kpiOrder.map(label => ALL_KPI_CARDS.find(c => c.label === label)).filter(Boolean);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <Topbar title="Dashboard" />

      <main className="flex-1 p-5 overflow-auto">
        {/* Greeting & KPI Period */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-medium tracking-tight" style={{ color: 'var(--text)' }}>Welcome back, {businessName || 'Admin'} 👋</h1>
            <p className="font-normal tracking-wide mt-1" style={{ color: 'var(--text-muted)' }}>Here is what's happening with your business.</p>
          </div>
          <div className="flex items-center w-full md:w-auto md:flex-1 md:px-8 max-w-2xl">
            <ProductQuickSearch />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Metrics:</span>
            <select value={kpiPeriod} onChange={e => setKpiPeriod(e.target.value)} className="shadow-sm text-sm font-medium rounded-lg py-1.5 px-3 cursor-pointer outline-none" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Chart Size:</span>
            <select 
              value={chartHeight}
              onChange={(e) => setChartHeight(e.target.value)}
              className="text-sm border-none bg-transparent font-medium outline-none cursor-pointer" style={{ color: 'var(--text)' }}
            >
              <option value="h-48">Small</option>
              <option value="h-64">Medium</option>
              <option value="h-96">Large</option>
            </select>
          </div>
          <button 
            onClick={() => setPrivacyMode(!privacyMode)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm hover:opacity-80 transition"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
            title={privacyMode ? "Show Figures" : "Hide Figures"}
          >
            {privacyMode ? <EyeOff className="w-5 h-5" style={{ color: 'var(--primary)' }} /> : <Eye className="w-5 h-5" style={{ color: 'var(--text-subtle)' }} />}
            <span className="text-xs font-medium uppercase tracking-wider hidden md:block">Privacy</span>
          </button>
        </div>

        {/* ── Two-column layout ────────────────────────────────────────────── */}
        <div className="flex flex-col xl:flex-row gap-5 items-start">

          {/* LEFT: KPIs + Charts (main area) */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* KPI Strip */}
            {kpiLoading
              ? <div className="h-20 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-subtle)' }} /></div>
              : (
                <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3">
                  {orderedCards.map((card, index) => {
                    if (!card) return null;
                    const { label, value, icon: Icon, color, bg } = card;
                    return (
                    <div 
                      key={label} 
                      draggable
                      onDragStart={() => (dragKpiItem.current = index)}
                      onDragEnter={() => (dragOverKpiItem.current = index)}
                      onDragEnd={handleKpiSort}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => setSelectedKpi(card)}
                      className="rounded-xl p-3 flex flex-col gap-1.5 transition cursor-grab active:cursor-grabbing hover:opacity-90"
                      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '12px' }}>
                      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center pointer-events-none`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <p className="text-xl font-medium pointer-events-none" style={{ color: 'var(--text)' }}>{value}</p>
                      <p className="text-xs font-medium leading-tight tracking-wide pointer-events-none" style={{ color: 'var(--text-subtle)' }}>{label}</p>
                    </div>
                  )})}
                </div>
              )}

            {/* Chart Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Business Trend — full width */}
              {!privacyMode && (
              <ChartCard span={2} title="Business Trend — Sales vs Purchases vs Expenses" icon={<TrendingUp className="w-5 h-5" style={{ color: 'var(--primary)' }} />}
                filter={<MiniFilter onChange={p => { setTrendLoading(true); dashboardApi.businessTrend(p).then(d => setTrendData(d.data || [])).finally(() => setTrendLoading(false)); }} />}
                loading={trendLoading}>
                <div className={chartHeight}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                      <XAxis dataKey="date" fontSize={11} fontWeight={500} tickLine={false} axisLine={false} stroke="#999" minTickGap={24} />
                      <YAxis fontSize={11} fontWeight={500} tickLine={false} axisLine={false} stroke="#999" tickFormatter={v => fmt(v)} />
                      <Tooltip content={<CustomTip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" dataKey="sales" name="Sales" stroke="var(--primary)" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="purchases" name="Purchases" stroke="var(--accent)" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="expenses" name="Expenses" stroke="var(--text)" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
              )}

              {/* High Volume Inventory */}
              <ChartCard title="High Volume Inventory" icon={<Package className="w-5 h-5 text-emerald-500" />}
                filter={<MiniFilter onChange={p => { setInventoryLoading(true); dashboardApi.inventoryVolume(p).then(d => setInventoryData(d.data || { high: [], low: [] })).finally(() => setInventoryLoading(false)); }} />}
                loading={inventoryLoading}>
                <div className={chartHeight}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryData.high.slice(0, chartHeight === 'h-48' ? 4 : 6)} layout="vertical" margin={{ top: 0, right: 4, left: 55, bottom: 0 }}>
                      <XAxis type="number" fontSize={11} fontWeight={500} tickLine={false} axisLine={false} stroke="#999" />
                      <YAxis type="category" dataKey="name" fontSize={11} fontWeight={500} tickLine={false} axisLine={false} stroke="#999" width={80} />
                      <Tooltip content={<CustomTip />} />
                      <Bar dataKey="stock" name="Stock" fill="var(--accent)" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Low Volume Inventory */}
              <ChartCard title="Low Volume Inventory" icon={<TrendingDown className="w-5 h-5 text-amber-500" />} filter={null} loading={inventoryLoading}>
                <div className={chartHeight}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryData.low.slice(0, chartHeight === 'h-48' ? 4 : 6)} layout="vertical" margin={{ top: 0, right: 4, left: 55, bottom: 0 }}>
                      <XAxis type="number" fontSize={11} fontWeight={500} tickLine={false} axisLine={false} stroke="#999" />
                      <YAxis type="category" dataKey="name" fontSize={11} fontWeight={500} tickLine={false} axisLine={false} stroke="#999" width={80} />
                      <Tooltip content={<CustomTip />} />
                      <Bar dataKey="stock" name="Stock" fill="var(--warning)" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Top 5 by Revenue */}
              {!privacyMode && (
              <ChartCard title="Top 5 Items by Revenue" icon={<ArrowUpRight className="w-5 h-5 text-emerald-600" />}
                filter={<MiniFilter onChange={p => { setTopProfitLoading(true); dashboardApi.topItemsProfit(p).then(d => setTopProfit(d.data || [])).finally(() => setTopProfitLoading(false)); }} />}
                loading={topProfitLoading}>
                <div className={chartHeight}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProfit} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
                      <XAxis dataKey="name" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} stroke="#000" />
                      <YAxis fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} stroke="#000" tickFormatter={v => fmt(v)} />
                      <Tooltip content={<CustomTip />} />
                      <Bar dataKey="revenue" name="Revenue" radius={[3, 3, 0, 0]}>
                        {topProfit.map((_, i) => <Cell key={i} fill={TOP_COLORS[i % TOP_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
              )}

              {/* Bottom 5 by Revenue */}
              {!privacyMode && (
              <ChartCard title="Bottom 5 Items by Revenue" icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                filter={<MiniFilter onChange={p => { setBottomProfitLoading(true); dashboardApi.bottomItemsProfit(p).then(d => setBottomProfit(d.data || [])).finally(() => setBottomProfitLoading(false)); }} />}
                loading={bottomProfitLoading}>
                <div className={chartHeight}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bottomProfit} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
                      <XAxis dataKey="name" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} stroke="#000" />
                      <YAxis fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} stroke="#000" tickFormatter={v => fmt(v)} />
                      <Tooltip content={<CustomTip />} />
                      <Bar dataKey="revenue" name="Revenue" radius={[3, 3, 0, 0]}>
                        {bottomProfit.map((_, i) => <Cell key={i} fill={BOT_COLORS[i % BOT_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
              )}

              {/* Cash Flow Overview */}
              <ChartCard title="Cash Flow Overview" icon={<IndianRupee className="w-5 h-5" style={{ color: 'var(--success, #1D9E75)' }} />}>
                <div className="flex items-center gap-3 h-64">
                  <div className="w-48 h-full flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { name: 'Income', value: Math.max(0, stats.sales || 0) },
                          { name: 'Purchases', value: Math.max(0, stats.purchases || 0) },
                          { name: 'Expenses', value: Math.max(0, stats.expenses || 0) }
                        ]} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" nameKey="name" paddingAngle={4}>
                          <Cell fill="var(--primary)" />
                          <Cell fill="var(--accent)" />
                          <Cell fill="var(--text)" />
                        </Pie>
                        <Tooltip content={<CustomTip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3 pr-2 flex flex-col justify-center">
                    <div className="pb-2" style={{ borderBottom: '0.5px solid var(--border)' }}>
                      <p className="text-[10px] uppercase font-medium tracking-wider mb-0.5" style={{ color: 'var(--text-subtle)' }}>Total Income</p>
                      <p className="text-sm font-medium text-emerald-700">{fmt(stats.sales || 0)}</p>
                    </div>
                    <div className="pb-2" style={{ borderBottom: '0.5px solid var(--border)' }}>
                      <p className="text-[10px] uppercase font-medium tracking-wider mb-0.5" style={{ color: 'var(--text-subtle)' }}>Total Purchases</p>
                      <p className="text-sm font-medium text-sky-700">{fmt(stats.purchases || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-medium tracking-wider mb-0.5" style={{ color: 'var(--text-subtle)' }}>Total Expenses</p>
                      <p className="text-sm font-medium text-amber-700">{fmt(stats.expenses || 0)}</p>
                    </div>
                  </div>
                </div>
              </ChartCard>

              {/* Top 5 Customers */}
              {!privacyMode && (
              <ChartCard title="Top 5 Customers by Revenue" icon={<Users className="w-5 h-5 text-amber-500" />}
                filter={<MiniFilter onChange={p => { setTopCustLoading(true); dashboardApi.topCustomers(p).then(d => setTopCustomers(d.data || [])).finally(() => setTopCustLoading(false)); }} />}
                loading={topCustLoading}>
                <div className={chartHeight}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCustomers} layout="vertical" margin={{ top: 0, right: 4, left: 60, bottom: 0 }}>
                      <XAxis type="number" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} stroke="#000" tickFormatter={v => fmt(v)} />
                      <YAxis type="category" dataKey="name" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} stroke="#000" width={80} />
                      <Tooltip content={<CustomTip />} />
                      <Bar dataKey="totalRevenue" name="Revenue" radius={[0, 3, 3, 0]}>
                        {topCustomers.map((_: any, i: number) => <Cell key={i} fill={TOP_COLORS[i % TOP_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
              )}

              {/* Customer Pending */}
              <ChartCard span={1} title="Customer Pending Payments" icon={<AlertCircle className="w-5 h-5 text-amber-500" />} filter={null} loading={pendingLoading}>
                {pendingCustomers.length === 0
                  ? <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--success-light)', border: '0.5px solid var(--success)' }}>
                      <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>✓ All customers are settled — no pending dues!</span>
                    </div>
                  : (
                    <div className="overflow-x-auto overflow-y-auto max-h-96">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-white shadow-sm z-10">
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-2 px-2 text-[11px] text-slate-500 font-bold uppercase tracking-wider">#</th>
                            <th className="text-left py-2 px-2 text-[11px] text-slate-500 font-bold uppercase tracking-wider">Customer</th>
                            <th className="text-right py-2 px-2 text-[11px] text-slate-500 font-bold uppercase tracking-wider">Pending</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingCustomers.map((c, i) => (
                            <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                              <td className="py-1.5 px-2 text-slate-400">{i + 1}</td>
                              <td className="py-1.5 px-2 font-semibold text-slate-700">{c.name}</td>
                              <td className={`py-1.5 px-2 text-right font-bold ${formatAccountingBalance(c.currentBalance, 'customer').colorClass}`}>{formatAccountingBalance(c.currentBalance, 'customer').text}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-white">
                          <tr className="border-t-2 border-slate-200">
                            <td colSpan={2} className="py-2 px-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Total Pending</td>
                            <td className={`py-2 px-2 text-right font-bold ${formatAccountingBalance(pendingCustomers.reduce((s, c) => s + c.currentBalance, 0), 'customer').colorClass}`}>
                              {formatAccountingBalance(pendingCustomers.reduce((s, c) => s + c.currentBalance, 0), 'customer').text}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
              </ChartCard>

              {/* Supplier Pending */}
              <ChartCard span={1} title="Supplier Pending Payments" icon={<AlertCircle className="w-5 h-5 text-amber-500" />} filter={null} loading={pendingLoading}>
                {pendingSuppliers.length === 0
                  ? <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--success-light)', border: '0.5px solid var(--success)' }}>
                      <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>✓ All suppliers are settled — no pending dues!</span>
                    </div>
                  : (
                    <div className="overflow-x-auto overflow-y-auto max-h-96">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-white shadow-sm z-10">
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-2 px-2 text-[11px] text-slate-500 font-bold uppercase tracking-wider">#</th>
                            <th className="text-left py-2 px-2 text-[11px] text-slate-500 font-bold uppercase tracking-wider">Supplier</th>
                            <th className="text-right py-2 px-2 text-[11px] text-slate-500 font-bold uppercase tracking-wider">Pending</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingSuppliers.map((s, i) => (
                            <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                              <td className="py-1.5 px-2 text-slate-400">{i + 1}</td>
                              <td className="py-1.5 px-2 font-semibold text-slate-700">{s.name}</td>
                              <td className={`py-1.5 px-2 text-right font-bold ${formatAccountingBalance(s.currentBalance, 'supplier').colorClass}`}>{formatAccountingBalance(s.currentBalance, 'supplier').text}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-white">
                          <tr className="border-t-2 border-slate-200">
                            <td colSpan={2} className="py-2 px-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Total Pending</td>
                            <td className={`py-2 px-2 text-right font-bold ${formatAccountingBalance(pendingSuppliers.reduce((sum, s) => sum + s.currentBalance, 0), 'supplier').colorClass}`}>
                              {formatAccountingBalance(pendingSuppliers.reduce((sum, s) => sum + s.currentBalance, 0), 'supplier').text}
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
          <div className="w-full xl:w-52 flex-shrink-0 space-y-3 xl:sticky xl:top-5">
            <h3 className="text-xs font-medium uppercase tracking-wider px-1" style={{ color: 'var(--text-subtle)' }}>Quick Actions</h3>
            {actions.map(({ label, href, icon: Icon, color, bg, desc }, index) => (
              <div key={label}
                draggable
                onDragStart={(e) => (dragItem.current = index)}
                onDragEnter={(e) => (dragOverItem.current = index)}
                onDragEnd={handleSort}
                onDragOver={(e) => e.preventDefault()}
                className="w-full">
                { (actions[index] as any).action ? (
                  <button onClick={() => {
                    if ((actions[index] as any).action === 'PAY_IN') setPaymentModalMode('IN');
                    else if ((actions[index] as any).action === 'PAY_OUT') setPaymentModalMode('OUT');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:-translate-y-0.5 transition-all text-left group cursor-grab active:cursor-grabbing"
                  style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)' }}>
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="min-w-0 pointer-events-none">
                      <p className="text-sm font-medium transition" style={{ color: 'var(--text)' }}>{label}</p>
                      <p className="text-xs truncate font-normal mt-0.5" style={{ color: 'var(--text-subtle)' }}>{desc}</p>
                    </div>
                    <div className="ml-auto flex items-center transition" style={{ color: 'var(--text-subtle)' }}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ) : (
                  <Link href={href as string} className="w-full flex items-center gap-3 p-3 rounded-xl hover:-translate-y-0.5 transition-all text-left group cursor-grab active:cursor-grabbing"
                    style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)' }}>
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="min-w-0 pointer-events-none">
                      <p className="text-sm font-medium transition" style={{ color: 'var(--text)' }}>{label}</p>
                      <p className="text-xs truncate font-normal mt-0.5" style={{ color: 'var(--text-subtle)' }}>{desc}</p>
                    </div>
                    <div className="ml-auto flex items-center transition" style={{ color: 'var(--text-subtle)' }}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </Link>
                )}
              </div>
            ))}

            {/* Mini KPI card below QA */}
            <div className="mt-2 pt-3" style={{ borderTop: '0.5px solid var(--border)' }}>
              <h3 className="text-xs font-medium uppercase tracking-wider px-1 mb-2" style={{ color: 'var(--text-subtle)' }}>Today's Snapshot</h3>
              <div className="rounded-xl p-4 text-white shadow-sm mb-3" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
                <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-0.5">Today's Sales</p>
                <p className="text-white font-medium text-2xl">{renderAmount(stats.todaySales)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button onClick={() => setPaymentModalMode('IN')} className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 hover:border-emerald-200 transition-colors group">
                  <div className="bg-emerald-100 p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                    <IndianRupee className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-medium text-emerald-800">Pay In</span>
                    <span className="block text-[9px] font-medium text-emerald-600/70 uppercase">Customer</span>
                  </div>
                </button>
                <button onClick={() => setPaymentModalMode('OUT')} className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 hover:border-rose-200 transition-colors group">
                  <div className="bg-rose-100 p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                    <CreditCard className="w-4 h-4 text-rose-700" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-medium text-rose-800">Pay Out</span>
                    <span className="block text-[9px] font-medium text-rose-600/70 uppercase">Supplier</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Bank & Cash Balances Widget */}
            <div className="mt-2 pt-3" style={{ borderTop: '0.5px solid var(--border)' }}>
              <h3 className="text-xs font-medium uppercase tracking-wider px-1 mb-2" style={{ color: 'var(--text-subtle)' }}>Fund Balances</h3>
              <div className="space-y-2">
                <div 
                    onClick={() => {
                      if (cashAccount) setSelectedKpi({ type: 'cash', label: 'Cash Transactions', bg: 'bg-emerald-100', color: 'text-emerald-700', icon: IndianRupee, accountId: cashAccount._id });
                    }}
                    className="flex items-center justify-between rounded-lg p-2 cursor-pointer transition-colors hover:opacity-80"
                    style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-700">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>Cash in Hand</span>
                  </div>
                  <span className={`text-sm font-medium ${cashInHand < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{renderAmount(cashInHand)}</span>
                </div>
                {banks.map(bank => (
                  <div key={bank._id} 
                    onClick={() => setSelectedKpi({ type: 'bank', label: bank.name || bank.bankName, bg: 'bg-sky-100', color: 'text-sky-700', icon: Wallet, accountId: bank._id })}
                    className="flex items-center justify-between rounded-lg p-2 cursor-pointer transition-colors hover:opacity-80"
                    style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <div className="bg-sky-100 p-1.5 rounded-lg text-sky-700">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium truncate max-w-[100px]" style={{ color: 'var(--text)' }}>{bank.bankName}</span>
                        <span className="text-[9px] truncate max-w-[100px]" style={{ color: 'var(--text-subtle)' }}>A/C: {bank.accountNumber}</span>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${bank.currentBalance < 0 ? 'text-red-600' : 'text-sky-700'}`}>{renderAmount(bank.currentBalance)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
      {selectedKpi && <KpiModal kpi={selectedKpi} onClose={() => setSelectedKpi(null)} />}
      {paymentModalMode && <QuickPaymentModal mode={paymentModalMode} onClose={() => setPaymentModalMode(null)} />}
    </div>
  );
}

function KpiModal({ kpi, onClose }: { kpi: any; onClose: () => void }) {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    let promise;

    if (['sales', 'received', 'outstanding'].includes(kpi.type)) {
      promise = invoicesApi.list({ limit: 500 }).then(res => res.data?.invoices || []);
    } else if (['purchases', 'paid'].includes(kpi.type)) {
      promise = purchasesApi.list({ limit: 500 }).then(res => res.data?.purchases || []);
    } else if (kpi.type === 'cash' || kpi.type === 'bank') {
      promise = accountsApi.getLedger(kpi.accountId).then(res => (res.data?.ledger || []).slice(-500).reverse());
    } else if (kpi.type === 'expenses') {
      promise = expensesApi.list({ limit: 500 }).then(res => res.data?.expenses || []);
    } else if (kpi.type === 'lowStock') {
      promise = inventoryApi.list({ lowStock: 'true', limit: 500 }).then(res => res.data?.inventory || []);
    } else {
      promise = Promise.resolve([]);
    }

    promise.then(resData => {
      if (active) { setData(resData); setLoading(false); }
    }).catch(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [kpi.type]);

  const handleViewAll = () => {
    onClose();
    if (['sales', 'received', 'outstanding'].includes(kpi.type)) router.push('/dashboard/sales');
    else if (['purchases', 'paid'].includes(kpi.type)) router.push('/dashboard/purchases');
    else if (kpi.type === 'expenses') router.push('/dashboard/expenses');
    else if (kpi.type === 'lowStock') router.push('/dashboard/inventory');
    else if (kpi.type === 'cash' || kpi.type === 'bank') router.push('/dashboard/reports/accounts/cash-book');
  };

  const renderRow = (item: any, i: number) => {
    if (kpi.type === 'lowStock') {
      return (
        <div key={i} className="flex justify-between items-center py-2.5 border-b last:border-0 text-sm">
          <div><p className="font-semibold text-slate-800">{item.name}</p><p className="text-xs text-slate-500">SKU: {item.sku || 'N/A'}</p></div>
          <div className="text-right"><p className="font-bold text-red-600">{item.currentStock} left</p></div>
        </div>
      );
    } else if (kpi.type === 'expenses') {
      return (
        <div key={i} className="flex justify-between items-center py-2.5 border-b last:border-0 text-sm">
          <div><p className="font-semibold text-slate-800">{item.category}</p><p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</p></div>
          <div className="text-right"><p className="font-bold text-slate-900">{fmtFull(item.totalWithTax)}</p></div>
        </div>
      );
    } else if (kpi.type === 'cash' || kpi.type === 'bank') {
      return (
        <div key={i} className="flex justify-between items-center py-2.5 border-b last:border-0 text-sm">
          <div><p className="font-semibold text-slate-800">{item.description || item.particulars || 'Transaction'}</p><p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</p></div>
          <div className="text-right">
            <p className={`font-bold ${item.credit > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {item.credit > 0 ? '-' : '+'}{fmtFull(item.credit > 0 ? item.credit : item.debit)}
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div key={i} className="flex justify-between items-center py-2.5 border-b last:border-0 text-sm">
          <div>
            <p className="font-semibold text-slate-800">{item.invoiceNumber || item.billNumber}</p>
            <p className="text-xs text-slate-500">{item.customerId?.name || item.supplierId?.name || 'Walk-in'} • {new Date(item.invoiceDate || item.billDate).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-900">{fmtFull(item.grandTotal)}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${item.status === 'paid' ? 'text-emerald-600' : item.status === 'partial' ? 'text-blue-600' : 'text-orange-600'}`}>{item.status}</p>
          </div>
        </div>
      );
    }
  };

  const Icon = kpi.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
             <Icon className={`w-5 h-5 ${kpi.color}`} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight">{kpi.label}</h3>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Recent related activity</p>
          </div>
        </div>
        <div className="p-5 min-h-[200px] max-h-[60vh] overflow-y-auto">
           {loading ? <div className="h-32 flex flex-col gap-2 items-center justify-center"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin"/><p className="text-xs text-slate-500 font-medium tracking-wide animate-pulse">Loading details...</p></div> 
            : data.length === 0 ? <div className="h-32 flex flex-col gap-2 items-center justify-center text-slate-400"><FileText className="w-8 h-8 opacity-20" /><p className="text-sm font-medium">No recent records found.</p></div>
            : <div className="flex flex-col">{data.map(renderRow)}</div>
           }
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-sm">Close</button>
          <button onClick={handleViewAll} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm shadow-indigo-200">View All Module</button>
        </div>
      </div>
    </div>
  )
}
