'use client';
import { useState, useEffect } from 'react';
import { Download, RefreshCw, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function GSTR3BPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsApi.getGSTR3B();
      setData(res.data?.data || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load GSTR-3B');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = data?.summary || {};
  const summaryCards = [
    { label: 'Total Output GST', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalOutputGST || 0) },
    { label: 'Total Input GST (ITC)', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalInputGST || 0) },
    { label: 'Net GST Payable', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.netGSTPayable || 0), highlight: true },
    { label: 'Taxable Turnover', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.taxableTurnover || 0) },
  ];

  const TableHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-col justify-center rounded-t-xl mt-6">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  GSTR Report
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">GSTR-3B</h1>
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
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Computing Tax Liability...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-12 h-12 text-red-300 mb-4" />
            <p className="text-red-500 font-medium text-lg">Error loading GSTR-3B</p>
            <p className="text-slate-500 mt-1">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-slate-600 mb-4">Monthly GST summary return and tax liability calculation.</p>

            {/* Section 3.1: Outward Supplies */}
            <div className="glass rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <TableHeader title="Section 3.1: Outward Supplies and Inward Supplies Liable to Reverse Charge" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2 font-medium">Nature of Supplies</th>
                      <th className="px-4 py-2 font-medium text-right">Taxable Value</th>
                      <th className="px-4 py-2 font-medium text-right">IGST</th>
                      <th className="px-4 py-2 font-medium text-right">CGST</th>
                      <th className="px-4 py-2 font-medium text-right">SGST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.outwardSupplies?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-700">{row.supplyType}</td>
                        <td className="px-4 py-2 text-right">₹{(row.taxableValue || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">₹{(row.igst || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">₹{(row.cgst || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">₹{(row.sgst || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {!data?.outwardSupplies?.length && <tr><td colSpan={5} className="px-4 py-4 text-center text-slate-400">No Outward Supplies</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Eligible ITC */}
            <div className="glass rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <TableHeader title="Section 4: Eligible Input Tax Credit (ITC)" subtitle="ITC available from purchases and expenses" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2 font-medium">ITC Category</th>
                      <th className="px-4 py-2 font-medium text-right">IGST</th>
                      <th className="px-4 py-2 font-medium text-right">CGST</th>
                      <th className="px-4 py-2 font-medium text-right">SGST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.eligibleITC?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-700">{row.itcCategory}</td>
                        <td className="px-4 py-2 text-right">₹{(row.igst || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">₹{(row.cgst || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">₹{(row.sgst || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {!data?.eligibleITC?.length && <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-400">No Eligible ITC</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net GST Payable Calculation Box */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mt-8 flex flex-col md:flex-row items-center justify-between shadow-sm">
              <div className="flex flex-col gap-1 text-indigo-900">
                <h3 className="font-bold text-lg">Final GST Calculation</h3>
                <p className="text-sm opacity-80">Output GST Less Input GST (ITC)</p>
              </div>
              <div className="text-right mt-4 md:mt-0">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">Net GST Payable</p>
                <div className="text-4xl font-extrabold text-indigo-700 tracking-tight">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.netGSTPayable || 0)}
                </div>
              </div>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}
