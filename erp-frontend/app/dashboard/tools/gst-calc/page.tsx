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
          <h2 className="text-xl font-bold dark:text-white text-gray-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#D4D4D4]" /> GST Calculator
          </h2>
          <p className="dark:text-[#94a3b8] text-gray-600 text-sm mt-1">Quickly compute inclusive or exclusive tax values.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="glass rounded-2xl p-6 border dark:border-[#1A1A1A] border-gray-300 space-y-6">
            <div>
              <label className="block text-xs font-medium dark:text-[#94a3b8] text-gray-600 mb-1.5">Calculation Mode</label>
              <div className="flex rounded-lg overflow-hidden border dark:border-[#1A1A1A] border-gray-300">
                <button onClick={() => setMode('exclusive')} className={`flex-1 py-3 text-sm font-medium transition ${mode === 'exclusive' ? 'bg-white text-black hover:bg-gray-200' : 'dark:bg-[#111111] bg-gray-50 dark:text-[#94a3b8] text-gray-600 hover:dark:text-white text-gray-900'}`}>
                  Add GST (Exclusive)
                </button>
                <button onClick={() => setMode('inclusive')} className={`flex-1 py-3 text-sm font-medium transition ${mode === 'inclusive' ? 'bg-white text-black hover:bg-gray-200' : 'dark:bg-[#111111] bg-gray-50 dark:text-[#94a3b8] text-gray-600 hover:dark:text-white text-gray-900'}`}>
                  Remove GST (Inclusive)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium dark:text-[#94a3b8] text-gray-600 mb-1.5">{mode === 'exclusive' ? 'Taxable Amount (Base)' : 'Total Amount (Incl. GST)'}</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-[#475569] text-gray-500" />
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  className="w-full pl-9 pr-4 py-3 rounded-xl dark:bg-[#0A0A0A] bg-white border dark:border-[#1A1A1A] border-gray-300 dark:text-white text-gray-900 text-lg font-semibold focus:outline-none focus:border-[#D4D4D4] transition" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium dark:text-[#94a3b8] text-gray-600 mb-1.5">GST Rate (%)</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_RATES.map(r => (
                  <button key={r} onClick={() => setRate(r)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${rate === r ? 'bg-[#D4D4D4] dark:text-white text-gray-900 border-[#D4D4D4]' : 'dark:bg-[#111111] bg-gray-50 dark:border-[#1A1A1A] border-gray-300 dark:text-[#94a3b8] text-gray-600 hover:dark:text-white text-gray-900 hover:border-[#D4D4D4]'}`}>
                    {r}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="glass rounded-2xl p-6 border dark:border-[#1A1A1A] border-gray-300 flex flex-col justify-center">
            <h3 className="dark:text-white text-gray-900 font-semibold text-lg border-b dark:border-[#1A1A1A] border-gray-300 pb-3 mb-4">Calculation Results</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center p-3 rounded-lg dark:bg-[#111111] bg-gray-50">
                <span className="dark:text-[#94a3b8] text-gray-600">Net / Taxable Amount</span>
                <span className="font-semibold dark:text-white text-gray-900">₹{result.base.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg dark:bg-[#111111] bg-gray-50/50">
                <span className="dark:text-[#94a3b8] text-gray-600">CGST ({(rate / 2).toFixed(1)}%)</span>
                <span className="font-medium dark:text-white text-gray-900">₹{result.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg dark:bg-[#111111] bg-gray-50/50">
                <span className="dark:text-[#94a3b8] text-gray-600">SGST ({(rate / 2).toFixed(1)}%)</span>
                <span className="font-medium dark:text-white text-gray-900">₹{result.sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg dark:bg-[#111111] bg-gray-50">
                <span className="dark:text-[#94a3b8] text-gray-600">Total Tax ({rate}%)</span>
                <span className="font-semibold text-red-400">₹{result.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-4">
                <span className="text-emerald-500 font-bold uppercase tracking-wider text-xs">Grand Total</span>
                <span className="text-2xl font-black dark:text-emerald-400 text-emerald-600">₹{result.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
