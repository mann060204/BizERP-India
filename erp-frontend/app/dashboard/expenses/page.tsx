'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../components/layout/Topbar';
import { expensesApi } from '../../../lib/erp-api';
import { Plus, Search, Receipt, Trash2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Expense { _id: string; category: string; amount: number; date: string; paymentMode: string; vendorName?: string; notes?: string; totalWithTax: number; }

const CATEGORIES = ['Rent', 'Salaries', 'Electricity', 'Internet', 'Marketing', 'Travel', 'Office Supplies', 'Maintenance', 'Legal & Professional', 'Miscellaneous'];
const PAYMENT_MODES = ['Cash', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Credit Card'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({ monthTotal: 0, byCategory: [] });

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: 'Miscellaneous', amount: 0, date: new Date().toISOString().split('T')[0], paymentMode: 'Cash', vendorName: '', notes: '', gstRate: 0, isInterState: false });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, sumRes] = await Promise.all([
        expensesApi.list({ category: search || undefined, limit: 100 }),
        expensesApi.summary()
      ]);
      setExpenses(expRes.data.expenses);
      setSummary(sumRes.data);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const openCreate = () => { setForm({ category: 'Miscellaneous', amount: 0, date: new Date().toISOString().split('T')[0], paymentMode: 'Cash', vendorName: '', notes: '', gstRate: 0, isInterState: false }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.amount || form.amount <= 0) { toast.error('Amount is required'); return; }
    setSaving(true);
    try {
      await expensesApi.create(form);
      toast.success('Expense recorded');
      setShowModal(false); fetchExpenses();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense record?')) return;
    try { await expensesApi.delete(id); toast.success('Expense deleted'); fetchExpenses(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Expenses" />
      <main className="flex-1 p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass rounded-2xl p-6 lg:col-span-1 flex flex-col justify-center">
            <p className="text-[#94a3b8] text-sm font-medium uppercase tracking-wider mb-2">Total Expenses (This Month)</p>
            <p className="text-3xl font-bold text-red-400">₹{(summary.monthTotal || 0).toFixed(2)}</p>
          </div>
          
          <div className="glass rounded-2xl p-5 lg:col-span-2 overflow-x-auto whitespace-nowrap space-x-4 flex items-center">
            {summary.byCategory && summary.byCategory.length > 0 ? (
              summary.byCategory.map((c: any) => (
                <div key={c._id} className="inline-block bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-3 min-w-[140px]">
                  <p className="text-[#94a3b8] text-xs font-medium truncate">{c._id}</p>
                  <p className="text-white font-bold mt-1">₹{c.total.toFixed(2)}</p>
                </div>
              ))
            ) : (
              <p className="text-[#475569] text-sm w-full text-center">No expenses recorded this month.</p>
            )}
          </div>
        </div>

        {/* Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
            <select value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] transition text-sm appearance-none">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-white/10/30">
            <Plus className="w-4 h-4" /> Record Expense
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#D4D4D4] animate-spin" /></div>
        ) : expenses.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Receipt className="w-14 h-14 text-[#1A1A1A] mx-auto mb-4" />
            <p className="text-white font-semibold text-lg">No expenses found</p>
            <p className="text-[#475569] text-sm mt-1">Record your first expense to track outflows</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1A1A1A]">
                    {['Date', 'Category', 'Vendor / Notes', 'Mode', 'Amount', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-[#94a3b8] font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {expenses.map((e) => (
                    <tr key={e._id} className="hover:bg-[#111111] transition-colors group">
                      <td className="px-5 py-4 text-[#94a3b8]">{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-5 py-4"><span className="px-2 py-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg text-white text-xs">{e.category}</span></td>
                      <td className="px-5 py-4">
                        <p className="text-white font-medium">{e.vendorName || '—'}</p>
                        {e.notes && <p className="text-[#475569] text-xs mt-0.5 max-w-[200px] truncate">{e.notes}</p>}
                      </td>
                      <td className="px-5 py-4 text-[#94a3b8]">{e.paymentMode}</td>
                      <td className="px-5 py-4 font-bold text-red-400">₹{e.totalWithTax.toFixed(2)}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => handleDelete(e._id)} className="p-1.5 rounded-lg hover:bg-red-900/20 text-[#475569] hover:text-red-400 transition opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#1A1A1A]">
              <h3 className="text-white font-bold text-lg">Record Expense</h3>
              <button onClick={() => setShowModal(false)} className="text-[#475569] hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Category *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Amount (₹) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Payment Mode</label>
                  <select value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition">
                    {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Vendor / Payee Name</label>
                <input value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} placeholder="e.g. BSNL, Reliance, John Doe"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
              </div>
              
              <div className="p-4 bg-[#000000] rounded-xl border border-[#1A1A1A] space-y-3">
                <p className="text-xs font-semibold text-white uppercase tracking-wider">Tax Details (Optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">GST %</label>
                    <select value={form.gstRate} onChange={e => setForm({ ...form, gstRate: parseInt(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition">
                      {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}% GST</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Supply Type</label>
                    <div className="flex rounded-lg overflow-hidden border border-[#1A1A1A]">
                      {[{ label: 'Intra (C+S)', v: false }, { label: 'Inter (I)', v: true }].map(({ label, v }) => (
                        <button key={label} type="button" onClick={() => setForm({ ...form, isInterState: v })} disabled={form.gstRate === 0}
                          className={`flex-1 py-2 text-xs font-medium transition ${form.isInterState === v ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#111111] text-[#94a3b8] hover:text-white'} disabled:opacity-50`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition resize-none" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-[#1A1A1A]">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#1A1A1A] text-[#94a3b8] hover:text-white hover:border-[#D4D4D4] font-medium text-sm transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Record Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
