'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'date', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'transactionNumber', label: 'Transaction Number' },
    { key: 'bankAccount', label: 'Bank Account' },
    { key: 'description', label: 'Description' },
    { key: 'deposit', label: 'Deposit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'withdrawal', label: 'Withdrawal', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'balance', label: 'Balance', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await reportsApi.getBankBook();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Opening Balance', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.openingBalance || 0) },
    { label: 'Deposits', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.deposits || 0), highlight: true },
    { label: 'Withdrawals', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.withdrawals || 0) },
    { label: 'Closing Balance', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.closingBalance || 0), highlight: true },] : [];

  return (
    <ReportLayout
      title="Bank Book"
      subtitle="Track all bank transactions"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
