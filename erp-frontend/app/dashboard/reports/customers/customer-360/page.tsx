'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ArrowLeft, Search, Users, IndianRupee, AlertTriangle, Package, AlertCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { customersApi, reportsApi } from '../../../../../lib/erp-api';
import { safeINR, extractArray } from '../../../../../lib/report-utils';

const INR = safeINR;

const TABS = ['Overview', 'Ledger', 'Invoice History', 'Items Bought', 'Aging'] as const;
type Tab = typeof TABS[number];

/** Build an "Items Bought" summary from invoice lineItems */
function buildItemSummary(invoices: any[]) {
  const map = new Map<string, { itemName: string; lastRate: number; totalQty: number; lastDate: Date | null; unit: string }>();
  // Sort invoices newest first so first seen = latest
  const sorted = [...invoices].sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
  sorted.forEach(inv => {
    (inv.lineItems || []).forEach((li: any) => {
      const key = li.productId?.toString() || li.productName;
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, { itemName: li.productName || '—', lastRate: li.rate || 0, totalQty: 0, lastDate: inv.invoiceDate ? new Date(inv.invoiceDate) : null, unit: li.unit || '' });
      }
      const entry = map.get(key)!;
      entry.totalQty += (li.quantity || 0);
    });
  });
  return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
}

/** Export data as CSV — accepts any[][] and stringifies each cell */
function exportCSV(filename: string, headers: string[], rows: any[][]) {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}

