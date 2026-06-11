'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'transactionDate', label: 'Transaction Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'referenceNumber', label: 'Reference Number' },
    { key: 'bankAmount', label: 'Bank Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'bookAmount', label: 'Book Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'difference', label: 'Difference', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'status', label: 'Status' },];

  const fetchData = async () => {
    const res = await reportsApi.getBankReconciliation();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Bank Balance', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.bankBalance || 0) },
    { label: 'Book Balance', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.bookBalance || 0) },
    { label: 'Unreconciled Amount', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.unreconciledAmount || 0), highlight: summary.unreconciledAmount > 0 },
    { label: 'Reconciled Transactions', value: summary.reconciledTransactions || 0 },] : [];

  return (
    <ReportLayout
      title="Bank Reconciliation"
      subtitle="Match bank statement with accounting records"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
