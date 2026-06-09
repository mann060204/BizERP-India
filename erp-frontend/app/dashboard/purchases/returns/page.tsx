'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Topbar from '../../../../components/layout/Topbar';
import { purchaseReturnApi } from '../../../../lib/erp-api';
import { Plus, Search, FileText, Loader2, CheckCircle, Clock, AlertCircle, XCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

interface purchaseReturn { _id: string; billNumber: string; billDate: string; supplierSnapshot: { name: string }; grandTotal: number; amountPaid: number; balance: number; status: string; paymentMode: string; }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft:     { label: 'Draft',    color: 'text-slate-600 bg-[#94a3b8]/10', icon: FileText },
  received:  { label: 'Received', color: 'text-blue-700 bg-blue-50 border border-blue-200',    icon: Clock },
  paid:      { label: 'Paid',     color: 'text-emerald-700 bg-emerald-50 border border-emerald-200',  icon: CheckCircle },
  partial:   { label: 'Partial',  color: 'text-yellow-700 bg-yellow-50 border border-yellow-200',icon: AlertCircle },
  overdue:   { label: 'Overdue',  color: 'text-red-700 bg-red-50 border border-red-200',      icon: AlertCircle },
  cancelled: { label: 'Cancelled',color: 'text-slate-600 bg-[#475569]/10', icon: XCircle },
};

export default function PurchaseReturnsPage() {
  const [purchaseReturns, setpurchaseReturns] = useState<purchaseReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [summary, setSummary] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [purRes, sumRes] = await Promise.all([
          purchaseReturnApi.list({ status: statusFilter || undefined, limit: 50 }),
          purchaseReturnApi.summary(),
        ]);
        setpurchaseReturns(purRes.data.returns || []);
        setSummary(sumRes.data);
      } catch { toast.error('Failed to load purchaseReturns'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [statusFilter]);

  const handleCancel = async (id: string, num: string) => {
    if (!confirm(`Cancel purchaseReturn bill ${num}?`)) return;
    if (!confirm(`Cancel Debit Note ${num}?`)) return;
    try { await purchaseReturnApi.cancel(id); toast.success('Debit Note cancelled'); setpurchaseReturns(pur => pur.filter(p => p._id !== id)); }
    catch { toast.error('Failed to cancel'); }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Debit Notes" />
      <main className="flex-1 p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'This Month', value: `₹${(summary.monthpurchaseReturns || 0).toFixed(2)}`, sub: `${summary.monthpurchaseReturnCount || 0} bills`, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Total Paid', value: `₹${(summary.totalPaid || 0).toFixed(2)}`, sub: 'Total payments made', color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'Outstanding Payables', value: `₹${(summary.outstanding || 0).toFixed(2)}`, sub: 'Pending to suppliers', color: 'text-orange-400', bg: 'bg-orange-400/10' },
          ].map(({ label, value, sub, color, bg }) => (
            <div key={label} className="glass rounded-2xl p-4">
              <p className="text-slate-600 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-600 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">All Debit Notes</h2>
          <Link href="/dashboard/purchases/returns/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-action-500 text-white hover:bg-action-600 font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-white/10/30">
            <Plus className="w-4 h-4" /> Add Debit Note
          </Link>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 flex-wrap">
          {[['', 'All'], ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])].map(([val, label]) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${statusFilter === val ? 'bg-action-500 text-white hover:bg-action-600 border-transparent' : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:border-[#D4D4D4]'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-slate-700 animate-spin" /></div>
        ) : purchaseReturns.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <RotateCcw className="w-14 h-14 text-[#1A1A1A] mx-auto mb-4" />
            <p className="text-slate-900 font-semibold text-lg">No Debit Notes yet</p>
            <p className="text-slate-600 text-sm mt-1 mb-6">Record your first Debit Note to update stock</p>
            <Link href="/dashboard/purchases/returns/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-action-500 text-white hover:bg-action-600 text-sm font-semibold hover:opacity-90 transition">
              <Plus className="w-4 h-4" /> Add Debit Note
            </Link>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    {['Debit Note #', 'Date', 'Supplier', 'Amount', 'Paid', 'Balance', 'Mode', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-slate-600 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {purchaseReturns.map((pur) => {
                    const sc = STATUS_CONFIG[pur.status] || STATUS_CONFIG['draft'];
                    const StatusIcon = sc.icon;
                    return (
                      <tr key={pur._id} className="hover:bg-[#F1F5F9] transition-colors group">
                        <td className="px-5 py-4 font-mono text-xs text-slate-700 font-semibold">{pur.billNumber}</td>
                        <td className="px-5 py-4 text-slate-600">{new Date(pur.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-5 py-4 text-slate-900 font-medium">{pur.supplierSnapshot?.name}</td>
                        <td className="px-5 py-4 text-slate-900 font-semibold">₹{pur.grandTotal.toFixed(2)}</td>
                        <td className="px-5 py-4 text-green-400">₹{(pur.amountPaid || 0).toFixed(2)}</td>
                        <td className="px-5 py-4"><span className={(pur.balance || 0) > 0 ? 'text-red-400 font-medium' : 'text-slate-600'}>₹{(pur.balance || 0).toFixed(2)}</span></td>
                        <td className="px-5 py-4 text-slate-600">{pur.paymentMode}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" /> {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <Link href={`/dashboard/purchases/returns/${pur._id}/edit`} className="px-2 py-1 rounded-lg text-xs text-blue-500 hover:bg-blue-100 transition">Edit</Link>
                            {pur.status !== 'cancelled' && (
                              <button onClick={() => handleCancel(pur._id, pur.billNumber)} className="px-2 py-1 rounded-lg text-xs text-red-500 hover:bg-red-100 transition">Cancel</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}







