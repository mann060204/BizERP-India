'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'accountCode', label: 'Account Code' },
    { key: 'accountName', label: 'Account Name' },
    { key: 'type', label: 'Type' },
    { key: 'debitBalance', label: 'Debit Balance', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'creditBalance', label: 'Credit Balance', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await reportsApi.getTrialBalance();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Debit', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalDebit || 0) },
    { label: 'Total Credit', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalCredit || 0) },
    { label: 'Difference', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.difference || 0), highlight: summary.difference > 0 },
    { label: 'Total Accounts', value: summary.totalAccounts || 0 },] : [];

  return (
    <ReportLayout
      title="Trial Balance"
      subtitle="Verify accounting accuracy and balances"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
