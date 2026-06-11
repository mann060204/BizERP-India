'use client';
import { useState, useEffect } from 'react';
import { Download, RefreshCw, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function GSTR1Page() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsApi.getGSTR1();
      setData(res.data?.data || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load GSTR-1');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = data?.summary || {};
  const summaryCards = [
    { label: 'Total Taxable Sales', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalTaxableSales || 0), highlight: true },
    { label: 'Total GST Collected', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalGSTCollected || 0), highlight: true },
    { label: 'Number Of Invoices', value: summary.numberOfInvoices || 0 },
    { label: 'Export Sales Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.exportSalesValue || 0) },
  ];

  const TableHeader = ({ title, count }: { title: string, count: number }) => (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between rounded-t-xl mt-6">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{count} records</span>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  GSTR Report
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">GSTR-1</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="erp-button-outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="erp-button-outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-100 px-6 py-3 max-w-7xl mx-auto w-full flex items-center gap-4">
        <ReportHeader summaryCards={summaryCards} />
      </div>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Computing GST Data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-12 h-12 text-red-300 mb-4" />
            <p className="text-red-500 font-medium text-lg">Error loading GSTR-1</p>
            <p className="text-slate-500 mt-1">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-slate-600 mb-4">Detailed outward supply statement for GST filing.</p>

            {/* B2B Supplies */}
            <div className="glass rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <TableHeader title="B2B Supplies (Registered Customers)" count={data?.b2b?.length || 0} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2 font-medium">Invoice Number</th>
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Customer Name</th>
                      <th className="px-4 py-2 font-medium">GSTIN</th>
                      <th className="px-4 py-2 font-medium">State</th>
                      <th className="px-4 py-2 font-medium text-right">Taxable Value</th>
                      <th className="px-4 py-2 font-medium text-right">GST Total</th>
                      <th className="px-4 py-2 font-medium text-right">Invoice Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.b2b?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2">{row.invoiceNumber}</td>
                        <td className="px-4 py-2">{new Date(row.invoiceDate).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{row.customerName}</td>
                        <td className="px-4 py-2">{row.gstin}</td>
                        <td className="px-4 py-2">{row.state}</td>
                        <td className="px-4 py-2 text-right">₹{row.taxableValue.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">₹{row.gstAmount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">₹{row.invoiceTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                    {!data?.b2b?.length && <tr><td colSpan={8} className="px-4 py-4 text-center text-slate-400">No B2B Supplies</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* B2C Large */}
            <div className="glass rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <TableHeader title="B2C Large Supplies (Interstate > 2.5L)" count={data?.b2cLarge?.length || 0} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2 font-medium">Invoice Number</th>
                      <th className="px-4 py-2 font-medium">State</th>
                      <th className="px-4 py-2 font-medium text-right">Taxable Value</th>
                      <th className="px-4 py-2 font-medium text-right">GST Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.b2cLarge?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2">{row.invoiceNumber}</td>
                        <td className="px-4 py-2">{row.state}</td>
                        <td className="px-4 py-2 text-right">₹{row.taxableValue.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">₹{row.gstAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {!data?.b2cLarge?.length && <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-400">No B2C Large Supplies</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* B2C Small */}
            <div className="glass rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <TableHeader title="B2C Small Supplies" count={data?.b2cSmall?.length || 0} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2 font-medium">State</th>
                      <th className="px-4 py-2 font-medium text-right">Taxable Value</th>
                      <th className="px-4 py-2 font-medium text-right">GST Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.b2cSmall?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2">{row.state || 'Local'}</td>
                        <td className="px-4 py-2 text-right">₹{row.taxableValue.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">₹{row.gstAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {!data?.b2cSmall?.length && <tr><td colSpan={3} className="px-4 py-4 text-center text-slate-400">No B2C Small Supplies</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exports */}
            <div className="glass rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <TableHeader title="Exports" count={data?.exports?.length || 0} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2 font-medium">Invoice Number</th>
                      <th className="px-4 py-2 font-medium">Export Type</th>
                      <th className="px-4 py-2 font-medium text-right">Taxable Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.exports?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2">{row.invoiceNumber}</td>
                        <td className="px-4 py-2">{row.exportType}</td>
                        <td className="px-4 py-2 text-right">₹{row.taxableValue.toFixed(2)}</td>
                      </tr>
                    ))}
                    {!data?.exports?.length && <tr><td colSpan={3} className="px-4 py-4 text-center text-slate-400">No Export Supplies</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}
