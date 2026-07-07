'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { inventoryApi, productsApi } from '../../../../lib/erp-api';
import { Search, Loader2, Package, Calendar, Hash, DollarSign, Edit2, X, Save, Tag, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product { _id: string; name: string; sku?: string; unit: string; }
interface BatchItem {
  _id: string;
  productId: any;
  batchNo: string;
  currentStock: number;
  currentStock: number;
  salePrice: number;
  salePrice2?: number;
  salePrice3?: number;
  mrp: number;
  box?: string;
  location?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  createdAt: string;
}

export default function BatchNumbersPage() {
  // ─── Products ───────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // ─── Form (Add) ─────────────────────────────────────────────────
  const [form, setForm] = useState({
    productId: '',
    productName: '',
    batchNo: '',
    quantity: 1,
    salePrice: 0,
    salePrice2: 0,
    salePrice3: 0,
    box: '',
    location: '',
    manufacturingDate: '',
    expiryDate: '',
  });
  const [saving, setSaving] = useState(false);

  // ─── Existing Batches ───────────────────────────────────────────
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [batchSearch, setBatchSearch] = useState('');

  // ─── Edit Modal ─────────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchItem | null>(null);
  const [editForm, setEditForm] = useState({
    batchNo: '',
    salePrice: 0,
    salePrice2: 0,
    salePrice3: 0,
    mrp: 0,
    box: '',
    location: '',
    manufacturingDate: '',
    expiryDate: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  // ─── Delete Confirm ─────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState<BatchItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      setBatches((data.batches || []).filter((b: any) => b.currentStock > 0));
    } catch { toast.error('Failed to load batches'); }
    finally { setLoadingBatches(false); }
  }, [batchSearch]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  // ─── Filtered product suggestions ───────────────────────────────
  const filteredProducts = products.filter(p =>
    p?.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  ).slice(0, 10);

  const selectProduct = (p: Product) => {
    setForm({ ...form, productId: p._id, productName: p.name });
    setProductSearch(p.name);
    setShowProductDropdown(false);
  };

  // ─── Save new batch ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.productId) { toast.error('Please select a product'); return; }
    if (!form.batchNo.trim()) { toast.error('Batch No. is required'); return; }
    setSaving(true);
    try {
      await inventoryApi.saveBatch(form);
      toast.success('Batch saved successfully');
      setForm({ productId: '', productName: '', batchNo: '', quantity: 1, salePrice: 0, salePrice2: 0, salePrice3: 0, box: '', location: '', manufacturingDate: '', expiryDate: '' });
      setProductSearch('');
      fetchBatches();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save batch');
    } finally { setSaving(false); }
  };

  // ─── Open Edit Modal ────────────────────────────────────────────
  const openEdit = (b: BatchItem) => {
    setEditingBatch(b);
    setEditForm({
      batchNo: b.batchNo,
      salePrice: b.salePrice || 0,
      salePrice2: b.salePrice2 || 0,
      salePrice3: b.salePrice3 || 0,
      mrp: b.mrp || 0,
      box: b.box || '',
      location: b.location || '',
      manufacturingDate: b.manufacturingDate ? new Date(b.manufacturingDate).toISOString().split('T')[0] : '',
      expiryDate: b.expiryDate ? new Date(b.expiryDate).toISOString().split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  // ─── Save Edited Batch ──────────────────────────────────────────
  const handleEditSave = async () => {
    if (!editingBatch) return;
    if (!editForm.batchNo.trim()) { toast.error('Batch No. is required'); return; }
    setEditSaving(true);
    try {
      await inventoryApi.updateBatch(editingBatch._id, editForm);
      toast.success(`Batch "${editForm.batchNo}" updated`);
      setShowEditModal(false);
      fetchBatches();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update batch');
    } finally { setEditSaving(false); }
  };

  // ─── Delete Batch ───────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingBatch) return;
    setDeleteLoading(true);
    try {
      await inventoryApi.deleteBatch(deletingBatch._id);
      toast.success(`Batch "${deletingBatch.batchNo}" deleted`);
      setShowDeleteConfirm(false);
      setDeletingBatch(null);
      fetchBatches();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete batch');
    } finally { setDeleteLoading(false); }
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
                <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })} min="0" step="0.001"
                  className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition" />
              </div>

              {/* Sale Price */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Sale Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="number" value={form.salePrice} onChange={e => setForm({ ...form, salePrice: parseFloat(e.target.value) || 0 })} min="0" step="0.001"
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
                      {['#', 'Item Name', 'Batch No.', 'Stock', 'Sale Price', 'MRP', 'Mfg Date', 'Expiry Date', 'Added On', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map((b, i) => {
                      const isExpired = b.expiryDate && new Date(b.expiryDate) < new Date();
                      return (
                        <tr key={b._id} className="hover:bg-blue-50/50 transition-colors group">
                          <td className="px-5 py-3 text-slate-400 text-xs">{i + 1}</td>
                          <td className="px-5 py-3 text-slate-900 font-medium">{b.productId?.name || '—'}</td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                              {b.batchNo}
                            </span>
                          </td>
                          <td className={`px-5 py-3 font-semibold ${b.currentStock <= 0 ? 'text-red-500' : 'text-slate-900'}`}>
                            {parseFloat((b.currentStock || 0).toFixed(2))} {b.productId?.unit || ''}
                          </td>
                          <td className="px-5 py-3 text-slate-700">₹{(b.salePrice || 0).toFixed(2)}</td>
                          <td className="px-5 py-3 text-slate-700">₹{(b.mrp || 0).toFixed(2)}</td>
                          <td className="px-5 py-3 text-slate-600 text-xs">
                            {b.manufacturingDate ? new Date(b.manufacturingDate).toLocaleDateString('en-IN') : '—'}
                          </td>
                          <td className="px-5 py-3 text-xs">
                            {b.expiryDate ? (
                              <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-slate-600'}`}>
                                {new Date(b.expiryDate).toLocaleDateString('en-IN')}
                                {isExpired && <span className="ml-1 px-1 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">Expired</span>}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-5 py-3 text-slate-500 text-xs">
                            {new Date(b.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(b)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition text-xs font-semibold"
                                title="Edit batch details"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => { setDeletingBatch(b); setShowDeleteConfirm(true); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 transition text-xs font-semibold"
                                title="Delete batch"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* ─── EDIT BATCH MODAL ──────────────────────────────────────── */}
      {showEditModal && editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Batch</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{editingBatch.productId?.name || 'Unknown Product'}</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-xl hover:bg-blue-100 text-slate-500 hover:text-slate-900 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Bar */}
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 flex items-center gap-4">
              <span>Current Stock: <strong className="text-slate-800">{parseFloat((editingBatch.currentStock || 0).toFixed(2))} {editingBatch.productId?.unit || ''}</strong></span>
              <span className="text-amber-600 font-medium">⚠ To adjust stock quantity, use the Stock Levels → Adjust feature</span>
            </div>

            {/* Fields */}
            <div className="p-6 space-y-4">

              {/* Batch No */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Batch No.</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={editForm.batchNo}
                    onChange={e => setEditForm({ ...editForm, batchNo: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition font-mono"
                    placeholder="Batch Number"
                  />
                </div>
              </div>

              {/* Sale Price + MRP */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Sale Price - 1 (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                    <input
                      type="number"
                      value={editForm.salePrice === 0 ? '' : editForm.salePrice}
                      onChange={e => setEditForm({ ...editForm, salePrice: parseFloat(e.target.value) || 0 })}
                      min="0" step="0.01"
                      className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">MRP (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                    <input
                      type="number"
                      value={editForm.mrp === 0 ? '' : editForm.mrp}
                      onChange={e => setEditForm({ ...editForm, mrp: parseFloat(e.target.value) || 0 })}
                      min="0" step="0.01"
                      className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Extra Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Sale Price - 2 (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                    <input
                      type="number"
                      value={editForm.salePrice2 === 0 ? '' : editForm.salePrice2}
                      onChange={e => setEditForm({ ...editForm, salePrice2: parseFloat(e.target.value) || 0 })}
                      min="0" step="0.01"
                      className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Sale Price - 3 (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                    <input
                      type="number"
                      value={editForm.salePrice3 === 0 ? '' : editForm.salePrice3}
                      onChange={e => setEditForm({ ...editForm, salePrice3: parseFloat(e.target.value) || 0 })}
                      min="0" step="0.01"
                      className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              
              {/* Box and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Box</label>
                  <input
                    type="text"
                    value={editForm.box}
                    onChange={e => setEditForm({ ...editForm, box: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition"
                    placeholder="e.g. Box A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Location/Godown</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition"
                    placeholder="e.g. Rack 12"
                  />
                </div>
              </div>

              {/* Mfg Date + Expiry Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Mfg Date
                  </label>
                  <input
                    type="date"
                    value={editForm.manufacturingDate}
                    onChange={e => setEditForm({ ...editForm, manufacturingDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Expiry Date
                  </label>
                  <input
                    type="date"
                    value={editForm.expiryDate}
                    onChange={e => setEditForm({ ...editForm, expiryDate: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-lg bg-slate-50 border text-sm transition focus:outline-none focus:ring-1 focus:ring-blue-200 ${
                      editForm.expiryDate && new Date(editForm.expiryDate) < new Date()
                        ? 'border-red-300 text-red-700 focus:border-red-400'
                        : 'border-slate-200 text-slate-900 focus:border-blue-400'
                    }`}
                  />
                  {editForm.expiryDate && new Date(editForm.expiryDate) < new Date() && (
                    <p className="text-red-500 text-[11px] mt-1">⚠ This date is in the past (expired)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white font-medium text-sm transition">
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-blue-200"
              >
                {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ──────────────────────────────────────── */}
      {showDeleteConfirm && deletingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-red-50 to-rose-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Delete Batch</h3>
              </div>
              <button onClick={() => { setShowDeleteConfirm(false); setDeletingBatch(null); }} className="p-2 rounded-xl hover:bg-red-100 text-slate-500 hover:text-slate-900 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  This will permanently delete batch <strong className="font-semibold">{deletingBatch.batchNo}</strong> and reduce the product stock by <strong>{parseFloat((deletingBatch.currentStock || 0).toFixed(2))} {deletingBatch.productId?.unit || ''}</strong>.
                </p>
              </div>
              <p className="text-sm text-slate-600">
                Product: <span className="font-medium text-slate-900">{deletingBatch.productId?.name || '—'}</span>
              </p>
              <p className="text-xs text-slate-400">This action cannot be undone.</p>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletingBatch(null); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white font-medium text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-red-200"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Batch
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
