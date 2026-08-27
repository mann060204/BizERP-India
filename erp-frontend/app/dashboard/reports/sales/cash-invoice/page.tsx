'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ArrowLeft, Banknote, AlertCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { reportsApi } from '../../../../../lib/erp-api';
import { safeINR, safePctStr, safeNum, safeDate, getPresetRange, formatDateForAPI, currentFYStart } from '../../../../../lib/report-utils';

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-700',
  sent: 'bg-blue-50 text-blue-700',
  draft: 'bg-slate-50 text-slate-500',
};

export default function CashInvoiceReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);

  // Filters
  const fyStart = formatDateForAPI(currentFYStart());
  const today = formatDateForAPI(new Date());
  const [fromDate, setFromDate] = useState(fyStart);
  const [toDate, setToDate] = useState(today);
  const [paymentMode, setPaymentMode] = useState('');
  const [soldBy, setSoldBy] = useState('');
  const [invoiceType, setInvoiceType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { fromDate, toDate };
      if (paymentMode) params.paymentMode = paymentMode;
      if (soldBy) params.soldBy = soldBy;
      if (invoiceType) params.invoiceType = invoiceType;
      if (statusFilter) params.status = statusFilter;

      const res = await reportsApi.getCashInvoiceReport(params);
      const d = (res as any).data?.data;
      setSummary(d?.summary || null);
      setRows(Array.isArray(d?.data) ? d.data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load report');
    } finally { setLoading(false); }
  }, [fromDate, toDate, paymentMode, soldBy, invoiceType, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const applyPreset = (key: string) => {
    const r = getPresetRange(key as any);
    setFromDate(r.from);
    setToDate(r.to);
  };

  // Unique values for filter dropdowns
  const paymentModes = Array.from(new Set(rows.map(r => r.paymentMode).filter(Boolean)));
  const salespeople = Array.from(new Set(rows.map(r => r.soldBy).filter(v => v && v !== '—')));

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-600">Sales Reports</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Cash Invoice Report</h1>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[1400px] mx-auto w-full space-y-5">

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          {/* Quick presets */}
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { label: 'Today', key: 'today' },
              { label: 'Yesterday', key: 'yesterday' },
              { label: 'This Month', key: 'this_month' },
              { label: 'Last Month', key: 'last_month' },
              { label: 'This FY', key: 'this_fy' },
              { label: 'Prev FY', key: 'prev_fy' },
            ].map(({ label, key }) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg transition-all"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Invoice Type</label>
              <select value={invoiceType} onChange={e => setInvoiceType(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-400">
                <option value="">All Types</option>
                <option value="GST">GST</option>
                <option value="NON-GST">NON-GST</option>
                <option value="Bill of Supply">Bill of Supply</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Payment Mode</label>
              <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-400">
                <option value="">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-400">
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
                <option value="sent">Sent</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <button onClick={load}
              className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition ml-auto">
              Apply Filters
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-sm">Unable to load this report.</p>
              <p className="text-red-600 text-xs mt-0.5">{error}</p>
            </div>
            <button onClick={load} className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : !error && (
          <>
            {/* Summary Banner */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Cash Invoices', value: String(safeNum(summary.totalInvoices)), color: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-200' },
                  { label: 'Total Sales', value: safeINR(summary.totalSales), color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                  { label: 'Total Discount', value: safeINR(summary.totalDiscount), color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
                  { label: 'Total GST', value: safeINR(summary.totalGST), color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
                  { label: 'Total Received', value: safeINR(summary.totalReceived), color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
                  { label: 'Outstanding', value: safeINR(summary.totalOutstanding), color: safeNum(summary.totalOutstanding) > 0 ? 'text-amber-700' : 'text-slate-400', bg: safeNum(summary.totalOutstanding) > 0 ? 'bg-amber-50' : 'bg-slate-50', border: safeNum(summary.totalOutstanding) > 0 ? 'border-amber-200' : 'border-slate-200' },
                ].map((k, i) => (
                  <div key={i} className={`rounded-xl border ${k.border} ${k.bg} p-4 shadow-sm`}>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{k.label}</div>
                    <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">
                  Cash Invoices
                  <span className="text-xs text-slate-400 ml-2 font-normal">({rows.length} records)</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1100px]">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-left">Invoice No.</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-center">Inv. Type</th>
                      <th className="px-4 py-3 text-center">GST/Non-GST</th>
                      <th className="px-4 py-3 text-center">Payment Mode</th>
                      <th className="px-4 py-3 text-left">Salesperson</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                      <th className="px-4 py-3 text-right">Discount</th>
                      <th className="px-4 py-3 text-right">GST</th>
                      <th className="px-4 py-3 text-right">Grand Total</th>
                      <th className="px-4 py-3 text-right">Received</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="text-center py-16 text-slate-400">
                          <Banknote className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">No cash invoices found for the selected filters.</p>
                        </td>
                      </tr>
                    ) : rows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-700">{r.invoiceNumber || '—'}</td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">{safeDate(r.invoiceDate)}</td>
                        <td className="px-4 py-2.5 font-medium max-w-[160px] truncate">{r.customerName || 'Cash Customer'}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{r.invoiceType}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.gstType === 'GST' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                            {r.gstType}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">{r.paymentMode || 'Cash'}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs">{r.soldBy || '—'}</td>
                        <td className="px-4 py-2.5 text-right">{safeINR(r.subtotal)}</td>
                        <td className="px-4 py-2.5 text-right text-red-600">{safeNum(r.discount) > 0 ? safeINR(r.discount) : '—'}</td>
                        <td className="px-4 py-2.5 text-right text-indigo-600">{safeNum(r.gst) > 0 ? safeINR(r.gst) : '—'}</td>
                        <td className="px-4 py-2.5 text-right font-bold">{safeINR(r.grandTotal)}</td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold">{safeINR(r.amountReceived)}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${safeNum(r.balance) > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {safeNum(r.balance) > 0 ? safeINR(r.balance) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[r.status] || 'bg-slate-50 text-slate-500'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {rows.length > 0 && (
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                      <tr className="font-bold text-sm">
                        <td className="px-4 py-3 text-xs text-slate-600 uppercase" colSpan={7}>Total ({rows.length} invoices)</td>
                        <td className="px-4 py-3 text-right">{safeINR(rows.reduce((s, r) => s + safeNum(r.subtotal), 0))}</td>
                        <td className="px-4 py-3 text-right text-red-600">{safeINR(rows.reduce((s, r) => s + safeNum(r.discount), 0))}</td>
                        <td className="px-4 py-3 text-right text-indigo-600">{safeINR(rows.reduce((s, r) => s + safeNum(r.gst), 0))}</td>
                        <td className="px-4 py-3 text-right">{safeINR(rows.reduce((s, r) => s + safeNum(r.grandTotal), 0))}</td>
                        <td className="px-4 py-3 text-right text-emerald-600">{safeINR(rows.reduce((s, r) => s + safeNum(r.amountReceived), 0))}</td>
                        <td className="px-4 py-3 text-right text-amber-600">{safeINR(rows.reduce((s, r) => s + safeNum(r.balance), 0))}</td>
                        <td className="px-4 py-3" />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
