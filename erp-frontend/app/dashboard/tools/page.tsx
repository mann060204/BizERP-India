'use client';
import Link from 'next/link';
import Topbar from '../../../components/layout/Topbar';
import { Calculator, Barcode, Upload, RefreshCcw, Bell } from 'lucide-react';

const TOOLS = [
  { name: 'GST Calculator', desc: 'Standalone tool to compute CGST/SGST/IGST splits', icon: Calculator, href: '/dashboard/tools/gst-calc', status: 'live' },
  { name: 'Barcode Generator', desc: 'Generate EAN-13 or QR codes for products', icon: Barcode, href: '/dashboard/tools/barcode', status: 'live' },
  { name: 'Bulk Import', desc: 'Import items or customers via CSV/Excel', icon: Upload, href: '/dashboard/tools/import', status: 'live' },
  { name: 'Bulk Tax Update', desc: 'Change HSN code or tax rate for multiple products', icon: RefreshCcw, href: '#', status: 'soon' },
  { name: 'Reminder System', desc: 'Schedule SMS/WhatsApp for overdue invoices', icon: Bell, href: '#', status: 'soon' },
];

export default function ToolsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Tools & Utilities" />
      <main className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
        <div>
          <h2 className="text-xl font-bold text-white">Tools & Utilities</h2>
          <p className="text-[#94a3b8] text-sm mt-1">Additional modules to streamline your operations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map(tool => {
            const isLive = tool.status === 'live';
            const Card = (
              <div className={`glass ngrok-card-hover rounded-2xl p-6 transition-all duration-300 ${isLive ? 'cursor-pointer group' : 'opacity-60 cursor-not-allowed'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition ${isLive ? 'bg-[#D4D4D4]/10 text-[#D4D4D4] group-hover:bg-[#D4D4D4] group-hover:text-white' : 'bg-[#0A0A0A] text-[#94a3b8]'}`}>
                  <tool.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-white text-lg mb-1">{tool.name}</h3>
                <p className="text-[#94a3b8] text-sm mb-4">{tool.desc}</p>
                <div className={`inline-block px-3 py-1 rounded-lg border ${isLive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-[#D4D4D4]/10 border-[#D4D4D4]/20'}`}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLive ? 'text-emerald-400' : 'text-[#D4D4D4]'}`}>
                    {isLive ? 'Access Tool' : 'Coming Soon'}
                  </span>
                </div>
              </div>
            );

            return isLive ? (
              <Link key={tool.name} href={tool.href}>
                {Card}
              </Link>
            ) : (
              <div key={tool.name}>{Card}</div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
