'use client';
import Link from 'next/link';
import Topbar from '../../../components/layout/Topbar';
import { FileText, TrendingUp, BookOpen, Calculator, BarChart3, Receipt, FileStack } from 'lucide-react';

const REPORTS = [
  {
    category: 'Financial & Accounting',
    items: [
      { name: 'Profit & Loss (P&L)', desc: 'Net profit summary: Sales vs Purchases vs Expenses', icon: TrendingUp, href: '/dashboard/reports/pnl' },
      { name: 'Daybook', desc: 'Chronological ledger of all daily transactions', icon: BookOpen, href: '/dashboard/reports/daybook' },
      { name: 'Balance Sheet', desc: 'Point-in-time snapshot of assets & liabilities', icon: Calculator, href: '#', disabled: true },
    ]
  },
  {
    category: 'Tax & GST Compliance',
    items: [
      { name: 'GSTR-3B Summary', desc: 'Monthly auto-computed GST summary with ITC', icon: FileStack, href: '/dashboard/reports/gstr' },
      { name: 'GSTR-1 Outward', desc: 'Detailed B2B and B2C outward supplies', icon: FileText, href: '/dashboard/reports/gstr' },
      { name: 'GSTR-2A Reconciliation', desc: 'Match purchase bills with portal data', icon: Receipt, href: '#', disabled: true },
    ]
  },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Reports Center" />
      <main className="flex-1 p-6 space-y-8 max-w-6xl mx-auto w-full">
        <div>
          <h2 className="text-xl font-bold text-white">Reports Center</h2>
          <p className="text-[#94a3b8] text-sm mt-1">Real-time financial and compliance reports for your business.</p>
        </div>

        <div className="space-y-8">
          {REPORTS.map(section => (
            <div key={section.category} className="space-y-4">
              <h3 className="text-[#D4D4D4] font-semibold text-sm uppercase tracking-wider">{section.category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.items.map(item => (
                  item.disabled ? (
                    <div key={item.name} className="glass rounded-2xl p-5 border border-[#1A1A1A] opacity-50 cursor-not-allowed">
                      <item.icon className="w-8 h-8 text-[#475569] mb-3" />
                      <h4 className="text-white font-medium text-base mb-1">{item.name}</h4>
                      <p className="text-[#475569] text-xs">{item.desc}</p>
                      <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A0A0A] text-[#94a3b8] border border-[#1A1A1A]">COMING SOON</span>
                    </div>
                  ) : (
                    <Link key={item.name} href={item.href} className="glass ngrok-card-hover rounded-2xl p-5 transition group">
                      <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center mb-3 group-hover:bg-orange-500/20 transition">
                        <item.icon className="w-5 h-5 text-[#94a3b8] group-hover:text-[#D4D4D4] transition" />
                      </div>
                      <h4 className="text-white font-medium text-base mb-1 group-hover:text-[#D4D4D4] transition">{item.name}</h4>
                      <p className="text-[#94a3b8] text-xs">{item.desc}</p>
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
