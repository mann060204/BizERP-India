'use client';
import { useState } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { Calculator, ArrowRightLeft, Percent, IndianRupee } from 'lucide-react';

const COMMON_RATES = [0, 5, 12, 18, 28];

export default function GstCalculatorPage() {
  const [amount, setAmount] = useState<string>('');
  const [rate, setRate] = useState<number>(18);
  const [mode, setMode] = useState<'exclusive' | 'inclusive'>('exclusive'); 

  const numAmount = parseFloat(amount) || 0;

  const calculate = () => {
    if (mode === 'exclusive') {
      // Add GST (Amount is Base)
      const tax = (numAmount * rate) / 100;
      return { base: numAmount, tax, cgst: tax / 2, sgst: tax / 2, total: numAmount + tax };
    } else {
      // Remove GST (Amount is Total)
      const base = (numAmount * 100) / (100 + rate);
      const tax = numAmount - base;
      return { base, tax, cgst: tax / 2, sgst: tax / 2, total: numAmount };
    }
  };

  const result = calculate();

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="GST Calculator" />
      <main className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-slate-700" /> GST Calculator
          </h2>
          <p className="text-slate-600 text-sm mt-1">Quickly compute inclusive or exclusive tax values.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="glass rounded-2xl p-6 border border-slate-200 space-y-6">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Calculation Mode</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-200">
                <button onClick={() => setMode('exclusive')} className={`flex-1 py-3 text-sm font-medium transition ${mode === 'exclusive' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-[#F1F5F9] text-slate-600 hover:text-slate-900'}`}>
                  Add GST (Exclusive)
                </button>
                <button onClick={() => setMode('inclusive')} className={`flex-1 py-3 text-sm font-medium transition ${mode === 'inclusive' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-[#F1F5F9] text-slate-600 hover:text-slate-900'}`}>
                  Remove GST (Inclusive)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{mode === 'exclusive' ? 'Taxable Amount (Base)' : 'Total Amount (Incl. GST)'}</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-lg font-semibold focus:outline-none focus:border-[#D4D4D4] transition" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">GST Rate (%)</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_RATES.map(r => (
                  <button key={r} onClick={() => setRate(r)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${rate === r ? 'bg-[#D4D4D4] text-slate-900 border-[#D4D4D4]' : 'bg-[#F1F5F9] border-slate-200 text-slate-600 hover:text-slate-900 hover:border-[#D4D4D4]'}`}>
                    {r}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="glass rounded-2xl p-6 border border-slate-200 flex flex-col justify-center">
            <h3 className="text-slate-900 font-semibold text-lg border-b border-slate-200 pb-3 mb-4">Calculation Results</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F1F5F9]">
                <span className="text-slate-600">Net / Taxable Amount</span>
                <span className="font-semibold text-slate-900">₹{result.base.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F1F5F9]">
                <span className="text-slate-600">CGST ({(rate / 2).toFixed(1)}%)</span>
                <span className="font-medium text-slate-900">₹{result.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F1F5F9]">
                <span className="text-slate-600">SGST ({(rate / 2).toFixed(1)}%)</span>
                <span className="font-medium text-slate-900">₹{result.sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F1F5F9]">
                <span className="text-slate-600">Total Tax ({rate}%)</span>
                <span className="font-semibold text-red-400">₹{result.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-4">
                <span className="text-emerald-500 font-bold uppercase tracking-wider text-xs">Grand Total</span>
                <span className="text-2xl font-black text-emerald-400">₹{result.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
