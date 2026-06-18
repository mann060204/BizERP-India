'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../../../../components/layout/Topbar';
import { businessApi, productsApi, suppliersApi } from '../../../../../lib/erp-api';
import { Loader2, Save, Plus, Trash2, ArrowLeft, Layers, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const GST_RATES = [0, 5, 12, 18, 28];
const PRODUCT_TYPES = ['General', 'Raw Material', 'Finished Good', 'WIP Component', 'Consumable'];
const FALLBACK_UNITS = ['Nos', 'Bags', 'Bale', 'Box', 'Bottles', 'Cartons', 'Dozens', 'Grams', 'Kilograms', 'Liters', 'Meters', 'Packs', 'Pieces', 'Pairs', 'Rolls', 'Sets'];

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += line[i];
    }
  }
  result.push(current.trim());
  return result;
}

const makeEmptyRow = (defaults: any = {}) => ({
  id: Date.now() + Math.random(),
  // Classification
  category: defaults.category || '',
  brand: defaults.brand || '',
  group: defaults.group || '',
  subGroup: defaults.subGroup || '',
  // Identity
  name: '',
  printName: '',
  sku: '',
  // Pricing
  purchasePrice: '',
  sellingPrice: '',
  sellingPrice2: '',
  sellingPrice3: '',
  mrp: '',
  minSalePrice: '',
  saleDiscount: '',
  saleDiscountType: 'percentage',
  // Unit & Stock
  unit: defaults.unit || 'Nos',
  secondaryUnit: '',
  openingStock: '',
  openingStockValue: '',
  reorderLevel: '',
  lowLevelLimit: '',
  // GST
  hsnCode: defaults.hsnCode || '',
  gstRate: defaults.gstRate ?? 0,
  // Other
  productType: 'General',
  location: '',
  batchNo: '',
  description: '',
  // Settings (booleans)
  printDescription: false,
  oneClickSale: false,
  enableTracking: false,
  printBatchNo: false,
  printExpiryDate: false,
});

// Tiny reusable cell input
const TI = ({ row, field, updateRow, type = 'text', placeholder = '', cls = '' }: any) => (
  <input
    type={type}
    min={type === 'number' ? 0 : undefined}
    value={row[field] ?? ''}
    onChange={e => updateRow(row.id, field, e.target.value)}
    placeholder={placeholder}
    className={`w-full px-2 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-xs shadow-sm ${cls}`}
  />
);

// Tiny checkbox cell
const TC = ({ row, field, updateRow }: any) => (
  <div className="flex justify-center">
    <input
      type="checkbox"
      checked={!!row[field]}
      onChange={e => updateRow(row.id, field, e.target.checked)}
      className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
    />
  </div>
);

// Tiny select cell
const TS = ({ row, field, updateRow, options }: any) => (
  <select
    value={row[field] ?? ''}
    onChange={e => updateRow(row.id, field, e.target.value)}
    className="w-full px-2 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-xs shadow-sm appearance-none"
  >
    {options.map((o: any) => (
      <option key={typeof o === 'object' ? o.value : o} value={typeof o === 'object' ? o.value : o}>
        {typeof o === 'object' ? o.label : o}
      </option>
    ))}
  </select>
);