export default function Customer360Page() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('Overview');
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  useEffect(() => {
    customersApi.list({ limit: 200 }).then(res => {
      setCustomers((res as any).data?.customers || (res as any).data || []);
    }).catch(console.error).finally(() => setLoadingCustomers(false));
  }, []);

  const loadCustomerDetail = useCallback(async (c: any) => {
    setSelected(c);
    setTab('Overview');
    setDetailError(null);
    setLoadingDetail(true);
    try {
      const [ledgerRes, invRes] = await Promise.all([
        customersApi.getLedger(c._id),
        // FIXED: pass customerId so backend strictly filters to this customer only
        reportsApi.getSalesInvoicewise({ customerId: c._id }),
      ]);
      setLedger(extractArray((ledgerRes as any).data?.ledger || (ledgerRes as any).data || ledgerRes));
      // Backend returns { success, data: { summary, data: [...] } }
      const invData = (invRes as any)?.data?.data || (invRes as any)?.data || invRes;
      setInvoices(extractArray(invData));
    } catch (e: any) {
      setDetailError(e?.response?.data?.message || e?.message || 'Failed to load customer data');
    } finally { setLoadingDetail(false); }
  }, []);

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.city || '').toLowerCase().includes(search.toLowerCase())
  );

  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const safeLedger = Array.isArray(ledger) ? ledger : [];

  // ── CANONICAL CALCULATIONS using correct field names ────────────────────────
  const totalSales = safeInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
  const totalPaid = safeInvoices.reduce((s, i) => s + (i.amountReceived || 0), 0);
  const outstanding = Math.max(0, totalSales - totalPaid);
  const invoiceCount = safeInvoices.length;

  const itemSummary = buildItemSummary(safeInvoices);

  const sortedInvoices = [...safeInvoices].sort((a, b) => {
    const diff = new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
    return sortDir === 'desc' ? -diff : diff;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-4">
            {/* Back to Customer Reports list */}
            <Link href="/dashboard/reports/customers" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-600">Customer Reports</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Customer 360°</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Customer List */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" placeholder="Search customers..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingCustomers ? (
              <div className="flex justify-center py-12"><RefreshCw className="w-5 h-5 animate-spin text-slate-400" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No customers found</div>
            ) : filtered.map(c => (
              <button key={c._id} onClick={() => loadCustomerDetail(c)}
                className={`w-full flex items-start gap-3 p-4 text-left border-b border-slate-50 transition hover:bg-blue-50 ${selected?._id === c._id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 font-bold text-blue-700 text-sm">
                  {(c.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{c.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{c.phone || c.city || 'No details'}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Detail Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Users className="w-16 h-16 mb-4 opacity-30" />
              <h3 className="text-lg font-semibold text-slate-500">Select a Customer</h3>
              <p className="text-sm mt-1">Choose a customer from the list to view their 360° profile</p>
            </div>
          ) : loadingDetail ? (
            <div className="flex items-center justify-center py-32"><RefreshCw className="w-8 h-8 text-blue-400 animate-spin" /></div>
          ) : detailError ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="font-semibold text-slate-700">Failed to load customer data</p>
              <p className="text-sm text-slate-400">{detailError}</p>
              <button onClick={() => selected && loadCustomerDetail(selected)} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">Try Again</button>
            </div>
          ) : (
            <>
              {/* Header Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-2xl shrink-0">
                    {(selected.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                      {selected.phone && <span>📞 {selected.phone}</span>}
                      {selected.email && <span>✉ {selected.email}</span>}
                      {selected.city && <span>📍 {selected.city}, {selected.state}</span>}
                      {selected.gstNumber && <span>🏛 GST: {selected.gstNumber}</span>}
                    </div>
                  </div>
                </div>
                {/* KPI Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
                  {[
                    { icon: IndianRupee, label: 'Total Sales', value: INR(totalSales), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { icon: IndianRupee, label: 'Total Paid', value: INR(totalPaid), color: 'text-blue-600', bg: 'bg-blue-50' },
                    { icon: AlertTriangle, label: 'Outstanding', value: INR(outstanding), color: outstanding > 0 ? 'text-amber-600' : 'text-slate-400', bg: outstanding > 0 ? 'bg-amber-50' : 'bg-slate-50' },
                    { icon: Package, label: 'Total Invoices', value: invoiceCount, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  ].map((k, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center`}>
                        <k.icon className={`w-4 h-4 ${k.color}`} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">{k.label}</div>
                        <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-5">
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {t}
                  </button>
                ))}
              </div>

              {/* ── Tab: Overview ─────────────────────────────────────────────── */}
              {tab === 'Overview' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-semibold text-slate-800 mb-4">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {[
                        ['Name', selected.name], ['Phone', selected.phone], ['Email', selected.email],
                        ['City', selected.city], ['State', selected.state], ['Pincode', selected.pincode],
                        ['GST Number', selected.gstNumber], ['Credit Limit', INR(selected.creditLimit)],
                        ['Credit Days', selected.creditDays ? `${selected.creditDays} days` : '—'],
                        ['Balance', INR(selected.balance)],
                      ].filter(([,v]) => v).map(([label, value], i) => (
                        <div key={i}><div className="text-xs text-slate-400 mb-0.5">{label}</div><div className="font-medium text-slate-800">{value || '—'}</div></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-semibold text-slate-800 mb-3">Recent Invoices</h3>
                    {safeInvoices.length === 0 ? (
                      <p className="text-center py-6 text-slate-400 text-sm">No invoices found for this customer</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead><tr className="text-xs text-slate-400 uppercase border-b">
                          <th className="pb-2 text-left">Invoice</th>
                          <th className="pb-2 text-left">Date</th>
                          <th className="pb-2 text-right">Amount</th>
                          <th className="pb-2 text-right">Paid</th>
                          <th className="pb-2 text-right">Balance</th>
                          <th className="pb-2 text-center">Status</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-50">
                          {sortedInvoices.slice(0, 10).map((inv: any, i: number) => {
                            const bal = inv.balance ?? Math.max(0, (inv.grandTotal||0) - (inv.amountReceived||0));
                            return (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="py-2 font-medium">{inv.invoiceNumber}</td>
                                <td className="py-2 text-slate-500 text-xs">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : '—'}</td>
                                <td className="py-2 text-right">{INR(inv.grandTotal)}</td>
                                <td className="py-2 text-right text-emerald-600">{INR(inv.amountReceived)}</td>
                                <td className="py-2 text-right text-amber-600">{INR(bal)}</td>
                                <td className="py-2 text-center"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : inv.status === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{inv.status}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab: Ledger ─────────────────────────────────────────────── */}
              {tab === 'Ledger' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50"><h3 className="font-semibold text-slate-800">Account Ledger</h3></div>
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10"><tr className="text-xs text-slate-400 uppercase bg-slate-50 border-b">
                      <th className="px-4 py-2.5 text-left">Date</th>
                      <th className="px-4 py-2.5 text-left">Description</th>
                      <th className="px-4 py-2.5 text-right">Debit</th>
                      <th className="px-4 py-2.5 text-right">Credit</th>
                      <th className="px-4 py-2.5 text-right">Balance</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {safeLedger.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-12 text-slate-400">No ledger entries found</td></tr>
                      ) : safeLedger.map((e: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-slate-500 text-xs">{e.date ? new Date(e.date).toLocaleDateString('en-IN') : '—'}</td>
                          <td className="px-4 py-2.5">{e.description || e.narration || '—'}</td>
                          <td className="px-4 py-2.5 text-right text-red-600">{e.debit ? INR(e.debit) : ''}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600">{e.credit ? INR(e.credit) : ''}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">{INR(e.balance || e.runningBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Tab: Invoice History ─────────────────────────────────────── */}
              {tab === 'Invoice History' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">All Invoices ({safeInvoices.length})</h3>
                    <div className="flex items-center gap-2">
                      <select value={sortDir} onChange={e => setSortDir(e.target.value as any)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-400">
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                      <button onClick={() => exportCSV(`invoices_${selected?.name}.csv`,
                        ['Invoice', 'Date', 'Amount', 'Paid', 'Balance', 'Status'],
                        sortedInvoices.map(i => [i.invoiceNumber, new Date(i.invoiceDate).toLocaleDateString('en-IN'), i.grandTotal, i.amountReceived, i.balance ?? Math.max(0,(i.grandTotal||0)-(i.amountReceived||0)), i.status])
                      )} className="flex items-center gap-1 text-xs px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                        <Download className="w-3 h-3" /> Export
                      </button>
                    </div>
                  </div>
                  <div className="overflow-auto max-h-[60vh]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10"><tr className="text-xs text-slate-400 uppercase bg-slate-50 border-b">
                        <th className="px-4 py-2.5 text-left">Invoice</th>
                        <th className="px-4 py-2.5 text-left">Date</th>
                        <th className="px-4 py-2.5 text-right">Amount</th>
                        <th className="px-4 py-2.5 text-right">Paid</th>
                        <th className="px-4 py-2.5 text-right">Balance</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {safeInvoices.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-12 text-slate-400">No invoices found for this customer</td></tr>
                        ) : sortedInvoices.map((inv: any, i: number) => {
                          const bal = inv.balance ?? Math.max(0, (inv.grandTotal||0) - (inv.amountReceived||0));
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-4 py-2.5 font-medium">{inv.invoiceNumber}</td>
                              <td className="px-4 py-2.5 text-slate-500 text-xs">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : '—'}</td>
                              <td className="px-4 py-2.5 text-right">{INR(inv.grandTotal)}</td>
                              <td className="px-4 py-2.5 text-right text-emerald-600">{INR(inv.amountReceived)}</td>
                              <td className="px-4 py-2.5 text-right text-amber-600">{INR(bal)}</td>
                              <td className="px-4 py-2.5 text-center"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : inv.status === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{inv.status}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Tab: Items Bought ─────────────────────────────────────────── */}
              {tab === 'Items Bought' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">Items Bought from {selected.name}</h3>
                    <button onClick={() => exportCSV(`items_${selected?.name}.csv`,
                      ['Item', 'Last Rate', 'Total Qty', 'Last Purchase'],
                      itemSummary.map(it => [it.itemName, it.lastRate, it.totalQty, it.lastDate ? it.lastDate.toLocaleDateString('en-IN') : '—'])
                    )} className="flex items-center gap-1 text-xs px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                      <Download className="w-3 h-3" /> Export
                    </button>
                  </div>
                  {itemSummary.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">No items found — ensure invoices have line items.</div>
                  ) : (
                    <div className="overflow-auto max-h-[60vh]">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10"><tr className="text-xs text-slate-400 uppercase bg-slate-50 border-b">
                          <th className="px-4 py-2.5 text-left">Item Name</th>
                          <th className="px-4 py-2.5 text-right">Last Rate</th>
                          <th className="px-4 py-2.5 text-right">Total Qty</th>
                          <th className="px-4 py-2.5 text-left">Last Purchase</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-100">
                          {itemSummary.map((it, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-4 py-2.5 font-medium">{it.itemName}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-indigo-700">{INR(it.lastRate)}</td>
                              <td className="px-4 py-2.5 text-right">{it.totalQty} {it.unit}</td>
                              <td className="px-4 py-2.5 text-slate-500 text-xs">{it.lastDate ? it.lastDate.toLocaleDateString('en-IN') : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab: Aging ───────────────────────────────────────────────── */}
              {tab === 'Aging' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-5">Receivable Aging</h3>
                  <div className="space-y-3">
                    {(() => {
                      const now = Date.now();
                      const buckets = [
                        { label: 'Current (0–30 days)', test: (ms: number) => ms <= 30 * 86400000 },
                        { label: '31–60 days', test: (ms: number) => ms > 30 * 86400000 && ms <= 60 * 86400000 },
                        { label: '61–90 days', test: (ms: number) => ms > 60 * 86400000 && ms <= 90 * 86400000 },
                        { label: '91–180 days', test: (ms: number) => ms > 90 * 86400000 && ms <= 180 * 86400000 },
                        { label: '180+ days (Critical)', test: (ms: number) => ms > 180 * 86400000 },
                      ];
                      const colors = ['text-emerald-700 bg-emerald-50', 'text-amber-700 bg-amber-50', 'text-orange-700 bg-orange-50', 'text-red-700 bg-red-50', 'text-red-900 bg-red-100'];
                      return buckets.map((b, i) => {
                        // Only show unpaid/partial invoices with a real pending balance
                        const invs = safeInvoices.filter(inv => {
                          if (inv.status === 'paid') return false;
                          const pendingBal = inv.balance ?? Math.max(0, (inv.grandTotal||0) - (inv.amountReceived||0));
                          if (pendingBal <= 0) return false;
                          const ageMs = now - new Date(inv.invoiceDate).getTime();
                          return b.test(ageMs);
                        });
                        // Use stored balance or compute fallback — NEVER use undefined paidAmount
                        const total = invs.reduce((s: number, inv: any) =>
                          s + (inv.balance ?? Math.max(0, (inv.grandTotal||0) - (inv.amountReceived||0))), 0);
                        return (
                          <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${colors[i].split(' ')[1]}`}>
                            <div>
                              <div className={`font-semibold text-sm ${colors[i].split(' ')[0]}`}>{b.label}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{invs.length} invoice{invs.length !== 1 ? 's' : ''}</div>
                            </div>
                            <div className={`text-xl font-bold ${colors[i].split(' ')[0]}`}>{INR(total)}</div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}