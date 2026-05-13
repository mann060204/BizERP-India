'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../components/layout/Topbar';
import { inventoryApi } from '../../../lib/erp-api';
import { Search, Database, AlertCircle, TrendingDown, TrendingUp, Settings2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product { _id: string; name: string; sku?: string; category?: string; unit: string; currentStock: number; reorderLevel: number; purchasePrice: number; }

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalStockValue: 0, lowStockCount: 0 });

  const [showModal, setShowModal] = useState(false);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'add', quantity: 0, reason: '', notes: '' });

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await inventoryApi.list({ search, lowStock: filter === 'low' ? 'true' : '', limit: 100 });
      setInventory(data.inventory);
      setSummary({ totalStockValue: data.totalStockValue, lowStockCount: data.lowStockCount });
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, [search, filter]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const openAdjust = (p: Product) => { setAdjusting(p); setForm({ type: 'add', quantity: 0, reason: 'Physical Count', notes: '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.quantity || form.quantity <= 0) { toast.error('Enter valid quantity'); return; }
    if (!form.reason.trim()) { toast.error('Reason is required'); return; }
    setSaving(true);
    try {
      await inventoryApi.adjust({ productId: adjusting!._id, ...form });
      toast.success('Stock adjusted');
      setShowModal(false); fetchInventory();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to adjust stock'); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Inventory Management" />
      <main className="flex-1 p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-4">
            <p className="text-[#94a3b8] text-xs font-medium uppercase tracking-wider mb-1">Total Stock Value</p>
            <p className="text-xl font-bold text-emerald-400">₹{(summary.totalStockValue || 0).toFixed(2)}</p>
            <p className="text-[#475569] text-xs mt-0.5">Based on purchase price</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-[#94a3b8] text-xs font-medium uppercase tracking-wider mb-1">Low Stock Alerts</p>
            <p className="text-xl font-bold text-red-400">{summary.lowStockCount || 0} items</p>
            <p className="text-[#475569] text-xs mt-0.5">Below reorder level</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-[#94a3b8] text-xs font-medium uppercase tracking-wider mb-1">Total Items Tracked</p>
            <p className="text-xl font-bold text-blue-400">{inventory.length}</p>
            <p className="text-[#475569] text-xs mt-0.5">Active products</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] transition text-sm" />
          </div>
          <div className="flex rounded-xl overflow-hidden border border-[#1A1A1A]">
            {[{ id: 'all', label: 'All Items' }, { id: 'low', label: 'Low Stock' }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id as any)}
                className={`px-4 py-2 text-sm font-medium transition ${filter === f.id ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#0A0A0A] text-[#94a3b8] hover:text-white'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#D4D4D4] animate-spin" /></div>
        ) : inventory.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Database className="w-14 h-14 text-[#1A1A1A] mx-auto mb-4" />
            <p className="text-white font-semibold text-lg">No inventory items found</p>
            <p className="text-[#475569] text-sm mt-1">Make sure you have added Products in the Masters section.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1A1A1A]">
                    {['Product', 'SKU', 'Category', 'Current Stock', 'Stock Value', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-[#94a3b8] font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {inventory.map((p) => {
                    const isLow = p.currentStock <= p.reorderLevel;
                    return (
                      <tr key={p._id} className="hover:bg-[#111111] transition-colors group">
                        <td className="px-5 py-4 text-white font-medium">{p.name}</td>
                        <td className="px-5 py-4 text-[#94a3b8] font-mono text-xs">{p.sku || '—'}</td>
                        <td className="px-5 py-4 text-[#94a3b8]">{p.category || '—'}</td>
                        <td className="px-5 py-4 font-bold text-white">{p.currentStock} {p.unit}</td>
                        <td className="px-5 py-4 text-emerald-400">₹{(p.currentStock * p.purchasePrice).toFixed(2)}</td>
                        <td className="px-5 py-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-red-400 bg-red-400/10"><AlertCircle className="w-3 h-3" /> Low Stock</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-green-400 bg-green-400/10">In Stock</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <button onClick={() => openAdjust(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1A1A1A] text-[#94a3b8] hover:text-white hover:border-[#D4D4D4] transition text-xs font-medium opacity-0 group-hover:opacity-100">
                            <Settings2 className="w-3.5 h-3.5" /> Adjust
                          </button>
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

      {/* Adjust Modal */}
      {showModal && adjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#1A1A1A]">
              <h3 className="text-white font-bold text-lg">Adjust Stock</h3>
              <button onClick={() => setShowModal(false)} className="text-[#475569] hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-[#94a3b8]">Product</p>
                <p className="text-white font-semibold">{adjusting.name}</p>
                <p className="text-xs text-[#475569] mt-0.5">Current Stock: {adjusting.currentStock} {adjusting.unit}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Adjustment Type</label>
                <div className="flex rounded-xl overflow-hidden border border-[#1A1A1A]">
                  {[{ id: 'add', label: 'Add Stock', icon: TrendingUp }, { id: 'subtract', label: 'Reduce Stock', icon: TrendingDown }].map(t => (
                    <button key={t.id} type="button" onClick={() => setForm({ ...form, type: t.id })}
                      className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition ${form.type === t.id ? (t.id === 'add' ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400') : 'bg-[#111111] text-[#94a3b8] hover:text-white'}`}>
                      <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Quantity to {form.type === 'add' ? 'Add' : 'Remove'}</label>
                <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })} min="0" step="any"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Reason</label>
                <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition">
                  {['Physical Count', 'Damage / Spoilage', 'Return to Supplier', 'Internal Consumption', 'Data Entry Error'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Notes (Optional)</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition resize-none" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-[#1A1A1A]">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#1A1A1A] text-[#94a3b8] hover:text-white hover:border-[#D4D4D4] font-medium text-sm transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className={`flex-1 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2 ${form.type === 'add' ? 'bg-green-500' : 'bg-red-500'}`}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
