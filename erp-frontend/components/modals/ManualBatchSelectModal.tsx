import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
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

  // Reset selections whenever the product/batches change (prevents stale values carrying over)
  useEffect(() => {
    setSelections({});
  }, [availableBatches]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleQtyChange = (batchNo: string, qty: string, maxStock: number) => {
    let val = parseFloat(qty) || 0;
    // Clamp to available stock — cannot exceed what's in stock
    if (val > maxStock) {
      val = maxStock;
      toast.error(`Max available for this batch is ${maxStock} ${unit}`);
    }
    if (val < 0) val = 0;
    setSelections(prev => ({ ...prev, [batchNo]: val }));
  };

  const totalSelected = Object.values(selections).reduce((a, b) => a + b, 0);

  // Any batch where the entered qty exceeds stock (safety check)
  const hasOverflow = availableBatches.some(b => (selections[b.batchNo] || 0) > b.currentStock);

  // Confirm is allowed as long as at least 1 unit allocated and no overflows
  const canConfirm = totalSelected > 0 && !hasOverflow;

  const handleSave = () => {
    if (totalSelected <= 0) {
      toast.error('Please allocate at least 1 unit before confirming.');
      return;
    }

    const result: SelectedBatch[] = [];
    for (const batch of availableBatches) {
      const qty = selections[batch.batchNo] || 0;
      if (qty > 0) {
        if (qty > batch.currentStock) {
          toast.error(`Batch ${batch.batchNo}: allocated ${qty} exceeds stock of ${batch.currentStock}`);
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

  const totalStock = availableBatches.reduce((a, b) => a + b.currentStock, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Select Batches for {productName}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {/* Info Banner */}
          <div className="mb-4 bg-blue-50 border border-blue-100 p-3 rounded flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              Enter the quantity to sell from each batch. Each batch is capped at its available stock.
              <br />
              <span className="font-semibold">Total In Stock:</span>{' '}
              <span className="font-bold text-blue-700">{totalStock} {unit}</span>
              {'  |  '}
              <span className="font-semibold">Total Allocated:</span>{' '}
              <span className={`font-bold ${totalSelected > 0 ? 'text-green-600' : 'text-slate-500'}`}>
                {totalSelected} {unit}
              </span>
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
                {availableBatches.map((b) => {
                  const entered = selections[b.batchNo] || 0;
                  const isOver = entered > b.currentStock;
                  return (
                    <tr key={b.batchNo} className="text-sm hover:bg-slate-50">
                      <td className="p-2 border border-slate-200 font-medium">{b.batchNo}</td>
                      <td className="p-2 border border-slate-200 text-center font-bold text-slate-700">{b.currentStock}</td>
                      <td className="p-2 border border-slate-200 text-center text-slate-500">
                        {b.manufacturingDate ? new Date(b.manufacturingDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-2 border border-slate-200 text-center text-slate-500">
                        {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-2 border border-slate-200 text-right">₹{b.mrp?.toFixed(2)}</td>
                      <td className="p-2 border border-slate-200 text-right">₹{b.salePrice?.toFixed(2)}</td>
                      <td className="p-2 border border-slate-200 bg-blue-50/30">
                        <input
                          type="number"
                          min="0"
                          max={b.currentStock}
                          step="0.001"
                          value={selections[b.batchNo] ?? ''}
                          onChange={(e) => handleQtyChange(b.batchNo, e.target.value, b.currentStock)}
                          className={`w-full border rounded px-2 py-1 text-center font-bold focus:outline-none focus:ring-1 ${
                            isOver
                              ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-400'
                              : entered > 0
                              ? 'border-green-400 bg-green-50 focus:border-green-500 focus:ring-green-400'
                              : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                          placeholder="0"
                        />
                        {isOver && (
                          <p className="text-red-500 text-[10px] mt-0.5 text-center">Max: {b.currentStock}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center gap-3">
          <div className="text-sm text-slate-600">
            {totalSelected > 0 ? (
              <span className="flex items-center gap-1 text-green-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                {totalSelected} {unit} ready to confirm
              </span>
            ) : (
              <span className="text-slate-400">Enter quantities above to proceed</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canConfirm}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded transition flex items-center gap-2 font-medium text-sm"
            >
              <Save className="w-4 h-4" /> Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
