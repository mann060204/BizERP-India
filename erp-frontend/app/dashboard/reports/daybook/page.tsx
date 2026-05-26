'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { reportsApi } from '../../../../lib/erp-api';
import { Loader2, ArrowUpRight, ArrowDownRight, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DaybookPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await reportsApi.daybook({ date: targetDate });
        setData(res.data);
      } catch { toast.error('Failed to load daybook'); }
      finally { setLoading(false); }
    };
    fetchReport();
  }, [targetDate]);

  // Derived totals
  const totalInflow = data?.transactions.filter((t:any) => t.type === 'Sale').reduce((s:number, t:any) => s + t.received, 0) || 0;
  const totalOutflow = data?.transactions.filter((t:any) => t.type !== 'Sale').reduce((s:number, t:any) => s + (t.paid || 0), 0) || 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Daybook Ledger" />
      <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Daily Transaction Ledger</h2>
            <p className="text-[#94a3b8] text-sm mt-0.5">Chronological record of all inflows and outflows</p>
          </div>
          <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] transition" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#D4D4D4] animate-spin" /></div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-5 border border-[#1A1A1A]">
                <p className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-2">Total Receipts (Inflow)</p>
                <p className="text-2xl font-bold text-green-400">₹{totalInflow.toFixed(2)}</p>
              </div>
              <div className="glass rounded-2xl p-5 border border-[#1A1A1A]">
                <p className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-2">Total Payments (Outflow)</p>
                <p className="text-2xl font-bold text-red-400">₹{totalOutflow.toFixed(2)}</p>
              </div>
              <div className="glass rounded-2xl p-5 border border-[#1A1A1A] bg-gradient-to-r from-blue-500/10 to-transparent">
                <p className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-2">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${totalInflow - totalOutflow >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  ₹{(totalInflow - totalOutflow).toFixed(2)}
                </p>
              </div>
            </div>

            {data.transactions.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center">
                <BookOpen className="w-14 h-14 text-[#1A1A1A] mx-auto mb-4" />
                <p className="text-white font-semibold text-lg">No transactions on this date</p>
              </div>
            ) : (
              <div className="glass rounded-2xl overflow-hidden border border-[#1A1A1A]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#0A0A0A] border-b border-[#1A1A1A]">
                        {['Time', 'Type', 'Reference', 'Party / Details', 'Mode', 'Inflow (+)', 'Outflow (-)'].map(h => (
                          <th key={h} className="text-left px-5 py-3.5 text-[#94a3b8] font-medium text-xs uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1A1A]">
                      {data.transactions.map((t: any, idx: number) => {
                        const isInflow = t.type === 'Sale';
                        return (
                          <tr key={idx} className="hover:bg-[#111111] transition-colors">
                            <td className="px-5 py-4 text-[#94a3b8]">
                              {new Date(t.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isInflow ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                                {isInflow ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                {t.type}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-white font-mono text-xs">{t.ref}</td>
                            <td className="px-5 py-4 text-white font-medium">{t.party}</td>
                            <td className="px-5 py-4 text-[#94a3b8]">{t.mode}</td>
                            <td className="px-5 py-4 font-semibold text-green-400">{isInflow ? `₹${(t.received || 0).toFixed(2)}` : '—'}</td>
                            <td className="px-5 py-4 font-semibold text-red-400">{!isInflow ? `₹${(t.paid || 0).toFixed(2)}` : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
