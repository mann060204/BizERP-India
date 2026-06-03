'use client';
import { useState, useCallback } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import DateRangeFilter from '../../../../../components/reports/DateRangeFilter';
import { reportsApi } from '../../../../../lib/erp-api';

const now = new Date(); const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

export default function Page() {
  const [from, setFrom] = useState(firstDay); const [to, setTo] = useState(lastDay); const [key, setKey] = useState(0);
  const columns: any[] = [
    { key: 'gstin', label: 'GSTIN / UIN' },
    { key: 'supplierName', label: 'Supplier\'s Name' },
    { key: 'billNumber', label: 'Purchase Bill' },
    { key: 'billDate', label: 'Invoice Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'placeOfSupply', label: 'PoS (State)' },
    { key: 'grandTotal', label: 'Total Invoice Value', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'rate', label: 'Rate', align: 'right', format: (v: any) => `${v}%` },
    { key: 'taxableValue', label: 'Taxable Value', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'igst', label: 'IGST', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'cgst', label: 'CGST', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'sgst', label: 'SGST', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
  ];
  const fetchData = useCallback(async () => { const res = await reportsApi.getPurchasesGST({ from, to }); return res.data?.data?.bills || []; }, [from, to]);
  return <ReportLayout title="GST Purchase Register" subtitle={`Bill-level ITC/GST input register • ${from} to ${to}`} category="Purchases" columns={columns} fetchData={fetchData} key={`${key}-${from}-${to}`} extraHeader={<DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onRefresh={() => setKey(k => k + 1)} />} />;
}
