'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'customer', label: 'Customer' },
    { key: 'invoice', label: 'Invoice' },
    { key: 'dueDate', label: 'Due Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'outstandingAmount', label: 'Outstanding Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'agingDays', label: 'Aging Days', align: 'center' },];

  const fetchData = async () => {
    const res = await reportsApi.getOutstandingReceivables();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Receivables', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalReceivables || 0), highlight: true },
    { label: 'Overdue Amount', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.overdueAmount || 0) },
    { label: 'Current Receivables', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.currentReceivables || 0) },
    { label: 'Collection Efficiency', value: `${(summary.collectionEfficiency || 0).toFixed(2)}%` },] : [];

  return (
    <ReportLayout
      title="Outstanding Receivables"
      subtitle="Track customer dues and aging"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
