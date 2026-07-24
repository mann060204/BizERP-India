'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRovingIndex, useFocusTrap, useGlobalShortcuts } from '../../../../hooks/useKeyboardNav';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Topbar from '../../../../components/layout/Topbar';
import { productsApi, businessApi } from '../../../../lib/erp-api';
import { Plus, Search, Package, Edit2, Trash2, X, Loader2, Save, Tag, DollarSign, Layers, FileText, Settings, ExternalLink, RefreshCw, Download, GitMerge, AlertTriangle, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import QuickCategoryModal from '../../../../components/modals/QuickCategoryModal';

interface Product {
  _id: string; name: string; printName?: string; category?: string; group?: string; subGroup?: string; brand?: string;
  type: string; sku?: string; hsnCode?: string; unit: string; secondaryUnit?: string;
  sellingPrice: number; sellingPrice2?: number; sellingPrice3?: number;
  purchasePrice: number; minSalePrice?: number; mrp?: number; conversionRate?: number;
  gstRate: number; cessRate?: number; igstRate?: number; saleDiscount?: number; saleDiscountType?: 'percentage' | 'amount';
  currentStock: number; reorderLevel: number; openingStock: number; openingStockValue?: number;
  lowLevelLimit?: number; location?: string; batchNo?: string; description?: string;
  productType?: string;
  printDescription?: boolean; printBatchNo?: boolean; oneClickSale?: boolean;
  enableTracking?: boolean; printExpiryDate?: boolean; notForSale?: boolean;
}

const GST_RATES = [0, 5, 12, 18, 28];
const FALLBACK_UNITS = ['Nos', 'Bags', 'Bale', 'Bundles', 'Buckles', 'Billion of units', 'Box', 'Bottles', 'Bunches', 'Cans', 'Cubic meters', 'Cubic centimeters', 'Centimeters', 'Cartons', 'Dozens', 'Drums', 'Feet', 'Grams', 'Gross', 'Gallons', 'Hours', 'Job', 'Kilograms', 'Kilometers', 'Liters', 'Meters', 'Metric ton', 'Milligrams', 'Milliliters', 'Numbers', 'Packs', 'Pieces', 'Pairs', 'Quintals', 'Rolls', 'Sets', 'Square feet', 'Square meters', 'Tablets', 'Ten gross', 'Thousands', 'Tons', 'Tubes', 'US gallons', 'Yards'];

const emptyForm = {
  name: '', printName: '', category: '', group: '', subGroup: '', brand: '', type: 'product', sku: '', hsnCode: '',
  unit: 'Nos', secondaryUnit: '', conversionRate: 1,
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
      className="w-4 h-4 rounded border-slate-200 bg-[#F1F5F9] text-primary focus:ring-primary focus:ring-offset-black" />
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
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [quickCategoryMode, setQuickCategoryMode] = useState<'category' | 'brand' | 'group' | 'subgroup' | null>(null);

  // ── Keyboard navigation refs ──────────────────────────────────────────────
  const tableRef = useRef<HTMLTableSectionElement>(null);
  const unitModalRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // Stable refs to avoid stale closures in hooks (updated each render)
  const openEditRef = useRef<(p: Product) => void>(() => {});
  const handleSaveRef = useRef<() => void>(() => {});

  const [mergeTarget, setMergeTarget] = useState<Record<string, string>>({}); // groupKey -> winner _id
  const [expandedDupGroups, setExpandedDupGroups] = useState<Record<string, boolean>>({});
  const [mergingSaving, setMergingSaving] = useState(false);

  // Table row roving navigation — Enter opens edit for that row
  useRovingIndex(
    products.length,
    tableRef,
    (idx) => { if (products[idx]) openEditRef.current(products[idx]); },
    !showModal && !showUnitModal && !showDuplicateModal
  );

  // Unit Settings modal focus trap
  useFocusTrap(unitModalRef, showUnitModal, () => setShowUnitModal(false));

  // Global shortcuts: Ctrl+S saves open form; Ctrl+K / '/' focuses search
  useGlobalShortcuts({
    onSave: () => { if (showModal) handleSaveRef.current(); },
    onSearch: () => searchRef.current?.focus(),
  });

  const [productGroups, setProductGroups] = useState<string[]>([]);
  const [productBrands, setProductBrands] = useState<string[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);
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

  // --- Duplicate detection ---
  const duplicateGroups: Record<string, Product[]> = {};
  products.forEach(p => {
    const key = p.name.trim().toLowerCase();
    if (!duplicateGroups[key]) duplicateGroups[key] = [];
    duplicateGroups[key].push(p);
  });
  const onlyDuplicates = Object.fromEntries(Object.entries(duplicateGroups).filter(([, v]) => v.length > 1));
  const duplicateIds = new Set(Object.values(onlyDuplicates).flat().map(p => p._id));
  const duplicateCount = Object.keys(onlyDuplicates).length;

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add-product') {
      setEditing(null); setForm({ ...emptyForm, type: 'product' }); setShowModal(true);
    } else if (action === 'add-service') {
      setEditing(null); setForm({ ...emptyForm, type: 'service' }); setShowModal(true);
    }
  }, [searchParams]);

  const openEdit = async (p: Product) => {
    await fetchSettings();
    setEditing(p);
    setForm({
      name: p.name || '', printName: p.printName || '', category: p.category || '', group: p.group || '', subGroup: p.subGroup || '', brand: p.brand || '',
      type: p.type || 'product', sku: p.sku || '', hsnCode: p.hsnCode || '',
      unit: p.unit || 'Nos', secondaryUnit: p.secondaryUnit || '',
      conversionRate: p.conversionRate || 1,
      purchasePrice: p.purchasePrice || 0, sellingPrice: p.sellingPrice || 0,
      sellingPrice2: p.sellingPrice2 || 0, sellingPrice3: p.sellingPrice3 || 0,
      minSalePrice: p.minSalePrice || 0, mrp: p.mrp || 0,
      openingStock: p.openingStock || 0, openingStockValue: p.openingStockValue || 0,
      reorderLevel: p.reorderLevel || 5, lowLevelLimit: p.lowLevelLimit || 0,
      gstRate: p.gstRate !== undefined && p.gstRate !== null ? p.gstRate : 0, cessRate: p.cessRate || 0, igstRate: p.igstRate || 0,
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

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Item name is required'); return; }
    if (!form.sellingPrice || form.sellingPrice <= 0) { toast.error('Sale Price 1 must be greater than 0'); return; }
    // Dual-unit validation: if second unit set, must have rate OR batch tracking
    if (form.secondaryUnit && form.secondaryUnit !== form.unit) {
      const hasRate = form.conversionRate && form.conversionRate > 0;
      if (!hasRate && !form.enableTracking) {
        toast.error(`Second Unit is set to "${form.secondaryUnit}" but no conversion rate is configured. Set a rate (1 ${form.secondaryUnit} = ? ${form.unit}) or enable "Track by Batch".`);
        return;
      }
    }
    setSaving(true);
    try {
      if (editing) { await productsApi.update(editing._id, form); toast.success('Item updated'); }
      else { await productsApi.create(form); toast.success('Item created'); }
      setShowModal(false); fetchProducts();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  // Keep keyboard-nav refs current (avoids stale closure in hook callbacks)
  useEffect(() => { openEditRef.current = openEdit; });
  useEffect(() => { handleSaveRef.current = handleSave; });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await productsApi.delete(id); toast.success('Item deleted'); fetchProducts(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleMergeDuplicates = async (groupItems: Product[], winnerId: string) => {
    const winner = groupItems.find(p => p._id === winnerId);
    if (!winner) return;
    const toDelete = groupItems.filter(p => p._id !== winnerId);
    if (!confirm(`Merge ${toDelete.length} duplicate(s) into "${winner.name}"?\nThe others will be permanently deleted.`)) return;
    setMergingSaving(true);
    try {
      for (const p of toDelete) {
        await productsApi.delete(p._id);
      }
      toast.success(`Merged: kept "${winner.name}", deleted ${toDelete.length} duplicate(s)`);
      fetchProducts();
      setShowDuplicateModal(false);
    } catch { toast.error('Failed to merge duplicates'); }
    finally { setMergingSaving(false); }
  };

  const exportProducts = async () => {
    try {
      const { data } = await productsApi.list({ limit: 10000 });
      const prods: Product[] = data.products;

      const headers = [
        'Category', 'Brand', 'Group', 'SubGroup',
        'Item Code / SKU', 'Product Name', 'Print Name',
        'Purchase Price (Rs)', 'MRP (Rs)',
        'Sale Price 1 (Retail) (Rs)', 'Sale Price 2 (Wholesale) (Rs)', 'Sale Price 3 (Rs)', 'Min. Sale Price (Rs)',
        'Sale Discount', 'Sale Discount Type',
        'Unit', 'Secondary Unit', 'Conversion Rate',
        'Opening Stock', 'Opening Stock Value (Rs)', 'Current Stock',
        'Reorder Level', 'Low Level Limit',
        'HSN / SAC Code', 'GST Rate (%)', 'Cess Rate (%)', 'IGST Rate (%)',
        'Product Type', 'Location/Rack', 'Batch No.',
        'Product Description',
        'Print Description', 'One Click Sale', 'Enable Tracking', 'Print Batch No', 'Print Expiry Date', 'Not For Sale'
      ];

      const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

      const rowsData = prods.map(p => [
        escape(p.category || ''),
        escape(p.brand || ''),
        escape(p.group || ''),
        escape(p.subGroup || ''),
        escape(p.sku || ''),
        escape(p.name || ''),
        escape(p.printName || ''),
        escape(p.purchasePrice || 0),
        escape(p.mrp || 0),
        escape(p.sellingPrice || 0),
        escape(p.sellingPrice2 || 0),
        escape(p.sellingPrice3 || 0),
        escape(p.minSalePrice || 0),
        escape(p.saleDiscount || 0),
        escape(p.saleDiscountType || 'percentage'),
        escape(p.unit || ''),
        escape(p.secondaryUnit || ''),
        escape(p.conversionRate || 1),
        escape(p.openingStock || 0),
        escape(p.openingStockValue || 0),
        escape(p.currentStock || 0),
        escape(p.reorderLevel || 0),
        escape(p.lowLevelLimit || 0),
        escape(p.hsnCode || ''),
        escape(p.gstRate ?? 0),
        escape(p.cessRate || 0),
        escape(p.igstRate || 0),
        escape(p.productType || 'General'),
        escape(p.location || ''),
        escape(p.batchNo || ''),
        escape(p.description || ''),
        escape(p.printDescription ? 'TRUE' : 'FALSE'),
        escape(p.oneClickSale ? 'TRUE' : 'FALSE'),
        escape(p.enableTracking ? 'TRUE' : 'FALSE'),
        escape(p.printBatchNo ? 'TRUE' : 'FALSE'),
        escape(p.printExpiryDate ? 'TRUE' : 'FALSE'),
        escape(p.notForSale ? 'TRUE' : 'FALSE'),
      ].join(','));

      const csvContent = [headers.map(h => `"${h}"`).join(','), ...rowsData].join('\n');
      const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${prods.length} products (${headers.length} fields each)`);
    } catch {
      toast.error('Failed to export products');
    }
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
          <div className="flex items-center gap-3 flex-wrap">
            {duplicateCount > 0 && (
              <button onClick={() => setShowDuplicateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition flex items-center gap-2 shadow-sm animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                {duplicateCount} Duplicate{duplicateCount > 1 ? 's' : ''} Found
              </button>
            )}
            <button onClick={exportProducts} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition flex items-center gap-2 shadow-sm">
              <Download className="w-4 h-4" /> Full Export (with Batch)
            </button>
            <Link href="/dashboard/masters/items/bulk" className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition flex items-center gap-2 shadow-sm">
              <Layers className="w-4 h-4" /> Bulk Entry
            </Link>
            <button onClick={() => { setForm({ ...emptyForm, category: productCategories[0]?.name || '' }); setEditing(null); setShowModal(true); }} className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-sm transition flex items-center gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>

        {/* Filters — Ctrl+K / '/' focuses search */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items… (Ctrl+K)"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] transition text-sm" />
          </div>
          {['', 'product', 'service'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${typeFilter === t ? 'bg-primary text-white hover:bg-primary-hover border-transparent' : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:border-[#D4D4D4]'}`}>
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
            <p className="text-slate-600 text-sm mt-1 mb-6">Add your products and services from purchase/sales to start billing</p>
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
                {/* Keyboard tip hint */}
                <caption className="sr-only">Use Arrow Up/Down to navigate rows, Enter to edit, Home/End to jump, Page Up/Down to scroll by 10</caption>
                <tbody ref={tableRef} className="divide-y divide-[#1A1A1A]">
                  {products.map((p, rowIdx) => {
                    const isDup = duplicateIds.has(p._id);
                    return (
                    <tr
                      key={p._id}
                      data-nav-row
                      tabIndex={rowIdx === 0 ? 0 : -1}
                      role="row"
                      aria-selected="false"
                      aria-label={`${p.name}, ${p.unit}, ₹${p.sellingPrice}`}
                      onDoubleClick={() => openEdit(p)}
                      className={`transition-colors group cursor-pointer ${isDup ? 'bg-amber-50 border-l-4 border-l-amber-400 hover:bg-amber-100' : 'hover:bg-[#F1F5F9]'}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${p.type === 'service' ? 'bg-violet-500/20 text-violet-300' : 'bg-primary/20 text-blue-300'}`}>
                            {p.type === 'service' ? 'S' : 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-slate-900 font-medium">{p.name}</p>
                              {isDup && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300">
                                  <Copy className="w-2.5 h-2.5" /> DUP
                                </span>
                              )}
                            </div>
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
                        {p.secondaryUnit && <div className="text-xs">1 {p.unit} = {p.conversionRate} {p.secondaryUnit}</div>}
                      </td>
                      <td className="px-5 py-4 text-slate-600">₹{p.purchasePrice.toFixed(2)}</td>
                      <td className="px-5 py-4 text-slate-900 font-semibold">₹{p.sellingPrice.toFixed(2)}</td>
                      <td className="px-5 py-4 text-slate-600">{p.mrp ? `₹${p.mrp.toFixed(2)}` : '—'}</td>
                      <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">{p.gstRate}%</span></td>
                      <td className="px-5 py-4">
                        {p.type === 'product' ? (
                          <span className={p.currentStock <= p.reorderLevel ? 'text-red-400 font-medium' : 'text-emerald-400'}>
                            {parseFloat((p.currentStock || 0).toFixed(2))} {p.unit}
                          </span>
                        ) : <span className="text-slate-600">N/A</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`} className="p-1.5 rounded-lg hover:bg-[#E2E8F0] text-slate-600 hover:text-slate-900 transition"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(p._id, p.name)} aria-label={`Delete ${p.name}`} className="p-1.5 rounded-lg hover:bg-red-900/20 text-slate-600 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                          {isDup && (
                            <button onClick={() => setShowDuplicateModal(true)} title="Manage duplicates" className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-500 hover:text-amber-700 transition">
                              <GitMerge className="w-4 h-4" />
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
                      <div className="flex items-center justify-between mb-4 border-b border-slate-300 pb-2">
                        <h4 className="text-sm font-semibold text-slate-900">Product Details</h4>
                        <button type="button" onClick={fetchSettings} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover bg-primary/5 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition" title="Refresh Categories">
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Refresh Categories</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(() => {
                          const availableCategories = productCategories.map(c => c.name);
                          const currentCat = productCategories.find(c => c.name === form.category);
                          const availableBrands = currentCat ? (currentCat.brands || []).map((b: any) => b.name) : [];
                          
                          const currentBrand = (currentCat?.brands || []).find((b: any) => b.name === form.brand);
                          const availableGroups = currentBrand ? (currentBrand.groups || []).map((g: any) => g.name) : [];
                          
                          const currentGroup = (currentBrand?.groups || []).find((g: any) => g.name === form.group);
                          const availableSubGroups = currentGroup ? (currentGroup.subGroups || []) : [];

                          return (
                            <>
                              <Select label="Category" keyName="category" options={['', ...availableCategories]} form={form} onQuickAdd={() => setQuickCategoryMode('category')} setForm={(newForm: any) => {
                                 if (newForm.category !== form.category) { newForm.brand = ''; newForm.group = ''; newForm.subGroup = ''; }
                                 setForm(newForm);
                              }} />
                              <Select label="Brand" keyName="brand" options={['', ...availableBrands]} form={form} onQuickAdd={() => setQuickCategoryMode('brand')} setForm={(newForm: any) => {
                                 if (newForm.brand !== form.brand) { newForm.group = ''; newForm.subGroup = ''; }
                                 setForm(newForm);
                              }} />
                              <Select label="Group" keyName="group" options={['', ...availableGroups]} form={form} onQuickAdd={() => setQuickCategoryMode('group')} setForm={(newForm: any) => {
                                 if (newForm.group !== form.group) { newForm.subGroup = ''; }
                                 setForm(newForm);
                              }} />
                              <Select label="SubGroup" keyName="subGroup" options={['', ...availableSubGroups]} form={form} onQuickAdd={() => setQuickCategoryMode('subgroup')} setForm={setForm} />
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
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">Stock & Unit Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="flex gap-2">
                          <div className="flex-1">
                             <Select label="Main Unit (Stock)" keyName="unit" options={units} required form={form} setForm={setForm} />
                          </div>
                          <button onClick={() => setShowUnitModal(true)} className="px-3 py-2 rounded-lg bg-primary/20 text-blue-400 hover:bg-primary/30 text-xs font-semibold whitespace-nowrap transition mt-5">
                            Second Unit
                          </button>
                        </div>

                        {/* Dual-Unit Conversion Rate */}
                        {form.secondaryUnit && form.secondaryUnit !== form.unit ? (
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wider">
                              1&nbsp;<span className="text-emerald-600 font-bold">{form.unit}</span>&nbsp;=&nbsp;___&nbsp;<span className="text-blue-600 font-bold">{form.secondaryUnit}</span>
                            </label>
                            <input
                              type="number" step="0.0001"
                              value={form.conversionRate === 0 ? '' : form.conversionRate}
                              onChange={e => setForm({ ...form, conversionRate: parseFloat(e.target.value) || 0 })}
                              disabled={!!form.enableTracking}
                              placeholder={form.enableTracking ? 'Set per batch' : '0.0000'}
                              className={`w-full px-3 py-2 rounded-lg border text-sm transition ${
                                form.enableTracking
                                  ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                                  : 'bg-[#F1F5F9] border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400'
                              }`}
                            />
                            {form.enableTracking && (
                              <p className="text-[10px] text-amber-600 mt-1">⚠ Rate is set per batch. Item-level rate is ignored.</p>
                            )}
                            {!form.enableTracking && form.conversionRate > 0 && (
                              <p className="text-[10px] text-emerald-600 mt-1">✓ 1 {form.unit} = {form.conversionRate} {form.secondaryUnit} | Selling in {form.secondaryUnit} deducts proportionally from {form.unit} stock</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center h-9 text-xs text-slate-400 italic">
                            {form.secondaryUnit ? 'Same as main unit' : 'No second unit configured'}
                          </div>
                        )}

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
                        {/* Relabeled for dual-unit batch tracking */}
                        <div className="col-span-2">
                          <label className={`flex items-start gap-2 text-sm cursor-pointer ${form.secondaryUnit && form.secondaryUnit !== form.unit ? 'text-amber-700 font-medium' : 'text-slate-900'}`}>
                            <input type="checkbox" checked={form.enableTracking} onChange={e => setForm({ ...form, enableTracking: e.target.checked })}
                              className="w-4 h-4 mt-0.5 rounded border-slate-200 bg-[#F1F5F9] text-primary focus:ring-primary focus:ring-offset-black flex-shrink-0" />
                            <span>
                              Track by Batch <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold ml-1">Dual-Unit</span>
                              {form.secondaryUnit && form.secondaryUnit !== form.unit && (
                                <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                                  When ON: each batch stores its own {form.secondaryUnit}→{form.unit} rate. Item-level rate is not used.
                                </span>
                              )}
                            </span>
                          </label>
                        </div>
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
              <button onClick={handleSave} disabled={saving} className="px-8 py-2 rounded-xl bg-primary text-white hover:bg-primary font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editing ? 'Update Item' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unit Settings Modal - Dark Theme */}
      {showUnitModal && (
        <div
          ref={unitModalRef}
          role="dialog"
          aria-modal="true"
          aria-label="Unit Settings"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/60 backdrop-blur-sm"
        >
          <div className="bg-[#F1F5F9] text-slate-900 border border-slate-200 w-full max-w-[440px] flex flex-col shadow-2xl rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Unit Settings</h3>
              </div>
              <button onClick={() => setShowUnitModal(false)} className="p-2 rounded-xl hover:bg-[#F1F5F9] text-slate-600 hover:text-slate-900 transition"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6 bg-[#F1F5F9]">
              {/* Main Unit & Second Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-[11px] font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Main Unit</label>
                   <input type="text" disabled value={form.unit || 'Pieces'} className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 focus:outline-none text-sm cursor-not-allowed" />
                </div>
                <div>
                   <label className="block text-[11px] font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Second Unit <span className="text-red-500">*</span></label>
                   <select value={form.secondaryUnit} onChange={e => setForm({...form, secondaryUnit: e.target.value})} className="w-full px-3 py-2.5 rounded-lg bg-[#F1F5F9] border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition appearance-none cursor-pointer">
                      {['', ...units].map(u => <option key={u} value={u}>{u}</option>)}
                   </select>
                </div>
              </div>

              {/* Inventory Conversion Factor */}
              <div className="p-4 rounded-xl border border-[#1e3a8a]/30 bg-white">
                 <div className="flex justify-between items-center mb-3">
                   <label className="block text-[11px] font-medium text-slate-600 uppercase tracking-wider">Conversion Factor</label>
                   {/* CORRECT direction: 1 Main Unit = rate × Second Units */}
                   <div className="text-[11px] text-blue-400 font-semibold bg-primary/10 px-2 py-1 rounded-md border border-action-400/20">1 {form.unit || 'Main Unit'} = {form.conversionRate || 1} {form.secondaryUnit || 'Second Unit'}</div>
                 </div>
                 <input type="number" value={form.conversionRate || ''} onChange={e => setForm({...form, conversionRate: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2.5 rounded-lg bg-[#F1F5F9] border border-slate-200 text-slate-900 focus:border-[#D4D4D4] focus:outline-none text-sm transition" placeholder="e.g. 16" />
                 {/* Live preview — identical wording to Add New Item screen */}
                 {form.secondaryUnit && form.conversionRate > 0 && (
                   <p className="text-[10px] text-emerald-600 mt-1.5">✓ 1 {form.unit} = {form.conversionRate} {form.secondaryUnit} | Selling in {form.secondaryUnit} deducts proportionally from {form.unit} stock</p>
                 )}
              </div>

              {/* Sale Price */}
              <div className="space-y-3">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-slate-900 cursor-pointer group">
                    <input type="radio" checked={form.secSalePriceType !== 'margin'} onChange={() => setForm({...form, secSalePriceType: 'fixed'})} className="w-4 h-4 rounded-full border-slate-200 bg-[#F1F5F9] text-primary focus:ring-primary focus:ring-offset-black" />
                    Fixed Per Unit
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900 transition group">
                    <input type="radio" checked={form.secSalePriceType === 'margin'} onChange={() => setForm({...form, secSalePriceType: 'margin'})} className="w-4 h-4 rounded-full border-slate-200 bg-[#F1F5F9] text-primary focus:ring-primary focus:ring-offset-black" />
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
                <input type="checkbox" checked={form.isDefaultSecondaryUnit || false} onChange={e => setForm({...form, isDefaultSecondaryUnit: e.target.checked})} className="w-4 h-4 rounded border-slate-200 bg-[#F1F5F9] text-primary focus:ring-primary focus:ring-offset-black" />
                Set as default sales unit
              </label>

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3">
              <button onClick={() => setShowUnitModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-[#D4D4D4] font-medium text-sm transition">
                Cancel
              </button>
              <button onClick={() => setShowUnitModal(false)} className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {quickCategoryMode && (
        <QuickCategoryModal 
          mode={quickCategoryMode}
          parentContext={{ category: form.category, brand: form.brand, group: form.group }}
          onClose={() => setQuickCategoryMode(null)}
          onSuccess={async (newName) => {
            await fetchSettings();
            let stateKey = quickCategoryMode;
            if (stateKey === 'subgroup') stateKey = 'subGroup' as any;
            setForm((prev: any) => ({ ...prev, [stateKey]: newName }));
          }}
        />
      )}

      {/* ======= DUPLICATE MANAGER MODAL ======= */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[88vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-amber-50 rounded-t-2xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Duplicate Items Manager</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{duplicateCount} group{duplicateCount > 1 ? 's' : ''} of duplicate items found</p>
                </div>
              </div>
              <button onClick={() => setShowDuplicateModal(false)} className="p-2 rounded-xl hover:bg-amber-100 text-slate-500 hover:text-slate-900 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Bar */}
            <div className="px-6 py-3 bg-amber-50/50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-2 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Select which item to <strong>keep</strong> as master, then click <strong>Merge</strong> — others will be deleted. Or delete individual items.
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {Object.entries(onlyDuplicates).map(([key, groupItems]) => {
                const isExpanded = expandedDupGroups[key] !== false; // default expanded
                const selectedWinner = mergeTarget[key] || groupItems[0]._id;
                return (
                  <div key={key} className="border border-amber-200 rounded-xl overflow-hidden">
                    {/* Group Header */}
                    <button
                      onClick={() => setExpandedDupGroups(prev => ({ ...prev, [key]: !isExpanded }))}
                      className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition text-left">
                      <div className="flex items-center gap-2">
                        <Copy className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-slate-800 capitalize">{groupItems[0].name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-800">
                          {groupItems.length} copies
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMergeDuplicates(groupItems, selectedWinner); }}
                          disabled={mergingSaving}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-sm disabled:opacity-50">
                          {mergingSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <GitMerge className="w-3 h-3" />}
                          Merge
                        </button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>

                    {/* Group Items */}
                    {isExpanded && (
                      <div className="divide-y divide-slate-100">
                        {groupItems.map((item, idx) => (
                          <div key={item._id} className={`flex items-center gap-3 px-4 py-3 ${selectedWinner === item._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-white hover:bg-slate-50'} transition`}>
                            {/* Radio: keep this one */}
                            <input
                              type="radio"
                              name={`winner-${key}`}
                              checked={selectedWinner === item._id}
                              onChange={() => setMergeTarget(prev => ({ ...prev, [key]: item._id }))}
                              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-800 text-sm truncate">{item.name}</span>
                                {selectedWinner === item._id && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">KEEP</span>
                                )}
                                {idx === 0 && selectedWinner !== item._id && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">Original</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-0.5 text-xs text-slate-500">
                                <span>SKU: {item.sku || '—'}</span>
                                <span>Sale: ₹{item.sellingPrice}</span>
                                <span>Stock: {item.currentStock} {item.unit}</span>
                                <span>GST: {item.gstRate}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => openEdit(item)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
                                title="Edit">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item._id, item.name)}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-slate-500 hover:text-red-600 transition"
                                title="Delete this duplicate">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between items-center shrink-0">
              <p className="text-xs text-slate-500">
                <strong>{Object.values(onlyDuplicates).flat().length}</strong> items across <strong>{duplicateCount}</strong> duplicate groups
              </p>
              <button onClick={() => setShowDuplicateModal(false)} className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

