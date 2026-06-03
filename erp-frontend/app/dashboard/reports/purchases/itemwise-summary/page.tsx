'use client';
import { useState, useCallback } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import DateRangeFilter from '../../../../../components/reports/DateRangeFilter';
import { reportsApi } from '../../../../../lib/erp-api';

const now = new Date(); const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

export default function Page() {
  const [from, setFrom] = useState(firstDay); const [to, setTo] = useState(lastDay); const [key, setKey] = useState(0);
  const columns: any[] = [
    { key: 'productName', label: 'Item Name' },
    { key: 'hsnCode', label: 'HSN' },
    { key: 'totalQty', label: 'Qty', align: 'right' },
    { key: 'totalTaxable', label: 'Taxable', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'totalCGST', label: 'CGST', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'totalSGST', label: 'SGST', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'totalIGST', label: 'IGST', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'totalGST', label: 'Total GST', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'totalAmount', label: 'Total Amount', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
  ];
  const fetchData = useCallback(async () => { const res = await reportsApi.getPurchasesItemwiseSummary({ from, to }); return res.data?.data || []; }, [from, to]);
  return <ReportLayout title="Itemwise Purchase Summary" subtitle={`GST summary per item across all purchases • ${from} to ${to}`} category="Purchases" columns={columns} fetchData={fetchData} key={`${key}-${from}-${to}`} extraHeader={<DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onRefresh={() => setKey(k => k + 1)} />} />;
}
