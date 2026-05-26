'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../components/layout/Topbar';
import { productsApi } from '../../../lib/erp-api';
import { Plus, Search, Package, Edit2, Trash2, X, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  _id: string; name: string; printName?: string; group?: string; brand?: string;
  type: string; sku?: string; hsnCode?: string; unit: string; secondaryUnit?: string;
  sellingPrice: number; sellingPrice2?: number; sellingPrice3?: number;
  purchasePrice: number; minSalePrice?: number; mrp?: number; conversionRate?: number;
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
const POPULAR_GROUPS = ['Electronics', 'Clothing', 'Food', 'Beverages', 'Medicine', 'Cosmetics', 'Furniture', 'Tools', 'Stationery', 'Other'];
const POPULAR_BRANDS = ['Generic', 'Local', 'Imported', 'Premium'];

const emptyForm = {
  name: '', printName: '', group: '', brand: '', type: 'product', sku: '', hsnCode: '',
  category: '', unit: 'Nos', secondaryUnit: '', conversionRate: 1,
  purchasePrice: 0, sellingPrice: 0, sellingPrice2: 0, sellingPrice3: 0, minSalePrice: 0, mrp: 0,
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
      conversionRate: p.conversionRate || 1,
      purchasePrice: p.purchasePrice || 0, sellingPrice: p.sellingPrice || 0,
      sellingPrice2: p.sellingPrice2 || 0, sellingPrice3: p.sellingPrice3 || 0,
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
    if (!form.sellingPrice || form.sellingPrice <= 0) { toast.error('Sale Price 1 must be greater than 0'); return; }
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

  // Reusable styling components for the dark theme
  const Input = ({ label, required = false, type = 'text', keyName, placeholder = '', list }: any) => (
    <div>
      <label className="block text-[11px] font-medium text-[#94a3b8] mb-1 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
      <input type={type} list={list}
        value={form[keyName] === 0 && type === 'number' ? '' : form[keyName]}
        onChange={e => setForm({ ...form, [keyName]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
    </div>
  );

  const Select = ({ label, required = false, keyName, options }: any) => (
    <div>
      <label className="block text-[11px] font-medium text-[#94a3b8] mb-1 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
      <select value={form[keyName]} onChange={e => setForm({ ...form, [keyName]: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition appearance-none">
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const Checkbox = ({ label, keyName, danger = false }: any) => (
    <label className={`flex items-center gap-2 text-sm cursor-pointer ${danger ? 'text-red-400 font-medium' : 'text-white'}`}>
      <input type="checkbox" checked={form[keyName]} onChange={e => setForm({ ...form, [keyName]: e.target.checked })}
        className="w-4 h-4 rounded border-[#1A1A1A] bg-[#111111] text-blue-500 focus:ring-blue-500 focus:ring-offset-black" />
      {label}
    </label>
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
                    {['Item Name', 'Group/Brand', 'Unit', 'Purchase', 'Sale Price 1', 'MRP', 'GST%', 'Stock', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-[#94a3b8] font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-[#111111] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${p.type === 'service' ? 'bg-violet-500/20 text-violet-300' : 'bg-blue-500/20 text-blue-300'}`}>
                            {p.type === 'service' ? 'S' : 'P'}
                          </div>
                          <div>
                            <p className="text-white font-medium">{p.name}</p>
                            {p.sku && <p className="text-[#475569] text-xs font-mono">{p.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#94a3b8] text-xs">
                        {p.group && <div className="text-white">{p.group}</div>}
                        {p.brand && <div>{p.brand}</div>}
                        {!p.group && !p.brand && '—'}
                      </td>
                      <td className="px-5 py-4 text-[#94a3b8]">
                        <span className="text-white">{p.unit}</span>
                        {p.secondaryUnit && <div className="text-xs">1 = {p.conversionRate} {p.secondaryUnit}</div>}
                      </td>
                      <td className="px-5 py-4 text-[#94a3b8]">₹{p.purchasePrice.toFixed(2)}</td>
                      <td className="px-5 py-4 text-white font-semibold">₹{p.sellingPrice.toFixed(2)}</td>
                      <td className="px-5 py-4 text-[#94a3b8]">{p.mrp ? `₹${p.mrp.toFixed(2)}` : '—'}</td>
                      <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">{p.gstRate}%</span></td>
                      <td className="px-5 py-4">
                        {p.type === 'product' ? (
                          <span className={p.currentStock <= p.reorderLevel ? 'text-red-400 font-medium' : 'text-emerald-400'}>
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

      {/* Datalists for Combobox behavior */}
      <datalist id="group-list">
        {POPULAR_GROUPS.map(g => <option key={g} value={g} />)}
      </datalist>
      <datalist id="brand-list">
        {POPULAR_BRANDS.map(b => <option key={b} value={b} />)}
      </datalist>

      {/* New Modern Dark Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#050505] border border-[#1A1A1A] rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-6 border-b border-[#1A1A1A]">
              <div>
                <h3 className="text-white font-bold text-xl">{editing ? 'Edit Item' : 'Add New Item'}</h3>
                <p className="text-sm text-[#94a3b8] mt-1">Fill in the product details below</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-[#111111] text-[#94a3b8] hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left Column */}
                <div className="space-y-6">
                  {/* Basic Details */}
                  <div className="glass rounded-xl p-5 border border-[#1A1A1A] space-y-4">
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Package className="w-4 h-4 text-blue-400" /> Basic Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Product Name" keyName="name" required />
                      <Input label="Print Name" keyName="printName" />
                      <Input label="Group" keyName="group" list="group-list" placeholder="Select or type..." />
                      <Input label="Brand" keyName="brand" list="brand-list" placeholder="Select or type..." />
                      <Input label="Item Code / SKU" keyName="sku" />
                      <Select label="Type" keyName="type" options={['product', 'service']} />
                    </div>
                  </div>

                  {/* Pricing Details */}
                  <div className="glass rounded-xl p-5 border border-[#1A1A1A] space-y-4">
                    <h4 className="text-sm font-semibold text-white mb-2 text-blue-400">Pricing</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Purchase Price (₹)" type="number" keyName="purchasePrice" />
                      <Input label="MRP (₹)" type="number" keyName="mrp" />
                      <Input label="Sale Price 1 (₹)" type="number" keyName="sellingPrice" required />
                      <Input label="Sale Price 2 (₹)" type="number" keyName="sellingPrice2" />
                      <Input label="Sale Price 3 (₹)" type="number" keyName="sellingPrice3" />
                      <Input label="Min Sale Price (₹)" type="number" keyName="minSalePrice" />
                      <Input label="Sale Discount (%)" type="number" keyName="saleDiscount" />
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="glass rounded-xl p-5 border border-[#1A1A1A] space-y-3">
                    <h4 className="text-sm font-semibold text-white mb-2 text-blue-400">Settings</h4>
                    <div className="grid grid-cols-2 gap-y-3">
                      <Checkbox label="Print Description" keyName="printDescription" />
                      <Checkbox label="One Click Sale" keyName="oneClickSale" />
                      <Checkbox label="Enable Tracking" keyName="enableTracking" />
                      <Checkbox label="Print Batch No" keyName="printBatchNo" />
                      <Checkbox label="Print Expiry Date" keyName="printExpiryDate" />
                      <Checkbox label="Not For Sale" keyName="notForSale" danger />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Stock & Units */}
                  <div className="glass rounded-xl p-5 border border-[#1A1A1A] space-y-4">
                    <h4 className="text-sm font-semibold text-white mb-2 text-blue-400">Stock & Units</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Select label="Primary Unit" keyName="unit" options={UNITS} required />
                      <Select label="Secondary Unit" keyName="secondaryUnit" options={['', ...UNITS]} />
                      
                      {form.secondaryUnit && form.secondaryUnit !== form.unit && (
                        <div className="col-span-2 p-3 bg-[#111111] border border-[#1e3a8a]/30 rounded-lg flex items-center justify-between">
                          <span className="text-sm text-[#94a3b8]">1 {form.unit} equals to:</span>
                          <div className="flex items-center gap-2">
                            <input type="number" value={form.conversionRate || 1} onChange={e => setForm({...form, conversionRate: parseFloat(e.target.value) || 1})} 
                              className="w-20 px-2 py-1.5 rounded-md bg-black border border-[#1A1A1A] text-white text-center text-sm focus:border-[#D4D4D4] outline-none" />
                            <span className="text-sm text-white font-medium">{form.secondaryUnit}</span>
                          </div>
                        </div>
                      )}

                      {form.type === 'product' && (
                        <>
                          <Input label="Opening Stock" type="number" keyName="openingStock" />
                          <Input label="Opening Stock Value (₹)" type="number" keyName="openingStockValue" />
                          <Input label="Reorder Level" type="number" keyName="reorderLevel" />
                          <Input label="Low Level Limit" type="number" keyName="lowLevelLimit" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* GST & Tax */}
                  <div className="glass rounded-xl p-5 border border-[#1A1A1A] space-y-4">
                    <h4 className="text-sm font-semibold text-white mb-2 text-blue-400">Tax Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="HSN / SAC Code" keyName="hsnCode" />
                      <Select label="Total GST Rate (%)" keyName="gstRate" options={GST_RATES} />
                      <Input label="CESS Rate (%)" type="number" keyName="cessRate" />
                      <Input label="IGST Rate (%)" type="number" keyName="igstRate" />
                    </div>
                  </div>

                  {/* Other Details */}
                  <div className="glass rounded-xl p-5 border border-[#1A1A1A] space-y-4">
                    <h4 className="text-sm font-semibold text-white mb-2 text-blue-400">Other Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Location / Rack" keyName="location" />
                      <Input label="Batch No." keyName="batchNo" />
                      <div className="col-span-2">
                        <label className="block text-[11px] font-medium text-[#94a3b8] mb-1 uppercase tracking-wider">Description</label>
                        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
                          className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition resize-none" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-[#1A1A1A] bg-[#050505] rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-[#1A1A1A] text-[#94a3b8] hover:text-white hover:border-[#D4D4D4] font-medium text-sm transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editing ? 'Save Changes' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
