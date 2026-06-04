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
    { key: 'invoiceNumber', label: 'Invoice #' },
    { key: 'invoiceDate', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'customer', label: 'Customer' },
    { key: 'taxableValue', label: 'Taxable Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'gstAmount', label: 'GST Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'grandTotal', label: 'Invoice Total', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'itemCount', label: 'Items', align: 'center' },
  ];

  const fetchData = useCallback(async () => {
    const res = await reportsApi.getInvoicewiseMargin({ from, to });
    return res.data?.data || [];
  }, [from, to]);

  return (
    <ReportLayout title="Invoicewise Profit Margin" subtitle={`Revenue vs taxable breakdown per invoice • ${from} to ${to}`}
      category="Sales" columns={columns} fetchData={fetchData} key={`${key}-${from}-${to}`}
      extraHeader={<DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onRefresh={() => setKey(k => k + 1)} />}
    />
  );
}
