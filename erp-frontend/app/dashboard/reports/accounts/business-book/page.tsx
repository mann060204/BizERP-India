'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState({ debit: 0, credit: 0, balance: 0 });

  const columns: any[] = [
    { key: 'date', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'accountId', label: 'Account', format: (v: any) => v?.name || '—' }, // populated object
    { key: 'particulars', label: 'Particulars' },    // Backend maps description → particulars
    { key: 'voucherType', label: 'Type' },           // Backend maps referenceType → voucherType
    { key: 'debit', label: 'Debit', align: 'right', format: (v: any) => v ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v)) : '—' },
    { key: 'credit', label: 'Credit', align: 'right', format: (v: any) => v ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v)) : '—' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getBusinessBook();
    const records = res.data?.data || [];
    
    let totalDebit = 0;
    let totalCredit = 0;
    let runningBalance = 0;
    
    // Sort ascending for balance calculation
    const sorted = [...records].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const mapped = sorted.map((row: any) => {
      const debit = Number(row.debit) || 0;
      const credit = Number(row.credit) || 0;
      totalDebit += debit;
      totalCredit += credit;
      runningBalance += (debit - credit);
      return { ...row, balance: runningBalance };
    });

    setSummary({
      debit: totalDebit,
      credit: totalCredit,
      balance: runningBalance,
    });

    // Return in original descending order if preferred by Business Book?
    // The previous implementation didn't sort here, just returned as is (which was descending from backend).
    // Let's return mapped (ascending) since we added balance, so descending makes balance column look weird.
    // Or we can reverse it.
    return mapped.reverse();
  };

  const extraHeader = (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="glass rounded-xl p-4 border border-blue-200 bg-blue-50/30">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Total Debit (In)</p>
        <p className="text-xl font-bold text-blue-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.debit)}</p>
      </div>
      <div className="glass rounded-xl p-4 border border-orange-200 bg-orange-50/30">
        <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">Total Credit (Out)</p>
        <p className="text-xl font-bold text-orange-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.credit)}</p>
      </div>
      <div className="glass rounded-xl p-4 border border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Closing Balance</p>
        <p className="text-xl font-bold text-slate-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.balance)}</p>
      </div>
    </div>
  );

  return (
    <ReportLayout
      title="Business Book"
      subtitle="Comprehensive business ledger — all transactions"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={extraHeader}
    />
  );
}
