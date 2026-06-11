'use client';
import { useState, useEffect } from 'react';
import { Download, RefreshCw, FileText, ArrowLeft, BarChart3, TrendingUp, DollarSign, Package, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { reportsApi } from '../../../../../lib/erp-api';

export default function BusinessDashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await (reportsApi as any).getBusinessDashboardAdvanced();
      setKpis(res.data?.data?.kpis || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const formatCcy = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v || 0);

  const cards = [
    { title: 'Total Revenue', value: formatCcy(kpis?.revenue), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Total Expenses', value: formatCcy(kpis?.expenses), icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'Net Profit', value: formatCcy(kpis?.profit), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Receivables', value: formatCcy(kpis?.receivables), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Payables', value: formatCcy(kpis?.payables), icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Inventory Value', value: formatCcy(kpis?.inventoryValue), icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Cash & Bank Balance', value: formatCcy(kpis?.cashBalance), icon: DollarSign, color: 'text-teal-600', bg: 'bg-teal-50' },
    { title: 'GST Liability', value: formatCcy(kpis?.gstLiability), icon: AlertCircle, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                  Management Report
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Business Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="erp-button-outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((c, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4 hover:shadow-md transition">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${c.bg} ${c.color}`}>
                  <c.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{c.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
