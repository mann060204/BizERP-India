'use client';
import { useState, useCallback } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import DateRangeFilter from '../../../../../components/reports/DateRangeFilter';
import { reportsApi } from '../../../../../lib/erp-api';

const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'overdue', label: 'Overdue' },
];

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  sent: 'bg-blue-100 text-blue-700',
  partial: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  draft: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-200 text-red-800',
};

export default function Page() {
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(lastDay);
  const [status, setStatus] = useState('');
  const [key, setKey] = useState(0);

  const columns: any[] = [
    { key: 'invoiceNumber', label: 'Invoice #' },
    { key: 'invoiceDate', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'dueDate', label: 'Due Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'customerSnapshot', label: 'Customer', format: (v: any) => v?.name || 'Cash' },
    { key: 'invoiceType', label: 'Type', align: 'center' },
    { key: 'paymentMode', label: 'Mode', align: 'center' },
    { key: 'grandTotal', label: 'Total', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'amountReceived', label: 'Received', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'balance', label: 'Balance', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'status', label: 'Status', align: 'center', format: (v: any) => (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[v] || 'bg-slate-100 text-slate-600'}`}>{v}</span>
    )},
  ];

  const fetchData = useCallback(async () => {
    const res = await reportsApi.getSalesInvoicewise({ from, to, ...(status ? { status } : {}) });
    return res.data?.data || [];
  }, [from, to, status]);

  return (
    <ReportLayout title="Invoicewise Sales" subtitle={`All invoices • ${from} to ${to}`}
      category="Sales" columns={columns} fetchData={fetchData} key={`${key}-${from}-${to}-${status}`}
      extraHeader={
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo}
          onRefresh={() => setKey(k => k + 1)} showStatus status={status} onStatusChange={setStatus}
          statusOptions={statusOptions} />
      }
    />
  );
}
