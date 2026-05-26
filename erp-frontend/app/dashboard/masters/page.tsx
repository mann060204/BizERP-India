'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../components/layout/Topbar';
import { productsApi } from '../../../lib/erp-api';
import { Plus, Search, Package, Edit2, Trash2, X, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  _id: string; name: string; printName?: string; group?: string; brand?: string;
  type: string; sku?: string; hsnCode?: string; unit: string; secondaryUnit?: string;
  sellingPrice: number; purchasePrice: number; minSalePrice?: number; mrp?: number;
  gstRate: number; cessRate?: number; igstRate?: number; saleDiscount?: number;
  currentStock: number; reorderLevel: number; openingStock: number; openingStockValue?: number;
  lowLevelLimit?: number; location?: string; batchNo?: string; description?: string;
  productType?: string; category?: string;
  printDescription?: boolean; printBatchNo?: boolean; oneClickSale?: boolean;
  enableTracking?: boolean; printExpiryDate?: boolean; notForSale?: boolean;
}

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['Nos', 'Kg', 'Gm', 'L', 'Ml', 'Box', 'Pcs', 'Mtr', 'Cm', 'Sqft', 'Hours', 'Job', 'Dozen', 'Set'];
const PRODUCT_TYPES = ['General', 'Medicine', 'Electronics', 'Clothing', 'Food', 'Beverage', 'Cosmetic', 'Furniture'];

