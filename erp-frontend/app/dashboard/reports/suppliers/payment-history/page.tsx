'use client';
import { useState, useCallback } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import DateRangeFilter from '../../../../../components/reports/DateRangeFilter';
import { reportsApi } from '../../../../../lib/erp-api';

const now = new Date(); const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

export default function Page() {
  const [from, setFrom] = useState(firstDay); const [to, setTo] = useState(lastDay); const [key, setKey] = useState(0);
  const columns: any[] = [
    { key: 'paymentDate', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'billNumber', label: 'Bill #' },
    { key: 'billDate', label: 'Bill Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'billTotal', label: 'Bill Total', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'amountPaid', label: 'Amount Paid', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'mode', label: 'Mode', align: 'center' },
    { key: 'balance', label: 'Balance', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'status', label: 'Status', align: 'center' },
  ];
  const fetchData = useCallback(async () => { const res = await reportsApi.getSupplierPaymentHistory({ from, to }); return res.data?.data || []; }, [from, to]);
  return <ReportLayout title="Supplier Payment History" subtitle={`Payments made to suppliers • ${from} to ${to}`} category="Suppliers" columns={columns} fetchData={fetchData} key={`${key}-${from}-${to}`} extraHeader={<DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onRefresh={() => setKey(k => k + 1)} />} />;
}
