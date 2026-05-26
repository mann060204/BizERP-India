'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { reportsApi } from '../../../../lib/erp-api';
import { Loader2, TrendingUp, ArrowDownRight, ArrowUpRight, MinusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PnlReportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Default to current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [dateRange, setDateRange] = useState({ from: firstDay, to: lastDay });

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await reportsApi.pnl(dateRange);
        setData(res.data);
      } catch { toast.error('Failed to load P&L report'); }
      finally { setLoading(false); }
    };
    fetchReport();
  }, [dateRange]);

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Profit & Loss" />
      <main className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold dark:text-white text-gray-900">Profit & Loss Summary</h2>
            <p className="dark:text-[#94a3b8] text-gray-600 text-sm mt-0.5">Revenue and Expense breakdown</p>
          </div>
          <div className="flex gap-3">
            <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-3 py-2 rounded-lg dark:bg-[#0A0A0A] bg-white border dark:border-[#1A1A1A] border-gray-300 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-[#D4D4D4] transition" />
            <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-3 py-2 rounded-lg dark:bg-[#0A0A0A] bg-white border dark:border-[#1A1A1A] border-gray-300 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-[#D4D4D4] transition" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#D4D4D4] animate-spin" /></div>
        ) : data ? (
          <div className="space-y-6">
            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-5 border dark:border-[#1A1A1A] border-gray-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-green-400/10 text-green-400"><ArrowUpRight className="w-4 h-4" /></div>
                  <p className="dark:text-[#94a3b8] text-gray-600 text-xs font-semibold uppercase tracking-wider">Total Sales</p>
                </div>
                <p className="text-2xl font-bold dark:text-white text-gray-900">₹{data.totalSales.toFixed(2)}</p>
              </div>
              <div className="glass rounded-2xl p-5 border dark:border-[#1A1A1A] border-gray-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-red-400/10 text-red-400"><ArrowDownRight className="w-4 h-4" /></div>
                  <p className="dark:text-[#94a3b8] text-gray-600 text-xs font-semibold uppercase tracking-wider">Purchases & Expenses</p>
                </div>
                <p className="text-2xl font-bold dark:text-white text-gray-900">₹{(data.totalPurchases + data.totalExpenses).toFixed(2)}</p>
              </div>
              <div className={`glass rounded-2xl p-5 border ${data.netProfit >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${data.netProfit >= 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="dark:text-[#94a3b8] text-gray-600 text-xs font-semibold uppercase tracking-wider">Net Profit</p>
                </div>
                <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ₹{data.netProfit.toFixed(2)}
                </p>
              </div>
            </div>

            {/* P&L Statement */}
            <div className="glass rounded-2xl border dark:border-[#1A1A1A] border-gray-300 overflow-hidden">
              <div className="p-4 dark:bg-[#0A0A0A] bg-white border-b dark:border-[#1A1A1A] border-gray-300">
                <h3 className="font-semibold dark:text-white text-gray-900">Statement of Profit & Loss</h3>
              </div>
              <div className="p-0">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-[#1A1A1A]">
                    {/* Revenue */}
                    <tr className="dark:bg-[#000000] bg-white/50"><td colSpan={2} className="px-5 py-3 text-xs font-semibold dark:text-[#94a3b8] text-gray-600 uppercase">Income</td></tr>
                    <tr className="hover:dark:bg-[#0A0A0A] bg-white transition">
                      <td className="px-5 py-3.5 dark:text-white text-gray-900 pl-8">Operating Revenue (Sales)</td>
                      <td className="px-5 py-3.5 text-right font-medium dark:text-white text-gray-900">₹{data.totalSales.toFixed(2)}</td>
                    </tr>
                    <tr className="dark:bg-[#0A0A0A] bg-white">
                      <td className="px-5 py-3 text-emerald-400 font-semibold pl-8">Total Income (A)</td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-400">₹{data.totalSales.toFixed(2)}</td>
                    </tr>

                    {/* Expenses */}
                    <tr className="dark:bg-[#000000] bg-white/50"><td colSpan={2} className="px-5 py-3 text-xs font-semibold dark:text-[#94a3b8] text-gray-600 uppercase">Expenses</td></tr>
                    <tr className="hover:dark:bg-[#0A0A0A] bg-white transition">
                      <td className="px-5 py-3.5 dark:text-white text-gray-900 pl-8">Cost of Goods Sold (Purchases)</td>
                      <td className="px-5 py-3.5 text-right font-medium dark:text-white text-gray-900">₹{data.totalPurchases.toFixed(2)}</td>
                    </tr>
                    <tr className="hover:dark:bg-[#0A0A0A] bg-white transition">
                      <td className="px-5 py-3.5 dark:text-white text-gray-900 pl-8">Indirect Expenses</td>
                      <td className="px-5 py-3.5 text-right font-medium dark:text-white text-gray-900">₹{data.totalExpenses.toFixed(2)}</td>
                    </tr>
                    <tr className="dark:bg-[#0A0A0A] bg-white">
                      <td className="px-5 py-3 text-red-400 font-semibold pl-8">Total Expenses (B)</td>
                      <td className="px-5 py-3 text-right font-bold text-red-400">₹{(data.totalPurchases + data.totalExpenses).toFixed(2)}</td>
                    </tr>

                    {/* Profit */}
                    <tr className="bg-gradient-to-r from-orange-500/10 to-transparent">
                      <td className="px-5 py-4 text-[#D4D4D4] font-bold text-base uppercase">Net Profit / Loss (A - B)</td>
                      <td className="px-5 py-4 text-right font-bold text-xl text-[#D4D4D4]">₹{data.netProfit.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
