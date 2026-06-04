'use client';
import { useState, useCallback } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import DateRangeFilter from '../../../../../components/reports/DateRangeFilter';
import { reportsApi } from '../../../../../lib/erp-api';
import { getGSTStateName } from '../../../../../lib/utils';

const now = new Date(); const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

export default function Page() {
  const [from, setFrom] = useState(firstDay); const [to, setTo] = useState(lastDay); const [key, setKey] = useState(0);
  const formatCurrency = (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v || 0));
  const columns: any[] = [
    { key: 'gstin', label: 'GSTIN / UIN', format: (v: any) => v || '—' },
    { key: 'supplierName', label: 'Supplier\'s Name' },
    { key: 'billNumber', label: 'Purchase Bill' },
    { key: 'billDate', label: 'Invoice Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'placeOfSupply', label: 'PoS (State)', format: (v: any, row: any) => getGSTStateName(v || row?.gstin) },
    { key: 'grandTotal', label: 'Total Invoice Value', align: 'right', format: formatCurrency },
    { key: 'rate', label: 'Rate', align: 'right', format: (v: any) => `${v}%` },
    { key: 'taxableValue', label: 'Taxable Value', align: 'right', format: formatCurrency },
    { key: 'igst', label: 'IGST', align: 'right', format: formatCurrency },
    { key: 'cgst', label: 'CGST', align: 'right', format: formatCurrency },
    { key: 'sgst', label: 'SGST', align: 'right', format: formatCurrency },
  ];
  const fetchData = useCallback(async () => { const res = await reportsApi.getPurchasesGST({ from, to }); return res.data?.data?.bills || []; }, [from, to]);
  return <ReportLayout title="GST Purchase Register" subtitle={`Bill-level ITC/GST input register • ${new Date(from).toLocaleDateString()} to ${new Date(to).toLocaleDateString()}`} category="Purchases" columns={columns} fetchData={fetchData} key={`${key}`} extraHeader={<DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onRefresh={() => setKey(k => k + 1)} />} />;
}
