// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../../../../components/layout/Topbar';
import { bomApi, manufacturingApi } from '../../../../../lib/erp-api';
import { Factory, Save, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DirectManufacturingJournal() {
  const router = useRouter();
  const [boms, setBoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedBomId, setSelectedBomId] = useState('');
  const [bom, setBom] = useState<any>(null);
  const [qtyToProduce, setQtyToProduce] = useState(1);

  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [scrapItems, setScrapItems] = useState<any[]>([]);
  const [laborCost, setLaborCost] = useState(0);
  const [overheadCost, setOverheadCost] = useState(0);

  useEffect(() => {
    bomApi.getAll().then(res => {
      setBoms(res.data.boms || []);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load BOMs');
      setLoading(false);
    });
  }, []);

  const handleBomChange = (bomId: string) => {
    setSelectedBomId(bomId);
    const selected = boms.find(b => b._id === bomId);
    if (selected) {
      setBom(selected);
      setQtyToProduce(1);
      setRawMaterials(selected.components.map((c: any) => ({
        ...c,
        quantityRequired: c.quantity,
        totalCost: c.quantity * c.costPerUnit
      })));
      setScrapItems((selected.scrapItems || []).map((s: any) => ({
        ...s,
        totalRecoveryValue: s.quantity * s.recoveryCostPerUnit
      })));
      setLaborCost(selected.directLaborCost || 0);
      setOverheadCost(selected.manufacturingOverhead || 0);
    } else {
      setBom(null);
      setRawMaterials([]);
      setScrapItems([]);
    }
  };

  const handleQtyChange = (qty: number) => {
    setQtyToProduce(qty);
    if (bom) {
      setRawMaterials(bom.components.map((c: any) => ({
        ...c,
        quantityRequired: c.quantity * qty,
        totalCost: c.quantity * qty * c.costPerUnit
      })));
      setScrapItems((bom.scrapItems || []).map((s: any) => ({
        ...s,
        quantity: s.quantity * qty,
        totalRecoveryValue: s.quantity * qty * s.recoveryCostPerUnit
      })));
      setLaborCost((bom.directLaborCost || 0) * qty);
      setOverheadCost((bom.manufacturingOverhead || 0) * qty);
    }
  };

  const handleSave = async () => {
    if (!bom) return toast.error('Select a BOM');
    if (qtyToProduce <= 0) return toast.error('Quantity must be > 0');

    setSaving(true);
    try {
      await manufacturingApi.createDirect({
        bomId: bom._id,
        productId: bom.productId,
        productName: bom.productName,
        quantityToProduce: qtyToProduce,
        rawMaterials: rawMaterials,
        scrapItems: scrapItems,
        actualLaborCost: laborCost,
        actualOverhead: overheadCost,
      });
      toast.success('Direct Manufacturing Journal Created!');
      router.push('/dashboard/manufacturing/orders'); // Or to journal list if it exists
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const totalRmCost = rawMaterials.reduce((acc, c) => acc + c.totalCost, 0);
  const totalScrapValue = scrapItems.reduce((acc, s) => acc + s.totalRecoveryValue, 0);
  const effectiveCost = totalRmCost - totalScrapValue + laborCost + overheadCost;
  const costPerUnit = qtyToProduce > 0 ? effectiveCost / qtyToProduce : 0;

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary-500" /></div>;

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      <Topbar 
        title="Direct Manufacturing Journal" 
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="erp-button bg-white text-slate-700 border border-slate-200">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <button onClick={handleSave} disabled={saving} className="erp-button bg-primary-600 text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Process Journal
            </button>
          </div>
        } 
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary-100 text-primary-600 rounded-lg">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Finished Goods Details</h2>
                <p className="text-sm text-slate-500">Select BOM and quantity to produce</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="erp-label">Bill of Materials (BOM)</label>
                <select className="erp-input w-full" value={selectedBomId} onChange={e => handleBomChange(e.target.value)}>
                  <option value="">Select BOM...</option>
                  {boms.map(b => (
                    <option key={b._id} value={b._id}>{b.productName} ({b.bomNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="erp-label">Quantity to Produce</label>
                <input 
                  type="number" min="1" 
                  className="erp-input w-full font-bold text-primary-700" 
                  value={qtyToProduce} 
                  onChange={e => handleQtyChange(Number(e.target.value))} 
                />
              </div>
              <div>
                <label className="erp-label">Batch No. (Auto)</label>
                <input className="erp-input w-full bg-slate-50" value="MFG-Auto" disabled />
              </div>
              <div>
                <label className="erp-label">Date</label>
                <input type="date" className="erp-input w-full" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Pane: Raw Materials */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-800">Components Consumed (Source)</h3>
              </div>
              <div className="p-4 flex-1">
                <div className="overflow-x-auto w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="pb-2 font-medium">Item</th>
                      <th className="pb-2 font-medium">Qty</th>
                      <th className="pb-2 font-medium text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawMaterials.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-slate-400">No components</td></tr>}
                    {rawMaterials.map((rm, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="py-2">{rm.productName}</td>
                        <td className="py-2">
                          <input 
                            type="number" 
                            className="erp-input w-20 py-1" 
                            value={rm.quantityRequired}
                            onChange={e => {
                              const newRm = [...rawMaterials];
                              newRm[i].quantityRequired = Number(e.target.value);
                              newRm[i].totalCost = newRm[i].quantityRequired * newRm[i].costPerUnit;
                              setRawMaterials(newRm);
                            }}
                          /> {rm.unit}
                        </td>
                        <td className="py-2 text-right">₹{rm.totalCost.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between font-bold text-slate-700">
                <span>Total Component Cost:</span>
                <span>₹{totalRmCost.toFixed(3)}</span>
              </div>
            </div>

            {/* Right Pane: Scrap / By-Products */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-800">Scrap / By-Products (Destination)</h3>
              </div>
              <div className="p-4 flex-1">
                <div className="overflow-x-auto w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="pb-2 font-medium">Item</th>
                      <th className="pb-2 font-medium">Qty</th>
                      <th className="pb-2 font-medium text-right">Recovery Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scrapItems.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-slate-400">No scrap items generated</td></tr>}
                    {scrapItems.map((s, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="py-2">{s.productName}</td>
                        <td className="py-2">
                          <input 
                            type="number" 
                            className="erp-input w-20 py-1" 
                            value={s.quantity}
                            onChange={e => {
                              const newScrap = [...scrapItems];
                              newScrap[i].quantity = Number(e.target.value);
                              newScrap[i].totalRecoveryValue = newScrap[i].quantity * newScrap[i].recoveryCostPerUnit;
                              setScrapItems(newScrap);
                            }}
                          /> {s.unit}
                        </td>
                        <td className="py-2 text-right">₹{s.totalRecoveryValue.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between font-bold text-slate-700">
                <span>Total Scrap Value:</span>
                <span className="text-emerald-600">-₹{totalScrapValue.toFixed(3)}</span>
              </div>
            </div>
          </div>

          {/* Footer: Costs & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Additional Costs</h3>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">Direct Labor</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-100 border border-slate-300 border-r-0 rounded-l-md text-slate-500 text-sm">₹</span>
                  <input type="number" className="erp-input rounded-l-none text-right" value={laborCost} onChange={e => setLaborCost(Number(e.target.value))} />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">Manufacturing Overhead</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-100 border border-slate-300 border-r-0 rounded-l-md text-slate-500 text-sm">₹</span>
                  <input type="number" className="erp-input rounded-l-none text-right" value={overheadCost} onChange={e => setOverheadCost(Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl shadow-lg text-white space-y-4">
              <h3 className="font-bold border-b border-slate-700 pb-2 text-slate-300">Effective Cost Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Component Cost:</span>
                <span>₹{totalRmCost.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Scrap Recovery:</span>
                <span className="text-emerald-400">-₹{totalScrapValue.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Additional Costs:</span>
                <span>₹{(laborCost + overheadCost).toFixed(3)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                <span className="text-lg font-bold">Effective Cost:</span>
                <span className="text-2xl font-black text-primary-400">₹{effectiveCost.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 pt-2">
                <span>Effective Rate / Unit:</span>
                <span>₹{costPerUnit.toFixed(3)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
