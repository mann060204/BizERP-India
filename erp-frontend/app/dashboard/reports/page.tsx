'use client';
import Link from 'next/link';
import Topbar from '../../../components/layout/Topbar';
import {
  FileText, TrendingUp, BookOpen, Calculator, BarChart3, Receipt, FileStack,
  Banknote, Briefcase, CreditCard, Download, Activity, Scale, CheckSquare,
  Archive, AlertTriangle, CheckCircle, SlidersHorizontal, BatteryCharging,
  Zap, Clock, Hash, List, Users, ShoppingCart, Package, DollarSign,
  BarChart2, PieChart, Layers, UserCheck, ArrowDownCircle, Timer, IndianRupee,
  ClipboardList, Truck, Wallet, History
} from 'lucide-react';

const categoryColors: Record<string, string> = {
  Accounts: 'text-orange-600',
  Inventory: 'text-purple-600',
  Sales: 'text-green-700',
  Customers: 'text-blue-600',
  Purchases: 'text-red-600',
  Suppliers: 'text-yellow-600',
  Expenses: 'text-rose-600',
  'GST / Tax': 'text-indigo-600',
};

const categoryBadges: Record<string, string> = {
  Accounts: 'bg-orange-50 border-orange-100',
  Inventory: 'bg-purple-50 border-purple-100',
  Sales: 'bg-green-50 border-green-100',
  Customers: 'bg-blue-50 border-blue-100',
  Purchases: 'bg-red-50 border-red-100',
  Suppliers: 'bg-yellow-50 border-yellow-100',
  Expenses: 'bg-rose-50 border-rose-100',
  'GST / Tax': 'bg-indigo-50 border-indigo-100',
};

