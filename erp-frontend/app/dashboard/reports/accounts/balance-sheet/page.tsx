'use client';
import { useState, useEffect } from 'react';
import { reportsApi } from '../../../../../lib/erp-api';
import { ArrowLeft, Loader2, Scale, RefreshCw, Download } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface AccountItem {
  name: string;
  accountType: string;
  balance: number;
  balanceType: string;
}
interface BalanceSheetData {
  assets: AccountItem[];
  liabilities: AccountItem[];
  equity: AccountItem[];
}

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsApi.getBalanceSheet();
      const d = res.data?.data;
      if (d) setData(d);
      else setData({ assets: [], liabilities: [], equity: [] });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load balance sheet');
      toast.error('Failed to load balance sheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const totalAssets = data?.assets.reduce((s, a) => s + (a.balance || 0), 0) || 0;
  const totalLiabilities = data?.liabilities.reduce((s, a) => s + (a.balance || 0), 0) || 0;
  const totalEquity = data?.equity.reduce((s, a) => s + (a.balance || 0), 0) || 0;
  const totalLiabilitiesEquity = totalLiabilities + totalEquity;

  const SectionTable = ({ title, items, total, color }: { title: string; items: AccountItem[]; total: number; color: string }) => (
    <div className="glass rounded-2xl border border-slate-200 overflow-hidden">
      <div className={`p-4 border-b border-slate-200 bg-${color}-50/50`}>
        <h3 className={`font-bold text-${color}-700 text-sm uppercase tracking-wider`}>{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="p-4 text-slate-500 text-sm text-center">No accounts found</p>
      ) : (
        <div className="overflow-x-auto w-full">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 text-slate-800">{item.name}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{item.accountType}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">₹{(item.balance || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-300 bg-slate-50">
            <tr>
              <td colSpan={2} className={`px-4 py-3 font-bold text-${color}-700 text-sm`}>Total {title}</td>
              <td className={`px-4 py-3 text-right font-bold text-${color}-700`}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(total)}</td>
            </tr>
          </tfoot>
        </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-orange-600 uppercase bg-orange-50 px-2 py-0.5 rounded">Accounts Report</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Balance Sheet</h1>
            </div>
          </div>
          <button onClick={loadData} className="erp-button-outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-5 border border-blue-200 bg-blue-50/40">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Total Assets</p>
            <p className="text-2xl font-bold text-blue-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAssets)}</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-red-200 bg-red-50/40">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Total Liabilities</p>
            <p className="text-2xl font-bold text-red-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalLiabilities)}</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-emerald-200 bg-emerald-50/40">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Total Equity / Capital</p>
            <p className="text-2xl font-bold text-emerald-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalEquity)}</p>
          </div>
        </div>

        {/* Balance Check */}
        <div className={`glass rounded-2xl p-4 border ${Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01 ? 'border-emerald-300 bg-emerald-50/50' : 'border-orange-300 bg-orange-50/50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-slate-600" />
              <span className="font-semibold text-slate-800">Balance Check</span>
              <span className="text-sm text-slate-500">Assets = Liabilities + Equity</span>
            </div>
            <div className="flex items-center gap-6 text-sm font-semibold">
              <span className="text-blue-600">Assets: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAssets)}</span>
              <span className="text-slate-400">=</span>
              <span className="text-slate-700">Liabilities + Equity: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalLiabilitiesEquity)}</span>
              {Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01
                ? <span className="text-emerald-600 text-xs bg-emerald-100 px-2 py-0.5 rounded-full">✓ Balanced</span>
                : <span className="text-orange-600 text-xs bg-orange-100 px-2 py-0.5 rounded-full">⚠ Difference: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(totalAssets - totalLiabilitiesEquity))}</span>
              }
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>
        ) : error ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-red-500 font-medium">{error}</p>
            <button onClick={loadData} className="mt-3 text-orange-500 underline text-sm">Retry</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionTable title="Assets" items={data?.assets || []} total={totalAssets} color="blue" />
            <div className="space-y-6">
              <SectionTable title="Liabilities" items={data?.liabilities || []} total={totalLiabilities} color="red" />
              <SectionTable title="Equity / Capital" items={data?.equity || []} total={totalEquity} color="emerald" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
