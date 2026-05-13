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
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#D4D4D4]" /> GST Calculator
          </h2>
          <p className="text-[#94a3b8] text-sm mt-1">Quickly compute inclusive or exclusive tax values.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="glass rounded-2xl p-6 border border-[#1A1A1A] space-y-6">
            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Calculation Mode</label>
              <div className="flex rounded-lg overflow-hidden border border-[#1A1A1A]">
                <button onClick={() => setMode('exclusive')} className={`flex-1 py-3 text-sm font-medium transition ${mode === 'exclusive' ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#111111] text-[#94a3b8] hover:text-white'}`}>
                  Add GST (Exclusive)
                </button>
                <button onClick={() => setMode('inclusive')} className={`flex-1 py-3 text-sm font-medium transition ${mode === 'inclusive' ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#111111] text-[#94a3b8] hover:text-white'}`}>
                  Remove GST (Inclusive)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">{mode === 'exclusive' ? 'Taxable Amount (Base)' : 'Total Amount (Incl. GST)'}</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] text-white text-lg font-semibold focus:outline-none focus:border-[#D4D4D4] transition" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">GST Rate (%)</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_RATES.map(r => (
                  <button key={r} onClick={() => setRate(r)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${rate === r ? 'bg-[#D4D4D4] text-white border-[#D4D4D4]' : 'bg-[#111111] border-[#1A1A1A] text-[#94a3b8] hover:text-white hover:border-[#D4D4D4]'}`}>
                    {r}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="glass rounded-2xl p-6 border border-[#1A1A1A] flex flex-col justify-center">
            <h3 className="text-white font-semibold text-lg border-b border-[#1A1A1A] pb-3 mb-4">Calculation Results</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#111111]">
                <span className="text-[#94a3b8]">Net / Taxable Amount</span>
                <span className="font-semibold text-white">₹{result.base.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#111111]/50">
                <span className="text-[#94a3b8]">CGST ({(rate / 2).toFixed(1)}%)</span>
                <span className="font-medium text-white">₹{result.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#111111]/50">
                <span className="text-[#94a3b8]">SGST ({(rate / 2).toFixed(1)}%)</span>
                <span className="font-medium text-white">₹{result.sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#111111]">
                <span className="text-[#94a3b8]">Total Tax ({rate}%)</span>
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