export default function BulkAddItemsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [units, setUnits] = useState<string[]>(FALLBACK_UNITS);
  const allCatNames = productCategories.map(c => c.name);

  // Defaults applied when adding a new row
  const [defaults, setDefaults] = useState({
    category: '', brand: '', group: '', subGroup: '',
    gstRate: 0, hsnCode: '', unit: 'Nos', supplierId: ''
  });

  const [rows, setRows] = useState<any[]>([makeEmptyRow()]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profRes, supRes] = await Promise.all([
          businessApi.getProfile(),
          suppliersApi.list({ limit: 1000 })
        ]);
        const rawCats = profRes.data.business?.productCategories || [];
        const parsedCats = rawCats.map((c: any) => ({
          name: c.name,
          brands: (c.brands || []).map((b: any) => ({
            name: b.name,
            groups: (b.groups || []).map((g: any) => ({
              name: g.name,
              subGroups: g.subGroups || []
            }))
          }))
        }));
        setProductCategories(parsedCats);
        const bizUnits = profRes.data.business?.units;
        if (bizUnits?.length) setUnits(bizUnits);
        if (supRes.data?.suppliers) setSuppliers(supRes.data.suppliers);
      } catch {
        toast.error('Failed to load dropdown data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addRow = () => setRows(prev => [...prev, makeEmptyRow(defaults)]);

  const removeRow = (id: any) => {
    if (rows.length === 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  const updateRow = (id: any, field: string, value: any) =>
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));

  // Apply defaults to all existing rows
  const applyDefaultsToAll = () => {
    setRows(prev => prev.map(r => ({
      ...r,
      category: defaults.category || r.category,
      brand: defaults.brand || r.brand,
      group: defaults.group || r.group,
      subGroup: defaults.subGroup || r.subGroup,
      hsnCode: defaults.hsnCode || r.hsnCode,
      gstRate: defaults.gstRate !== undefined ? defaults.gstRate : r.gstRate,
      unit: defaults.unit || r.unit,
    })));
    toast.success('Defaults applied to all rows');
  };

  const handleSave = async () => {
    const validRows = rows.filter((r: any) => r.name?.trim() !== '');
    if (validRows.length === 0) { toast.error('Please enter at least one item name'); return; }
    setSaving(true);
    try {
      const payload = validRows.map((r: any) => ({
        supplierId: defaults.supplierId || undefined,
        category: r.category || '',
        brand: r.brand || '',
        group: r.group || '',
        subGroup: r.subGroup || '',
        name: r.name,
        printName: r.printName || '',
        sku: r.sku || '',
        purchasePrice: Number(r.purchasePrice) || 0,
        sellingPrice: Number(r.sellingPrice) || 0,
        sellingPrice2: Number(r.sellingPrice2) || 0,
        sellingPrice3: Number(r.sellingPrice3) || 0,
        mrp: Number(r.mrp) || 0,
        minSalePrice: Number(r.minSalePrice) || 0,
        saleDiscount: Number(r.saleDiscount) || 0,
        saleDiscountType: r.saleDiscountType || 'percentage',
        unit: r.unit || 'Nos',
        secondaryUnit: r.secondaryUnit || '',
        openingStock: Number(r.openingStock) || 0,
        openingStockValue: Number(r.openingStockValue) || 0,
        currentStock: Number(r.openingStock) || 0,
        reorderLevel: Number(r.reorderLevel) || 0,
        lowLevelLimit: Number(r.lowLevelLimit) || 0,
        hsnCode: r.hsnCode || '',
        gstRate: Number(r.gstRate) ?? 0,
        productType: r.productType || 'General',
        location: r.location || '',
        batchNo: r.batchNo || '',
        description: r.description || '',
        printDescription: !!r.printDescription,
        oneClickSale: !!r.oneClickSale,
        enableTracking: !!r.enableTracking,
        printBatchNo: !!r.printBatchNo,
        printExpiryDate: !!r.printExpiryDate,
        cessRate: Number(r.cessRate) || 0,
        igstRate: Number(r.igstRate) || 0,
        conversionRate: Number(r.conversionRate) || 1,
        notForSale: !!r.notForSale,
        type: 'product',
      }));
      await productsApi.bulkCreate({ products: payload });
      toast.success(`${payload.length} items saved successfully!`);
      router.push('/dashboard/masters/items');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to bulk create items');
    } finally {
      setSaving(false);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = (evt.target?.result as string).replace(/\r/g, '');
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) { toast.error('CSV has no data rows'); return; }
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
        const col = (row: string[], name: string) => {
          const i = headers.indexOf(name.toLowerCase().trim());
          return i >= 0 ? row[i] || '' : '';
        };
        const numCol = (row: string[], name: string) => col(row, name) || '';
        const boolCol = (row: string[], name: string) => col(row, name).toUpperCase() === 'TRUE';

         const importedRows = lines.slice(1)
          .map(l => parseCSVLine(l))
          .map((row, i) => ({
            id: Date.now() + i,
            category: col(row, 'category'),
            brand: col(row, 'brand'),
            group: col(row, 'group'),
            subGroup: col(row, 'subgroup'),
            name: col(row, 'product name'),
            printName: col(row, 'print name'),
            sku: col(row, 'item code / sku'),
            purchasePrice: numCol(row, 'purchase price (rs)'),
            sellingPrice: numCol(row, 'sale price 1 (retail) (rs)'),
            sellingPrice2: numCol(row, 'sale price 2 (wholesale) (rs)'),
            sellingPrice3: numCol(row, 'sale price 3 (rs)'),
            mrp: numCol(row, 'mrp (rs)'),
            minSalePrice: numCol(row, 'min. sale price (rs)'),
            saleDiscount: numCol(row, 'sale discount'),
            saleDiscountType: col(row, 'sale discount type') || 'percentage',
            unit: col(row, 'unit') || 'Nos',
            secondaryUnit: col(row, 'secondary unit'),
            conversionRate: numCol(row, 'conversion rate') || '1',
            openingStock: numCol(row, 'opening stock'),
            openingStockValue: numCol(row, 'opening stock value (rs)'),
            reorderLevel: numCol(row, 'reorder level') || '5',
            lowLevelLimit: numCol(row, 'low level limit'),
            hsnCode: col(row, 'hsn / sac code'),
            gstRate: numCol(row, 'gst rate (%)') || '0',
            cessRate: numCol(row, 'cess rate (%)') || '0',
            igstRate: numCol(row, 'igst rate (%)') || '0',
            productType: col(row, 'product type') || 'General',
            location: col(row, 'location/rack'),
            batchNo: col(row, 'batch no.'),
            description: col(row, 'product description'),
            printDescription: boolCol(row, 'print description'),
            oneClickSale: boolCol(row, 'one click sale'),
            enableTracking: boolCol(row, 'enable tracking'),
            printBatchNo: boolCol(row, 'print batch no'),
            printExpiryDate: boolCol(row, 'print expiry date'),
            notForSale: boolCol(row, 'not for sale'),
          }))
          .filter(r => r.name.trim() !== '');

        if (importedRows.length === 0) { toast.error('No valid product rows found'); return; }
        setRows(importedRows);
        toast.success(`Imported ${importedRows.length} items. Review and click "Save All Items".`);
      } catch {
        toast.error('Failed to parse CSV. Use a file exported from this system.');
      }
    };
    reader.readAsText(file);
  };

  // Cascading for defaults panel
  const defCat = productCategories.find(c => c.name === defaults.category);
  const defBrands = defCat ? defCat.brands.map((b: any) => b.name) : [];
  const defBrand = (defCat?.brands || []).find((b: any) => b.name === defaults.brand);
  const defGroups = defBrand ? defBrand.groups.map((g: any) => g.name) : [];
  const defGroup = (defBrand?.groups || []).find((g: any) => g.name === defaults.group);
  const defSubGroups = defGroup ? defGroup.subGroups : [];

  const gstOpts = GST_RATES.map(r => ({ value: r, label: `${r}%` }));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-slate-700 animate-spin" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <Topbar title="Bulk Add Items" />
      <main className="flex-1 p-4 space-y-4 w-full">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/masters/items" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Bulk Entry: Items</h2>
              <p className="text-slate-500 text-sm mt-0.5">All fields editable per row — or import from CSV.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
            <button onClick={() => csvInputRef.current?.click()} className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition flex items-center gap-2 shadow-sm">
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-sm transition flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All Items
            </button>
          </div>
        </div>

        {/* Defaults Panel */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Layers className="w-4 h-4" />
              Row Defaults
              <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Set defaults then click "Apply to All" or they pre-fill new rows</span>
            </div>
            <button onClick={applyDefaultsToAll} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition">
              Apply to All Rows
            </button>
          </div>
          <div className="grid grid-cols-8 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Category</label>
              <select value={defaults.category} onChange={e => setDefaults({ ...defaults, category: e.target.value, brand: '', group: '', subGroup: '' })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:border-primary focus:outline-none">
                <option value="">Select...</option>
                {allCatNames.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Brand</label>
              <select value={defaults.brand} onChange={e => setDefaults({ ...defaults, brand: e.target.value, group: '', subGroup: '' })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:border-primary focus:outline-none">
                <option value="">Select...</option>
                {defBrands.map((b: string) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Group</label>
              <select value={defaults.group} onChange={e => setDefaults({ ...defaults, group: e.target.value, subGroup: '' })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:border-primary focus:outline-none">
                <option value="">Select...</option>
                {defGroups.map((g: string) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">SubGroup</label>
              <select value={defaults.subGroup} onChange={e => setDefaults({ ...defaults, subGroup: e.target.value })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:border-primary focus:outline-none">
                <option value="">Select...</option>
                {defSubGroups.map((sg: string) => <option key={sg} value={sg}>{sg}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">HSN Code</label>
              <input value={defaults.hsnCode} onChange={e => setDefaults({ ...defaults, hsnCode: e.target.value })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:border-primary focus:outline-none" placeholder="e.g. 8471" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">GST %</label>
              <select value={defaults.gstRate} onChange={e => setDefaults({ ...defaults, gstRate: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:border-primary focus:outline-none">
                {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Default Unit</label>
              <select value={defaults.unit} onChange={e => setDefaults({ ...defaults, unit: e.target.value })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:border-primary focus:outline-none">
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Supplier</label>
              <select value={defaults.supplierId} onChange={e => setDefaults({ ...defaults, supplierId: e.target.value })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:border-primary focus:outline-none">
                <option value="">None</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Full Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 text-slate-800 font-semibold p-3 border-b border-slate-200 bg-slate-50 text-sm">
            Item Details Grid
            <span className="text-xs font-normal text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">{rows.length} rows</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ minWidth: '3200px' }}>
              <thead>
                <tr className="bg-slate-100 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  {/* Classification */}
                  <th className="p-2 pl-3 font-semibold w-28 bg-purple-50 text-purple-600">Category</th>
                  <th className="p-2 font-semibold w-28 bg-purple-50 text-purple-600">Brand</th>
                  <th className="p-2 font-semibold w-28 bg-purple-50 text-purple-600">Group</th>
                  <th className="p-2 font-semibold w-28 bg-purple-50 text-purple-600">SubGroup</th>
                  {/* Identity */}
                  <th className="p-2 font-semibold w-48 bg-blue-50 text-blue-600">Item Name <span className="text-red-400">*</span></th>
                  <th className="p-2 font-semibold w-36 bg-blue-50 text-blue-600">Print Name</th>
                  <th className="p-2 font-semibold w-28 bg-blue-50 text-blue-600">Code/SKU</th>
                  {/* Pricing */}
                  <th className="p-2 font-semibold w-24 text-right bg-amber-50 text-amber-600">Purchase (₹)</th>
                  <th className="p-2 font-semibold w-24 text-right bg-amber-50 text-amber-600">MRP (₹)</th>
                  <th className="p-2 font-semibold w-24 text-right bg-green-50 text-green-700">Sale 1 (₹)</th>
                  <th className="p-2 font-semibold w-24 text-right bg-green-50 text-green-700">Sale 2 (₹)</th>
                  <th className="p-2 font-semibold w-24 text-right bg-green-50 text-green-700">Sale 3 (₹)</th>
                  <th className="p-2 font-semibold w-24 text-right bg-green-50 text-green-700">Min Sale (₹)</th>
                  <th className="p-2 font-semibold w-20 bg-orange-50 text-orange-600">Discount</th>
                  <th className="p-2 font-semibold w-20 bg-orange-50 text-orange-600">Disc Type</th>
                  {/* Unit & Stock */}
                  <th className="p-2 font-semibold w-24 bg-sky-50 text-sky-600">Unit</th>
                  <th className="p-2 font-semibold w-24 bg-sky-50 text-sky-600">Sec Unit</th>
                  <th className="p-2 font-semibold w-22 text-center bg-sky-50 text-sky-600">Op. Stock</th>
                  <th className="p-2 font-semibold w-24 text-center bg-sky-50 text-sky-600">Stock Value (₹)</th>
                  <th className="p-2 font-semibold w-22 text-center bg-sky-50 text-sky-600">Reorder Lvl</th>
                  <th className="p-2 font-semibold w-22 text-center bg-sky-50 text-sky-600">Low Limit</th>
                  {/* GST */}
                  <th className="p-2 font-semibold w-28 bg-red-50 text-red-600">HSN Code</th>
                  <th className="p-2 font-semibold w-20 bg-red-50 text-red-600">GST %</th>
                  {/* Other */}
                  <th className="p-2 font-semibold w-28 bg-slate-50 text-slate-600">Product Type</th>
                  <th className="p-2 font-semibold w-28 bg-slate-50 text-slate-600">Location/Rack</th>
                  <th className="p-2 font-semibold w-24 bg-slate-50 text-slate-600">Batch No.</th>
                  <th className="p-2 font-semibold w-36 bg-slate-50 text-slate-600">Description</th>
                  {/* Settings */}
                  <th className="p-2 font-semibold w-16 text-center bg-indigo-50 text-indigo-600">Prnt Desc</th>
                  <th className="p-2 font-semibold w-16 text-center bg-indigo-50 text-indigo-600">1-Click</th>
                  <th className="p-2 font-semibold w-16 text-center bg-indigo-50 text-indigo-600">Track</th>
                  <th className="p-2 font-semibold w-16 text-center bg-indigo-50 text-indigo-600">Prnt Batch</th>
                  <th className="p-2 font-semibold w-16 text-center bg-indigo-50 text-indigo-600">Prnt Expiry</th>
                  <th className="p-2 font-semibold w-10 pr-3 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition ${index % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                    {/* Classification */}
                    <td className="p-1.5 pl-3 bg-purple-50/30"><TI row={row} field="category" updateRow={updateRow} placeholder="Category" cls="text-purple-700" /></td>
                    <td className="p-1.5 bg-purple-50/30"><TI row={row} field="brand" updateRow={updateRow} placeholder="Brand" cls="text-purple-700" /></td>
                    <td className="p-1.5 bg-purple-50/30"><TI row={row} field="group" updateRow={updateRow} placeholder="Group" cls="text-purple-700" /></td>
                    <td className="p-1.5 bg-purple-50/30"><TI row={row} field="subGroup" updateRow={updateRow} placeholder="SubGroup" cls="text-purple-700" /></td>
                    {/* Identity */}
                    <td className="p-1.5 bg-blue-50/20">
                      <input value={row.name} onChange={e => updateRow(row.id, 'name', e.target.value)} placeholder="Product Name *"
                        className="w-full px-2 py-1.5 rounded bg-white border border-blue-200 focus:border-blue-500 focus:outline-none text-xs shadow-sm font-semibold text-slate-800"
                        autoFocus={index === rows.length - 1} />
                    </td>
                    <td className="p-1.5 bg-blue-50/20"><TI row={row} field="printName" updateRow={updateRow} placeholder="Print Name" /></td>
                    <td className="p-1.5 bg-blue-50/20"><TI row={row} field="sku" updateRow={updateRow} placeholder="SKU" cls="font-mono text-slate-600" /></td>
                    {/* Pricing */}
                    <td className="p-1.5 bg-amber-50/20"><TI row={row} field="purchasePrice" updateRow={updateRow} type="number" placeholder="0" cls="text-right text-amber-700 font-medium" /></td>
                    <td className="p-1.5 bg-amber-50/20"><TI row={row} field="mrp" updateRow={updateRow} type="number" placeholder="0" cls="text-right text-slate-600" /></td>
                    <td className="p-1.5 bg-green-50/20"><TI row={row} field="sellingPrice" updateRow={updateRow} type="number" placeholder="0" cls="text-right font-bold text-green-700" /></td>
                    <td className="p-1.5 bg-green-50/20"><TI row={row} field="sellingPrice2" updateRow={updateRow} type="number" placeholder="0" cls="text-right text-purple-600" /></td>
                    <td className="p-1.5 bg-green-50/20"><TI row={row} field="sellingPrice3" updateRow={updateRow} type="number" placeholder="0" cls="text-right text-primary" /></td>
                    <td className="p-1.5 bg-green-50/20"><TI row={row} field="minSalePrice" updateRow={updateRow} type="number" placeholder="0" cls="text-right text-slate-600" /></td>
                    <td className="p-1.5 bg-orange-50/20"><TI row={row} field="saleDiscount" updateRow={updateRow} type="number" placeholder="0" cls="text-center text-orange-600" /></td>
                    <td className="p-1.5 bg-orange-50/20">
                      <TS row={row} field="saleDiscountType" updateRow={updateRow} options={[{ value: 'percentage', label: '%' }, { value: 'amount', label: '₹' }]} />
                    </td>
                    {/* Unit & Stock */}
                    <td className="p-1.5 bg-sky-50/20">
                      <select value={row.unit || 'Nos'} onChange={e => updateRow(row.id, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-xs shadow-sm appearance-none">
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="p-1.5 bg-sky-50/20"><TI row={row} field="secondaryUnit" updateRow={updateRow} placeholder="e.g. Mtr" /></td>
                    <td className="p-1.5 bg-sky-50/20"><TI row={row} field="openingStock" updateRow={updateRow} type="number" placeholder="0" cls="text-center text-blue-600 font-medium" /></td>
                    <td className="p-1.5 bg-sky-50/20"><TI row={row} field="openingStockValue" updateRow={updateRow} type="number" placeholder="0" cls="text-center text-blue-600" /></td>
                    <td className="p-1.5 bg-sky-50/20"><TI row={row} field="reorderLevel" updateRow={updateRow} type="number" placeholder="5" cls="text-center" /></td>
                    <td className="p-1.5 bg-sky-50/20"><TI row={row} field="lowLevelLimit" updateRow={updateRow} type="number" placeholder="0" cls="text-center" /></td>
                    {/* GST */}
                    <td className="p-1.5 bg-red-50/20"><TI row={row} field="hsnCode" updateRow={updateRow} placeholder="HSN" cls="font-mono text-slate-600" /></td>
                    <td className="p-1.5 bg-red-50/20">
                      <select value={row.gstRate ?? 0} onChange={e => updateRow(row.id, 'gstRate', e.target.value)}
                        className="w-full px-2 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-xs shadow-sm appearance-none">
                        {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </td>
                    {/* Other */}
                    <td className="p-1.5">
                      <select value={row.productType || 'General'} onChange={e => updateRow(row.id, 'productType', e.target.value)}
                        className="w-full px-2 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-xs shadow-sm appearance-none">
                        {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="p-1.5"><TI row={row} field="location" updateRow={updateRow} placeholder="Rack / Shelf" /></td>
                    <td className="p-1.5"><TI row={row} field="batchNo" updateRow={updateRow} placeholder="B001" cls="font-mono" /></td>
                    <td className="p-1.5"><TI row={row} field="description" updateRow={updateRow} placeholder="Description..." /></td>
                    {/* Settings */}
                    <td className="p-1.5 bg-indigo-50/20"><TC row={row} field="printDescription" updateRow={updateRow} /></td>
                    <td className="p-1.5 bg-indigo-50/20"><TC row={row} field="oneClickSale" updateRow={updateRow} /></td>
                    <td className="p-1.5 bg-indigo-50/20"><TC row={row} field="enableTracking" updateRow={updateRow} /></td>
                    <td className="p-1.5 bg-indigo-50/20"><TC row={row} field="printBatchNo" updateRow={updateRow} /></td>
                    <td className="p-1.5 bg-indigo-50/20"><TC row={row} field="printExpiryDate" updateRow={updateRow} /></td>
                    <td className="p-1.5 pr-3 text-center">
                      <button onClick={() => removeRow(row.id)} disabled={rows.length === 1}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition disabled:opacity-30">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button onClick={addRow} className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition">
              <Plus className="w-4 h-4" /> Add Row
            </button>
            <span className="text-xs text-slate-400">Scroll horizontally to see all fields →</span>
          </div>
        </div>

      </main>
    </div>
  );
}
