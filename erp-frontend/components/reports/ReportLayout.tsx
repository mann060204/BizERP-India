'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, Search, FileText, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Column {
  key: string;
  label: string;
  format?: (val: any, row?: any) => any;
  align?: 'left' | 'center' | 'right';
  disableTotal?: boolean;
}

type ReportCategory = 'Accounts' | 'Inventory' | 'Sales' | 'Customers' | 'Purchases' | 'Suppliers' | 'Expenses' | 'GSTR';

const categoryColors: Record<ReportCategory, { badge: string; text: string }> = {
  Accounts: { badge: 'bg-orange-50 text-orange-600', text: 'text-orange-600' },
  Inventory: { badge: 'bg-purple-50 text-purple-600', text: 'text-purple-600' },
  Sales: { badge: 'bg-green-50 text-green-700', text: 'text-green-700' },
  Customers: { badge: 'bg-blue-50 text-blue-700', text: 'text-blue-700' },
  Purchases: { badge: 'bg-red-50 text-red-700', text: 'text-red-700' },
  Suppliers: { badge: 'bg-yellow-50 text-yellow-700', text: 'text-yellow-700' },
  Expenses: { badge: 'bg-rose-50 text-rose-700', text: 'text-rose-700' },
  GSTR: { badge: 'bg-indigo-50 text-indigo-700', text: 'text-indigo-700' },
};

interface ReportLayoutProps {
  title: string;
  subtitle: string;
  columns: Column[];
  fetchData: () => Promise<any[]>;
  category?: ReportCategory;
  extraHeader?: React.ReactNode;
}

export default function ReportLayout({ title, subtitle, columns, fetchData, category = 'Accounts', extraHeader }: ReportLayoutProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const exportCSV = () => {
    if (!filteredData.length) return;
    const headers = columns.map(c => c.label).join(',');
    const rows = filteredData.map(row =>
      columns.map(col => {
        const val = col.format ? col.format(row[col.key], row) : (row[col.key] ?? '');
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
  };

  const exportExcel = () => {
    if (!filteredData.length) return;
    const headers = columns.map(c => c.label);
    const rows = filteredData.map(row => 
      columns.map(col => col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''))
    );
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_report.xlsx`);
  };

  const exportPDF = () => {
    if (!filteredData.length) return;
    const doc = new jsPDF('landscape');
    doc.text(`${title} - ${subtitle}`, 14, 15);
    const headers = columns.map(c => c.label);
    const rows = filteredData.map(row => 
      columns.map(col => {
        const val = col.format ? col.format(row[col.key], row) : (row[col.key] ?? '');
        // Strip out HTML or custom components if any, though usually simple strings here
        // Handle Rs symbol which sometimes breaks PDF default fonts by replacing with INR or keeping
        return String(val).replace(/₹/g, 'Rs ');
      })
    );
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] }
    });
    doc.save(`${title.replace(/\s+/g, '_')}_report.pdf`);
  };

  const exportDoc = () => {
    if (!filteredData.length) return;
    const headers = columns.map(c => `<th>${c.label}</th>`).join('');
    const rows = filteredData.map(row => {
      const cells = columns.map(col => {
        const val = col.format ? col.format(row[col.key], row) : (row[col.key] ?? '');
        return `<td>${val}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>${title}</title></head>
    <body>
      <h2>${title}</h2>
      <p>${subtitle}</p>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead><tr>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_report.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };
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
          const formatted = col.format(val, item);
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
                <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${categoryColors[category]?.badge || 'bg-orange-50 text-orange-600'}`}>
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
            <div className="relative">
              <button 
                className="erp-button-outline" 
                onClick={() => setShowExportMenu(!showExportMenu)}
                onBlur={() => setTimeout(() => setShowExportMenu(false), 200)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-xl p-2 z-50 flex flex-col gap-1">
                  <button onClick={exportCSV} className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition">CSV File (.csv)</button>
                  <button onClick={exportExcel} className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-green-600 rounded-lg transition">Excel File (.xlsx)</button>
                  <button onClick={exportPDF} className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-600 rounded-lg transition">PDF Document (.pdf)</button>
                  <button onClick={exportDoc} className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition">Word Document (.doc)</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {extraHeader && (
        <div className="bg-white border-b border-slate-100 px-6 py-3 max-w-7xl mx-auto w-full flex items-center gap-4">
          {extraHeader}
        </div>
      )}

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
                          {col.format ? col.format(row[col.key], row) : (row[col.key] ?? '—')}
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
                      if (col.align === 'right' && !col.disableTotal) {
                        const sum = filteredData.reduce((acc, row) => {
                          const val = row[col.key];
                          return acc + (typeof val === 'number' ? val : 0);
                        }, 0);
                        return (
                          <td key={i} className="px-4 py-2.5 text-right font-semibold text-slate-700 text-xs">
                            {sum !== 0 ? (col.format ? col.format(sum, {}) : sum.toFixed(2)) : ''}
                          </td>
                        );
                      }
                      return <td key={i} className={`px-4 py-2.5 text-xs text-slate-500 font-medium ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
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
