'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import Topbar from '../../../components/layout/Topbar';
import {
  FileText, TrendingUp, BookOpen, Calculator, BarChart3, Receipt, FileStack,
  Banknote, Briefcase, CreditCard, Download, Activity, Scale, CheckSquare,
  Archive, AlertTriangle, CheckCircle, SlidersHorizontal, BatteryCharging,
  Zap, Clock, Hash, List, Users, ShoppingCart, Package, DollarSign,
  BarChart2, PieChart, Layers, UserCheck, ArrowDownCircle, IndianRupee,
  ClipboardList, Truck, Wallet, History, Calendar, Star, GitMerge,
  Award, CornerUpLeft, Shield, Tag, Search, TrendingDown, Compass,
  Target, Globe, LayoutDashboard, Boxes, ArrowRightLeft, Cpu, ChevronRight
} from 'lucide-react';

// ─── Category Config ──────────────────────────────────────────────────────────
const CAT_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  'Accounts':              { color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-100', dot: 'bg-orange-500' },
  'Inventory':             { color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-100', dot: 'bg-purple-500' },
  'Sales':                 { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500' },
  'Purchases':             { color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-100',    dot: 'bg-red-500' },
  'Customers':             { color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-100',   dot: 'bg-blue-500' },
  'Suppliers':             { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-100',  dot: 'bg-amber-500' },
  'Expenses':              { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-100',   dot: 'bg-rose-500' },
  'GST / Tax':             { color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-100', dot: 'bg-indigo-500' },
  'Financials':            { color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-100',   dot: 'bg-teal-500' },
  'Compliance':            { color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200',  dot: 'bg-slate-500' },
  'Management Analytics':  { color: 'text-sky-700',     bg: 'bg-sky-50',     border: 'border-sky-100',    dot: 'bg-sky-500' },
  'Planning & Forecast':   { color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-100', dot: 'bg-violet-500' },
};

type Badge = 'IMPROVED' | 'NEW' | 'CONSOLIDATED';

interface ReportItem {
  name: string;
  desc: string;
  icon: any;
  href: string;
  badge?: Badge;
}

interface ReportSection {
  category: string;
  icon: any;
  items: ReportItem[];
}

// ─── Report Data ──────────────────────────────────────────────────────────────
const REPORTS: ReportSection[] = [
  {
    category: 'Accounts',
    icon: Banknote,
    items: [
      { name: 'Cash Book',           desc: 'Daily cash transaction summary',           icon: Banknote,      href: '/dashboard/reports/accounts/cash-book' },
      { name: 'Business Book',       desc: 'Comprehensive business ledger',            icon: Briefcase,     href: '/dashboard/reports/accounts/business-book' },
      { name: 'Payment Paid',        desc: 'Summary of all outgoing payments',         icon: CreditCard,    href: '/dashboard/reports/accounts/payment-paid' },
      { name: 'Payment Received',    desc: 'Summary of all incoming payments',         icon: Download,      href: '/dashboard/reports/accounts/payment-received' },
      { name: 'Daily Summary',       desc: 'Daybook and chronological ledger',         icon: Activity,      href: '/dashboard/reports/daybook' },
      { name: 'Profit & Loss',       desc: 'Sales vs Purchases vs Expenses',          icon: TrendingUp,    href: '/dashboard/reports/pnl' },
      { name: 'Chart of Accounts',   desc: 'Directory of all ledger accounts',         icon: List,          href: '/dashboard/reports/accounts/chart-of-accounts' },
      { name: 'Balance Sheet',       desc: 'Snapshot of assets & liabilities',         icon: Scale,         href: '/dashboard/reports/accounts/balance-sheet' },
    ],
  },
  {
    category: 'Inventory',
    icon: Package,
    items: [
      { name: 'Item Register',         desc: 'Complete registry of all items & stock',      icon: Archive,          href: '/dashboard/reports/inventory/item-register' },
      { name: 'Stock Availability',    desc: 'Current available stock balances',             icon: CheckCircle,      href: '/dashboard/reports/inventory/stock-availability' },
      { name: 'Low Level Stock',       desc: 'Items below minimum stock threshold',          icon: AlertTriangle,    href: '/dashboard/reports/inventory/low-level-stock' },
      { name: 'Stock Adjustment',      desc: 'History of manual stock adjustments',          icon: SlidersHorizontal,href: '/dashboard/reports/inventory/stock-adjustment' },
      { name: 'Fast Moving Items',     desc: 'High velocity inventory items',                icon: Zap,              href: '/dashboard/reports/inventory/fast-moving' },
      { name: 'Slow Moving Items',     desc: 'Dead stock or slow-moving items',              icon: Clock,            href: '/dashboard/reports/inventory/slow-moving' },
      { name: 'Consumable Stock',      desc: 'Tracking of consumable inventory',             icon: BatteryCharging,  href: '/dashboard/reports/inventory/consumable-stock' },
      { name: 'Available Serials',     desc: 'Available serial/batch numbers',               icon: Hash,             href: '/dashboard/reports/inventory/available-serials' },
      { name: 'Inventory Valuation',   desc: 'Total stock value at current cost',            icon: DollarSign,       href: '/dashboard/reports/advanced-inventory/inventory-valuation', badge: 'IMPROVED' },
      { name: 'Stock Movement',        desc: 'Historical log of all stock in/out',           icon: History,          href: '/dashboard/reports/advanced-inventory/stock-movement', badge: 'IMPROVED' },
      { name: 'Warehouse-wise Stock',  desc: 'Inventory by physical location',               icon: Boxes,            href: '/dashboard/reports/advanced-inventory/warehouse-stock' },
      { name: 'Dead Stock Analysis',   desc: 'Unsold capital & liquidation recommendations', icon: TrendingDown,     href: '/dashboard/reports/advanced-inventory/dead-stock-advanced', badge: 'CONSOLIDATED' },
      { name: 'Expiry Items',          desc: 'Monitor expiring batches',                     icon: AlertTriangle,    href: '/dashboard/reports/advanced-inventory/expiry-items' },
      { name: 'Inventory Turnover',    desc: 'Efficiency of stock sales cycle',              icon: ArrowRightLeft,   href: '/dashboard/reports/special/inventory-turnover-ratio' },
    ],
  },
  {
    category: 'Sales',
    icon: TrendingUp,
    items: [
      { name: 'Itemwise Sales',          desc: 'Total quantity and revenue per product',       icon: Package,     href: '/dashboard/reports/sales/itemwise' },
      { name: 'Invoicewise Sales',       desc: 'All invoices with payment status',             icon: ClipboardList,href: '/dashboard/reports/sales/invoicewise' },
      { name: 'Invoicewise Margin',      desc: 'Revenue vs cost per invoice',                  icon: BarChart2,   href: '/dashboard/reports/sales/invoicewise-margin' },
      { name: 'Itemwise Margin',         desc: 'Gross profit per product sold',                icon: PieChart,    href: '/dashboard/reports/sales/itemwise-margin' },
      { name: 'Customerwise Margin',     desc: 'Revenue analysis per customer',                icon: UserCheck,   href: '/dashboard/reports/sales/customerwise-margin' },
      { name: 'Invoicewise Summary',     desc: 'Per-invoice GST breakdown',                   icon: FileStack,   href: '/dashboard/reports/sales/invoicewise-summary' },
      { name: 'Customerwise Summary',    desc: 'Aggregated sales per customer',                icon: Users,       href: '/dashboard/reports/sales/customerwise-summary' },
      { name: 'Itemwise Summary',        desc: 'Item-level GST summary',                      icon: Layers,      href: '/dashboard/reports/sales/itemwise-summary' },
      { name: 'GST Sales Register',      desc: 'Invoice-level outward GST detail',            icon: IndianRupee, href: '/dashboard/reports/sales/gst' },
      { name: 'Active Recurring',        desc: 'All unpaid recurring invoices',                icon: ArrowDownCircle, href: '/dashboard/reports/sales/recurring' },
      { name: 'Salesperson Performance', desc: 'Sales, targets & margin by salesperson',      icon: Users,       href: '/dashboard/reports/advanced-sales/salesperson-performance', badge: 'IMPROVED' },
    ],
  },
  {
    category: 'Purchases',
    icon: ShoppingCart,
    items: [
      { name: 'Billwise Purchases',    desc: 'All purchase bills with status',                icon: ClipboardList, href: '/dashboard/reports/purchases/billwise' },
      { name: 'Itemwise Purchases',    desc: 'Quantity and amount per item',                  icon: Package,       href: '/dashboard/reports/purchases/itemwise' },
      { name: 'Billwise Summary',      desc: 'Bill totals with GST breakdown',                icon: FileStack,     href: '/dashboard/reports/purchases/billwise-summary' },
      { name: 'Itemwise Summary',      desc: 'Item totals across all bills',                  icon: Layers,        href: '/dashboard/reports/purchases/itemwise-summary' },
      { name: 'Supplierwise Summary',  desc: 'Totals grouped by supplier',                   icon: Truck,         href: '/dashboard/reports/purchases/supplierwise-summary' },
      { name: 'GST Purchase Register', desc: 'Bill-level ITC input register',                icon: IndianRupee,   href: '/dashboard/reports/purchases/gst' },
      { name: 'Purchase Return',       desc: 'Returned purchases with amounts',               icon: CornerUpLeft,  href: '/dashboard/reports/special/purchase-return-report', badge: 'IMPROVED' },
    ],
  },
  {
    category: 'Customers',
    icon: Users,
    items: [
      { name: 'Customer Account Balances', desc: 'All customer ledger balances',              icon: Wallet,     href: '/dashboard/reports/customers/account-balances' },
      { name: 'Customer Payment History',  desc: 'Payment records from all customers',        icon: History,    href: '/dashboard/reports/customers/payment-history' },
      { name: 'Customer 360°',             desc: 'Sales, outstanding, ledger, returns & buying history per customer', icon: Compass, href: '/dashboard/reports/customers/customer-360', badge: 'NEW' },
      { name: 'Customer Wise Item Sales',  desc: 'Products bought by each customer',          icon: ShoppingCart, href: '/dashboard/reports/special/customer-wise-item-sales' },
      { name: 'Inv. Wise Customer',        desc: 'Which customers bought specific items',     icon: Users,      href: '/dashboard/reports/special/inventory-wise-customer-summary' },
    ],
  },
  {
    category: 'Suppliers',
    icon: Truck,
    items: [
      { name: 'Supplier Account Balances', desc: 'Supplier ledger balance sheet',             icon: Wallet,    href: '/dashboard/reports/suppliers/account-balances' },
      { name: 'Supplier Payment History',  desc: 'Payments made to suppliers',                icon: History,   href: '/dashboard/reports/suppliers/payment-history' },
      { name: 'Supplier 360°',             desc: 'Purchase history, ledger, rate history & performance per supplier', icon: Compass, href: '/dashboard/reports/suppliers/supplier-360', badge: 'NEW' },
      { name: 'Supplier Rate Comparison',  desc: 'Compare item rates across suppliers',       icon: GitMerge,  href: '/dashboard/reports/special/supplier-rate-comparison' },
      { name: 'Supplier Item History',     desc: 'Item purchase history per supplier',        icon: Clock,     href: '/dashboard/reports/special/supplier-item-history' },
      { name: 'Supplier Performance',      desc: 'Evaluate vendors on volume & delivery',     icon: Award,     href: '/dashboard/reports/advanced-purchases/supplier-performance', badge: 'IMPROVED' },
      { name: 'Inv. Wise Supplier',        desc: 'Which suppliers provide specific items',    icon: Truck,     href: '/dashboard/reports/special/inventory-wise-supplier-summary' },
    ],
  },
  {
    category: 'Expenses',
    icon: Receipt,
    items: [
      { name: 'Search Expenses', desc: 'Filterable expense list',                              icon: Receipt, href: '/dashboard/reports/expenses/search' },
      { name: 'Expense Analysis', desc: 'Category-wise expense breakdown & trends',            icon: PieChart, href: '/dashboard/reports/expenses/indirect', badge: 'IMPROVED' },
    ],
  },
  {
    category: 'GST / Tax',
    icon: IndianRupee,
    items: [
      { name: 'GSTR-1',               desc: 'Detailed outward supply statement',             icon: FileText,   href: '/dashboard/reports/gstr/gstr1' },
      { name: 'GSTR-3B',              desc: 'GST summary with ITC reconciliation',           icon: Calculator, href: '/dashboard/reports/gstr/gstr3b' },
      { name: 'GST Sales Register',   desc: 'Invoice-level outward GST detail',             icon: IndianRupee,href: '/dashboard/reports/sales/gst' },
      { name: 'GST Purchase Register',desc: 'Bill-level input tax credit register',          icon: IndianRupee,href: '/dashboard/reports/purchases/gst' },
      { name: 'GST Audit',            desc: 'Reconcile Output vs Input GST',                icon: FileStack,  href: '/dashboard/reports/compliance/gst-audit' },
      { name: 'Input/Output Tax',     desc: 'Tax collection and payment summary',            icon: FileStack,  href: '/dashboard/reports/gstr' },
    ],
  },
  {
    category: 'Financials',
    icon: Scale,
    items: [
      { name: 'Trial Balance',             desc: 'Validates all debits vs credits',                    icon: Scale,      href: '/dashboard/reports/financial/trial-balance' },
      { name: 'General Ledger',            desc: 'Deep dive into account transactions',                icon: BookOpen,   href: '/dashboard/reports/financial/general-ledger' },
      { name: 'Bank Book',                 desc: 'Ledger view for Bank & Cash accounts',               icon: Wallet,     href: '/dashboard/reports/financial/bank-book' },
      { name: 'Bank Reconciliation',       desc: 'Compare system vs bank statements',                  icon: CheckSquare,href: '/dashboard/reports/financial/bank-reconciliation' },
      { name: 'Cash Flow',                 desc: 'Operations, investing & financing cash movements',    icon: Activity,   href: '/dashboard/reports/financial/cash-flow' },
      { name: 'Outstanding Receivables',   desc: 'Customer invoice aging (0–30, 31–60, 61–90, 90+)',   icon: AlertTriangle, href: '/dashboard/reports/financial/outstanding-receivables', badge: 'IMPROVED' },
      { name: 'Outstanding Payables',      desc: 'Supplier bill aging (0–30, 31–60, 61–90, 90+)',      icon: AlertTriangle, href: '/dashboard/reports/financial/outstanding-payables', badge: 'IMPROVED' },
    ],
  },
  {
    category: 'Compliance',
    icon: Shield,
    items: [
      { name: 'E-Invoice Register', desc: 'Tracker for IRN generation',       icon: FileText, href: '/dashboard/reports/compliance/e-invoice-register' },
      { name: 'E-Way Bill Register',desc: 'Tracker for E-Way Bills generated', icon: Truck,    href: '/dashboard/reports/compliance/eway-bill-register' },
      { name: 'Audit Trail',        desc: 'System security and change log',    icon: History,  href: '/dashboard/reports/management/audit-trail' },
    ],
  },
  {
    category: 'Management Analytics',
    icon: LayoutDashboard,
    items: [
      { name: 'Business Health Dashboard', desc: 'KPIs, charts & trends — the complete business overview',    icon: LayoutDashboard, href: '/dashboard/reports/management/business-dashboard-advanced', badge: 'IMPROVED' },
      { name: 'Sales Performance',         desc: 'Revenue trend, top customers, products & salesperson',      icon: TrendingUp,      href: '/dashboard/reports/management/sales-performance', badge: 'CONSOLIDATED' },
      { name: 'Purchase Performance',      desc: 'Purchase trend, supplier analysis & cost tracking',         icon: ShoppingCart,    href: '/dashboard/reports/management/purchase-performance', badge: 'CONSOLIDATED' },
      { name: 'Profit Performance',        desc: 'Gross & net profit, margin trends, category profitability', icon: BarChart3,       href: '/dashboard/reports/management/profit-performance', badge: 'CONSOLIDATED' },
      { name: 'Category Performance',      desc: 'Sales, P&L, margins & supplier dependency by category',    icon: Layers,          href: '/dashboard/reports/management/category-performance', badge: 'CONSOLIDATED' },
      { name: 'Margin Analysis',           desc: 'Profit margins by product, customer, brand & invoice',      icon: PieChart,        href: '/dashboard/reports/management/margin-analysis', badge: 'CONSOLIDATED' },
      { name: 'Customer Performance',      desc: 'Top customers, CLV, repeat rate & buying behavior',         icon: UserCheck,       href: '/dashboard/reports/management/customer-performance', badge: 'CONSOLIDATED' },
      { name: 'Product Performance',       desc: 'Top/bottom products by revenue, volume & profit',           icon: Package,         href: '/dashboard/reports/management/product-performance', badge: 'CONSOLIDATED' },
      { name: 'Receivable & Payable Aging',desc: 'Combined aging view for working capital management',        icon: AlertTriangle,   href: '/dashboard/reports/management/aging-summary', badge: 'NEW' },
      { name: 'Discount Impact',           desc: 'Revenue vs discount analysis by scheme, customer & product',icon: Tag,             href: '/dashboard/reports/management/discount-impact', badge: 'NEW' },
      { name: 'Budget vs Actual',          desc: 'Account expenditures vs budgets',                           icon: Target,          href: '/dashboard/reports/management/budget-vs-actual' },
    ],
  },
  {
    category: 'Planning & Forecast',
    icon: Cpu,
    items: [
      { name: 'Reorder & Purchase Planner', desc: 'Critical stock, reorder levels & recommended purchase quantities', icon: ShoppingCart, href: '/dashboard/reports/special/forecast-purchase-planning', badge: 'IMPROVED' },
      { name: 'Sales Forecast',             desc: 'Predict future revenue based on historical trends',                icon: TrendingUp,   href: '/dashboard/reports/special/forecast-sales-planning', badge: 'IMPROVED' },
      { name: 'Seasonal Analysis',          desc: 'Peak sales periods and seasonal demand patterns',                  icon: Calendar,     href: '/dashboard/reports/special/seasonal-analysis' },
    ],
  },
];

const BADGE_CONFIG: Record<Badge, { label: string; cls: string }> = {
  'NEW':          { label: 'NEW',          cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  'IMPROVED':     { label: 'IMPROVED',     cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
  'CONSOLIDATED': { label: 'MERGED',       cls: 'bg-violet-100 text-violet-700 border border-violet-200' },
};

// ─── Components ──────────────────────────────────────────────────────────────
function ReportCard({ item, category }: { item: ReportItem; category: string }) {
  const cfg = CAT_CONFIG[category] ?? CAT_CONFIG['Accounts'];
  return (
    <Link
      href={item.href}
      className={`group relative flex flex-col bg-white border ${cfg.border} rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150`}
    >
      {item.badge && (
        <span className={`absolute top-3 right-3 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${BADGE_CONFIG[item.badge].cls}`}>
          {BADGE_CONFIG[item.badge].label}
        </span>
      )}
      <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        <item.icon className={`w-5 h-5 ${cfg.color}`} />
      </div>
      <h4 className="font-semibold text-slate-900 text-sm leading-tight">{item.name}</h4>
      <p className="text-slate-500 text-xs mt-1 leading-relaxed flex-1">{item.desc}</p>
      <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${cfg.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
        <span>Open report</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const totalReports = useMemo(() => REPORTS.reduce((acc, s) => acc + s.items.length, 0), []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return REPORTS
      .filter(s => !activeCategory || s.category === activeCategory)
      .map(s => ({
        ...s,
        items: s.items.filter(item =>
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q)
        ),
      }))
      .filter(s => s.items.length > 0);
  }, [search, activeCategory]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Topbar title="Reports Center" />
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 pb-12">

        {/* Header */}
        <div className="py-6 border-b border-slate-200 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Reports Center</h2>
              <p className="text-slate-500 text-sm mt-1">
                {totalReports} reports across {REPORTS.length} categories — financial, inventory, GST, and business analytics.
              </p>
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!activeCategory ? 'bg-slate-900 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'}`}
            >
              All ({totalReports})
            </button>
            {REPORTS.map(s => {
              const cfg = CAT_CONFIG[s.category];
              const isActive = activeCategory === s.category;
              return (
                <button
                  key={s.category}
                  onClick={() => setActiveCategory(prev => prev === s.category ? null : s.category)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isActive ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm` : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  <s.icon className={`w-3 h-3 ${isActive ? cfg.color : ''}`} />
                  {s.category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Sections */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No reports match &ldquo;{search}&rdquo;</p>
            <button onClick={() => setSearch('')} className="mt-2 text-sm text-indigo-600 hover:underline">Clear search</button>
          </div>
        ) : (
          <div className="space-y-10">
            {filtered.map(section => {
              const cfg = CAT_CONFIG[section.category];
              return (
                <section key={section.category} id={`section-${section.category.replace(/\s+/g, '-').toLowerCase()}`}>
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                      <section.icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${cfg.color}`}>
                      {section.category}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                      {section.items.length} report{section.items.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  {/* Report Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {section.items.map(item => (
                      <ReportCard key={item.name} item={item} category={section.category} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
