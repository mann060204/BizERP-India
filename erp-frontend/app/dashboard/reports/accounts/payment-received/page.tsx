'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState({ total: 0, count: 0, largest: 0 });

  const columns: any[] = [
    { key: 'date', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'accountId', label: 'Received Into Account', format: (v: any) => v?.name || '—' }, // populated
    { key: 'particulars', label: 'Received From / Details' }, // Backend maps description → particulars
    { key: 'voucherNo', label: 'Reference No.' },             // Backend maps referenceId → voucherNo
    { key: 'debit', label: 'Amount Received', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v || 0)) },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getPaymentReceived();
    const records = res.data?.data || [];
    
    let total = 0;
    let largest = 0;
    
    records.forEach((row: any) => {
      const amt = Number(row.debit) || 0;
      total += amt;
      if (amt > largest) largest = amt;
    });

    setSummary({
      total,
      count: records.length,
      largest,
    });

    return records;
  };

  const extraHeader = (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="glass rounded-xl p-4 border border-green-200 bg-green-50/30">
        <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Total Collections</p>
        <p className="text-xl font-bold text-green-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.total)}</p>
      </div>
      <div className="glass rounded-xl p-4 border border-slate-200 bg-white">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Number Of Receipts</p>
        <p className="text-xl font-bold text-slate-700">{summary.count}</p>
      </div>
      <div className="glass rounded-xl p-4 border border-slate-200 bg-white">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Largest Receipt</p>
        <p className="text-xl font-bold text-slate-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.largest)}</p>
      </div>
    </div>
  );

  return (
    <ReportLayout
      title="Payment Received"
      subtitle="Summary of all incoming payments (Cash / Bank debited)"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={extraHeader}
    />
  );
}
