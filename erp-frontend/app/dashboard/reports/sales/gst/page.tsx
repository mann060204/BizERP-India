'use client';
import { useState, useCallback, useEffect } from 'react';
import { reportsApi } from '../../../../../lib/erp-api';
import DateRangeFilter from '../../../../../components/reports/DateRangeFilter';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { ArrowLeft, RefreshCw, FileStack } from 'lucide-react';
import Link from 'next/link';

const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

export default function Page() {
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(lastDay);
  const [key, setKey] = useState(0);

  const columns: any[] = [
    { key: 'invoiceNumber', label: 'Invoice #' },
    { key: 'invoiceDate', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'invoiceType', label: 'Type', align: 'center' },
    { key: 'customerSnapshot', label: 'Customer', format: (v: any) => v?.name || 'Cash' },
    { key: 'placeOfSupply', label: 'Place of Supply' },
    { key: 'totalTaxableAmount', label: 'Taxable', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'totalCGST', label: 'CGST', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'totalSGST', label: 'SGST', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'totalIGST', label: 'IGST', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'totalGST', label: 'Total GST', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'grandTotal', label: 'Grand Total', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
  ];

  const fetchData = useCallback(async () => {
    const res = await reportsApi.getSalesGST({ from, to });
    // GST report returns { invoices, rateSummary } — return invoices for table
    return res.data?.data?.invoices || [];
  }, [from, to]);

  return (
    <ReportLayout title="GST Sales Register" subtitle={`Invoice-level GST detail • ${from} to ${to}`}
      category="Sales" columns={columns} fetchData={fetchData} key={`${key}-${from}-${to}`}
      extraHeader={<DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onRefresh={() => setKey(k => k + 1)} />}
    />
  );
}
