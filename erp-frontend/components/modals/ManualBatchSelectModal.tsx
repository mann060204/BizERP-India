import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface BatchInfo {
  batchNo: string;
  mrp: number;
  salePrice: number;
  currentStock: number;
  manufacturingDate?: string;
  expiryDate?: string;
}

interface SelectedBatch {
  batchNo: string;
  quantity: number;
  mrp: number;
  salePrice: number;
}

interface ManualBatchSelectModalProps {
  productName: string;
  requestedQuantity: number;
  unit: string;
  availableBatches: BatchInfo[];
  onClose: () => void;
  onConfirm: (selectedBatches: SelectedBatch[]) => void;
}

export default function ManualBatchSelectModal({
  productName,
  requestedQuantity,
  unit,
  availableBatches,
  onClose,
  onConfirm
}: ManualBatchSelectModalProps) {
  const [selections, setSelections] = useState<{ [batchNo: string]: number }>({});

  // Reset selections whenever the product or requested quantity changes (prevents stale values carrying over)
  useEffect(() => {
    setSelections({});
  }, [requestedQuantity, availableBatches]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleQtyChange = (batchNo: string, qty: string) => {
    const val = parseFloat(qty) || 0;
    setSelections(prev => ({
      ...prev,
      [batchNo]: val
    }));
  };

  const totalSelected = Object.values(selections).reduce((a, b) => a + b, 0);

  const handleSave = () => {
    // Use small epsilon to handle floating-point rounding (e.g. 1.0000000000001 === 1)
    if (Math.abs(totalSelected - requestedQuantity) > 0.001) {
      toast.error(`Total selected quantity (${totalSelected}) must equal requested quantity (${requestedQuantity})`);
      return;
    }

    const result: SelectedBatch[] = [];
    for (const batch of availableBatches) {
      const qty = selections[batch.batchNo];
      if (qty && qty > 0) {
        if (qty > batch.currentStock) {
           toast.error(`Cannot select ${qty} from batch ${batch.batchNo}. Max available: ${batch.currentStock}`);
           return;
        }
        result.push({
          batchNo: batch.batchNo,
          quantity: qty,
          mrp: batch.mrp,
          salePrice: batch.salePrice
        });
      }
    }
    onConfirm(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Select Batches for {productName}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4 bg-blue-50 border border-blue-100 p-3 rounded flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              You requested <span className="font-bold text-blue-700">{requestedQuantity} {unit}</span>. 
              Please allocate this quantity across the available batches below.
              <br/>
              Currently allocated: <span className={`font-bold ${totalSelected === requestedQuantity ? 'text-green-600' : 'text-red-500'}`}>{totalSelected} {unit}</span>
            </div>
          </div>

          {(!availableBatches || availableBatches.length === 0) ? (
            <div className="text-center py-8 text-slate-500">
              No available batches found in stock for this item.
            </div>
          ) : (
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-xs uppercase text-slate-600">
                  <th className="p-2 border border-slate-200">Batch No</th>
                  <th className="p-2 border border-slate-200 text-center">In Stock ({unit})</th>
                  <th className="p-2 border border-slate-200 text-center">Mfg Date</th>
                  <th className="p-2 border border-slate-200 text-center">Expiry</th>
                  <th className="p-2 border border-slate-200 text-right">M.R.P.</th>
                  <th className="p-2 border border-slate-200 text-right">Sale Price</th>
                  <th className="p-2 border border-slate-200 text-center bg-blue-50">Allocated Qty ({unit})</th>
                </tr>
              </thead>
              <tbody>
                {availableBatches.map((b) => (
                  <tr key={b.batchNo} className="text-sm hover:bg-slate-50">
                    <td className="p-2 border border-slate-200 font-medium">{b.batchNo}</td>
                    <td className="p-2 border border-slate-200 text-center font-bold text-slate-700">{b.currentStock}</td>
                    <td className="p-2 border border-slate-200 text-center text-slate-500">{b.manufacturingDate ? new Date(b.manufacturingDate).toLocaleDateString() : '-'}</td>
                    <td className="p-2 border border-slate-200 text-center text-slate-500">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '-'}</td>
                    <td className="p-2 border border-slate-200 text-right">₹{b.mrp?.toFixed(2)}</td>
                    <td className="p-2 border border-slate-200 text-right">₹{b.salePrice?.toFixed(2)}</td>
                    <td className="p-2 border border-slate-200 bg-blue-50/30">
                      <input 
                        type="number" 
                        min="0"
                        max={b.currentStock}
                        value={selections[b.batchNo] || ''}
                        onChange={(e) => handleQtyChange(b.batchNo, e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-center font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition font-medium text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={Math.abs(totalSelected - requestedQuantity) > 0.001}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded transition flex items-center gap-2 font-medium text-sm"
          >
            <Save className="w-4 h-4" /> Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}
