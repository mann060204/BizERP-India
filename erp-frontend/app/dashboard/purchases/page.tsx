'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Topbar from '../../../components/layout/Topbar';
import { purchasesApi } from '../../../lib/erp-api';
import { Plus, Search, FileText, Loader2, CheckCircle, Clock, AlertCircle, XCircle, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import ExportDropdown from '../../../components/shared/ExportDropdown';

interface Purchase { _id: string; billNumber: string; billDate: string; supplierSnapshot: { name: string }; grandTotal: number; amountPaid: number; balance: number; status: string; paymentMode: string; }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft:     { label: 'Draft',    color: 'text-slate-600 bg-[#94a3b8]/10', icon: FileText },
  received:  { label: 'Received', color: 'text-blue-400 bg-blue-400/10',    icon: Clock },
  paid:      { label: 'Paid',     color: 'text-green-400 bg-green-400/10',  icon: CheckCircle },
  partial:   { label: 'Partial',  color: 'text-yellow-400 bg-yellow-400/10',icon: AlertCircle },
  overdue:   { label: 'Overdue',  color: 'text-red-400 bg-red-400/10',      icon: AlertCircle },
  cancelled: { label: 'Cancelled',color: 'text-slate-600 bg-[#475569]/10', icon: XCircle },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'This Month', value: `₹${(summary.monthPurchases || 0).toFixed(2)}`, sub: `${summary.monthPurchaseCount || 0} bills`, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
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
          <h2 className="text-xl font-bold text-slate-900">All Purchases</h2>
          <div className="flex items-center gap-3">
            <ExportDropdown 
              data={purchases.filter(p => !statusFilter || p.status === statusFilter)}
              filename="Purchases_Export"
              columns={[
                { header: 'Date', render: (p) => new Date(p.billDate).toLocaleDateString('en-GB') },
                { header: 'Bill No.', key: 'billNumber' },
                { header: 'Supplier', render: (p) => p.supplierSnapshot?.name || '' },
                { header: 'Total Amount', render: (p) => (p.grandTotal || 0).toFixed(2) },
                { header: 'Amount Paid', render: (p) => (p.amountPaid || 0).toFixed(2) },
                { header: 'Balance', render: (p) => (p.balance || 0).toFixed(2) },
                { header: 'Status', render: (p) => STATUS_CONFIG[p.status]?.label || p.status }
              ]}
            />
            <Link href="/dashboard/purchases/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-action-500 text-white hover:bg-action-600 font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-white/10/30">
              <Plus className="w-4 h-4" /> Add Purchase Bill
            </Link>
          </div>
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
        ) : purchases.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <FileText className="w-14 h-14 text-[#1A1A1A] mx-auto mb-4" />
            <p className="text-slate-900 font-semibold text-lg">No purchases yet</p>
            <p className="text-slate-600 text-sm mt-1 mb-6">Record your first purchase bill to update stock</p>
            <Link href="/dashboard/purchases/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-action-500 text-white hover:bg-action-600 text-sm font-semibold hover:opacity-90 transition">
              <Plus className="w-4 h-4" /> Add Purchase Bill
            </Link>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    {['Bill #', 'Date', 'Supplier', 'Amount', 'Paid', 'Balance', 'Mode', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-slate-600 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {purchases.map((pur) => {
                    const sc = STATUS_CONFIG[pur.status] || STATUS_CONFIG['draft'];
                    const StatusIcon = sc.icon;
                    return (
                      <tr key={pur._id} className="hover:bg-[#F1F5F9] transition-colors group">
                        <td className="px-5 py-4 font-mono text-xs text-slate-700 font-semibold">{pur.billNumber}</td>
                        <td className="px-5 py-4 text-slate-600">{new Date(pur.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-5 py-4 text-slate-900 font-medium">{pur.supplierSnapshot.name}</td>
                        <td className="px-5 py-4 text-slate-900 font-semibold">₹{pur.grandTotal.toFixed(2)}</td>
                        <td className="px-5 py-4 text-green-400">₹{pur.amountPaid.toFixed(2)}</td>
                        <td className="px-5 py-4"><span className={pur.balance > 0 ? 'text-red-400 font-medium' : 'text-slate-600'}>₹{pur.balance.toFixed(2)}</span></td>
                        <td className="px-5 py-4 text-slate-600">{pur.paymentMode}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" /> {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                            <Link href={`/print/purchase/${pur._id}`} target="_blank" className="p-1.5 rounded-lg bg-[#E2E8F0] text-slate-600 hover:text-slate-900 hover:bg-[#D4D4D4] transition" title="Print Purchase Bill">
                              <Printer className="w-4 h-4" />
                            </Link>
                            <Link href={`/dashboard/purchases/${pur._id}/edit`} className="px-2 py-1 rounded-lg text-xs text-blue-500 hover:bg-blue-100 transition">Edit</Link>
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
