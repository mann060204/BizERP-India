'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Topbar from '../../../components/layout/Topbar';
import { purchasesApi } from '../../../lib/erp-api';
import { Plus, Search, FileText, Loader2, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Purchase { _id: string; billNumber: string; billDate: string; supplierSnapshot: { name: string }; grandTotal: number; amountPaid: number; balance: number; status: string; paymentMode: string; }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft:     { label: 'Draft',    color: 'dark:text-[#94a3b8] text-gray-600 bg-[#94a3b8]/10', icon: FileText },
  received:  { label: 'Received', color: 'text-blue-400 bg-blue-400/10',    icon: Clock },
  paid:      { label: 'Paid',     color: 'text-green-400 bg-green-400/10',  icon: CheckCircle },
  partial:   { label: 'Partial',  color: 'dark:text-yellow-400 text-yellow-600 bg-yellow-400/10',icon: AlertCircle },
  overdue:   { label: 'Overdue',  color: 'text-red-400 bg-red-400/10',      icon: AlertCircle },
  cancelled: { label: 'Cancelled',color: 'dark:text-[#475569] text-gray-500 bg-[#475569]/10', icon: XCircle },
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [summary, setSummary] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [purRes, sumRes] = await Promise.all([
          purchasesApi.list({ status: statusFilter || undefined, limit: 50 }),
          purchasesApi.summary(),
        ]);
        setPurchases(purRes.data.purchases);
        setSummary(sumRes.data);
      } catch { toast.error('Failed to load purchases'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [statusFilter]);

  const handleCancel = async (id: string, num: string) => {
    if (!confirm(`Cancel purchase bill ${num}?`)) return;
    try { await purchasesApi.cancel(id); toast.success('Purchase bill cancelled'); setPurchases(pur => pur.filter(p => p._id !== id)); }
    catch { toast.error('Failed to cancel'); }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Purchases" />
      <main className="flex-1 p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'This Month', value: `₹${(summary.monthPurchases || 0).toFixed(2)}`, sub: `${summary.monthPurchaseCount || 0} bills`, color: 'dark:text-emerald-400 text-emerald-600', bg: 'bg-emerald-400/10' },
            { label: 'Total Paid', value: `₹${(summary.totalPaid || 0).toFixed(2)}`, sub: 'Total payments made', color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'Outstanding Payables', value: `₹${(summary.outstanding || 0).toFixed(2)}`, sub: 'Pending to suppliers', color: 'text-orange-400', bg: 'bg-orange-400/10' },
          ].map(({ label, value, sub, color, bg }) => (
            <div key={label} className="glass rounded-2xl p-4">
              <p className="dark:text-[#94a3b8] text-gray-600 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="dark:text-[#475569] text-gray-500 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold dark:text-white text-gray-900">All Purchases</h2>
          <Link href="/dashboard/purchases/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-white/10/30">
            <Plus className="w-4 h-4" /> Add Purchase Bill
          </Link>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 flex-wrap">
          {[['', 'All'], ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])].map(([val, label]) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${statusFilter === val ? 'bg-white text-black hover:bg-gray-200 border-transparent' : 'dark:border-[#1A1A1A] border-gray-300 dark:text-[#94a3b8] text-gray-600 hover:dark:text-white text-gray-900 hover:border-[#D4D4D4]'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#D4D4D4] animate-spin" /></div>
        ) : purchases.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <FileText className="w-14 h-14 text-[#1A1A1A] mx-auto mb-4" />
            <p className="dark:text-white text-gray-900 font-semibold text-lg">No purchases yet</p>
            <p className="dark:text-[#475569] text-gray-500 text-sm mt-1 mb-6">Record your first purchase bill to update stock</p>
            <Link href="/dashboard/purchases/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 text-sm font-semibold hover:opacity-90 transition">
              <Plus className="w-4 h-4" /> Add Purchase Bill
            </Link>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-[#1A1A1A] border-gray-300">
                    {['Bill #', 'Date', 'Supplier', 'Amount', 'Paid', 'Balance', 'Mode', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 dark:text-[#94a3b8] text-gray-600 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {purchases.map((pur) => {
                    const sc = STATUS_CONFIG[pur.status] || STATUS_CONFIG['draft'];
                    const StatusIcon = sc.icon;
                    return (
                      <tr key={pur._id} className="hover:dark:bg-[#111111] bg-gray-50 transition-colors group">
                        <td className="px-5 py-4 font-mono text-xs text-[#D4D4D4] font-semibold">{pur.billNumber}</td>
                        <td className="px-5 py-4 dark:text-[#94a3b8] text-gray-600">{new Date(pur.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-5 py-4 dark:text-white text-gray-900 font-medium">{pur.supplierSnapshot.name}</td>
                        <td className="px-5 py-4 dark:text-white text-gray-900 font-semibold">₹{pur.grandTotal.toFixed(2)}</td>
                        <td className="px-5 py-4 text-green-400">₹{pur.amountPaid.toFixed(2)}</td>
                        <td className="px-5 py-4"><span className={pur.balance > 0 ? 'text-red-400 font-medium' : 'dark:text-[#475569] text-gray-500'}>₹{pur.balance.toFixed(2)}</span></td>
                        <td className="px-5 py-4 dark:text-[#94a3b8] text-gray-600">{pur.paymentMode}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" /> {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {pur.status !== 'cancelled' && (
                            <button onClick={() => handleCancel(pur._id, pur.billNumber)} className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded-lg text-xs text-red-400 hover:bg-red-900/10 transition">Cancel</button>
                          )}
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
