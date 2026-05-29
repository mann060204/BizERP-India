'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Topbar from '../../../components/layout/Topbar';
import { invoicesApi } from '../../../lib/erp-api';
import { Plus, Filter, Search, FileText, TrendingUp, Loader2, CheckCircle, Clock, AlertCircle, XCircle, Printer, MessageCircle, Mail, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Invoice { _id: string; invoiceNumber: string; invoiceDate: string; customerSnapshot: { name: string; mobile?: string }; grandTotal: number; amountReceived: number; balance: number; status: string; paymentMode: string; }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft:     { label: 'Draft',    color: 'text-slate-600 bg-[#94a3b8]/10', icon: FileText },
  partial:   { label: 'Partial',  color: 'text-yellow-400 bg-yellow-400/10',icon: AlertCircle },
  paid:      { label: 'Paid',     color: 'text-green-400 bg-green-400/10',  icon: CheckCircle },
  overdue:   { label: 'Overdue',  color: 'text-red-400 bg-red-400/10',      icon: AlertCircle },
  cancelled: { label: 'Cancelled',color: 'text-slate-500 bg-slate-500/10', icon: XCircle },
};

export default function SalesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [invRes, sumRes] = await Promise.all([
          invoicesApi.list({ status: statusFilter || undefined, limit: 50 }),
          invoicesApi.summary(),
        ]);
        setInvoices(invRes.data.invoices);
        setSummary(sumRes.data);
      } catch { toast.error('Failed to load invoices'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [statusFilter]);

  const handleCancel = async (id: string, num: string) => {
    if (!confirm(`Cancel invoice ${num}?`)) return;
    try { await invoicesApi.cancel(id); toast.success('Invoice cancelled'); setInvoices(inv => inv.filter(i => i._id !== id)); }
    catch { toast.error('Failed to cancel'); }
  };

  const handleWhatsApp = (inv: Invoice) => {
    const text = `Hello ${inv.customerSnapshot.name},\n\nYour invoice ${inv.invoiceNumber} for ₹${inv.grandTotal.toFixed(2)} is ready.\nPlease review it here: http://localhost:3000/print/invoice/${inv._id}\n\nThank you for your business!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.customerSnapshot?.name?.toLowerCase().includes(q) ||
      inv.customerSnapshot?.mobile?.toLowerCase().includes(q) ||
      inv.grandTotal?.toString().includes(q)
    );
  });

  const handleEmail = (inv: Invoice) => {
    const subject = `Invoice ${inv.invoiceNumber} from our business`;
    const body = `Hello ${inv.customerSnapshot.name},\n\nYour invoice ${inv.invoiceNumber} for ₹${inv.grandTotal.toFixed(2)} is ready.\nPlease review it here: http://localhost:3000/print/invoice/${inv._id}\n\nThank you for your business!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Sales" />
      <main className="flex-1 p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'This Month', value: `₹${(summary.monthSales || 0).toFixed(2)}`, sub: `${summary.monthInvoiceCount || 0} invoices`, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: "Today's Sales", value: `₹${(summary.todaySales || 0).toFixed(2)}`, sub: 'Today', color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'Amount Received', value: `₹${(summary.totalReceived || 0).toFixed(2)}`, sub: 'Total collected', color: 'text-violet-400', bg: 'bg-violet-400/10' },
            { label: 'Outstanding', value: `₹${(summary.outstanding || 0).toFixed(2)}`, sub: 'Pending balance', color: 'text-orange-400', bg: 'bg-orange-400/10' },
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
          <h2 className="text-xl font-bold text-slate-900">All Invoices</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by Bill No, Name, Mobile..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-action-400 w-72 text-slate-900"
              />
            </div>
            <Link href="/dashboard/sales/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-action-500 text-white hover:bg-action-600 font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-white/10/30 whitespace-nowrap">
              <Plus className="w-4 h-4" /> New Invoice
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
        ) : filteredInvoices.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <FileText className="w-14 h-14 text-[#1A1A1A] mx-auto mb-4" />
            <p className="text-slate-900 font-semibold text-lg">No invoices yet</p>
            <p className="text-slate-600 text-sm mt-1 mb-6">Create your first GST invoice to get started</p>
            <Link href="/dashboard/sales/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-action-500 text-white hover:bg-action-600 text-sm font-semibold hover:opacity-90 transition">
              <Plus className="w-4 h-4" /> Create Invoice
            </Link>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    {['Invoice #', 'Date', 'Customer', 'Amount', 'Received', 'Balance', 'Mode', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-slate-600 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {filteredInvoices.map((inv) => {
                    const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG['draft'];
                    const StatusIcon = sc.icon;
                    return (
                      <tr key={inv._id} className="hover:bg-[#F1F5F9] transition-colors group">
                        <td className="px-5 py-4 font-mono text-xs text-slate-700 font-semibold">{inv.invoiceNumber}</td>
                        <td className="px-5 py-4 text-slate-600">{new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-5 py-4 text-slate-900 font-medium">{inv.customerSnapshot.name}</td>
                        <td className="px-5 py-4 text-slate-900 font-semibold">₹{inv.grandTotal.toFixed(2)}</td>
                        <td className="px-5 py-4 text-green-400">₹{inv.amountReceived.toFixed(2)}</td>
                        <td className="px-5 py-4"><span className={inv.balance > 0 ? 'text-red-400 font-medium' : 'text-slate-600'}>₹{inv.balance.toFixed(2)}</span></td>
                        <td className="px-5 py-4 text-slate-600">{inv.paymentMode}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                              <StatusIcon className="w-3 h-3" /> {sc.label}
                            </span>
                            {inv.balance > 0 && inv.status !== 'cancelled' && inv.status !== 'paid' && (
                              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                                {Math.max(0, Math.floor((new Date().getTime() - new Date(inv.invoiceDate).getTime()) / (1000 * 3600 * 24)))} days pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/print/invoice/${inv._id}`} target="_blank" className="p-1.5 rounded-lg bg-[#E2E8F0] text-slate-600 hover:text-slate-900 hover:bg-[#D4D4D4] transition tooltip" title="Print Invoice">
                              <Printer className="w-4 h-4" />
                            </Link>
                            {inv.status !== 'cancelled' && (
                              <Link href={`/dashboard/sales/${inv._id}/edit`} className="p-1.5 rounded-lg bg-[#E2E8F0] text-slate-600 hover:text-slate-900 hover:bg-action-500 transition tooltip" title="Edit Invoice">
                                <Edit3 className="w-4 h-4" />
                              </Link>
                            )}
                            <button onClick={() => handleWhatsApp(inv)} className="p-1.5 rounded-lg bg-[#E2E8F0] text-slate-600 hover:text-slate-900 hover:bg-[#22c55e] transition" title="Share via WhatsApp">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEmail(inv)} className="p-1.5 rounded-lg bg-[#E2E8F0] text-slate-600 hover:text-slate-900 hover:bg-[#D4D4D4] transition" title="Share via Email">
                              <Mail className="w-4 h-4" />
                            </button>
                            {inv.status !== 'cancelled' && (
                              <button onClick={() => handleCancel(inv._id, inv.invoiceNumber)} className="p-1.5 rounded-lg bg-[#E2E8F0] text-slate-600 hover:text-slate-900 hover:bg-red-500 transition" title="Cancel Invoice">
                                <XCircle className="w-4 h-4" />
                              </button>
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
