'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../../../../components/layout/Topbar';
import { businessApi, productsApi, suppliersApi } from '../../../../../lib/erp-api';
import { Loader2, Save, Plus, Trash2, ArrowLeft, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const GST_RATES = [0, 5, 12, 18, 28];
const FALLBACK_UNITS = ['Nos', 'Bags', 'Bale', 'Box', 'Bottles', 'Cartons', 'Dozens', 'Grams', 'Kilograms', 'Liters', 'Meters', 'Packs', 'Pieces', 'Pairs', 'Rolls', 'Sets'];

export default function BulkAddItemsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile data for dropdowns
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [units, setUnits] = useState<string[]>(FALLBACK_UNITS);

  // Common Fields State
  const [common, setCommon] = useState({
    category: '',
    brand: '',
    group: '',
    subGroup: '',
    gstRate: 0,
    hsnCode: '',
    unit: 'Nos',
    supplierId: ''
  });

  // Grid State
  const emptyRow = { id: Date.now(), name: '', sku: '', purchasePrice: 0, sellingPrice: 0, sellingPrice2: 0, sellingPrice3: 0, mrp: 0, openingStock: 0, reorderLevel: 5, location: '', batchNo: '' };
  const [rows, setRows] = useState<any[]>([emptyRow]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profRes, supRes] = await Promise.all([
          businessApi.getProfile(),
          suppliersApi.list({ limit: 1000 })
        ]);
        
        const rawCats = profRes.data.business?.productCategories || [];
        // Map 4-level taxonomy safely
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
        
        if (profRes.data.business?.productUnits?.length) {
          setUnits(profRes.data.business.productUnits);
        }
        
        if (supRes.data?.suppliers) {
          setSuppliers(supRes.data.suppliers);
        }
      } catch (e) {
        toast.error('Failed to load required data for dropdowns');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addRow = () => {
    setRows([...rows, { ...emptyRow, id: Date.now() }]);
  };

  const removeRow = (id: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  const updateRow = (id: number, field: string, value: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    const validRows = rows.filter(r => r.name.trim() !== '');
    if (validRows.length === 0) {
      toast.error('Please enter at least one item name');
      return;
    }

    setSaving(true);
    try {
      const payload = validRows.map(r => ({
        ...common,
        name: r.name,
        sku: r.sku,
        purchasePrice: Number(r.purchasePrice) || 0,
        sellingPrice: Number(r.sellingPrice) || 0,
        sellingPrice2: Number(r.sellingPrice2) || 0,
        sellingPrice3: Number(r.sellingPrice3) || 0,
        mrp: Number(r.mrp) || 0,
        openingStock: Number(r.openingStock) || 0,
        currentStock: Number(r.openingStock) || 0,
        reorderLevel: Number(r.reorderLevel) || 0,
        location: r.location || '',
        batchNo: r.batchNo || '',
        type: 'product',
        productType: 'General'
      }));

      await productsApi.bulkCreate({ products: payload });
      toast.success(`${payload.length} items added successfully!`);
      router.push('/dashboard/masters/items');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to bulk create items');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-slate-700 animate-spin" /></div>;

  // Derive cascading dropdowns
  const availableCategories = productCategories.map(c => c.name);
  const currentCat = productCategories.find(c => c.name === common.category);
  const availableBrands = currentCat ? (currentCat.brands || []).map((b: any) => b.name) : [];
  const currentBrand = (currentCat?.brands || []).find((b: any) => b.name === common.brand);
  const availableGroups = currentBrand ? (currentBrand.groups || []).map((g: any) => g.name) : [];
  const currentGroup = (currentBrand?.groups || []).find((g: any) => g.name === common.group);
  const availableSubGroups = currentGroup ? (currentGroup.subGroups || []) : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <Topbar title="Bulk Add Items" />
      <main className="flex-1 p-6 space-y-6 w-full max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/masters/items" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Bulk Entry: Items</h2>
              <p className="text-slate-500 text-sm mt-0.5">Quickly add multiple items sharing the same category and taxonomy.</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-sm transition flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All Items
          </button>
        </div>

        {/* Top Section: Common Fields */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold border-b border-slate-100 pb-3 mb-4">
            <Layers className="w-5 h-5" />
            Step 1: Set Common Fields
            <span className="ml-2 text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-md">These apply to all items below</span>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {/* Taxonomy */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Category</label>
              <select value={common.category} onChange={e => setCommon({ ...common, category: e.target.value, brand: '', group: '', subGroup: '' })} className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:border-primary focus:outline-none">
                <option value="">Select...</option>
                {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Brand</label>
              <select value={common.brand} onChange={e => setCommon({ ...common, brand: e.target.value, group: '', subGroup: '' })} className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:border-primary focus:outline-none">
                <option value="">Select...</option>
                {availableBrands.map((b: any) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Group</label>
              <select value={common.group} onChange={e => setCommon({ ...common, group: e.target.value, subGroup: '' })} className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:border-primary focus:outline-none">
                <option value="">Select...</option>
                {availableGroups.map((g: any) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">SubGroup</label>
              <select value={common.subGroup} onChange={e => setCommon({ ...common, subGroup: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:border-primary focus:outline-none">
                <option value="">Select...</option>
                {availableSubGroups.map((sg: any) => <option key={sg} value={sg}>{sg}</option>)}
              </select>
            </div>

            {/* Other Config */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">HSN Code</label>
              <input value={common.hsnCode} onChange={e => setCommon({ ...common, hsnCode: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:border-primary focus:outline-none" placeholder="e.g. 8471" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">GST %</label>
              <select value={common.gstRate} onChange={e => setCommon({ ...common, gstRate: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:border-primary focus:outline-none">
                {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Default Unit</label>
              <select value={common.unit} onChange={e => setCommon({ ...common, unit: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:border-primary focus:outline-none">
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Supplier</label>
              <select value={common.supplierId} onChange={e => setCommon({ ...common, supplierId: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:border-primary focus:outline-none">
                <option value="">Select supplier...</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Bottom Section: Dynamic Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 text-slate-800 font-semibold p-4 border-b border-slate-200 bg-slate-50">
            Step 2: Enter Item Details
            <span className="ml-2 text-xs font-normal text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">{rows.length} items to add</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1800px]">
              <thead>
                <tr className="bg-slate-100/50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="font-semibold p-3 pl-4">Item Name <span className="text-red-400">*</span></th>
                  <th className="font-semibold p-3 w-28">Code/SKU</th>
                  <th className="font-semibold p-3 w-28 text-right">Purchase (₹)</th>
                  <th className="font-semibold p-3 w-28 text-right">Sale Price 1 (₹)</th>
                  <th className="font-semibold p-3 w-28 text-right">Sale Price 2 (₹)</th>
                  <th className="font-semibold p-3 w-28 text-right">Sale Price 3 (₹)</th>
                  <th className="font-semibold p-3 w-28 text-right">MRP (₹)</th>
                  <th className="font-semibold p-3 w-24 text-center">Op. Stock</th>
                  <th className="font-semibold p-3 w-24 text-center">Min Stock</th>
                  <th className="font-semibold p-3 w-32">Location/Rack</th>
                  <th className="font-semibold p-3 w-32">Batch No.</th>
                  <th className="font-semibold p-3 w-12 pr-4 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="p-2 pl-4">
                      <input value={row.name} onChange={e => updateRow(row.id, 'name', e.target.value)} placeholder="Product Name" 
                        className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-sm shadow-sm" autoFocus={index === rows.length - 1} />
                    </td>
                    <td className="p-2">
                      <input value={row.sku} onChange={e => updateRow(row.id, 'sku', e.target.value)} placeholder="SKU" 
                        className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-sm shadow-sm font-mono text-slate-600" />
                    </td>
                    <td className="p-2">
                      <input type="number" min="0" value={row.purchasePrice || ''} onChange={e => updateRow(row.id, 'purchasePrice', e.target.value)} placeholder="0" 
                        className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-sm text-right shadow-sm font-medium text-amber-600" />
                    </td>
                    <td className="p-2">
                      <input type="number" min="0" value={row.sellingPrice || ''} onChange={e => updateRow(row.id, 'sellingPrice', e.target.value)} placeholder="0" 
                        className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-sm text-right shadow-sm font-bold text-slate-800" />
                    </td>
                    <td className="p-2">
                      <input type="number" min="0" value={row.sellingPrice2 || ''} onChange={e => updateRow(row.id, 'sellingPrice2', e.target.value)} placeholder="0" 
                        className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-sm text-right shadow-sm font-medium text-purple-600" />
                    </td>
                    <td className="p-2">
                      <input type="number" min="0" value={row.sellingPrice3 || ''} onChange={e => updateRow(row.id, 'sellingPrice3', e.target.value)} placeholder="0" 
                        className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-sm text-right shadow-sm font-medium text-primary" />
                    </td>
                    <td className="p-2">
                      <input type="number" min="0" value={row.mrp || ''} onChange={e => updateRow(row.id, 'mrp', e.target.value)} placeholder="0" 
                        className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-sm text-right shadow-sm text-slate-600" />
                    </td>
                    <td className="p-2">
                      <input type="number" min="0" value={row.openingStock || ''} onChange={e => updateRow(row.id, 'openingStock', e.target.value)} placeholder="0" 
                        className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-sm text-center shadow-sm font-medium text-blue-600" />
                    </td>
                    <td className="p-2">
                      <input type="number" min="0" value={row.reorderLevel || ''} onChange={e => updateRow(row.id, 'reorderLevel', e.target.value)} placeholder="0" 
                        className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-sm text-center shadow-sm text-slate-600" />
                    </td>
                    <td className="p-2">
                      <input value={row.location || ''} onChange={e => updateRow(row.id, 'location', e.target.value)} placeholder="Rack / Shelf" 
                        className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-sm shadow-sm text-slate-600" />
                    </td>
                    <td className="p-2">
                      <input value={row.batchNo || ''} onChange={e => updateRow(row.id, 'batchNo', e.target.value)} placeholder="e.g. B001" 
                        className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 focus:border-primary focus:outline-none text-sm shadow-sm font-mono text-slate-600" />
                    </td>
                    <td className="p-2 pr-4 text-center">
                      <button onClick={() => removeRow(row.id)} disabled={rows.length === 1} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition disabled:opacity-30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <button onClick={addRow} className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition">
              <Plus className="w-4 h-4" /> Add Another Row
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