const emptyForm = {
  name: '', printName: '', group: '', brand: '', type: 'product', sku: '', hsnCode: '',
  category: '', unit: 'Nos', secondaryUnit: '',
  purchasePrice: 0, sellingPrice: 0, minSalePrice: 0, mrp: 0,
  openingStock: 0, openingStockValue: 0, reorderLevel: 5, lowLevelLimit: 0,
  gstRate: 18, cessRate: 0, igstRate: 0, saleDiscount: 0,
  location: '', batchNo: '', description: '', productType: 'General',
  printDescription: false, printBatchNo: false, oneClickSale: false,
  enableTracking: false, printExpiryDate: false, notForSale: false,
};

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
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name || '', printName: p.printName || '', group: p.group || '', brand: p.brand || '',
      type: p.type || 'product', sku: p.sku || '', hsnCode: p.hsnCode || '',
      category: p.category || '', unit: p.unit || 'Nos', secondaryUnit: p.secondaryUnit || '',
      purchasePrice: p.purchasePrice || 0, sellingPrice: p.sellingPrice || 0,
      minSalePrice: p.minSalePrice || 0, mrp: p.mrp || 0,
      openingStock: p.openingStock || 0, openingStockValue: p.openingStockValue || 0,
      reorderLevel: p.reorderLevel || 5, lowLevelLimit: p.lowLevelLimit || 0,
      gstRate: p.gstRate || 18, cessRate: p.cessRate || 0, igstRate: p.igstRate || 0,
      saleDiscount: p.saleDiscount || 0, location: p.location || '', batchNo: p.batchNo || '',
      description: p.description || '', productType: p.productType || 'General',
      printDescription: p.printDescription || false, printBatchNo: p.printBatchNo || false,
      oneClickSale: p.oneClickSale || false, enableTracking: p.enableTracking || false,
      printExpiryDate: p.printExpiryDate || false, notForSale: p.notForSale || false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Item name is required'); return; }
    if (!form.sellingPrice || form.sellingPrice <= 0) { toast.error('Sale Price must be greater than 0'); return; }
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

  const inp = (key: string, type = 'text', placeholder = '') => (
    <input type={type} value={form[key] === 0 && type === 'number' ? '' : form[key]}
      placeholder={placeholder}
      onChange={e => setForm({ ...form, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
      className="w-full px-2 py-1 border border-[#c8ccd0] bg-white text-gray-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 rounded-sm" />
  );

  const sel = (key: string, options: string[]) => (
    <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
      className="w-full px-2 py-1 border border-[#c8ccd0] bg-white text-gray-800 text-xs focus:outline-none focus:border-blue-500 rounded-sm">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const chk = (key: string, label: string, danger = false) => (
    <label className={`flex items-center gap-1.5 text-xs cursor-pointer ${danger ? 'text-red-500' : 'text-gray-700'}`}>
      <input type="checkbox" checked={form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })}
        className="accent-blue-600 w-3.5 h-3.5" />
      {label}
    </label>
  );

  const priceInp = (key: string, placeholder = '') => (
    <div className="flex">
      <span className="px-2 py-1 bg-blue-600 text-white text-xs border border-blue-600 flex items-center font-semibold">₹</span>
      <input type="number" value={form[key] === 0 ? '' : form[key]} placeholder={placeholder}
        onChange={e => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
        className="flex-1 px-2 py-1 border border-[#c8ccd0] border-l-0 bg-white text-gray-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 min-w-0" />
    </div>
  );

  const pctInp = (key: string) => (
    <div className="flex">
      <input type="number" value={form[key] === 0 ? '' : form[key]}
        onChange={e => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
        className="flex-1 px-2 py-1 border border-[#c8ccd0] border-r-0 bg-white text-gray-800 text-xs focus:outline-none focus:border-blue-500 min-w-0" />
      <span className="px-2 py-1 bg-blue-600 text-white text-xs border border-blue-600 flex items-center font-semibold">%</span>
    </div>
  );

  const lbl = (text: string, required = false) => (
    <span className="text-xs text-gray-700 whitespace-nowrap">{text}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
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
                    {['Item Name', 'Group/Brand', 'Unit', 'Purchase', 'Sale Price', 'MRP', 'GST%', 'Stock', 'Actions'].map(h => (
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
                            {p.printName && <p className="text-[#475569] text-xs">{p.printName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#94a3b8] text-xs">
                        {p.group && <div>{p.group}</div>}
                        {p.brand && <div className="text-[#64748b]">{p.brand}</div>}
                        {!p.group && !p.brand && '—'}
                      </td>
                      <td className="px-5 py-4 text-[#94a3b8]">{p.unit}{p.secondaryUnit ? ` / ${p.secondaryUnit}` : ''}</td>
                      <td className="px-5 py-4 text-[#94a3b8]">₹{p.purchasePrice.toFixed(2)}</td>
                      <td className="px-5 py-4 text-white font-semibold">₹{p.sellingPrice.toFixed(2)}</td>
                      <td className="px-5 py-4 text-[#94a3b8]">{p.mrp ? `₹${p.mrp.toFixed(2)}` : '—'}</td>
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

      {/* Add / Edit Modal — matches the exact layout from the reference image */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#f0f0f0] border border-[#b0b8c1] rounded w-full max-w-3xl shadow-2xl flex flex-col" style={{ maxHeight: '95vh' }}>
            
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#1a5fa8] rounded-t select-none">
              <span className="text-white font-semibold text-sm">{editing ? 'Edit Product' : 'Add New Product'}</span>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-200 transition p-0.5 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 gap-3">

                {/* ── LEFT COLUMN ── */}
                <div className="space-y-3">

                  {/* Product Details */}
                  <fieldset className="border border-[#b0b8c1] bg-white rounded p-2 pt-3 relative">
                    <legend className="text-xs font-semibold text-gray-700 px-1 absolute -top-2.5 left-2 bg-white">Product Details</legend>
                    <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1.5 items-center">
                      {lbl('Group', true)} 
                      <div className="flex gap-1">
                        {sel('group', ['', 'Electronics', 'Clothing', 'Food', 'Beverages', 'Medicine', 'Cosmetics', 'Furniture', 'Tools', 'Stationery', 'Other'])}
                      </div>
                      {lbl('Brand', true)}
                      {sel('brand', ['', 'Generic', 'Local', 'Imported', 'Premium'])}
                      {lbl('Item Code')}
                      {inp('sku', 'text', '')}
                      {lbl('Product Name', true)}
                      {inp('name', 'text', '')}
                      {lbl('Print Name')}
                      {inp('printName', 'text', '')}
                    </div>
                  </fieldset>

                  {/* Price Details */}
                  <fieldset className="border border-[#b0b8c1] bg-white rounded p-2 pt-3 relative">
                    <legend className="text-xs font-semibold text-gray-700 px-1 absolute -top-2.5 left-2 bg-white">Price Details</legend>
                    <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1.5 items-center">
                      {lbl('Purchase Price', true)}
                      <div className="flex items-center gap-1">
                        {priceInp('purchasePrice')}
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">Excluding Tax</span>
                      </div>
                      {lbl('Sale Price', true)}
                      <div className="flex items-center gap-1">
                        {priceInp('sellingPrice')}
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">Excluding Tax</span>
                      </div>
                      {lbl('Min. Sale Price')}
                      {priceInp('minSalePrice')}
                      {lbl('M.R.P.')}
                      {priceInp('mrp')}
                    </div>
                  </fieldset>

                  {/* Stock and Unit Details */}
                  <fieldset className="border border-[#b0b8c1] bg-white rounded p-2 pt-3 relative">
                    <legend className="text-xs font-semibold text-gray-700 px-1 absolute -top-2.5 left-2 bg-white">Stock and Unit Details</legend>
                    <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1.5 items-center">
                      {lbl('Unit', true)}
                      <div className="flex gap-1">
                        <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                          className="flex-1 px-2 py-1 border border-[#c8ccd0] bg-white text-gray-800 text-xs focus:outline-none focus:border-blue-500 rounded-sm">
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                        <select value={form.secondaryUnit} onChange={e => setForm({ ...form, secondaryUnit: e.target.value })}
                          className="w-28 px-2 py-1 border border-[#c8ccd0] bg-white text-gray-800 text-xs focus:outline-none focus:border-blue-500 rounded-sm">
                          <option value="">Secondary Unit</option>
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                      {lbl('Opening Stock')}
                      {inp('openingStock', 'number')}
                      {lbl('Opening Stock Value')}
                      {priceInp('openingStockValue')}
                    </div>
                  </fieldset>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="space-y-3">

                  {/* GST Details */}
                  <fieldset className="border border-[#b0b8c1] bg-white rounded p-2 pt-3 relative">
                    <legend className="text-xs font-semibold text-gray-700 px-1 absolute -top-2.5 left-2 bg-white">GST Details</legend>
                    <div className="grid grid-cols-[90px_1fr] gap-x-2 gap-y-1.5 items-center">
                      {lbl('HSN / SAC Code')}
                      {inp('hsnCode', 'text')}
                      {lbl('GST Rates', true)}
                      <div className="grid grid-cols-2 gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs px-1.5 py-1 bg-blue-600 text-white font-semibold rounded-sm">CGST</span>
                          {pctInp('gstRate')}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs px-1.5 py-1 bg-blue-600 text-white font-semibold rounded-sm">Cess</span>
                          {pctInp('cessRate')}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs px-1.5 py-1 bg-blue-600 text-white font-semibold rounded-sm">SGST</span>
                          {pctInp('gstRate')}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs px-1.5 py-1 bg-blue-600 text-white font-semibold rounded-sm">IGST</span>
                          {pctInp('igstRate')}
                        </div>
                      </div>
                    </div>
                  </fieldset>

                  {/* Other Details */}
                  <fieldset className="border border-[#b0b8c1] bg-white rounded p-2 pt-3 relative">
                    <legend className="text-xs font-semibold text-gray-700 px-1 absolute -top-2.5 left-2 bg-white">Other Details</legend>
                    <div className="grid grid-cols-[90px_1fr] gap-x-2 gap-y-1.5 items-center">
                      {lbl('Sale Discount')}
                      {pctInp('saleDiscount')}
                      {lbl('Low Level Limit')}
                      {inp('lowLevelLimit', 'number')}
                      {lbl('Product Type')}
                      {sel('productType', PRODUCT_TYPES)}
                      {lbl('Location/Rack')}
                      {inp('location', 'text')}
                      {lbl('Batch No.')}
                      {inp('batchNo', 'text')}
                    </div>
                  </fieldset>

                  {/* Product Description */}
                  <fieldset className="border border-[#b0b8c1] bg-white rounded p-2 pt-3 relative">
                    <legend className="text-xs font-semibold text-gray-700 px-1 absolute -top-2.5 left-2 bg-white">Product Description</legend>
                    <div className="relative">
                      <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                        maxLength={250} rows={4}
                        className="w-full px-2 py-1 border border-[#c8ccd0] bg-white text-gray-800 text-xs focus:outline-none focus:border-blue-500 resize-none rounded-sm" />
                      <span className="absolute bottom-1 right-2 text-[10px] text-gray-400">{250 - (form.description?.length || 0)}</span>
                    </div>
                  </fieldset>

                  {/* Product Settings */}
                  <fieldset className="border border-[#b0b8c1] bg-white rounded p-2 pt-3 relative">
                    <legend className="text-xs font-semibold text-gray-700 px-1 absolute -top-2.5 left-2 bg-white">Product Settings</legend>
                    <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                      {chk('printDescription', 'Print Description')}
                      {chk('oneClickSale', 'One Click Sale')}
                      {chk('enableTracking', 'Enable Tracking')}
                      {chk('printBatchNo', 'Print Batch No')}
                      {chk('printExpiryDate', 'Print Expiry Date')}
                      {chk('notForSale', 'Not For Sale', true)}
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-[#b0b8c1] bg-[#e8edf2]">
              <button onClick={() => setShowModal(false)} className="px-4 py-1.5 text-xs border border-[#b0b8c1] bg-white text-gray-700 hover:bg-gray-50 rounded transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition disabled:opacity-60">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
