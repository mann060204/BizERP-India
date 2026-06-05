'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';
import { formatDateGlobal, formatAccountingBalance } from '../../../../../lib/utils';

export default function Page() {
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
    return sorted.map((row: any) => {
      runningBalance += (Number(row.debit) || 0) - (Number(row.credit) || 0);
      return { ...row, balance: runningBalance };
    });
  };

  return (
    <ReportLayout
      title="Cash Book"
      subtitle="Daily cash & bank transaction summary"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
