'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../components/layout/Topbar';
import { useAppSelector } from '../../hooks/useRedux';
import { invoicesApi, purchasesApi, inventoryApi, reportsApi } from '../../lib/erp-api';
import {
  TrendingUp, TrendingDown, CreditCard, Wallet,
  AlertTriangle, IndianRupee, ArrowUpRight,
  ShoppingCart, Loader2, FilePlus, PackagePlus, UserPlus, SlidersHorizontal
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

const QUICK_ACTIONS = [
  { label: 'New Invoice', href: '/dashboard/sales/new', icon: FilePlus, desc: 'Create GST invoice' },
  { label: 'Add Purchase', href: '/dashboard/purchases/new', icon: PackagePlus, desc: 'Record a purchase bill' },
  { label: 'Add Customer', href: '/dashboard/customers/new', icon: UserPlus, desc: 'Add new customer' },
  { label: 'Stock Adjustment', href: '/dashboard/inventory', icon: SlidersHorizontal, desc: 'Manage inventory' },
];

export default function DashboardPage() {
  const { user } = useAppSelector((s) => s.auth);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    sales: 0, received: 0, salesOutstanding: 0,
    purchases: 0, paid: 0, purchasesOutstanding: 0,
    lowStock: 0
  });
  const [charts, setCharts] = useState({ salesData: [], profitData: [] });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [invRes, purRes, invenRes, chartsRes] = await Promise.all([
          invoicesApi.summary().catch(() => ({ data: { monthSales: 0, totalReceived: 0, totalOutstanding: 0 } })),
          purchasesApi.summary().catch(() => ({ data: { monthPurchases: 0, totalPaid: 0, totalOutstanding: 0 } })),
          inventoryApi.list({ lowStock: 'true', limit: 1 }).catch(() => ({ data: { lowStockCount: 0 } })),
          reportsApi.dashboardCharts().catch(() => ({ data: { salesData: [], profitData: [] } }))
        ]);

        setStats({
          sales: invRes.data.monthSales || 0,
          received: invRes.data.totalReceived || 0,
          salesOutstanding: invRes.data.totalOutstanding || 0,
          purchases: purRes.data.monthPurchases || 0,
          paid: purRes.data.totalPaid || 0,
          purchasesOutstanding: purRes.data.totalOutstanding || 0,
          lowStock: invenRes.data.lowStockCount || 0
        });
        setCharts(chartsRes.data);
      } catch (e) {
        console.error('Failed to fetch dashboard stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const KPI_CARDS = [
    { label: 'Total Sales (Month)', value: `₹${stats.sales.toFixed(2)}`, sub: 'Taxable value of sales', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Total Purchases (Month)', value: `₹${stats.purchases.toFixed(2)}`, sub: 'Taxable value of purchases', icon: ShoppingCart, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Amount Received', value: `₹${stats.received.toFixed(2)}`, sub: 'Total payments in', icon: Wallet, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: 'Outstanding (To Receive)', value: `₹${stats.salesOutstanding.toFixed(2)}`, sub: 'Pending from customers', icon: CreditCard, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Amount Paid', value: `₹${stats.paid.toFixed(2)}`, sub: 'Total payments out', icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Low Stock Alerts', value: `${stats.lowStock}`, sub: 'Products below reorder', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-3 rounded-lg shadow-xl">
          <p className="text-white font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-semibold flex justify-between gap-4" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span>₹{entry.value.toFixed(2)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Dashboard" />

      <main className="flex-1 p-6 space-y-8 overflow-auto">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold text-white">
            Good {greeting},{' '}
            <span className="text-white">{user?.name?.split(' ')[0] || 'Admin'}</span> 👋
          </h2>
          <p className="text-[#94a3b8] mt-1 text-sm">Here's your business snapshot for today.</p>
        </div>

        {/* KPI Grid */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#D4D4D4]" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {KPI_CARDS.map(({ label, value, sub, icon: Icon, color, bg }) => {
                const glowClass = color.includes('emerald') ? 'glow-green' : color.includes('red') ? 'glow-red' : color.includes('blue') ? 'glow-blue' : color.includes('violet') ? 'glow-purple' : color.includes('yellow') ? 'glow-yellow' : color.includes('orange') ? 'glow-orange' : 'glow-purple';
                return (
                <div key={label} className={`glass ngrok-card-hover ${glowClass} rounded-2xl p-5 group cursor-default`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#475569] group-hover:text-[#D4D4D4] transition" />
                  </div>
                  <p className="text-[#94a3b8] text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-white text-2xl font-bold">{value}</p>
                  <p className="text-[#475569] text-xs mt-1">{sub}</p>
                </div>
                );
              })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Sales Area Chart */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold">Sales Overview</h3>
                  <span className="text-xs text-[#94a3b8] bg-[#000000] px-3 py-1 rounded-full border border-[#1A1A1A]">Last 30 days</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.salesData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} minTickGap={20} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                      <CartesianGrid strokeDasharray="3 3" stroke="#0A0A0A" vertical={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="sales" name="Sales" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Profit Bar Chart */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold">Revenue vs Profit</h3>
                  <span className="text-xs text-[#94a3b8] bg-[#000000] px-3 py-1 rounded-full border border-[#1A1A1A]">Last 6 Months</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.profitData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                      <CartesianGrid strokeDasharray="3 3" stroke="#0A0A0A" vertical={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#0A0A0A', opacity: 0.4 }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="revenue" name="Revenue" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Net Profit" fill="#D4D4D4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map(({ label, href, icon: ActionIcon, desc }) => (
              <a key={label} href={href}
                className="glass ngrok-card-hover rounded-2xl p-5 group cursor-pointer flex flex-col justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#111111] border border-[#1A1A1A] flex items-center justify-center mb-4 group-hover:bg-[#2563EB]/10 group-hover:border-[#2563EB]/30 transition">
                  {ActionIcon && <ActionIcon className="w-5 h-5 text-[#94a3b8] group-hover:text-[#2563EB] transition" />}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold group-hover:text-[#FFFFFF] transition">{label}</p>
                  <p className="text-[#475569] text-xs mt-1">{desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

