'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'supplier', label: 'Supplier' },
    { key: 'billNumber', label: 'Bill Number' },
    { key: 'dueDate', label: 'Due Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'outstandingAmount', label: 'Outstanding Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'agingDays', label: 'Aging Days', align: 'center' },];

  const fetchData = async () => {
    const res = await reportsApi.getOutstandingPayables();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Payables', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalPayables || 0), highlight: true },
    { label: 'Overdue Payables', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.overduePayables || 0) },
    { label: 'Current Payables', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.currentPayables || 0) },
    { label: 'Avg Payment Days', value: `${(summary.averagePaymentDays || 0).toFixed(0)} Days` },] : [];

  return (
    <ReportLayout
      title="Outstanding Payables"
      subtitle="Track supplier dues and aging"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