const REPORTS = [
  {
    category: 'Accounts',
    items: [
      { name: 'Cash Book', desc: 'Daily cash transaction summary', icon: Banknote, href: '/dashboard/reports/accounts/cash-book' },
      { name: 'Business Book', desc: 'Comprehensive business ledger', icon: Briefcase, href: '/dashboard/reports/accounts/business-book' },
      { name: 'Payment Paid', desc: 'Summary of all outgoing payments', icon: CreditCard, href: '/dashboard/reports/accounts/payment-paid' },
      { name: 'Payment Received', desc: 'Summary of all incoming payments', icon: Download, href: '/dashboard/reports/accounts/payment-received' },
      { name: 'Daily Summary', desc: 'Daybook and chronological ledger', icon: Activity, href: '/dashboard/reports/daybook' },
      { name: 'Input/Output Tax', desc: 'Tax collection and payment summary', icon: FileStack, href: '/dashboard/reports/gstr' },
      { name: 'Profit & Loss', desc: 'Sales vs Purchases vs Expenses', icon: TrendingUp, href: '/dashboard/reports/pnl' },
      { name: 'Chart Of Accounts', desc: 'Directory of all ledger accounts', icon: List, href: '/dashboard/reports/accounts/chart-of-accounts' },
      { name: 'Balance Sheet', desc: 'Snapshot of assets & liabilities', icon: Scale, href: '/dashboard/reports/accounts/balance-sheet' },
    ]
  },
  {
    category: 'Inventory',
    items: [
      { name: 'Item Register', desc: 'Complete registry of all items', icon: Archive, href: '/dashboard/reports/inventory/item-register' },
      { name: 'Low Level Stock', desc: 'Items below minimum stock threshold', icon: AlertTriangle, href: '/dashboard/reports/inventory/low-level-stock' },
      { name: 'Stock Availability', desc: 'Current available stock balances', icon: CheckCircle, href: '/dashboard/reports/inventory/stock-availability' },
      { name: 'Stock Adjustment', desc: 'History of manual stock adjustments', icon: SlidersHorizontal, href: '/dashboard/reports/inventory/stock-adjustment' },
      { name: 'Consumable Stock', desc: 'Tracking of consumable inventory', icon: BatteryCharging, href: '/dashboard/reports/inventory/consumable-stock' },
      { name: 'Fast Moving Items', desc: 'High velocity inventory items', icon: Zap, href: '/dashboard/reports/inventory/fast-moving' },
      { name: 'Slow Moving Items', desc: 'Dead stock or slow-moving items', icon: Clock, href: '/dashboard/reports/inventory/slow-moving' },
      { name: 'Available Serials', desc: 'Available serial/batch numbers', icon: Hash, href: '/dashboard/reports/inventory/available-serials' },
      { name: 'Item List', desc: 'Master list of inventory products', icon: FileText, href: '/dashboard/reports/inventory/item-list' },
    ]
  },
  {
    category: 'Sales',
    items: [
      { name: 'Sales Aging', desc: 'Overdue invoices by aging bracket', icon: Timer, href: '/dashboard/reports/sales/aging' },
      { name: 'Itemwise Sales', desc: 'Total qty and revenue per product', icon: Package, href: '/dashboard/reports/sales/itemwise' },
      { name: 'Invoicewise Sales', desc: 'All invoices with payment status', icon: ClipboardList, href: '/dashboard/reports/sales/invoicewise' },
      { name: 'Invoicewise Margin', desc: 'Revenue vs taxable per invoice', icon: BarChart2, href: '/dashboard/reports/sales/invoicewise-margin' },
      { name: 'Itemwise Margin', desc: 'Gross profit per product', icon: PieChart, href: '/dashboard/reports/sales/itemwise-margin' },
      { name: 'Customerwise Margin', desc: 'Revenue analysis per customer', icon: UserCheck, href: '/dashboard/reports/sales/customerwise-margin' },
      { name: 'Invoicewise Summary', desc: 'Per-invoice GST breakdown', icon: FileStack, href: '/dashboard/reports/sales/invoicewise-summary' },
      { name: 'Customerwise Summary', desc: 'Aggregated sales per customer', icon: Users, href: '/dashboard/reports/sales/customerwise-summary' },
      { name: 'Itemwise Summary', desc: 'Item-level GST summary', icon: Layers, href: '/dashboard/reports/sales/itemwise-summary' },
      { name: 'GST Sales Register', desc: 'Invoice-level outward GST detail', icon: IndianRupee, href: '/dashboard/reports/sales/gst' },
      { name: 'Active Recurring', desc: 'All outstanding unpaid invoices', icon: ArrowDownCircle, href: '/dashboard/reports/sales/recurring' },
    ]
  },
  {
    category: 'Customers',
    items: [
      { name: 'Amount Due', desc: 'Outstanding balances per customer', icon: AlertTriangle, href: '/dashboard/reports/customers/amount-due' },
      { name: 'Payment History', desc: 'Payment records from customers', icon: History, href: '/dashboard/reports/customers/payment-history' },
      { name: 'Account Balances', desc: 'All customer ledger balances', icon: Wallet, href: '/dashboard/reports/customers/account-balances' },
    ]
  },
  {
    category: 'Purchases',
    items: [
      { name: 'Purchase Aging', desc: 'Overdue bills by aging bracket', icon: Timer, href: '/dashboard/reports/purchases/aging' },
      { name: 'Billwise Purchases', desc: 'All purchase bills listed', icon: ClipboardList, href: '/dashboard/reports/purchases/billwise' },
      { name: 'Itemwise Purchases', desc: 'Qty and amount per item', icon: Package, href: '/dashboard/reports/purchases/itemwise' },
      { name: 'Billwise Summary', desc: 'Bill totals with GST breakdown', icon: FileStack, href: '/dashboard/reports/purchases/billwise-summary' },
      { name: 'Itemwise Summary', desc: 'Item totals across all bills', icon: Layers, href: '/dashboard/reports/purchases/itemwise-summary' },
      { name: 'Supplierwise Summary', desc: 'Totals grouped by supplier', icon: Truck, href: '/dashboard/reports/purchases/supplierwise-summary' },
      { name: 'GST Purchase Register', desc: 'Bill-level ITC input register', icon: IndianRupee, href: '/dashboard/reports/purchases/gst' },
    ]
  },
  {
    category: 'Suppliers',
    items: [
      { name: 'Account Balances', desc: 'Supplier ledger balance sheet', icon: Wallet, href: '/dashboard/reports/suppliers/account-balances' },
      { name: 'Payment History', desc: 'Payments made to suppliers', icon: History, href: '/dashboard/reports/suppliers/payment-history' },
    ]
  },
  {
    category: 'Expenses',
    items: [
      { name: 'Search Expenses', desc: 'Filterable expense list', icon: Receipt, href: '/dashboard/reports/expenses/search' },
      { name: 'Indirect Expenses', desc: 'Expense category summary', icon: PieChart, href: '/dashboard/reports/expenses/indirect' },
    ]
  },
  {
    category: 'GST / Tax',
    items: [
      { name: 'GSTR-1', desc: 'Detailed outward supply statement', icon: FileText, href: '/dashboard/reports/gstr/gstr1' },
      { name: 'GSTR-3B', desc: 'GST summary with ITC reconciliation', icon: Calculator, href: '/dashboard/reports/gstr/gstr3b' },
    ]
  },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Reports Center" />
      <main className="flex-1 p-6 space-y-10 max-w-7xl mx-auto w-full">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports Center</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time financial, inventory, GST, and business analytics for your business.</p>
        </div>

        <div className="space-y-10">
          {REPORTS.map(section => (
            <div key={section.category} className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className={`text-sm font-bold uppercase tracking-widest ${categoryColors[section.category] || 'text-slate-700'}`}>
                  {section.category}
                </h3>
                <span className="text-xs text-slate-400">{section.items.length} report{section.items.length !== 1 ? 's' : ''}</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {section.items.map(item => (
                  <Link key={item.name} href={item.href}
                    className={`glass rounded-2xl p-5 border transition group hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${categoryBadges[section.category] || 'border-slate-200 bg-white'}`}>
                    <item.icon className={`w-7 h-7 mb-3 ${categoryColors[section.category] || 'text-slate-600'} transition group-hover:scale-110`} />
                    <h4 className="font-semibold text-slate-900 text-sm leading-tight">{item.name}</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
