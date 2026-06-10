'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';
import { formatDateGlobal, formatAccountingBalance } from '../../../../../lib/utils';

export default function Page() {
  const [summary, setSummary] = useState({ opening: 0, inflow: 0, outflow: 0, closing: 0 });

  const columns: any[] = [
    { key: 'date', label: 'Date', format: (v: any) => v ? formatDateGlobal(v) : '—' },
    { key: 'particulars', label: 'Particulars' },
    { key: 'voucherNo', label: 'Voucher No.' },
    { key: 'referenceType', label: 'Type' },
    { key: 'debit', label: 'Debit (In)', align: 'right', format: (v: any) => v ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v)) : '—' },
    { key: 'credit', label: 'Credit (Out)', align: 'right', format: (v: any) => v ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v)) : '—' },
    { key: 'balance', label: 'Balance', align: 'right', disableTotal: true, format: (v: any) => { const bal = formatAccountingBalance(Number(v || 0), 'cash'); return <span className={bal.colorClass}>{bal.text}</span>; } },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getCashBook();
    const records = res.data?.data || [];
    
    // Sort chronologically ascending for running balance
    const sorted = [...records].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningBalance = 0;
    let totalInflow = 0;
    let totalOutflow = 0;
    
    const mapped = sorted.map((row: any) => {
      const debit = Number(row.debit) || 0;
      const credit = Number(row.credit) || 0;
      totalInflow += debit;
      totalOutflow += credit;
      runningBalance += (debit - credit);
      return { ...row, balance: runningBalance };
    });
    
    setSummary({
      opening: 0, // Since cash book doesn't strictly track previous day opening balance easily without pagination, we'll start at 0
      inflow: totalInflow,
      outflow: totalOutflow,
      closing: runningBalance,
    });
    
    return mapped;
  };

  const extraHeader = (
    <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="glass rounded-xl p-4 border border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Opening Balance</p>
        <p className="text-xl font-bold text-slate-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.opening)}</p>
      </div>
      <div className="glass rounded-xl p-4 border border-green-200 bg-green-50/30">
        <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Total Receipts</p>
        <p className="text-xl font-bold text-green-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.inflow)}</p>
      </div>
      <div className="glass rounded-xl p-4 border border-red-200 bg-red-50/30">
        <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Total Payments</p>
        <p className="text-xl font-bold text-red-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.outflow)}</p>
      </div>
      <div className="glass rounded-xl p-4 border border-blue-200 bg-blue-50/30">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Closing Balance</p>
        <p className="text-xl font-bold text-blue-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.closing)}</p>
      </div>
    </div>
  );

  return (
    <ReportLayout
      title="Cash Book"
      subtitle="Daily cash & bank transaction summary"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={extraHeader}
    />
  );
}
