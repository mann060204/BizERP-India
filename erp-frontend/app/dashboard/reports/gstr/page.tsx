'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { reportsApi } from '../../../../lib/erp-api';
import { Loader2, FileStack } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GstReportPage() {
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
        const res = await reportsApi.gstr(dateRange);
        setData(res.data);
      } catch { toast.error('Failed to load GST report'); }
      finally { setLoading(false); }
    };
    fetchReport();
  }, [dateRange]);

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="GST Reports" />
      <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">GSTR-3B Summary</h2>
            <p className="text-[#94a3b8] text-sm mt-0.5">Outward supplies and ITC claim summary</p>
          </div>
          <div className="flex gap-3">
            <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white text-sm focus:outline-none focus:border-[#D4D4D4] transition" />
            <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white text-sm focus:outline-none focus:border-[#D4D4D4] transition" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#D4D4D4] animate-spin" /></div>
        ) : data ? (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Outward (Sales) */}
              <div className="glass rounded-2xl border border-[#1A1A1A] overflow-hidden">
                <div className="p-4 bg-[#0A0A0A] border-b border-[#1A1A1A] flex items-center gap-2">
                  <FileStack className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold text-white">3.1 Outward Supplies (Sales)</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Taxable Value</span><span className="text-white font-medium">₹{data.outward.taxableValue.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">CGST Collected</span><span className="text-white">₹{data.outward.cgst.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">SGST Collected</span><span className="text-white">₹{data.outward.sgst.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">IGST Collected</span><span className="text-white">₹{data.outward.igst.toFixed(2)}</span></div>
                  <div className="border-t border-[#1A1A1A] pt-2 flex justify-between font-bold text-sm">
                    <span className="text-white">Total Output Tax</span><span className="text-blue-400">₹{data.outward.totalTax.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Inward (ITC) */}
              <div className="glass rounded-2xl border border-[#1A1A1A] overflow-hidden">
                <div className="p-4 bg-[#0A0A0A] border-b border-[#1A1A1A] flex items-center gap-2">
                  <FileStack className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">4. Eligible ITC (Purchases & Exp.)</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Taxable Value</span><span className="text-white font-medium">₹{data.inward.taxableValue.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">CGST Paid</span><span className="text-white">₹{data.inward.cgst.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">SGST Paid</span><span className="text-white">₹{data.inward.sgst.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">IGST Paid</span><span className="text-white">₹{data.inward.igst.toFixed(2)}</span></div>
                  <div className="border-t border-[#1A1A1A] pt-2 flex justify-between font-bold text-sm">
                    <span className="text-white">Total ITC Available</span><span className="text-emerald-400">₹{data.inward.totalTax.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Computation */}
            <div className="glass rounded-2xl border border-orange-500/30 overflow-hidden bg-gradient-to-r from-orange-500/5 to-transparent">
              <div className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-white text-lg">Net GST Payable (Cash Ledger)</h3>
                  <p className="text-[#94a3b8] text-sm mt-1">Output Tax minus Eligible ITC</p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">CGST</p>
                    <p className="text-white font-semibold">₹{data.netGstPayable.cgst.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">SGST</p>
                    <p className="text-white font-semibold">₹{data.netGstPayable.sgst.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">IGST</p>
                    <p className="text-white font-semibold">₹{data.netGstPayable.igst.toFixed(2)}</p>
                  </div>
                  <div className="pl-6 border-l border-[#1A1A1A]">
                    <p className="text-[#D4D4D4] text-xs font-bold uppercase tracking-wider mb-1">Total Payable</p>
                    <p className="text-[#D4D4D4] text-2xl font-bold">₹{data.totalNetPayable.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : null}
      </main>
    </div>
  );
}
