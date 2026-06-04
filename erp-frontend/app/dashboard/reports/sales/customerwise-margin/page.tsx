'use client';
import { useState, useCallback } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import DateRangeFilter from '../../../../../components/reports/DateRangeFilter';
import { reportsApi } from '../../../../../lib/erp-api';

const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

export default function Page() {
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(lastDay);
  const [key, setKey] = useState(0);

  const columns: any[] = [
    { key: 'customerName', label: 'Customer' },
    { key: 'invoiceCount', label: 'Invoices', align: 'center' },
    { key: 'totalRevenue', label: 'Total Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'totalTaxable', label: 'Taxable Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'totalGST', label: 'Total GST', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'totalReceived', label: 'Amount Received', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'totalBalance', label: 'Balance Due', align: 'right', format: (v: any) => {
      const n = Number(v||0);
      return <span className={n > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>{n > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n) : '—'}</span>;
    }},
  ];

  const fetchData = useCallback(async () => {
    const res = await reportsApi.getCustomerwiseMargin({ from, to });
    return res.data?.data || [];
  }, [from, to]);

  return (
    <ReportLayout title="Customerwise Profit Margin" subtitle={`Revenue and balance analysis per customer • ${from} to ${to}`}
      category="Sales" columns={columns} fetchData={fetchData} key={`${key}-${from}-${to}`}
      extraHeader={<DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onRefresh={() => setKey(k => k + 1)} />}
    />
  );
}
