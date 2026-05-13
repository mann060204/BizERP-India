'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../components/layout/Topbar';
import { productsApi } from '../../../lib/erp-api';
import { Plus, Search, Package, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product { _id: string; name: string; type: string; sku?: string; hsnCode?: string; unit: string; sellingPrice: number; purchasePrice: number; gstRate: number; currentStock: number; reorderLevel: number; category?: string; }

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['Nos', 'Kg', 'L', 'Box', 'Pcs', 'Mtr', 'Sqft', 'Hours', 'Job'];

const emptyForm = { name: '', type: 'product', sku: '', hsnCode: '', category: '', unit: 'Nos', purchasePrice: 0, sellingPrice: 0, mrp: 0, gstRate: 18, openingStock: 0, reorderLevel: 5 };

export default function MastersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await productsApi.list({ search, type: typeFilter || undefined, limit: 100 });
      setProducts(data.products);
    } catch { toast.error('Failed to load items'); }
    finally { setLoading(false); }
  }, [search, typeFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ name: p.name, type: p.type, sku: p.sku || '', hsnCode: p.hsnCode || '', category: p.category || '', unit: p.unit, purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice, mrp: 0, gstRate: p.gstRate, openingStock: p.currentStock, reorderLevel: p.reorderLevel }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Item name is required'); return; }
    if (!form.sellingPrice || form.sellingPrice <= 0) { toast.error('Selling price must be greater than 0'); return; }
    setSaving(true);
    try {
      if (editing) { await productsApi.update(editing._id, form); toast.success('Item updated'); }
      else { await productsApi.create(form); toast.success('Item created'); }
      setShowModal(false); fetchProducts();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await productsApi.delete(id); toast.success('Item deleted'); fetchProducts(); }
    catch { toast.error('Failed to delete'); }
  };

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">{label}</label>
      <input type={type} value={form[key]} placeholder={placeholder}
        onChange={e => setForm({ ...form, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
        className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Items & Services" />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Items & Services</h2>
            <p className="text-[#94a3b8] text-sm mt-0.5">{products.length} item{products.length !== 1 ? 's' : ''} in master</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-white/10/30">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] transition text-sm" />
          </div>
          {['', 'product', 'service'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${typeFilter === t ? 'bg-white text-black hover:bg-gray-200 border-transparent' : 'border-[#1A1A1A] text-[#94a3b8] hover:text-white hover:border-[#D4D4D4]'}`}>
              {t === '' ? 'All' : t === 'product' ? 'Products' : 'Services'}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#D4D4D4] animate-spin" /></div>
        ) : products.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Package className="w-14 h-14 text-[#1A1A1A] mx-auto mb-4" />
            <p className="text-white font-semibold text-lg">No items yet</p>
            <p className="text-[#475569] text-sm mt-1 mb-6">Add your products and services to start billing</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 text-sm font-semibold hover:opacity-90 transition">Add Item</button>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1A1A1A]">
                    {['Item Name', 'Type', 'SKU', 'Unit', 'Sell Price', 'GST%', 'Stock', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-[#94a3b8] font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-[#111111] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${p.type === 'service' ? 'bg-violet-400/10 text-violet-400' : 'bg-blue-400/10 text-blue-400'}`}>
                            {p.type === 'service' ? 'S' : 'P'}
                          </div>
                          <div>
                            <p className="text-white font-medium">{p.name}</p>
                            {p.category && <p className="text-[#475569] text-xs">{p.category}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.type === 'service' ? 'bg-violet-400/10 text-violet-400' : 'bg-blue-400/10 text-blue-400'}`}>{p.type}</span></td>
                      <td className="px-5 py-4 text-[#94a3b8] font-mono text-xs">{p.sku || '—'}</td>
                      <td className="px-5 py-4 text-[#94a3b8]">{p.unit}</td>
                      <td className="px-5 py-4 text-white font-semibold">₹{p.sellingPrice.toFixed(2)}</td>
                      <td className="px-5 py-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-400/10 text-orange-400">{p.gstRate}%</span></td>
                      <td className="px-5 py-4">
                        {p.type === 'product' ? (
                          <span className={p.currentStock <= p.reorderLevel ? 'text-red-400 font-medium' : 'text-green-400'}>
                            {p.currentStock} {p.unit}
                          </span>
                        ) : <span className="text-[#475569]">N/A</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[#1A1A1A] text-[#94a3b8] hover:text-white transition"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(p._id, p.name)} className="p-1.5 rounded-lg hover:bg-red-900/20 text-[#94a3b8] hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
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
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#1A1A1A]">
              <h3 className="text-white font-bold text-lg">{editing ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => setShowModal(false)} className="text-[#475569] hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Type toggle */}
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Item Type</label>
                <div className="flex rounded-xl overflow-hidden border border-[#1A1A1A]">
                  {['product', 'service'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2.5 text-sm font-medium capitalize transition ${form.type === t ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#111111] text-[#94a3b8] hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {field('Item Name *', 'name', 'text', 'e.g. Rice (1kg)')}
              <div className="grid grid-cols-2 gap-3">
                {field('SKU / Code', 'sku', 'text', 'RICE001')}
                {field('Category', 'category', 'text', 'Groceries')}
              </div>
              {form.type === 'product' && field('HSN Code', 'hsnCode', 'text', '1006')}
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Unit</label>
                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field('Purchase Price (₹)', 'purchasePrice', 'number', '0')}
                {field('Selling Price (₹) *', 'sellingPrice', 'number', '0')}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">GST Rate</label>
                <select value={form.gstRate} onChange={e => setForm({ ...form, gstRate: parseInt(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition">
                  {GST_RATES.map(r => <option key={r} value={r}>{r}% GST</option>)}
                </select>
              </div>
              {form.type === 'product' && (
                <div className="grid grid-cols-2 gap-3">
                  {field('Opening Stock', 'openingStock', 'number', '0')}
                  {field('Reorder Level', 'reorderLevel', 'number', '5')}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-[#1A1A1A]">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#1A1A1A] text-[#94a3b8] hover:text-white hover:border-[#D4D4D4] font-medium text-sm transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editing ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
