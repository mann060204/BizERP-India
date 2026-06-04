'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { reportsApi } from '../../../../lib/erp-api';
import { Loader2, FileStack, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GstReportPage() {
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
      const res = await reportsApi.gstr(dateRange);
      // gstr returns { outward, inward, netGstPayable, totalNetPayable } directly
      setData(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load GST report');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Safe number extraction with fallback
  const n = (v: any) => Number(v || 0);

  const outward = data?.outward || {};
  const inward = data?.inward || {};
  const netGstPayable = data?.netGstPayable || {};
  const totalNetPayable = n(data?.totalNetPayable);

  const Row = ({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) => (
    <div className={`flex justify-between text-sm ${bold ? 'border-t border-slate-200 pt-2 mt-1' : ''}`}>
      <span className={bold ? 'font-bold text-slate-900' : 'text-slate-600'}>{label}</span>
      <span className={bold ? 'font-bold text-slate-900' : 'text-slate-800'}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)}</span>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="GST Reports" />
      <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">GSTR-3B Summary</h2>
            <p className="text-slate-600 text-sm mt-0.5">Outward supplies and Input Tax Credit (ITC) summary</p>
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
            {/* KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-5 border border-blue-200 bg-blue-50/40">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Output Tax (Sales)</p>
                <p className="text-2xl font-bold text-blue-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n(outward.totalTax))}</p>
                <p className="text-xs text-slate-500 mt-1">On {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n(outward.taxableValue))} taxable value</p>
              </div>
              <div className="glass rounded-2xl p-5 border border-emerald-200 bg-emerald-50/40">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">ITC Available (Purchases)</p>
                <p className="text-2xl font-bold text-emerald-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n(inward.totalTax))}</p>
                <p className="text-xs text-slate-500 mt-1">On {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n(inward.taxableValue))} taxable value</p>
              </div>
              <div className="glass rounded-2xl p-5 border border-orange-200 bg-orange-50/40">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Net GST Payable</p>
                <p className="text-2xl font-bold text-orange-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalNetPayable)}</p>
                <p className="text-xs text-slate-500 mt-1">Output Tax − ITC (cash payment)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Outward (Sales) */}
              <div className="glass rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 bg-blue-50/50 border-b border-slate-200 flex items-center gap-2">
                  <FileStack className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-slate-900">3.1 Outward Supplies (Sales)</h3>
                </div>
                <div className="p-5 space-y-3">
                  <Row label="Taxable Value" value={n(outward.taxableValue)} />
                  <Row label="CGST Collected" value={n(outward.cgst)} />
                  <Row label="SGST Collected" value={n(outward.sgst)} />
                  <Row label="IGST Collected" value={n(outward.igst)} />
                  <Row label="Total Output Tax" value={n(outward.totalTax)} bold />
                </div>
              </div>

              {/* Inward (ITC) */}
              <div className="glass rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 bg-emerald-50/50 border-b border-slate-200 flex items-center gap-2">
                  <FileStack className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-semibold text-slate-900">4. Eligible ITC (Purchases & Expenses)</h3>
                </div>
                <div className="p-5 space-y-3">
                  <Row label="Taxable Value" value={n(inward.taxableValue)} />
                  <Row label="CGST Paid" value={n(inward.cgst)} />
                  <Row label="SGST Paid" value={n(inward.sgst)} />
                  <Row label="IGST Paid" value={n(inward.igst)} />
                  <Row label="Total ITC Available" value={n(inward.totalTax)} bold />
                </div>
              </div>
            </div>

            {/* Final Computation */}
            <div className="glass rounded-2xl border border-orange-400/40 overflow-hidden bg-gradient-to-r from-orange-50 to-white">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-slate-900 text-lg">Net GST Payable (Cash Ledger)</h3>
                  <span className="text-slate-500 text-sm">= Output Tax − Eligible ITC</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">CGST</p>
                    <p className="text-slate-900 font-bold text-lg">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n(netGstPayable.cgst))}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {n(outward.cgst).toFixed(2)} − {n(inward.cgst).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">SGST</p>
                    <p className="text-slate-900 font-bold text-lg">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n(netGstPayable.sgst))}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {n(outward.sgst).toFixed(2)} − {n(inward.sgst).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">IGST</p>
                    <p className="text-slate-900 font-bold text-lg">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n(netGstPayable.igst))}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {n(outward.igst).toFixed(2)} − {n(inward.igst).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-orange-500 rounded-xl p-4 text-white">
                    <p className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-1">Total Payable</p>
                    <p className="font-bold text-2xl">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalNetPayable)}</p>
                    <p className="text-orange-200 text-xs mt-1">Pay via Cash Ledger</p>
                  </div>
                </div>
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
