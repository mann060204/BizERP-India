'use client';
import Link from 'next/link';
import Topbar from '../../../components/layout/Topbar';
import { 
  FileText, TrendingUp, BookOpen, Calculator, BarChart3, Receipt, FileStack,
  Banknote, Briefcase, CreditCard, Download, Activity, Scale, CheckSquare,
  Archive, AlertTriangle, CheckCircle, SlidersHorizontal, BatteryCharging,
  Zap, Clock, Hash, List
} from 'lucide-react';

const REPORTS = [
  {
    category: 'Accounts',
    items: [
      { name: 'Cash Book', desc: 'Daily cash transaction summary', icon: Banknote, href: '#', disabled: true },
      { name: 'Business Book', desc: 'Comprehensive business ledger', icon: Briefcase, href: '#', disabled: true },
      { name: 'Payment Paid', desc: 'Summary of all outgoing payments', icon: CreditCard, href: '#', disabled: true },
      { name: 'Payment - Received', desc: 'Summary of all incoming payments', icon: Download, href: '#', disabled: true },
      { name: 'Daily Summary', desc: 'Daybook and chronological ledger', icon: Activity, href: '/dashboard/reports/daybook', disabled: false },
      { name: 'Input/Output Tax', desc: 'Tax collection and payment summary', icon: FileStack, href: '/dashboard/reports/gstr', disabled: false },
      { name: 'Profit & Loss Summary', desc: 'Sales vs Purchases vs Expenses', icon: TrendingUp, href: '/dashboard/reports/pnl', disabled: false },
      { name: 'Chart Of Accounts', desc: 'Directory of all ledger accounts', icon: List, href: '#', disabled: true },
      { name: 'Balance Sheet', desc: 'Snapshot of assets & liabilities', icon: Scale, href: '#', disabled: true },
    ]
  },
  {
    category: 'Inventory',
    items: [
      { name: 'Item Register', desc: 'Complete registry of all items', icon: Archive, href: '#', disabled: true },
      { name: 'Low Level Stock', desc: 'Items below minimum stock threshold', icon: AlertTriangle, href: '#', disabled: true },
      { name: 'Stock Availability', desc: 'Current available stock balances', icon: CheckCircle, href: '#', disabled: true },
      { name: 'Stock Adjustment', desc: 'History of manual stock adjustments', icon: SlidersHorizontal, href: '#', disabled: true },
      { name: 'Consumable Stock', desc: 'Tracking of consumable inventory', icon: BatteryCharging, href: '#', disabled: true },
      { name: 'Fast Moving Item', desc: 'High velocity inventory items', icon: Zap, href: '#', disabled: true },
      { name: 'Items Not Moving', desc: 'Dead stock or slow-moving items', icon: Clock, href: '#', disabled: true },
      { name: 'Available Serials', desc: 'Available serial/batch numbers', icon: Hash, href: '#', disabled: true },
      { name: 'Item List', desc: 'Master list of inventory products', icon: FileText, href: '#', disabled: true },
    ]
  }
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Reports Center" />
      <main className="flex-1 p-6 space-y-8 max-w-6xl mx-auto w-full">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reports Center</h2>
          <p className="text-slate-600 text-sm mt-1">Real-time financial and inventory reports for your business.</p>
        </div>

        <div className="space-y-8">
          {REPORTS.map(section => (
            <div key={section.category} className="space-y-4">
              <h3 className="text-slate-700 font-semibold text-sm uppercase tracking-wider">{section.category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.items.map(item => (
                  item.disabled ? (
                    <div key={item.name} className="glass rounded-2xl p-5 border border-slate-200 opacity-50 cursor-not-allowed">
                      <item.icon className="w-8 h-8 text-slate-600 mb-3" />
                      <h4 className="text-slate-900 font-medium text-base mb-1">{item.name}</h4>
                      <p className="text-slate-600 text-xs">{item.desc}</p>
                      <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-600 border border-slate-200">COMING SOON</span>
                    </div>
                  ) : (
                    <Link key={item.name} href={item.href} className="glass ngrok-card-hover rounded-2xl p-5 transition group border border-slate-200">
                      <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center mb-3 group-hover:bg-orange-500/20 transition">
                        <item.icon className="w-5 h-5 text-slate-600 group-hover:text-orange-500 transition" />
                      </div>
                      <h4 className="text-slate-900 font-medium text-base mb-1 group-hover:text-orange-600 transition">{item.name}</h4>
                      <p className="text-slate-600 text-xs">{item.desc}</p>
                    </Link>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
