'use client';
import { useState, useEffect } from 'react';
import { Download, RefreshCw, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function CashFlowPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsApi.getCashFlowStatement();
      setData(res.data?.data || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Cash Flow');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = data?.summary || {};
  const summaryCards = [
    { label: 'Operating Cash Flow', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.operatingCashFlow || 0) },
    { label: 'Investing Cash Flow', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.investingCashFlow || 0) },
    { label: 'Financing Cash Flow', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.financingCashFlow || 0) },
    { label: 'Net Cash Flow', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.netCashFlow || 0), highlight: true },
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
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-orange-50 text-orange-600">
                  Accounts Report
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Cash Flow Statement</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="erp-button-outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="erp-button-outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-100 px-6 py-3 max-w-7xl mx-auto w-full flex items-center gap-4">
        <ReportHeader summaryCards={summaryCards} />
      </div>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Computing Cash Flow...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-12 h-12 text-red-300 mb-4" />
            <p className="text-red-500 font-medium text-lg">Error loading Cash Flow Statement</p>
            <p className="text-slate-500 mt-1">{error}</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="glass rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">Cash Flow Activities</h2>
              
              <div className="space-y-4">
                {data?.sections?.map((section: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-dashed border-slate-200 last:border-0">
                    <span className="font-medium text-slate-700">{section.category}</span>
                    <span className={`font-semibold ${section.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(section.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t-2 border-slate-800 flex items-center justify-between bg-slate-50 p-4 rounded-lg">
                <span className="font-bold text-lg text-slate-900">Net Cash Flow</span>
                <span className={`font-bold text-2xl ${summary.netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.netCashFlow || 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
