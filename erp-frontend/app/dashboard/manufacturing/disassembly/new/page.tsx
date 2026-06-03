// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../../../../components/layout/Topbar';
import { bomApi, manufacturingApi, productsApi } from '../../../../../lib/erp-api';
import { RefreshCcw, Save, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReverseManufacturingJournal() {
  const router = useRouter();
  const [boms, setBoms] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedBatchNo, setSelectedBatchNo] = useState('');
  const [qtyToDisassemble, setQtyToDisassemble] = useState(1);
  const [bom, setBom] = useState<any>(null);

  const [rawMaterials, setRawMaterials] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      bomApi.getAll(),
      productsApi.list()
    ]).then(([bomRes, prodRes]) => {
      setBoms(bomRes.data.boms || []);
      setProducts(prodRes.data.products || []);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load data');
      setLoading(false);
    });
  }, []);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    setSelectedBatchNo('');
    // Find default BOM for this product
    const defaultBom = boms.find(b => b.productId === prodId);
    if (defaultBom) {
      setBom(defaultBom);
      handleQtyChange(1, defaultBom);
    } else {
      setBom(null);
      setRawMaterials([]);
    }
  };

  const handleQtyChange = (qty: number, currentBom: any = bom) => {
    setQtyToDisassemble(qty);
    if (currentBom) {
      setRawMaterials(currentBom.components.map((c: any) => ({
        ...c,
        quantityRequired: c.quantity * qty,
        totalCost: c.quantity * qty * c.costPerUnit
      })));
    }
  };

  const handleSave = async () => {
    if (!selectedProductId) return toast.error('Select a Product to disassemble');
    if (!bom) return toast.error('No BOM found for this product');
    if (qtyToDisassemble <= 0) return toast.error('Quantity must be > 0');

    setSaving(true);
    try {
      await manufacturingApi.createReverse({
        bomId: bom._id,
        productId: bom.productId,
        productName: bom.productName,
        quantityToProduce: qtyToDisassemble,
        batchNoGenerated: selectedBatchNo || undefined,
        rawMaterials: rawMaterials,
      });
      toast.success('Disassembly Journal Created!');
      router.push('/dashboard/manufacturing/orders');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = products.find(p => p._id === selectedProductId);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary-500" /></div>;

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      <Topbar 
        title="Disassembly Journal" 
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="erp-button bg-white text-slate-700 border border-slate-200">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <button onClick={handleSave} disabled={saving} className="erp-button bg-red-600 text-white hover:bg-red-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
              Process Disassembly
            </button>
          </div>
        } 
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                <RefreshCcw className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Finished Good to Disassemble</h2>
                <p className="text-sm text-slate-500">Select product to break down into raw materials</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="erp-label">Finished Good</label>
                <select className="erp-input w-full" value={selectedProductId} onChange={e => handleProductChange(e.target.value)}>
                  <option value="">Select Product...</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              {selectedProduct?.hasBatches && (
                <div>
                  <label className="erp-label">Batch No (Optional)</label>
                  <select className="erp-input w-full" value={selectedBatchNo} onChange={e => setSelectedBatchNo(e.target.value)}>
                    <option value="">Any Batch</option>
                    {selectedProduct.batches?.map((b: any) => (
                      <option key={b.batchNo} value={b.batchNo}>{b.batchNo} (Qty: {b.currentStock})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="erp-label">Quantity to Disassemble</label>
                <input 
                  type="number" min="1" 
                  className="erp-input w-full font-bold text-red-700" 
                  value={qtyToDisassemble} 
                  onChange={e => handleQtyChange(Number(e.target.value))} 
                />
              </div>
            </div>
            
            {!bom && selectedProductId && (
              <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200 text-sm">
                No BOM mapped to this product. Disassembly requires a BOM to know which raw materials to return to stock.
              </div>
            )}
          </div>

          {/* Raw Materials Returning */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-emerald-50">
              <h3 className="font-bold text-emerald-800">Raw Materials Returning to Stock</h3>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium">Qty Returning</th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterials.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-slate-400">Select a product to view components</td></tr>}
                  {rawMaterials.map((rm, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="py-3">{rm.productName}</td>
                      <td className="py-3 font-bold text-emerald-600">
                        +{rm.quantityRequired} {rm.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
