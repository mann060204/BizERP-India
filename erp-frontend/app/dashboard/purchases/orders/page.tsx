'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Topbar from '../../../../components/layout/Topbar';
import { purchaseOrdersApi } from '../../../../lib/erp-api';
import { Plus, FileText, Loader2, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PurchaseOrder { _id: string; orderNumber: string; orderDate: string; supplierSnapshot: { name: string }; grandTotal: number; status: string; }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  Draft:     { label: 'Draft',    color: 'text-slate-600 bg-[#94a3b8]/10', icon: FileText },
  Sent:      { label: 'Sent',     color: 'text-blue-400 bg-blue-400/10',    icon: Clock },
  Accepted:  { label: 'Accepted', color: 'text-green-400 bg-green-400/10',  icon: CheckCircle },
  Rejected:  { label: 'Rejected', color: 'text-red-400 bg-red-400/10',      icon: AlertCircle },
  Billed:    { label: 'Billed',   color: 'text-emerald-400 bg-emerald-400/10', icon: CheckCircle },
  Cancelled: { label: 'Cancelled',color: 'text-slate-600 bg-[#475569]/10', icon: XCircle },
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [summary, setSummary] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordRes, sumRes] = await Promise.all([
          purchaseOrdersApi.list({ status: statusFilter || undefined, limit: 50 }),
          purchaseOrdersApi.summary(),
        ]);
        setOrders(ordRes.orders);
        setSummary(sumRes);
      } catch { toast.error('Failed to load purchase orders'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [statusFilter]);

  const handleCancel = async (id: string, num: string) => {
    if (!confirm(`Cancel purchase order ${num}?`)) return;
    try { await purchaseOrdersApi.delete(id); toast.success('Purchase order cancelled'); setOrders(ord => ord.filter(o => o._id !== id)); }
    catch { toast.error('Failed to cancel'); }
  };

  const handleConvertToBill = async (id: string, num: string) => {
    if (!confirm(`Convert Purchase Order ${num} to a Purchase Bill?`)) return;
    try {
      const res = await purchaseOrdersApi.convert(id);
      toast.success('Successfully converted to Purchase Bill!');
      // Update local state to reflect Billed
      setOrders(ord => ord.map(o => o._id === id ? { ...o, status: 'Billed' } : o));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to convert to purchase bill');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Purchase Orders" />
      <main className="flex-1 p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'This Month', value: `₹${(summary.monthOrders || 0).toFixed(2)}`, sub: `${summary.monthOrderCount || 0} orders`, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Today', value: `₹${(summary.todayOrders || 0).toFixed(2)}`, sub: 'Total orders today', color: 'text-blue-400', bg: 'bg-blue-400/10' },
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
          <h2 className="text-xl font-bold text-slate-900">All Purchase Orders</h2>
          <Link href="/dashboard/purchases/orders/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-action-500 text-white hover:bg-action-600 font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-white/10/30">
            <Plus className="w-4 h-4" /> Add Purchase Order
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
        ) : orders.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <FileText className="w-14 h-14 text-[#1A1A1A] mx-auto mb-4" />
            <p className="text-slate-900 font-semibold text-lg">No purchase orders yet</p>
            <p className="text-slate-600 text-sm mt-1 mb-6">Create a purchase order to send to your supplier.</p>
            <Link href="/dashboard/purchases/orders/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-action-500 text-white hover:bg-action-600 text-sm font-semibold hover:opacity-90 transition">
              <Plus className="w-4 h-4" /> Add Purchase Order
            </Link>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    {['Order #', 'Date', 'Supplier', 'Amount', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-slate-600 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {orders.map((ord) => {
                    const sc = STATUS_CONFIG[ord.status] || STATUS_CONFIG['Draft'];
                    const StatusIcon = sc.icon;
                    return (
                      <tr key={ord._id} className="hover:bg-[#F1F5F9] transition-colors group">
                        <td className="px-5 py-4 font-mono text-xs text-slate-700 font-semibold">{ord.orderNumber}</td>
                        <td className="px-5 py-4 text-slate-600">{new Date(ord.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-5 py-4 text-slate-900 font-medium">{ord.supplierSnapshot.name}</td>
                        <td className="px-5 py-4 text-slate-900 font-semibold">₹{ord.grandTotal.toFixed(2)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" /> {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            {ord.status !== 'Billed' && ord.status !== 'Cancelled' && (
                              <button onClick={() => handleConvertToBill(ord._id, ord.orderNumber)} className="px-2 py-1 rounded-lg text-xs text-action-600 bg-action-50 hover:bg-action-100 transition">Convert to Bill</button>
                            )}
                            <Link href={`/dashboard/purchases/orders/${ord._id}/edit`} className="px-2 py-1 rounded-lg text-xs text-blue-500 hover:bg-blue-100 transition">Edit</Link>
                            {ord.status !== 'Cancelled' && (
                              <button onClick={() => handleCancel(ord._id, ord.orderNumber)} className="px-2 py-1 rounded-lg text-xs text-red-500 hover:bg-red-100 transition">Cancel</button>
                            )}
                            <Link href={`/print/purchase-order/${ord._id}`} target="_blank" className="px-2 py-1 rounded-lg text-xs text-slate-600 hover:bg-slate-200 transition">Print</Link>
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
