'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Topbar from '../../../../components/layout/Topbar';
import { productsApi, businessApi } from '../../../../lib/erp-api';
import { Plus, Search, Package, Edit2, Trash2, X, Loader2, Save, Tag, DollarSign, Layers, FileText, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import CategoryMasterModal from '../../../../components/masters/CategoryMasterModal';

interface Product {
  _id: string; name: string; printName?: string; group?: string; brand?: string;
  type: string; sku?: string; hsnCode?: string; unit: string; secondaryUnit?: string;
  sellingPrice: number; sellingPrice2?: number; sellingPrice3?: number;
  purchasePrice: number; minSalePrice?: number; mrp?: number; conversionRate?: number;
  gstRate: number; cessRate?: number; igstRate?: number; saleDiscount?: number; saleDiscountType?: 'percentage' | 'amount';
  currentStock: number; reorderLevel: number; openingStock: number; openingStockValue?: number;
  lowLevelLimit?: number; location?: string; batchNo?: string; description?: string;
  productType?: string; category?: string;
  printDescription?: boolean; printBatchNo?: boolean; oneClickSale?: boolean;
  enableTracking?: boolean; printExpiryDate?: boolean; notForSale?: boolean;
}

const GST_RATES = [0, 5, 12, 18, 28];
const FALLBACK_UNITS = ['Nos', 'Bags', 'Bale', 'Bundles', 'Buckles', 'Billion of units', 'Box', 'Bottles', 'Bunches', 'Cans', 'Cubic meters', 'Cubic centimeters', 'Centimeters', 'Cartons', 'Dozens', 'Drums', 'Feet', 'Grams', 'Gross', 'Gallons', 'Hours', 'Job', 'Kilograms', 'Kilometers', 'Liters', 'Meters', 'Metric ton', 'Milligrams', 'Milliliters', 'Numbers', 'Packs', 'Pieces', 'Pairs', 'Quintals', 'Rolls', 'Sets', 'Square feet', 'Square meters', 'Tablets', 'Ten gross', 'Thousands', 'Tons', 'Tubes', 'US gallons', 'Yards'];

const emptyForm = {
  name: '', printName: '', group: '', brand: '', type: 'product', sku: '', hsnCode: '',
  category: '', unit: 'Nos', secondaryUnit: '', conversionRate: 1,
  purchasePrice: 0, sellingPrice: 0, sellingPrice2: 0, sellingPrice3: 0, minSalePrice: 0, mrp: 0,
  openingStock: 0, openingStockValue: 0, reorderLevel: 5, lowLevelLimit: 0,
  gstRate: 0, cessRate: 0, igstRate: 0, saleDiscount: 0, saleDiscountType: 'percentage',
  location: '', batchNo: '', description: '', productType: 'General',
  printDescription: false, printBatchNo: false, oneClickSale: false,
  enableTracking: false, printExpiryDate: false, notForSale: false,
  secSalePriceType: 'fixed', secSalePrice: 0, secMrp: 0, secMinSalePrice: 0, isDefaultSecondaryUnit: false,
};

// Reusable styling components defined OUTSIDE to prevent focus loss
const Input = ({ label, required = false, type = 'text', keyName, form, setForm, placeholder = '', onQuickAdd }: any) => (
  <div>
    <label className="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wider flex items-center justify-between">
      <span>{label} {required && <span className="text-red-500">*</span>}</span>
      {onQuickAdd && (
        <button type="button" onClick={onQuickAdd} className="text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 p-0.5 rounded transition">
          <Plus className="w-3 h-3" />
        </button>
      )}
    </label>
    <input type={type}
      value={form[keyName] === 0 && type === 'number' ? '' : form[keyName]}
      onChange={e => setForm({ ...form, [keyName]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg bg-[#F1F5F9] border border-slate-200 text-slate-900 placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
  </div>
);

const Select = ({ label, required = false, keyName, form, setForm, options, onQuickAdd }: any) => (
  <div>
    <label className="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wider flex items-center justify-between">
      <span>{label} {required && <span className="text-red-500">*</span>}</span>
      {onQuickAdd && (
        <button type="button" onClick={onQuickAdd} className="text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 p-0.5 rounded transition">
          <Plus className="w-3 h-3" />
        </button>
      )}
    </label>
    <select value={form[keyName]} onChange={e => setForm({ ...form, [keyName]: e.target.value })}
      className="w-full px-3 py-2 rounded-lg bg-[#F1F5F9] border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition appearance-none">
      {options.map((o: string) => <option key={o} value={o}>{o || 'Select...'}</option>)}
    </select>
  </div>
);

const Checkbox = ({ label, keyName, form, setForm, danger = false }: any) => (
  <label className={`flex items-center gap-2 text-sm cursor-pointer ${danger ? 'text-red-400 font-medium' : 'text-slate-900'}`}>
    <input type="checkbox" checked={form[keyName]} onChange={e => setForm({ ...form, [keyName]: e.target.checked })}
      className="w-4 h-4 rounded border-slate-200 bg-[#F1F5F9] text-action-500 focus:ring-action-400 focus:ring-offset-black" />
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
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [productGroups, setProductGroups] = useState<string[]>([]);
  const [productBrands, setProductBrands] = useState<string[]>([]);
  const [productCategories, setProductCategories] = useState<{name: string, brands: string[]}[]>([]);
  const [units, setUnits] = useState<string[]>(FALLBACK_UNITS);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await businessApi.getProfile();
      setProductGroups(data.business?.productGroups || []);
      setProductBrands(data.business?.productBrands || []);
      setProductCategories(data.business?.productCategories || []);
      const bizUnits = data.business?.units;
      if (bizUnits && bizUnits.length > 0) setUnits(bizUnits);
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
      setEditing(null); setForm({ ...emptyForm, type: 'product' }); setShowModal(true);
    } else if (action === 'add-service') {
      setEditing(null); setForm({ ...emptyForm, type: 'service' }); setShowModal(true);
    }
  }, [searchParams]);

  const openCreate = async () => { await fetchSettings(); setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = async (p: Product) => {
    await fetchSettings();
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
      saleDiscount: p.saleDiscount || 0, saleDiscountType: p.saleDiscountType || 'percentage',
      location: p.location || '', batchNo: p.batchNo || '',
      description: p.description || '', productType: p.productType || 'General',
      printDescription: p.printDescription || false, printBatchNo: p.printBatchNo || false,
      oneClickSale: p.oneClickSale || false, enableTracking: p.enableTracking || false,
      printExpiryDate: p.printExpiryDate || false, notForSale: p.notForSale || false,
      secSalePriceType: 'fixed', secSalePrice: 0, secMrp: 0, secMinSalePrice: 0, isDefaultSecondaryUnit: false,
    });
    setShowModal(true);
  };

  const handleAddGroup = async () => {
    setShowCategoryModal(true);
  };

  const handleAddBrand = async () => {
    setShowCategoryModal(true);
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



  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Items & Services" />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Items & Services</h2>
            <p className="text-slate-600 text-sm mt-0.5">{products.length} item{products.length !== 1 ? 's' : ''} in master</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-action-500 text-white hover:bg-action-600 font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-white/10/30">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] transition text-sm" />
          </div>
          {['', 'product', 'service'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${typeFilter === t ? 'bg-action-500 text-white hover:bg-action-600 border-transparent' : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:border-[#D4D4D4]'}`}>
              {t === '' ? 'All' : t === 'product' ? 'Products' : 'Services'}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-slate-700 animate-spin" /></div>
        ) : products.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Package className="w-14 h-14 text-[#1A1A1A] mx-auto mb-4" />
            <p className="text-slate-900 font-semibold text-lg">No items yet</p>
            <p className="text-slate-600 text-sm mt-1 mb-6">Add your products and services to start billing</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-action-500 text-white hover:bg-action-600 text-sm font-semibold hover:opacity-90 transition">Add Item</button>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    {['Item Name', 'Group/Brand', 'Unit', 'Purchase', 'Sale Price 1', 'MRP', 'GST%', 'Stock', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-slate-600 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-[#F1F5F9] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${p.type === 'service' ? 'bg-violet-500/20 text-violet-300' : 'bg-action-500/20 text-blue-300'}`}>
                            {p.type === 'service' ? 'S' : 'P'}
                          </div>
                          <div>
                            <p className="text-slate-900 font-medium">{p.name}</p>
                            {p.sku && <p className="text-slate-600 text-xs font-mono">{p.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-xs">
                        {p.group && <div className="text-slate-900">{p.group}</div>}
                        {p.brand && <div>{p.brand}</div>}
                        {!p.group && !p.brand && '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <span className="text-slate-900">{p.unit}</span>
                        {p.secondaryUnit && <div className="text-xs">1 = {p.conversionRate} {p.secondaryUnit}</div>}
                      </td>
                      <td className="px-5 py-4 text-slate-600">₹{p.purchasePrice.toFixed(2)}</td>
                      <td className="px-5 py-4 text-slate-900 font-semibold">₹{p.sellingPrice.toFixed(2)}</td>
                      <td className="px-5 py-4 text-slate-600">{p.mrp ? `₹${p.mrp.toFixed(2)}` : '—'}</td>
                      <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">{p.gstRate}%</span></td>
                      <td className="px-5 py-4">
                        {p.type === 'product' ? (
                          <span className={p.currentStock <= p.reorderLevel ? 'text-red-400 font-medium' : 'text-emerald-400'}>
                            {parseFloat((p.currentStock || 0).toFixed(3))} {p.unit}
                          </span>
                        ) : <span className="text-slate-600">N/A</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[#E2E8F0] text-slate-600 hover:text-slate-900 transition"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(p._id, p.name)} className="p-1.5 rounded-lg hover:bg-red-900/20 text-slate-600 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
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

      {/* New Modern Dark Modal - Expanded Two-Column Layout */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-50/60 backdrop-blur-sm">
          <div className="bg-[#F1F5F9] border border-slate-200 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-slate-900 font-bold text-lg">{editing ? 'Edit Item' : 'Add New Item'}</h3>
                <p className="text-xs text-slate-600 mt-0.5">Fill in the product details below</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-[#F1F5F9] text-slate-600 hover:text-slate-900 transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 p-5 overflow-y-auto bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Product Details Section */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F1F5F9]">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">Product Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(() => {
                          const availableGroups = productCategories.length > 0 ? productCategories.map(c => c.name) : productGroups;
                          const currentCat = productCategories.find(c => c.name === form.group);
                          const availableBrands = currentCat ? currentCat.brands : (productCategories.length > 0 && form.group ? [] : productBrands);
                          return (
                            <>
                              <Select label="Group" keyName="group" options={['', ...availableGroups]} form={form} onQuickAdd={handleAddGroup} setForm={(newForm: any) => {
                                 if (newForm.group !== form.group) newForm.brand = '';
                                 setForm(newForm);
                              }} />
                              <Select label="Brand" keyName="brand" options={['', ...availableBrands]} form={form} onQuickAdd={handleAddBrand} setForm={setForm} />
                            </>
                          );
                        })()}
                        <Input label="Item Code / SKU" keyName="sku" form={form} setForm={setForm} />
                        <Input label="Product Name" keyName="name" required form={form} setForm={setForm} />
                        <div className="col-span-2">
                          <Input label="Print Name (Optional)" keyName="printName" form={form} setForm={setForm} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Price Details Section */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F1F5F9]">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">Price Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Purchase Price (₹)" type="number" keyName="purchasePrice" form={form} setForm={setForm} />
                        <Input label="M.R.P. (₹)" type="number" keyName="mrp" form={form} setForm={setForm} />
                        <Input label="Sale Price 1 (Retail) (₹)" type="number" keyName="sellingPrice" required form={form} setForm={setForm} />
                        <Input label="Sale Price 2 (Wholesale) (₹)" type="number" keyName="sellingPrice2" form={form} setForm={setForm} />
                        <Input label="Sale Price 3 (₹)" type="number" keyName="sellingPrice3" form={form} setForm={setForm} />
                        <Input label="Min. Sale Price (₹)" type="number" keyName="minSalePrice" form={form} setForm={setForm} />
                      </div>
                    </div>

                    {/* Stock and Unit Details */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F1F5F9]">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">Stock and Unit Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="flex gap-2">
                          <div className="flex-1">
                             <Select label="Unit" keyName="unit" options={units} required form={form} setForm={setForm} />
                          </div>
                          <button onClick={() => setShowUnitModal(true)} className="px-3 py-2 rounded-lg bg-action-500/20 text-blue-400 hover:bg-action-500/30 text-xs font-semibold whitespace-nowrap transition mt-5">
                            Secondary Unit
                          </button>
                        </div>
                        <div className="flex items-center h-9 text-xs text-slate-600">
                          {form.secondaryUnit && form.secondaryUnit !== form.unit && `1 ${form.unit} = ${form.conversionRate} ${form.secondaryUnit}`}
                        </div>
                        {form.type === 'product' && (
                          <>
                            <Input label="Opening Stock" type="number" keyName="openingStock" form={form} setForm={setForm} />
                            <Input label="Opening Stock Value (₹)" type="number" keyName="openingStockValue" form={form} setForm={setForm} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* GST Details */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F1F5F9]">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">GST Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="HSN / SAC Code" keyName="hsnCode" form={form} setForm={setForm} />
                        <Select label="GST Rate (%)" keyName="gstRate" options={GST_RATES} form={form} setForm={setForm} />
                      </div>
                    </div>

                    {/* Other Details */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F1F5F9]">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">Other Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wider">Sale Discount</label>
                          <div className="flex rounded-lg overflow-hidden border border-slate-200">
                            <input type="number" value={form.saleDiscount === 0 ? '' : form.saleDiscount} onChange={e => setForm({ ...form, saleDiscount: parseFloat(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2 bg-white text-slate-900 focus:outline-none text-sm" />
                            <select value={form.saleDiscountType} onChange={e => setForm({ ...form, saleDiscountType: e.target.value })} className="bg-[#E2E8F0] text-slate-900 px-2 py-2 text-sm focus:outline-none cursor-pointer border-l border-slate-200">
                              <option value="percentage">%</option>
                              <option value="amount">₹</option>
                            </select>
                          </div>
                        </div>
                        <Input label="Low Level Limit" type="number" keyName="lowLevelLimit" form={form} setForm={setForm} />
                        <Select label="Product Type" keyName="productType" options={['General', 'Raw Material', 'Finished Good', 'WIP Component', 'Consumable']} form={form} setForm={setForm} />
                        <Input label="Location/Rack" keyName="location" form={form} setForm={setForm} />
                        <div className="col-span-2">
                          <Input label="Batch No." keyName="batchNo" form={form} setForm={setForm} />
                        </div>
                      </div>
                    </div>

                    {/* Product Description */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F1F5F9]">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">Product Description</h4>
                      <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition resize-none" />
                    </div>

                    {/* Product Settings */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F1F5F9]">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">Product Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Checkbox label="Print Description" keyName="printDescription" form={form} setForm={setForm} />
                        <Checkbox label="One Click Sale" keyName="oneClickSale" form={form} setForm={setForm} />
                        <Checkbox label="Enable Tracking" keyName="enableTracking" form={form} setForm={setForm} />
                        <Checkbox label="Print Batch No" keyName="printBatchNo" form={form} setForm={setForm} />
                        <Checkbox label="Print Expiry Date" keyName="printExpiryDate" form={form} setForm={setForm} />
                        <Checkbox label="Not For Sale" keyName="notForSale" danger form={form} setForm={setForm} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-slate-200 bg-white shrink-0 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-[#D4D4D4] font-medium text-sm transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-8 py-2 rounded-xl bg-action-500 text-white hover:bg-action-500 font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editing ? 'Update Item' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unit Settings Modal - Dark Theme */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/60 backdrop-blur-sm">
          <div className="bg-[#F1F5F9] text-slate-900 border border-slate-200 w-full max-w-[440px] flex flex-col shadow-2xl rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-action-500/10 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Unit Settings</h3>
              </div>
              <button onClick={() => setShowUnitModal(false)} className="p-2 rounded-xl hover:bg-[#F1F5F9] text-slate-600 hover:text-slate-900 transition"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6 bg-[#F1F5F9]">
              {/* Base Unit & Secondary Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-[11px] font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Base Unit</label>
                   <input type="text" disabled value={form.unit || 'Pieces'} className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 focus:outline-none text-sm cursor-not-allowed" />
                </div>
                <div>
                   <label className="block text-[11px] font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Secondary Unit <span className="text-red-500">*</span></label>
                   <select value={form.secondaryUnit} onChange={e => setForm({...form, secondaryUnit: e.target.value})} className="w-full px-3 py-2.5 rounded-lg bg-[#F1F5F9] border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition appearance-none cursor-pointer">
                      {['', ...units].map(u => <option key={u} value={u}>{u}</option>)}
                   </select>
                </div>
              </div>

              {/* Inventory Conversion Factor */}
              <div className="p-4 rounded-xl border border-[#1e3a8a]/30 bg-white">
                 <div className="flex justify-between items-center mb-3">
                   <label className="block text-[11px] font-medium text-slate-600 uppercase tracking-wider">Conversion Factor</label>
                   <div className="text-[11px] text-blue-400 font-semibold bg-action-500/10 px-2 py-1 rounded-md border border-action-400/20">1 {form.unit || 'Pieces'} = {form.conversionRate || 1} {form.secondaryUnit || 'Feet'}</div>
                 </div>
                 <input type="number" value={form.conversionRate || ''} onChange={e => setForm({...form, conversionRate: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2.5 rounded-lg bg-[#F1F5F9] border border-slate-200 text-slate-900 focus:border-[#D4D4D4] focus:outline-none text-sm transition" placeholder="e.g. 16" />
              </div>

              {/* Sale Price */}
              <div className="space-y-3">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-slate-900 cursor-pointer group">
                    <input type="radio" checked={form.secSalePriceType !== 'margin'} onChange={() => setForm({...form, secSalePriceType: 'fixed'})} className="w-4 h-4 rounded-full border-slate-200 bg-[#F1F5F9] text-action-500 focus:ring-action-400 focus:ring-offset-black" />
                    Fixed Per Unit
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900 transition group">
                    <input type="radio" checked={form.secSalePriceType === 'margin'} onChange={() => setForm({...form, secSalePriceType: 'margin'})} className="w-4 h-4 rounded-full border-slate-200 bg-[#F1F5F9] text-action-500 focus:ring-action-400 focus:ring-offset-black" />
                    Margin Per Unit
                  </label>
                </div>
                <div className="flex rounded-lg overflow-hidden border border-slate-200 focus-within:border-[#D4D4D4] transition">
                  <div className="bg-[#F1F5F9] text-slate-600 px-4 py-2.5 border-r border-slate-200 flex items-center justify-center text-sm font-medium">₹</div>
                  <input type="number" value={form.secSalePrice || ''} onChange={e => setForm({...form, secSalePrice: parseFloat(e.target.value) || 0})} className="flex-1 px-3 py-2.5 bg-white text-slate-900 focus:outline-none text-sm" placeholder="Secondary Sale Price" />
                </div>
              </div>

              {/* MRP & Min. Sale Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1.5 uppercase tracking-wider">M.R.P.</label>
                  <div className="flex rounded-lg overflow-hidden border border-slate-200 focus-within:border-[#D4D4D4] transition">
                    <div className="bg-[#F1F5F9] text-slate-600 px-3 py-2.5 border-r border-slate-200 flex items-center justify-center text-sm">₹</div>
                    <input type="number" value={form.secMrp || ''} onChange={e => setForm({...form, secMrp: parseFloat(e.target.value) || 0})} className="flex-1 px-3 py-2 bg-white text-slate-900 focus:outline-none text-sm" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Min. Sale Price</label>
                  <div className="flex rounded-lg overflow-hidden border border-slate-200 focus-within:border-[#D4D4D4] transition">
                    <div className="bg-[#F1F5F9] text-slate-600 px-3 py-2.5 border-r border-slate-200 flex items-center justify-center text-sm">₹</div>
                    <input type="number" value={form.secMinSalePrice || ''} onChange={e => setForm({...form, secMinSalePrice: parseFloat(e.target.value) || 0})} className="flex-1 px-3 py-2 bg-white text-slate-900 focus:outline-none text-sm" placeholder="0.00" />
                  </div>
                </div>
              </div>

              {/* Default Sales Unit Checkbox */}
              <label className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer hover:text-slate-900 transition pt-2">
                <input type="checkbox" checked={form.isDefaultSecondaryUnit || false} onChange={e => setForm({...form, isDefaultSecondaryUnit: e.target.checked})} className="w-4 h-4 rounded border-slate-200 bg-[#F1F5F9] text-action-500 focus:ring-action-400 focus:ring-offset-black" />
                Set as default sales unit
              </label>

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3">
              <button onClick={() => setShowUnitModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-[#D4D4D4] font-medium text-sm transition">
                Cancel
              </button>
              <button onClick={() => setShowUnitModal(false)} className="flex items-center gap-2 px-6 py-2.5 bg-action-500 hover:bg-action-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/20">
                <Plus className="w-4 h-4" /> Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
      {showCategoryModal && (
        <CategoryMasterModal 
          onClose={() => setShowCategoryModal(false)} 
          onSaveSuccess={() => {
            fetchSettings();
          }} 
        />
      )}
    </div>
  );
}

