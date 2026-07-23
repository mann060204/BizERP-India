'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Save, ChevronRight, Factory, Package, Layers, RefreshCw, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { bomApi, productsApi } from '../../../../lib/erp-api';
import Topbar from '../../../../components/layout/Topbar';

type Product = { _id: string; name: string; productType: string; unit: string; purchasePrice: number; currentStock: number; secondaryUnit?: string; conversionRate?: number; };
type BOMLine = {
  productId: string; productName: string;
  unit: string; secondaryUnit?: string; conversionRate?: number;
  quantity: number; costPerUnit: number; totalCost: number;
  currentStock?: number; productType?: string;
  qtyUnitType: 'MAIN' | 'SECOND';  // which unit was qty entered in
};

const TYPE_BADGE: Record<string, string> = {
  'Raw Material': 'bg-red-100 text-red-700 border border-red-200',
  'Finished Good': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'WIP Component': 'bg-amber-100 text-amber-700 border border-amber-200',
  'General': 'bg-slate-100 text-slate-600 border border-slate-200',
};
const TYPE_LABEL: Record<string, string> = { 'Raw Material': 'RM', 'Finished Good': 'FG', 'WIP Component': 'SFG', 'General': 'GEN' };

export default function BOMPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedFG, setSelectedFG] = useState<Product | null>(null);
  const [bom, setBom] = useState<any>(null);
  const [components, setComponents] = useState<BOMLine[]>([]);
  const [directLaborCost, setDirectLaborCost] = useState(0);
  const [overhead, setOverhead] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fgSearch, setFgSearch] = useState('');

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const res = await productsApi.list({ limit: 500 });
      setProducts(res.data.products || []);
    } catch { toast.error('Failed to load products'); }
  };

  const fgProducts = products.filter(p => p.productType === 'Finished Good' || p.productType === 'WIP Component');
  const rmProducts = products.filter(p => p.productType !== 'Finished Good');
  const filteredFG = fgProducts.filter(p => p.name.toLowerCase().includes(fgSearch.toLowerCase()));

  const selectFG = useCallback(async (prod: Product) => {
    setSelectedFG(prod);
    setLoading(true);
    try {
      const res = await bomApi.getByProduct(prod._id);
      const existingBom = res.data.bom;
      if (existingBom) {
        setBom(existingBom);
        setComponents(existingBom.components.map((c: any) => ({
          ...c,
          qtyUnitType: c.qtyUnitType || 'MAIN',
          secondaryUnit: c.secondaryUnit || null,
          conversionRate: c.conversionRate || null,
          totalCost: c.quantity * c.costPerUnit,
        })));
        setDirectLaborCost(existingBom.directLaborCost || 0);
        setOverhead(existingBom.manufacturingOverhead || 0);
      } else {
        setBom(null); setComponents([]); setDirectLaborCost(0); setOverhead(0);
      }
    } catch { toast.error('Failed to load BOM'); }
    finally { setLoading(false); }
  }, []);

  const addLine = () => setComponents(prev => [...prev, { productId: '', productName: '', unit: 'Nos', quantity: 1, costPerUnit: 0, totalCost: 0, qtyUnitType: 'MAIN' }]);

  const updateLine = (idx: number, field: string, value: any) => {
    setComponents(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'productId') {
        const prod = products.find(p => p._id === value) as any;
        if (prod) {
          updated[idx].productName = prod.name;
          updated[idx].unit = prod.unit || 'Nos';
          updated[idx].secondaryUnit = prod.secondaryUnit || null;
          updated[idx].conversionRate = prod.conversionRate || null;
          updated[idx].costPerUnit = prod.purchasePrice || 0;
          updated[idx].currentStock = prod.currentStock;
          updated[idx].productType = prod.productType;
          updated[idx].qtyUnitType = 'MAIN'; // reset to main unit when product changes
        }
      }
      updated[idx].totalCost = (updated[idx].quantity || 0) * (updated[idx].costPerUnit || 0);
      return updated;
    });
  };

  const removeLine = (idx: number) => setComponents(prev => prev.filter((_, i) => i !== idx));

  const materialCost = components.reduce((acc, c) => acc + c.totalCost, 0);
  const totalCostPerUnit = materialCost + Number(directLaborCost) + Number(overhead);

  const handleSave = async () => {
    if (!selectedFG) return toast.error('Select a Finished Good first');
    if (components.length === 0) return toast.error('Add at least one RM component');
    for (const c of components) {
      if (!c.productId) return toast.error('Select a product for all component rows');
      if (c.quantity <= 0) return toast.error('Qty must be > 0 for all rows');
      // Fix 4: Block save when Second Unit is selected but conversion rate is not configured
      if (c.qtyUnitType === 'SECOND' && (!c.conversionRate || c.conversionRate <= 0)) {
        return toast.error(
          `"${c.productName || 'A component'}": Conversion rate not set. Cannot use ${c.secondaryUnit || 'Second Unit'} — set the rate in Item Master first.`
        );
      }
    }
    setSaving(true);
    try {
      await bomApi.saveForProduct(selectedFG._id, { components, directLaborCost, manufacturingOverhead: overhead });
      toast.success(`BOM saved for ${selectedFG.name}`);
      selectFG(selectedFG);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save BOM');
    } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-base,#f8fafc)]">
      <Topbar title="Bill of Materials" />
      <div className="flex flex-1 overflow-hidden">

        {/* ─── Left Panel: FG Product List ─── */}
        <div className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-3 border-b border-slate-200">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Finished Goods &amp; SFG</p>
            <input
              type="text" placeholder="Search products..." value={fgSearch}
              onChange={e => setFgSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredFG.length === 0 ? (
              <div className="p-4 text-xs space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
                  <p className="font-bold mb-1 flex items-center gap-1">⚠ No Finished Goods found</p>
                  <p className="leading-relaxed">Your products exist but none are tagged as <strong>Finished Good</strong> or <strong>WIP Component</strong> yet.</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-600 space-y-2">
                  <p className="font-bold text-slate-700">How to fix:</p>
                  <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                    <li>Go to <strong>Master → Items</strong></li>
                    <li>Edit each product</li>
                    <li>Set <strong>Product Type</strong> to:<br />
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">Finished Good</span> — for end products<br />
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">Raw Material</span> — for RM components<br />
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">WIP Component</span> — for SFG
                    </li>
                  </ol>
                  <a href="/dashboard/masters/items" className="block mt-2 text-center text-primary font-semibold bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition">
                    → Open Item Master
                  </a>
                </div>
              </div>
            ) : filteredFG.map(prod => (
              <button key={prod._id} onClick={() => selectFG(prod)}
                className={`w-full text-left px-3 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition flex items-center justify-between group ${selectedFG?._id === prod._id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-slate-800 truncate">{prod.name}</p>
                  <p className="text-[10px] text-slate-500">Stock: {prod.currentStock ?? 0} {prod.unit}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${TYPE_BADGE[prod.productType] || TYPE_BADGE.General}`}>
                    {TYPE_LABEL[prod.productType] || 'GEN'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Main BOM Editor ─── */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {!selectedFG ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-slate-400">
              <Layers className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-lg font-semibold text-slate-500">Select a Finished Good</p>
              <p className="text-sm mt-1">Choose a product from the left panel to view or edit its Bill of Materials.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{selectedFG.name}</h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${TYPE_BADGE[selectedFG.productType] || TYPE_BADGE.General}`}>
                      {selectedFG.productType}
                    </span>
                    {bom && <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">{bom.bomNumber}</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Current Stock: <strong>{selectedFG.currentStock ?? 0} {selectedFG.unit}</strong>
                    {!bom && <span className="ml-3 text-amber-600 font-medium">⚠ No BOM yet — save below to create one</span>}
                  </p>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-xl hover:bg-primary-hover transition text-sm font-semibold shadow disabled:opacity-50">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save BOM
                </button>
              </div>

              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="flex-1 p-6 space-y-5">

                  {/* Components Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-semibold text-slate-700">Raw Materials / Components</span>
                        <span className="text-xs text-slate-400">({components.length} items)</span>
                      </div>
                      <button onClick={addLine}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition">
                        <Plus className="w-3.5 h-3.5" /> Add Row
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-medium uppercase tracking-wider">
                            <th className="px-4 py-2.5 text-left w-8">#</th>
                            <th className="px-4 py-2.5 text-left">Raw Material / Component</th>
                            <th className="px-4 py-2.5 text-left w-28">Unit Type</th>
                            <th className="px-4 py-2.5 text-right w-32">Qty / 1 FG</th>
                            <th className="px-4 py-2.5 text-right w-32">Rate (₹)</th>
                            <th className="px-4 py-2.5 text-right w-32">Amount (₹)</th>
                            <th className="px-4 py-2.5 text-center w-20">In Stock</th>
                            <th className="px-4 py-2.5 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {components.map((comp, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition group">
                              <td className="px-4 py-2 text-slate-400 text-xs">{idx + 1}</td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <select value={comp.productId} onChange={e => updateLine(idx, 'productId', e.target.value)}
                                    className="w-full min-w-[200px] px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                                    <option value="">— Select Material —</option>
                                    {rmProducts.map(p => (
                                      <option key={p._id} value={p._id} disabled={p._id === selectedFG._id}>
                                        {p.name} ({p.productType === 'WIP Component' ? 'SFG' : 'RM'})
                                      </option>
                                    ))}
                                  </select>
                                  {comp.productType === 'WIP Component' && (
                                    <span className="text-[9px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold whitespace-nowrap flex items-center gap-0.5">
                                      <Info className="w-2.5 h-2.5" /> SFG nested
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                {comp.secondaryUnit ? (
                                  // Dual-unit toggle: MAIN / SECOND
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => updateLine(idx, 'qtyUnitType', 'MAIN')}
                                      className={`px-2 py-1 text-[10px] font-bold rounded-l-md border transition ${
                                        comp.qtyUnitType !== 'SECOND'
                                          ? 'bg-emerald-600 text-white border-emerald-600'
                                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                      }`}
                                      title={`Main unit: ${comp.unit}`}
                                    >{comp.unit}</button>
                                    <button
                                      onClick={() => updateLine(idx, 'qtyUnitType', 'SECOND')}
                                      className={`px-2 py-1 text-[10px] font-bold rounded-r-md border-t border-b border-r transition ${
                                        comp.qtyUnitType === 'SECOND'
                                          ? 'bg-blue-600 text-white border-blue-600'
                                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                      }`}
                                      title={`Second unit: ${comp.secondaryUnit}`}
                                    >{comp.secondaryUnit}</button>
                                  </div>
                                ) : (
                                  <input value={comp.unit} onChange={e => updateLine(idx, 'unit', e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <input type="number" min="0.001" step="0.001" value={comp.quantity || ''}
                                  onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-right" />
                                { /* Fix 3: Live conversion preview — shown when Second Unit is active */ }
                                {comp.qtyUnitType === 'SECOND' && comp.conversionRate && comp.conversionRate > 0 && comp.quantity > 0 && (
                                  <div className="mt-1 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 text-right font-semibold">
                                    ≈ {(comp.quantity * comp.conversionRate).toFixed(2)} {comp.unit} will be deducted
                                  </div>
                                )}
                                { /* Warn when Second Unit selected but no conversion rate */ }
                                {comp.qtyUnitType === 'SECOND' && (!comp.conversionRate || comp.conversionRate <= 0) && (
                                  <div className="mt-1 text-[10px] text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 text-right font-semibold">
                                    ⚠ No conversion rate — set in Item Master
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <input type="number" min="0" step="0.01" value={comp.costPerUnit || ''}
                                  onChange={e => updateLine(idx, 'costPerUnit', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-right" />
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-slate-700">
                                ₹{comp.totalCost.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {comp.productId && (
                                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${(comp.currentStock ?? 0) > 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-600 bg-red-50 border border-red-200'}`}>
                                    {comp.currentStock ?? 0}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button onClick={() => removeLine(idx)} className="p-1 text-slate-200 hover:text-red-500 transition rounded group-hover:text-slate-400">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {components.length === 0 && (
                            <tr>
                              <td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">
                                Click &quot;Add Row&quot; to add raw materials to this BOM.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cost Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4">Additional Costs (per unit FG)</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <label className="text-sm text-slate-600 w-44 shrink-0">Direct Labor Cost (₹)</label>
                          <input type="number" min="0" value={directLaborCost}
                            onChange={e => setDirectLaborCost(parseFloat(e.target.value) || 0)}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-right" />
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-sm text-slate-600 w-44 shrink-0">Manufacturing Overhead (₹)</label>
                          <input type="number" min="0" value={overhead}
                            onChange={e => setOverhead(parseFloat(e.target.value) || 0)}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-right" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 p-5">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4">💡 Cost Summary (per 1 unit FG)</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-slate-600">
                          <span>Material Cost</span>
                          <span className="font-medium">₹{materialCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Direct Labor</span>
                          <span className="font-medium">₹{Number(directLaborCost).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Manufacturing Overhead</span>
                          <span className="font-medium">₹{Number(overhead).toFixed(2)}</span>
                        </div>
                        <div className="border-t border-primary/20 pt-2 mt-2 flex justify-between font-bold text-base text-primary">
                          <span>Total Cost per Unit FG</span>
                          <span>₹{totalCostPerUnit.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
