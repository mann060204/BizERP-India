'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { inventoryApi, productsApi } from '../../../../lib/erp-api';
import { Search, Loader2, Package, Calendar, Hash, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product { _id: string; name: string; sku?: string; unit: string; }
interface BatchItem {
  _id: string;
  productId: any;
  batchNo: string;
  currentStock: number;
  salePrice: number;
  mrp: number;
  manufacturingDate?: string;
  expiryDate?: string;
  createdAt: string;
}

export default function BatchNumbersPage() {
  // ─── Products ───────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // ─── Form ───────────────────────────────────────────────────────
  const [form, setForm] = useState({
    productId: '',
    productName: '',
    batchNo: '',
    quantity: 1,
    salePrice: 0,
    manufacturingDate: '',
    expiryDate: '',
  });
  const [saving, setSaving] = useState(false);

  // ─── Existing Batches ───────────────────────────────────────────
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [batchSearch, setBatchSearch] = useState('');

  // ─── Load products ──────────────────────────────────────────────
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await productsApi.list({ limit: 500 });
        setProducts(data.products || []);
      } catch { /* ignore */ }
    };
    loadProducts();
  }, []);

  // ─── Load batches ───────────────────────────────────────────────
  const fetchBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const { data } = await inventoryApi.listBatches({ search: batchSearch });
      setBatches(data.batches || []);
    } catch { toast.error('Failed to load batches'); }
    finally { setLoadingBatches(false); }
  }, [batchSearch]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  // ─── Filtered product suggestions ───────────────────────────────
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  ).slice(0, 10);

  const selectProduct = (p: Product) => {
    setForm({ ...form, productId: p._id, productName: p.name });
    setProductSearch(p.name);
    setShowProductDropdown(false);
  };

  // ─── Save batch ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.productId) { toast.error('Please select a product'); return; }
    if (!form.batchNo.trim()) { toast.error('Batch No. is required'); return; }
    setSaving(true);
    try {
      await inventoryApi.saveBatch(form);
      toast.success('Batch saved successfully');
      setForm({ productId: '', productName: '', batchNo: '', quantity: 1, salePrice: 0, manufacturingDate: '', expiryDate: '' });
      setProductSearch('');
      fetchBatches();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save batch');
    } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Add Batch Number" />
      <main className="flex-1 p-6 space-y-6">

        {/* ─── ADD BATCH FORM ─────────────────────────────────────── */}
        <div className="glass rounded-2xl relative z-20">
          <div className="px-6 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
            <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wider">Add Batch Number</h2>
          </div>

          <div className="p-5">
            {/* Form Row */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">

              {/* Item Name */}
              <div className="md:col-span-2 relative">
                <label className="block text-xs font-medium text-slate-500 mb-1">Item Name</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={productSearch}
                    onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); setForm({ ...form, productId: '', productName: '' }); }}
                    onFocus={() => setShowProductDropdown(true)}
                    placeholder="Select"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition"
                  />
                </div>
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <button key={p._id} onClick={() => selectProduct(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm text-slate-800 transition flex items-center justify-between border-b border-slate-100 last:border-0">
                        <span className="font-medium">{p.name}</span>
                        {p.sku && <span className="text-xs text-slate-400 font-mono">{p.sku}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Batch No */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Batch No.</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={form.batchNo} onChange={e => setForm({ ...form, batchNo: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition"
                    placeholder="e.g. B001" />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
                <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })} min="0" step="any"
                  className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition" />
              </div>

              {/* Sale Price */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Sale Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="number" value={form.salePrice} onChange={e => setForm({ ...form, salePrice: parseFloat(e.target.value) || 0 })} min="0" step="any"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition" />
                </div>
              </div>

              {/* Mfg Date */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Mfg Date</label>
                <input type="date" value={form.manufacturingDate} onChange={e => setForm({ ...form, manufacturingDate: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition" />
              </div>

              {/* Expiry Date */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition" />
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-md">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── EXISTING BATCH NUMBERS TABLE ────────────────────────── */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Existing Batch Number(s)</h2>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={batchSearch} onChange={e => setBatchSearch(e.target.value)}
                placeholder="Search batches..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 text-xs transition" />
            </div>
          </div>

          <div className="min-h-[300px]">
            {loadingBatches ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              </div>
            ) : batches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Search className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm font-medium">No batches added yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      {['#', 'Item Name', 'Batch No.', 'Stock', 'Sale Price', 'MRP', 'Mfg Date', 'Expiry Date', 'Added On'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map((b, i) => (
                      <tr key={b._id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-5 py-3 text-slate-400 text-xs">{i + 1}</td>
                        <td className="px-5 py-3 text-slate-900 font-medium">{b.productId?.name || '—'}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                            {b.batchNo}
                          </span>
                        </td>
                        <td className={`px-5 py-3 font-semibold ${b.currentStock <= 0 ? 'text-red-500' : 'text-slate-900'}`}>
                          {parseFloat((b.currentStock || 0).toFixed(3))} {b.productId?.unit || ''}
                        </td>
                        <td className="px-5 py-3 text-slate-700">₹{(b.salePrice || 0).toFixed(2)}</td>
                        <td className="px-5 py-3 text-slate-700">₹{(b.mrp || 0).toFixed(2)}</td>
                        <td className="px-5 py-3 text-slate-600 text-xs">
                          {b.manufacturingDate ? new Date(b.manufacturingDate).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          {b.expiryDate ? (
                            <span className={`font-medium ${new Date(b.expiryDate) < new Date() ? 'text-red-600' : 'text-slate-600'}`}>
                              {new Date(b.expiryDate).toLocaleDateString('en-IN')}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs">
                          {new Date(b.createdAt).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
