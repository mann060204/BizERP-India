'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'date', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'voucherNumber', label: 'Voucher Number' },
    { key: 'accountName', label: 'Account Name' },
    { key: 'particulars', label: 'Particulars' },
    { key: 'debit', label: 'Debit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'credit', label: 'Credit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'runningBalance', label: 'Running Balance', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await reportsApi.getGeneralLedger();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Accounts', value: summary.totalAccounts || 0 },
    { label: 'Total Transactions', value: summary.totalTransactions || 0 },
    { label: 'Total Debit', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalDebit || 0) },
    { label: 'Total Credit', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalCredit || 0) },] : [];

  return (
    <ReportLayout
      title="General Ledger"
      subtitle="Detailed ledger transactions for all accounts"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
