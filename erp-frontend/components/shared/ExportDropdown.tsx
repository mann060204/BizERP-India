'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, FileIcon, FileType } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Column {
  header: string;
  key?: string;
  render?: (row: any) => string | number;
}

interface ExportDropdownProps {
  data: any[];
  columns: Column[];
  filename: string;
}

export default function ExportDropdown({ data, columns, filename }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getExportData = () => {
    return data.map(row => {
      const exportRow: any = {};
      columns.forEach(col => {
        let value = '';
        if (col.render) {
          value = String(col.render(row));
        } else if (col.key) {
          value = String(row[col.key] || '');
        }
        exportRow[col.header] = value;
      });
      return exportRow;
    });
  };

  const exportExcel = () => {
    const exportData = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    setOpen(false);
  };

  const exportCSV = () => {
    const exportData = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    setOpen(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const tableData = data.map(row => {
      return columns.map(col => {
        if (col.render) return col.render(row);
        if (col.key) return row[col.key] || '';
        return '';
      });
    });

    autoTable(doc, {
      head: [columns.map(c => c.header)],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] }, // action-800 color
    });

    doc.save(`${filename}.pdf`);
    setOpen(false);
  };

  const exportWord = () => {
    const tableHeaders = columns.map(c => `<th>${c.header}</th>`).join('');
    const tableRows = data.map(row => {
      const tds = columns.map(col => {
        let val = '';
        if (col.render) val = String(col.render(row));
        else if (col.key) val = String(row[col.key] || '');
        return `<td>${val}</td>`;
      }).join('');
      return `<tr>${tds}</tr>`;
    }).join('');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${filename}</title>
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid black; padding: 5px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
      </head>
      <body>
        <h2>${filename}</h2>
        <table>
          <thead><tr>${tableHeaders}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.doc`;
    link.click();
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition shadow-sm"
      >
        <Download className="w-4 h-4" /> Export
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="py-1">
            <button
              onClick={exportExcel}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-green-600 transition"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel (.xlsx)
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-red-600 transition"
            >
              <FileText className="w-4 h-4" /> PDF (.pdf)
            </button>
            <button
              onClick={exportWord}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
            >
              <FileType className="w-4 h-4" /> Word (.doc)
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <FileIcon className="w-4 h-4" /> CSV (.csv)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
