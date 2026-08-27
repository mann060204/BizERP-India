'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ArrowLeft, Search, Truck, IndianRupee, AlertTriangle, Package, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { suppliersApi, reportsApi } from '../../../../../lib/erp-api';
import { safeINR, safeNum } from '../../../../../lib/report-utils';

const INR = safeINR;

const TABS = ['Overview', 'Ledger', 'Purchase History', 'Rate History', 'Aging'] as const;
type Tab = typeof TABS[number];

export default function Supplier360Page() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('Overview');
  const [search, setSearch] = useState('');

  useEffect(() => {
    suppliersApi.list({ limit: 200 }).then(res => {
      setSuppliers((res as any).data?.suppliers || (res as any).data || []);
    }).catch(console.error).finally(() => setLoadingSuppliers(false));
  }, []);

  const loadDetail = useCallback(async (s: any) => {
    setSelected(s);
    setTab('Overview');
    setDetailError(null);
    setLoadingDetail(true);
    try {
      const [ledgerRes, purchRes] = await Promise.all([
        suppliersApi.getLedger(s._id),
        reportsApi.getPurchasesBillwise({ supplierId: s._id }),
      ]);
      setLedger((ledgerRes as any).data?.ledger || (ledgerRes as any).data || []);
      setPurchases((purchRes as any).data?.data || (purchRes as any).data || []);
    } catch (e: any) {
      setDetailError(e?.response?.data?.message || e?.message || 'Failed to load supplier data');
    } finally { setLoadingDetail(false); }
  }, []);

  const filtered = (Array.isArray(suppliers) ? suppliers : []).filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search)
  );

  // Always-safe arrays — never crash on .reduce/.map/.filter
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safeLedger = Array.isArray(ledger) ? ledger : [];

  const totalPurchases = safePurchases.reduce((s, i) => s + (i.grandTotal || 0), 0);
  const totalPaid = safePurchases.reduce((s, i) => s + (i.paidAmount || i.amountReceived || 0), 0);
  const outstanding = totalPurchases - totalPaid;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reports" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-600">Supplier Reports</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Supplier 360°</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Supplier List */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingSuppliers ? (
              <div className="flex justify-center py-12"><RefreshCw className="w-5 h-5 animate-spin text-slate-400" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No suppliers found</div>
            ) : filtered.map(s => (
              <button key={s._id} onClick={() => loadDetail(s)}
                className={`w-full flex items-start gap-3 p-4 text-left border-b border-slate-50 transition hover:bg-amber-50 ${selected?._id === s._id ? 'bg-amber-50 border-l-2 border-l-amber-500' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0 font-bold text-amber-700 text-sm">
                  {(s.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{s.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{s.phone || s.city || 'No details'}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Detail Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Truck className="w-16 h-16 mb-4 opacity-30" />
              <h3 className="text-lg font-semibold text-slate-500">Select a Supplier</h3>
              <p className="text-sm mt-1">Choose a supplier to view their complete profile</p>
            </div>
          ) : loadingDetail ? (
            <div className="flex items-center justify-center py-32"><RefreshCw className="w-8 h-8 text-amber-400 animate-spin" /></div>
          ) : detailError ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="font-semibold text-slate-700">Failed to load supplier data</p>
              <p className="text-sm text-slate-400">{detailError}</p>
              <button onClick={() => selected && loadDetail(selected)} className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition">Try Again</button>
            </div>
          ) : (
            <>
              {/* Header Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center font-bold text-amber-700 text-2xl shrink-0">
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
                  {[
                    { icon: IndianRupee, label: 'Total Purchases', value: INR(totalPurchases), color: 'text-amber-600', bg: 'bg-amber-50' },
                    { icon: IndianRupee, label: 'Total Paid', value: INR(totalPaid), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { icon: AlertTriangle, label: 'Outstanding', value: INR(outstanding), color: outstanding > 0 ? 'text-red-600' : 'text-slate-400', bg: outstanding > 0 ? 'bg-red-50' : 'bg-slate-50' },
                    { icon: Package, label: 'Total Bills', value: safePurchases.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  ].map((k, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center`}><k.icon className={`w-4 h-4 ${k.color}`} /></div>
                      <div><div className="text-xs text-slate-400">{k.label}</div><div className={`text-lg font-bold ${k.color}`}>{k.value}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-5">
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
                ))}
              </div>

              {tab === 'Overview' && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-4">Supplier Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[['Name', selected.name], ['Phone', selected.phone], ['Email', selected.email], ['City', selected.city], ['State', selected.state], ['GST Number', selected.gstNumber], ['Balance', INR(selected.balance)]].filter(([,v]) => v).map(([label, value], i) => (
                      <div key={i}><div className="text-xs text-slate-400 mb-0.5">{label}</div><div className="font-medium text-slate-800">{value || '—'}</div></div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'Ledger' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50"><h3 className="font-semibold text-slate-800">Account Ledger</h3></div>
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-slate-400 uppercase bg-slate-50 border-b">
                      <th className="px-4 py-2.5 text-left">Date</th><th className="px-4 py-2.5 text-left">Description</th>
                      <th className="px-4 py-2.5 text-right">Debit</th><th className="px-4 py-2.5 text-right">Credit</th><th className="px-4 py-2.5 text-right">Balance</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {safeLedger.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-slate-400">No ledger entries</td></tr> :
                        safeLedger.map((e: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 text-slate-500 text-xs">{e.date ? new Date(e.date).toLocaleDateString('en-IN') : '—'}</td>
                            <td className="px-4 py-2.5">{e.description || e.narration || '—'}</td>
                            <td className="px-4 py-2.5 text-right text-red-600">{e.debit ? INR(e.debit) : ''}</td>
                            <td className="px-4 py-2.5 text-right text-emerald-600">{e.credit ? INR(e.credit) : ''}</td>
                            <td className="px-4 py-2.5 text-right font-semibold">{INR(e.balance || e.runningBalance)}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'Purchase History' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50"><h3 className="font-semibold text-slate-800">All Purchase Bills ({safePurchases.length})</h3></div>
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-slate-400 uppercase bg-slate-50 border-b">
                      <th className="px-4 py-2.5 text-left">Bill No.</th><th className="px-4 py-2.5 text-left">Date</th>
                      <th className="px-4 py-2.5 text-right">Amount</th><th className="px-4 py-2.5 text-right">Paid</th><th className="px-4 py-2.5 text-right">Balance</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {safePurchases.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-slate-400">No purchase bills found</td></tr> :
                        safePurchases.map((p: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-medium">{p.billNumber || p.purchaseNumber || '—'}</td>
                            <td className="px-4 py-2.5 text-slate-500 text-xs">{p.billDate ? new Date(p.billDate).toLocaleDateString('en-IN') : '—'}</td>
                            <td className="px-4 py-2.5 text-right">{INR(p.grandTotal)}</td>
                            <td className="px-4 py-2.5 text-right text-emerald-600">{INR(p.paidAmount || p.amountReceived)}</td>
                            <td className="px-4 py-2.5 text-right text-amber-600">{INR((p.grandTotal || 0) - (p.paidAmount || p.amountReceived || 0))}</td>
                            <td className="px-4 py-2.5 text-center"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.paymentStatus === 'PAID' || p.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : p.paymentStatus === 'PARTIAL' || p.status === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{p.paymentStatus || p.status || '—'}</span></td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'Rate History' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-4">Item Rate History</h3>
                  <p className="text-sm text-slate-500 mb-4">This shows all items purchased from <strong>{selected.name}</strong> and their last purchase rates.</p>
                  {safePurchases.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead><tr className="text-xs text-slate-400 uppercase bg-slate-50 border-b">
                        <th className="px-4 py-2.5 text-left">Item</th><th className="px-4 py-2.5 text-right">Last Rate</th><th className="px-4 py-2.5 text-right">Qty</th><th className="px-4 py-2.5 text-left">Date</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {safePurchases.flatMap((p: any) => (Array.isArray(p.items) ? p.items : []).map((item: any) => ({ ...item, billDate: p.billDate, billNumber: p.billNumber || p.purchaseNumber }))).slice(0, 30).map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-medium">{item.productName || item.name || '—'}</td>
                            <td className="px-4 py-2.5 text-right font-semibold">{INR(item.rate || item.unitPrice)}</td>
                            <td className="px-4 py-2.5 text-right">{item.quantity} {item.unit}</td>
                            <td className="px-4 py-2.5 text-slate-500 text-xs">{item.billDate ? new Date(item.billDate).toLocaleDateString('en-IN') : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <div className="text-center py-12 text-slate-400">No rate history available</div>}
                </div>
              )}

              {tab === 'Aging' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-5">Payable Aging</h3>
                  <div className="space-y-3">
                    {(() => {
                      const now = Date.now();
                      const buckets = [
                        { label: 'Current (0–30 days)', filter: (p: any) => (p.paymentStatus !== 'PAID' && p.status !== 'paid') && (now - new Date(p.billDate).getTime()) <= 30 * 86400000 },
                        { label: '31–60 days', filter: (p: any) => (p.paymentStatus !== 'PAID' && p.status !== 'paid') && (now - new Date(p.billDate).getTime()) > 30 * 86400000 && (now - new Date(p.billDate).getTime()) <= 60 * 86400000 },
                        { label: '61–90 days', filter: (p: any) => (p.paymentStatus !== 'PAID' && p.status !== 'paid') && (now - new Date(p.billDate).getTime()) > 60 * 86400000 && (now - new Date(p.billDate).getTime()) <= 90 * 86400000 },
                        { label: '91–180 days', filter: (p: any) => (p.paymentStatus !== 'PAID' && p.status !== 'paid') && (now - new Date(p.billDate).getTime()) > 90 * 86400000 && (now - new Date(p.billDate).getTime()) <= 180 * 86400000 },
                        { label: '180+ days (Overdue)', filter: (p: any) => (p.paymentStatus !== 'PAID' && p.status !== 'paid') && (now - new Date(p.billDate).getTime()) > 180 * 86400000 },
                      ];
                      const colors = ['text-emerald-700 bg-emerald-50', 'text-amber-700 bg-amber-50', 'text-orange-700 bg-orange-50', 'text-red-700 bg-red-50', 'text-red-900 bg-red-100'];
                      return buckets.map((b, i) => {
                        const matching = safePurchases.filter(b.filter);
                        const total = matching.reduce((s: number, p: any) => s + ((p.grandTotal || 0) - (p.paidAmount || p.amountReceived || 0)), 0);
                        return (
                          <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${colors[i].split(' ')[1]}`}>
                            <div>
                              <div className={`font-semibold text-sm ${colors[i].split(' ')[0]}`}>{b.label}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{matching.length} bill{matching.length !== 1 ? 's' : ''}</div>
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
