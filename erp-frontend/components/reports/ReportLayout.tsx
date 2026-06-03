'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, Search, FileText, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Column {
  key: string;
  label: string;
  format?: (val: any) => any;
  align?: 'left' | 'center' | 'right';
}

interface ReportLayoutProps {
  title: string;
  subtitle: string;
  columns: Column[];
  fetchData: () => Promise<any[]>;
  category?: 'Accounts' | 'Inventory';
}

export default function ReportLayout({ title, subtitle, columns, fetchData, category = 'Accounts' }: ReportLayoutProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  // Use ref to avoid stale closure / infinite re-render with fetchData
  const fetchRef = useRef(fetchData);
  fetchRef.current = fetchData;

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchRef.current().then(res => {
      setData(Array.isArray(res) ? res : []);
      setLoading(false);
    }).catch(err => {
      console.error('Report fetch error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load report data');
      setData([]);
      setLoading(false);
    });
  };

  // Run only once on mount
  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredData = data.filter(item => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return columns.some(col => {
      const val = item[col.key];
      if (val && typeof val === 'string' && val.toLowerCase().includes(searchLower)) return true;
      if (val && typeof val === 'number' && val.toString().includes(searchLower)) return true;
      if (col.format) {
        try {
          const formatted = col.format(val);
          if (formatted && typeof formatted === 'string' && formatted.toLowerCase().includes(searchLower)) return true;
        } catch { /* ignore */ }
      }
      return false;
    });
  });

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
                <span className="text-[10px] font-bold tracking-wider text-orange-600 uppercase bg-orange-50 px-2 py-0.5 rounded">
                  {category} Report
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="erp-button-outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              className="erp-button-outline"
              onClick={() => {
                if (!filteredData.length) return;
                const headers = columns.map(c => c.label).join(',');
                const rows = filteredData.map(row =>
                  columns.map(col => {
                    const val = col.format ? col.format(row[col.key]) : (row[col.key] ?? '');
                    return `"${String(val).replace(/"/g, '""')}"`;
                  }).join(',')
                );
                const csv = [headers, ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${title.replace(/\s+/g, '_')}_report.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="glass rounded-2xl border border-slate-200 overflow-hidden flex flex-col bg-white shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="font-semibold text-slate-800">{subtitle}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {loading ? 'Loading...' : error ? 'Error loading data' : `${filteredData.length} records found`}
              </p>
            </div>
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search report..." 
                className="erp-input pl-9 w-full bg-white"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                <tr>
                  {columns.map((col, i) => (
                    <th key={i} className={`px-4 py-3 font-medium whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center">
                      <Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto mb-2" />
                      <p className="text-slate-500">Loading report data...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                      <FileText className="w-10 h-10 mx-auto mb-3 text-red-300" />
                      <p className="text-red-500 font-medium">Error loading data</p>
                      <p className="text-slate-400 text-xs mt-1">{error}</p>
                      <button onClick={loadData} className="mt-3 text-orange-500 underline text-sm">Retry</button>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                      <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p>No data found for this report.</p>
                      {search && <p className="text-xs mt-1">Try clearing the search filter.</p>}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition">
                      {columns.map((col, j) => (
                        <td key={j} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                          {col.format ? col.format(row[col.key]) : (row[col.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
              {!loading && !error && filteredData.length > 0 && (
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr>
                    {columns.map((col, i) => {
                      // Sum numeric right-aligned columns
                      if (col.align === 'right') {
                        const sum = filteredData.reduce((acc, row) => {
                          const val = row[col.key];
                          return acc + (typeof val === 'number' ? val : 0);
                        }, 0);
                        return (
                          <td key={i} className="px-4 py-2.5 text-right font-semibold text-slate-700 text-xs">
                            {sum > 0 ? (col.format ? col.format(sum) : sum.toFixed(2)) : ''}
                          </td>
                        );
                      }
                      return <td key={i} className="px-4 py-2.5 text-xs text-slate-500 font-medium">
                        {i === 0 ? `Total (${filteredData.length})` : ''}
                      </td>;
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
