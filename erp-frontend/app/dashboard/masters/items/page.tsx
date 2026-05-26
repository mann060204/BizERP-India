'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Topbar from '../../../../components/layout/Topbar';
import { productsApi, businessApi } from '../../../../lib/erp-api';
import { Plus, Search, Package, Edit2, Trash2, X, Loader2, Save, Tag, DollarSign, Layers, FileText, Settings } from 'lucide-react';
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

// Reusable styling components defined OUTSIDE to prevent focus loss
const Input = ({ label, required = false, type = 'text', keyName, form, setForm, placeholder = '' }: any) => (
  <div>
    <label className="block text-[11px] font-medium text-[#94a3b8] mb-1 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
    <input type={type}
      value={form[keyName] === 0 && type === 'number' ? '' : form[keyName]}
      onChange={e => setForm({ ...form, [keyName]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
  </div>
);

const Select = ({ label, required = false, keyName, form, setForm, options }: any) => (
  <div>
    <label className="block text-[11px] font-medium text-[#94a3b8] mb-1 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
    <select value={form[keyName]} onChange={e => setForm({ ...form, [keyName]: e.target.value })}
      className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition appearance-none">
      {options.map((o: string) => <option key={o} value={o}>{o || 'Select...'}</option>)}
    </select>
  </div>
);

const Checkbox = ({ label, keyName, form, setForm, danger = false }: any) => (
  <label className={`flex items-center gap-2 text-sm cursor-pointer ${danger ? 'text-red-400 font-medium' : 'text-white'}`}>
    <input type="checkbox" checked={form[keyName]} onChange={e => setForm({ ...form, [keyName]: e.target.checked })}
      className="w-4 h-4 rounded border-[#1A1A1A] bg-[#111111] text-blue-500 focus:ring-blue-500 focus:ring-offset-black" />
    {label}
  </label>
);

export default function MastersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);

  const [productGroups, setProductGroups] = useState<string[]>([]);
  const [productBrands, setProductBrands] = useState<string[]>([]);
  const [productCategories, setProductCategories] = useState<{name: string, brands: string[]}[]>([]);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await businessApi.getProfile();
      setProductGroups(data.business?.productGroups || []);
      setProductBrands(data.business?.productBrands || []);
      setProductCategories(data.business?.productCategories || []);
    } catch (e) {
      console.error('Failed to load business settings', e);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await productsApi.list({ search, type: typeFilter || undefined, limit: 100 });
      setProducts(data.products);
    } catch { toast.error('Failed to load items'); }
    finally { setLoading(false); }
  }, [search, typeFilter]);

  useEffect(() => { 
    fetchSettings();
    fetchProducts(); 
  }, [fetchProducts, fetchSettings]);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add-product') {
      setEditing(null); setForm({ ...emptyForm, type: 'product' }); setActiveTab('basic'); setShowModal(true);
    } else if (action === 'add-service') {
      setEditing(null); setForm({ ...emptyForm, type: 'service' }); setActiveTab('basic'); setShowModal(true);
    }
  }, [searchParams]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setActiveTab('basic'); setShowModal(true); };
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
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Item name is required'); setActiveTab('basic'); return; }
    if (!form.sellingPrice || form.sellingPrice <= 0) { toast.error('Sale Price 1 must be greater than 0'); setActiveTab('pricing'); return; }
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

  const tabs = [
    { id: 'basic', label: 'Basic Details', icon: Tag },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'stock', label: 'Stock & Units', icon: Layers },
    { id: 'tax', label: 'Tax & Other', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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

      {/* New Modern Dark Modal - Tabbed */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#050505] border border-[#1A1A1A] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col h-[600px]">
            
            <div className="flex items-center justify-between p-6 border-b border-[#1A1A1A] shrink-0">
              <div>
                <h3 className="text-white font-bold text-xl">{editing ? 'Edit Item' : 'Add New Item'}</h3>
                <p className="text-sm text-[#94a3b8] mt-1">Fill in the product details below</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-[#111111] text-[#94a3b8] hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-48 border-r border-[#1A1A1A] p-4 space-y-1 overflow-y-auto bg-[#0A0A0A]">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-white text-black' : 'text-[#94a3b8] hover:bg-[#111111] hover:text-white'}`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white mb-2 border-b border-[#1A1A1A] pb-2">Basic Details</h4>
                    <Input label="Product Name" keyName="name" required form={form} setForm={setForm} />
                    <Input label="Print Name (Optional)" keyName="printName" form={form} setForm={setForm} />
                    <div className="grid grid-cols-2 gap-4">
                      {(() => {
                        const availableGroups = productCategories.length > 0 ? productCategories.map(c => c.name) : productGroups;
                        const currentCat = productCategories.find(c => c.name === form.group);
                        const availableBrands = currentCat ? currentCat.brands : (productCategories.length > 0 && form.group ? [] : productBrands);
                        
                        return (
                          <>
                            <Select label="Group" keyName="group" options={['', ...availableGroups]} form={form} setForm={(newForm: any) => {
                               // Reset brand if group changes to avoid invalid brand selection
                               if (newForm.group !== form.group) newForm.brand = '';
                               setForm(newForm);
                            }} />
                            <Select label="Brand" keyName="brand" options={['', ...availableBrands]} form={form} setForm={setForm} />
                          </>
                        );
                      })()}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Item Code / SKU" keyName="sku" form={form} setForm={setForm} />
                      <Select label="Type" keyName="type" options={['product', 'service']} form={form} setForm={setForm} />
                    </div>
                  </div>
                )}

                {activeTab === 'pricing' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white mb-2 border-b border-[#1A1A1A] pb-2">Pricing</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Purchase Price (₹)" type="number" keyName="purchasePrice" form={form} setForm={setForm} />
                      <Input label="MRP (₹)" type="number" keyName="mrp" form={form} setForm={setForm} />
                      <Input label="Sale Price 1 (Retail) (₹)" type="number" keyName="sellingPrice" required form={form} setForm={setForm} />
                      <Input label="Sale Price 2 (Wholesale) (₹)" type="number" keyName="sellingPrice2" form={form} setForm={setForm} />
                      <Input label="Sale Price 3 (₹)" type="number" keyName="sellingPrice3" form={form} setForm={setForm} />
                      <Input label="Min Sale Price (₹)" type="number" keyName="minSalePrice" form={form} setForm={setForm} />
                      <div className="col-span-2">
                        <Input label="Sale Discount (%)" type="number" keyName="saleDiscount" form={form} setForm={setForm} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'stock' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white mb-2 border-b border-[#1A1A1A] pb-2">Stock & Units</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Select label="Primary Unit" keyName="unit" options={UNITS} required form={form} setForm={setForm} />
                      <Select label="Secondary Unit" keyName="secondaryUnit" options={['', ...UNITS]} form={form} setForm={setForm} />
                      
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
                          <Input label="Opening Stock" type="number" keyName="openingStock" form={form} setForm={setForm} />
                          <Input label="Opening Stock Value (₹)" type="number" keyName="openingStockValue" form={form} setForm={setForm} />
                          <Input label="Reorder Level" type="number" keyName="reorderLevel" form={form} setForm={setForm} />
                          <Input label="Low Level Limit" type="number" keyName="lowLevelLimit" form={form} setForm={setForm} />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'tax' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white mb-2 border-b border-[#1A1A1A] pb-2">Tax & Location</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="HSN / SAC Code" keyName="hsnCode" form={form} setForm={setForm} />
                      <Select label="Total GST Rate (%)" keyName="gstRate" options={GST_RATES} form={form} setForm={setForm} />
                      <Input label="CESS Rate (%)" type="number" keyName="cessRate" form={form} setForm={setForm} />
                      <Input label="IGST Rate (%)" type="number" keyName="igstRate" form={form} setForm={setForm} />
                      <Input label="Location / Rack" keyName="location" form={form} setForm={setForm} />
                      <Input label="Batch No." keyName="batchNo" form={form} setForm={setForm} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#94a3b8] mb-1 uppercase tracking-wider">Description</label>
                      <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition resize-none" />
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white mb-2 border-b border-[#1A1A1A] pb-2">Item Settings</h4>
                    <div className="grid grid-cols-1 gap-y-4 bg-[#111111] border border-[#1A1A1A] rounded-xl p-5">
                      <Checkbox label="Print Description on Invoice" keyName="printDescription" form={form} setForm={setForm} />
                      <Checkbox label="One Click Sale (POS)" keyName="oneClickSale" form={form} setForm={setForm} />
                      <Checkbox label="Enable Batch/Serial Tracking" keyName="enableTracking" form={form} setForm={setForm} />
                      <Checkbox label="Print Batch No on Invoice" keyName="printBatchNo" form={form} setForm={setForm} />
                      <Checkbox label="Print Expiry Date on Invoice" keyName="printExpiryDate" form={form} setForm={setForm} />
                      <div className="pt-2 border-t border-[#1A1A1A]">
                        <Checkbox label="Not For Sale" keyName="notForSale" danger form={form} setForm={setForm} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-[#1A1A1A] bg-[#0A0A0A] shrink-0 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl border border-[#1A1A1A] text-[#94a3b8] hover:text-white hover:border-[#D4D4D4] font-medium text-sm transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2 shadow-lg shadow-white/10">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editing ? 'Save Changes' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
