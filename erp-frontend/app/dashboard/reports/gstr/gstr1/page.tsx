'use client';
import { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../../../../../lib/erp-api';
import DateRangeFilter from '../../../../../components/reports/DateRangeFilter';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

type Section = 'invoices' | 'b2b' | 'b2c' | 'hsn';

export default function GSTR1Page() {
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(lastDay);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState<Section>('invoices');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getGSTR1({ from, to });
      setData(res.data?.data);
    } finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { load(); }, []);

  const totals = data?.totals || {};
  const invoices: any[] = data?.invoices || [];
  const b2b: any[] = data?.b2b || [];
  const b2c: any[] = data?.b2c || [];
  const hsnSummary: any[] = data?.hsnSummary || [];

  const sections = [
    { key: 'invoices', label: 'All Invoices', count: invoices.length },
    { key: 'b2b', label: 'B2B', count: b2b.length },
    { key: 'b2c', label: 'B2C', count: b2c.length },
    { key: 'hsn', label: 'HSN Summary', count: hsnSummary.length },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded">GSTR Report</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">GSTR-1 Outward Supply Statement</h1>
            </div>
          </div>
        </div>
      </header>
      <div className="bg-white border-b border-slate-100 px-6 py-3 max-w-7xl mx-auto w-full">
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onRefresh={load} loading={loading} />
      </div>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-5">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Taxable', value: totals.totalTaxable },
            { label: 'Total CGST', value: totals.totalCGST },
            { label: 'Total SGST', value: totals.totalSGST },
            { label: 'Total IGST', value: totals.totalIGST },
          ].map(k => (
            <div key={k.label} className="glass rounded-2xl p-5 border border-slate-200 bg-white">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{k.label}</p>
              <p className="text-xl font-bold text-slate-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(k.value||0))}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-5 border border-slate-200 bg-white">
            <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Total GST</p>
            <p className="text-xl font-bold text-indigo-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(totals.totalGST||0))}</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-slate-200 bg-white">
            <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Grand Total</p>
            <p className="text-xl font-bold text-slate-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(totals.grandTotal||0))}</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-blue-100 bg-blue-50/40">
            <p className="text-xs text-blue-600 font-semibold uppercase mb-1">B2B (With GSTIN)</p>
            <p className="text-xl font-bold text-blue-700">{totals.b2bCount || 0} invoices</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-green-100 bg-green-50/40">
            <p className="text-xs text-green-600 font-semibold uppercase mb-1">B2C (No GSTIN)</p>
            <p className="text-xl font-bold text-green-700">{totals.b2cCount || 0} invoices</p>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {sections.map(s => (
            <button key={s.key} onClick={() => setSection(s.key as Section)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${section === s.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {s.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${section === s.key ? 'bg-indigo-500 text-white' : 'bg-slate-100'}`}>{s.count}</span>
            </button>
          ))}
        </div>

        {/* Tables */}
        <div className="glass rounded-2xl border border-slate-200 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            {section !== 'hsn' ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{['Invoice #', 'Date', 'Customer', 'GSTIN', 'Place of Supply', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total GST', 'Grand Total'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? <tr><td colSpan={11} className="px-4 py-10 text-center">Loading...</td></tr>
                    : (section === 'invoices' ? invoices : section === 'b2b' ? b2b : b2c).map((inv: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                        <td className="px-3 py-3 text-xs">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-3 py-3 font-medium">{inv.customerSnapshot?.name || 'Cash'}</td>
                        <td className="px-3 py-3 text-xs text-slate-500 font-mono">
                          {inv.customerSnapshot?.gstin ? (
                            <>
                              {inv.customerSnapshot?.gstin}
                              {inv.customerSnapshot?.gstin && <span className="block text-[10px] text-slate-400 mt-0.5">(SC: {inv.customerSnapshot.gstin.substring(0, 2)})</span>}
                            </>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-3 text-xs">{inv.placeOfSupply || '—'}</td>
                        <td className="px-3 py-3 text-right">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(inv.totalTaxableAmount||0))}</td>
                        <td className="px-3 py-3 text-right">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(inv.totalCGST||0))}</td>
                        <td className="px-3 py-3 text-right">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(inv.totalSGST||0))}</td>
                        <td className="px-3 py-3 text-right">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(inv.totalIGST||0))}</td>
                        <td className="px-3 py-3 text-right font-medium text-indigo-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(inv.totalGST||0))}</td>
                        <td className="px-3 py-3 text-right font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(inv.grandTotal||0))}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="overflow-x-auto w-full">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{['HSN Code', 'Description', 'GST Rate', 'Total Qty', 'Taxable Value', 'CGST', 'SGST', 'IGST'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hsnSummary.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono text-xs">{row._id || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{row.description || '—'}</td>
                      <td className="px-4 py-3 text-center">{row.gstRate || 0}%</td>
                      <td className="px-4 py-3 text-right">{row.totalQty}</td>
                      <td className="px-4 py-3 text-right">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(row.totalTaxable||0))}</td>
                      <td className="px-4 py-3 text-right">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(row.totalCGST||0))}</td>
                      <td className="px-4 py-3 text-right">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(row.totalSGST||0))}</td>
                      <td className="px-4 py-3 text-right">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(row.totalIGST||0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
