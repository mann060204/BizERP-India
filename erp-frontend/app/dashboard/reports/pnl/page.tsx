'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { reportsApi } from '../../../../lib/erp-api';
import { Loader2, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PnlReportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Default to current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [dateRange, setDateRange] = useState({ from: firstDay, to: lastDay });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.pnl(dateRange);
      // pnl returns { totalSales, totalPurchases, grossProfit, totalExpenses, netProfit } directly
      setData(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load P&L report');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const totalSales = Number(data?.totalSales || 0);
  const totalPurchases = Number(data?.totalPurchases || 0);
  const totalExpenses = Number(data?.totalExpenses || 0);
  const grossProfit = Number(data?.grossProfit ?? (totalSales - totalPurchases));
  const netProfit = Number(data?.netProfit ?? (grossProfit - totalExpenses));
  const totalCosts = totalPurchases + totalExpenses;
  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Profit & Loss" />
      <main className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Profit & Loss Summary</h2>
            <p className="text-slate-600 text-sm mt-0.5">Revenue vs Expenses breakdown for the selected period</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateRange.from}
              onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-300 transition"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-300 transition"
            />
            <button onClick={fetchReport} disabled={loading} className="erp-button-outline">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass rounded-2xl p-5 border border-green-200 bg-green-50/40">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-green-400/10 text-green-500"><ArrowUpRight className="w-4 h-4" /></div>
                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Total Sales</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalSales)}</p>
              </div>
              <div className="glass rounded-2xl p-5 border border-red-200 bg-red-50/40">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-red-400/10 text-red-500"><ArrowDownRight className="w-4 h-4" /></div>
                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Purchases</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalPurchases)}</p>
              </div>
              <div className="glass rounded-2xl p-5 border border-orange-200 bg-orange-50/40">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-orange-400/10 text-orange-500"><ArrowDownRight className="w-4 h-4" /></div>
                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Expenses</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalExpenses)}</p>
              </div>
              <div className={`glass rounded-2xl p-5 border ${netProfit >= 0 ? 'border-emerald-300 bg-emerald-50/40' : 'border-red-300 bg-red-50/40'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${netProfit >= 0 ? 'bg-emerald-400/10 text-emerald-500' : 'bg-red-400/10 text-red-500'}`}>
                    {netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Net Profit</p>
                </div>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? '' : '-'}{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(netProfit))}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {profitMargin.toFixed(1)}% margin
                </p>
              </div>
            </div>

            {/* P&L Statement */}
            <div className="glass rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-white border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Statement of Profit & Loss</h3>
              </div>
              <div className="overflow-x-auto w-full">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {/* Income Section */}
                  <tr className="bg-slate-50">
                    <td colSpan={2} className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Income</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-slate-800 pl-8">Operating Revenue (Sales)</td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalSales)}</td>
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="px-5 py-3 text-emerald-700 font-bold pl-8">Total Income (A)</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalSales)}</td>
                  </tr>

                  {/* Expenses Section */}
                  <tr className="bg-slate-50">
                    <td colSpan={2} className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Expenses</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-slate-800 pl-8">Cost of Goods Sold (Purchases)</td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalPurchases)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-slate-800 pl-8">Gross Profit (Sales − Purchases)</td>
                    <td className={`px-5 py-3.5 text-right font-medium ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(grossProfit)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-slate-800 pl-8">Indirect Expenses</td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalExpenses)}</td>
                  </tr>
                  <tr className="bg-red-50/50">
                    <td className="px-5 py-3 text-red-700 font-bold pl-8">Total Expenses (B = Purchases + Expenses)</td>
                    <td className="px-5 py-3 text-right font-bold text-red-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalCosts)}</td>
                  </tr>

                  {/* Net Profit */}
                  <tr className={`${netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <td className="px-5 py-5 font-bold text-base text-slate-800 uppercase tracking-wide">
                      Net {netProfit >= 0 ? 'Profit' : 'Loss'} (A − B)
                    </td>
                    <td className={`px-5 py-5 text-right font-bold text-2xl ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {netProfit < 0 ? '(' : ''}{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(netProfit))}{netProfit < 0 ? ')' : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-16 text-center">
            <p className="text-slate-500">Failed to load data. Please try again.</p>
            <button onClick={fetchReport} className="mt-3 text-orange-500 underline text-sm">Retry</button>
          </div>
        )}
      </main>
    </div>
  );
}
