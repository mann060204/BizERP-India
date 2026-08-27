'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { RefreshCw, ArrowLeft, Tag, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { reportsApi } from '../../../../../lib/erp-api';
import { safeINR, safePctStr, safeNum, getPresetRange, formatDateForAPI, currentFYStart } from '../../../../../lib/report-utils';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-slate-700">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name.includes('%') ? safePctStr(p.value) : safeINR(p.value)}
        </p>
      ))}
    </div>
  );
};

const TABS = [
  { id: 'customer', label: 'By Customer' },
  { id: 'product', label: 'By Product' },
  { id: 'category', label: 'By Category' },
  { id: 'salesperson', label: 'By Salesperson' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function DiscountImpactPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<TabId>('customer');

  // Date filter state
  const fyStart = formatDateForAPI(currentFYStart());
  const today = formatDateForAPI(new Date());
  const [fromDate, setFromDate] = useState(fyStart);
  const [toDate, setToDate] = useState(today);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsApi.getDiscountImpact({ fromDate, toDate });
      setData((res as any).data?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load report');
    } finally { setLoading(false); }
  }, [fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  const applyPreset = (preset: string) => {
    const r = getPresetRange(preset as any);
    setFromDate(r.from);
    setToDate(r.to);
  };

  const summary = data?.summary;
  const tableData: any[] = tab === 'customer' ? (data?.byCustomer || [])
    : tab === 'product' ? (data?.byProduct || [])
    : tab === 'category' ? (data?.byCategory || [])
    : (data?.bySalesperson || []);

  const nameKey = tab === 'customer' ? 'customerName'
    : tab === 'product' ? 'productName'
    : tab === 'category' ? 'category'
    : 'salesperson';

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
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-600">Management Analytics</span>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">Discount Impact Analysis</h1>
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

        {/* Date Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Today', key: 'today' },
                { label: 'This Month', key: 'this_month' },
                { label: 'Last Month', key: 'last_month' },
                { label: 'This FY', key: 'this_fy' },
                { label: 'Prev FY', key: 'prev_fy' },
              ].map(({ label, key }) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg transition-all"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2 ml-auto">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <button
                onClick={load}
                className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Error state */}
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
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : !error && (
          <>
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Gross Sales', value: safeINR(summary?.grossSales), color: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-200' },
                { label: 'Total Discount', value: safeINR(summary?.totalDiscount), color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
                { label: 'Net Sales', value: safeINR(summary?.netSales), color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { label: 'Discount %', value: safePctStr(summary?.discountPct), color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
                { label: 'Total GST', value: safeINR(summary?.totalGST), color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
                { label: 'Invoices', value: String(safeNum(summary?.invoiceCount)), color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
              ].map((k, i) => (
                <div key={i} className={`rounded-xl border ${k.border} ${k.bg} p-4 shadow-sm`}>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{k.label}</div>
                  <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Discount Visualization */}
            {data?.byCustomer?.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Bar Chart – Discount by category */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-4">Discount by Category</h3>
                  {data?.byCategory?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={data.byCategory.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                        <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={100} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="discount" name="Discount" fill="#ef4444" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No category data</div>
                  )}
                </div>

                {/* Pie Chart – Discount share by top customers */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-4">Discount Share (Top 8 Customers)</h3>
                  {data?.byCustomer?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={data.byCustomer.slice(0, 8)}
                          dataKey="discount"
                          nameKey="customerName"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ customerName, discountPct }: any) => `${(customerName || '').slice(0, 12)}… ${safePctStr(discountPct)}`}
                          labelLine={false}
                        >
                          {data.byCustomer.slice(0, 8).map((_: any, idx: number) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => safeINR(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No customer data</div>
                  )}
                </div>
              </div>
            )}

            {/* Tabs + Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Tab Bar */}
              <div className="flex gap-1 p-3 border-b border-slate-100 bg-slate-50/50">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-left">
                        {tab === 'customer' ? 'Customer' : tab === 'product' ? 'Product' : tab === 'category' ? 'Category' : 'Salesperson'}
                      </th>
                      {tab === 'customer' && <th className="px-4 py-3 text-right">Invoices</th>}
                      {tab === 'product' && <th className="px-4 py-3 text-right">Qty Sold</th>}
                      <th className="px-4 py-3 text-right">Gross Sales</th>
                      <th className="px-4 py-3 text-right text-red-600">Discount</th>
                      <th className="px-4 py-3 text-right text-orange-600">Disc %</th>
                      <th className="px-4 py-3 text-right text-emerald-600">Net Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          No data found for the selected filters.
                        </td>
                      </tr>
                    ) : tableData.map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-medium">{r[nameKey] || '—'}</td>
                        {tab === 'customer' && <td className="px-4 py-2.5 text-right">{r.invoiceCount || 0}</td>}
                        {tab === 'product' && <td className="px-4 py-2.5 text-right">{safeNum(r.qtySold).toFixed(0)}</td>}
                        <td className="px-4 py-2.5 text-right">{safeINR(r.grossSales)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-red-600">{safeINR(r.discount)}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${safeNum(r.discountPct) > 15 ? 'text-red-600' : safeNum(r.discountPct) > 8 ? 'text-orange-600' : 'text-slate-600'}`}>
                          {safePctStr(r.discountPct)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">{safeINR(r.netSales)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {tableData.length > 0 && (
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td className="px-4 py-3 font-bold text-xs text-slate-600 uppercase">Total</td>
                        {(tab === 'customer' || tab === 'product') && <td className="px-4 py-3 text-right font-bold">
                          {tableData.reduce((s, r) => s + safeNum(tab === 'customer' ? r.invoiceCount : r.qtySold), 0).toFixed(0)}
                        </td>}
                        <td className="px-4 py-3 text-right font-bold">{safeINR(tableData.reduce((s, r) => s + safeNum(r.grossSales), 0))}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">{safeINR(tableData.reduce((s, r) => s + safeNum(r.discount), 0))}</td>
                        <td className="px-4 py-3 text-right font-bold text-orange-600">{safePctStr(summary?.discountPct)}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700">{safeINR(tableData.reduce((s, r) => s + safeNum(r.netSales), 0))}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {tableData.length === 0 && !error && (
              <div className="text-center py-16 text-slate-400">
                <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No discount data found for the selected period.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
