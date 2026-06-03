'use client';
import { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../../../../../lib/erp-api';
import DateRangeFilter from '../../../../../components/reports/DateRangeFilter';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';

const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

function GSTRow({ label, value, className = '' }: { label: string; value: number; className?: string }) {
  return (
    <div className={`flex justify-between items-center py-3 px-4 ${className}`}>
      <span className="text-sm text-slate-700">{label}</span>
      <span className="font-semibold text-slate-900">₹{Number(value || 0).toFixed(2)}</span>
    </div>
  );
}

export default function GSTR3BPage() {
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(lastDay);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getGSTR3B({ from, to });
      setData(res.data?.data);
    } finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { load(); }, []);

  const outward = data?.outward || {};
  const purchaseITC = data?.purchaseITC || {};
  const expenseITC = data?.expenseITC || {};
  const itcClaimed = data?.itcClaimed || {};
  const netPayable = data?.netPayable || {};
  const totalNetPayable = data?.totalNetPayable || 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded">GSTR Report</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">GSTR-3B Summary</h1>
            </div>
          </div>
        </div>
      </header>
      <div className="bg-white border-b border-slate-100 px-6 py-3 max-w-7xl mx-auto w-full">
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onRefresh={load} loading={loading} />
      </div>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-5">
        {/* Tax payable summary KPI */}
        <div className={`glass rounded-2xl p-6 border ${totalNetPayable > 0 ? 'border-red-200 bg-gradient-to-r from-red-50 to-white' : 'border-green-200 bg-gradient-to-r from-green-50 to-white'} flex items-center justify-between`}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider mb-1 text-slate-600">Net GST Payable to Government</p>
            <p className={`text-4xl font-bold ${totalNetPayable > 0 ? 'text-red-700' : 'text-green-700'}`}>₹{Number(totalNetPayable).toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">CGST ₹{Number(netPayable.cgst||0).toFixed(2)} + SGST ₹{Number(netPayable.sgst||0).toFixed(2)} + IGST ₹{Number(netPayable.igst||0).toFixed(2)}</p>
          </div>
          <div className={totalNetPayable > 0 ? 'text-red-300' : 'text-green-300'}>
            {totalNetPayable > 0 ? <TrendingUp className="w-16 h-16" /> : <TrendingDown className="w-16 h-16" />}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 3.1 Outward Supplies */}
          <div className="glass rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
              <h3 className="font-semibold text-blue-800 text-sm">3.1 — Outward Supplies (Sales)</h3>
            </div>
            <div className="divide-y divide-slate-100">
              <GSTRow label="Taxable Value" value={outward.taxableValue || 0} />
              <GSTRow label="CGST" value={outward.cgst || 0} />
              <GSTRow label="SGST" value={outward.sgst || 0} />
              <GSTRow label="IGST" value={outward.igst || 0} />
              <GSTRow label="Total Tax Collected" value={outward.totalTax || 0} className="font-semibold bg-blue-50" />
              <GSTRow label="Grand Total Sales" value={outward.grandTotal || 0} className="font-bold" />
            </div>
          </div>

          {/* 4 — ITC Claimed */}
          <div className="glass rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 bg-green-50 border-b border-green-100">
              <h3 className="font-semibold text-green-800 text-sm">4 — Input Tax Credit (ITC)</h3>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="px-4 py-2 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wider">From Purchases</div>
              <GSTRow label="Taxable Value" value={purchaseITC.taxableValue || 0} />
              <GSTRow label="CGST" value={purchaseITC.cgst || 0} />
              <GSTRow label="SGST" value={purchaseITC.sgst || 0} />
              <GSTRow label="IGST" value={purchaseITC.igst || 0} />
              <div className="px-4 py-2 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wider">From Expenses</div>
              <GSTRow label="Taxable Value" value={expenseITC.taxableValue || 0} />
              <GSTRow label="GST on Expenses" value={expenseITC.totalTax || 0} />
              <GSTRow label="Total ITC Claimed" value={itcClaimed.totalTax || 0} className="font-bold bg-green-50 text-green-800" />
            </div>
          </div>

          {/* 6 — Net Tax Payable */}
          <div className="glass rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
              <h3 className="font-semibold text-orange-800 text-sm">6 — Net Tax Payable</h3>
            </div>
            <div className="divide-y divide-slate-100">
              <GSTRow label="Tax Collected (CGST)" value={outward.cgst || 0} />
              <GSTRow label="ITC CGST" value={itcClaimed.cgst || 0} />
              <GSTRow label="Net CGST Payable" value={netPayable.cgst || 0} className="font-bold bg-orange-50" />
              <GSTRow label="Tax Collected (SGST)" value={outward.sgst || 0} />
              <GSTRow label="ITC SGST" value={itcClaimed.sgst || 0} />
              <GSTRow label="Net SGST Payable" value={netPayable.sgst || 0} className="font-bold bg-orange-50" />
              <GSTRow label="Tax Collected (IGST)" value={outward.igst || 0} />
              <GSTRow label="ITC IGST" value={itcClaimed.igst || 0} />
              <GSTRow label="Net IGST Payable" value={netPayable.igst || 0} className="font-bold bg-orange-50" />
              <div className={`flex justify-between items-center py-4 px-4 ${totalNetPayable > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                <span className="text-sm font-bold">Total Net Payable</span>
                <span className={`text-lg font-bold ${totalNetPayable > 0 ? 'text-red-700' : 'text-green-700'}`}>₹{Number(totalNetPayable).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl border border-slate-100 bg-amber-50 p-4 text-xs text-amber-700">
          <strong>Note:</strong> GSTR-3B figures are computed from sales invoices (outward), purchase bills (ITC), and GST-inclusive expenses. Net payable = Tax Collected − ITC. Verify with your CA before filing.
        </div>
      </main>
    </div>
  );
}
