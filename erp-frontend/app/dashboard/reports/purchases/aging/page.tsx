'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'billNumber', label: 'Bill Number' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'billDate', label: 'Bill Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'dueDate', label: 'Due Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'billAmount', label: 'Bill Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'paidAmount', label: 'Paid Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'outstandingAmount', label: 'Outstanding Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'daysOutstanding', label: 'Days Outstanding', align: 'center' },
    { key: 'agingCategory', label: 'Aging Category' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getPurchaseAging();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Outstanding Payables', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalOutstandingPayables || 0), highlight: true },
    { label: 'Overdue Bills', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.overdueBills || 0), highlight: true },
    { label: 'Current Payables', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.currentPayables || 0) },
    { label: 'Average Payment Days', value: `${summary.averagePaymentDays || 0} days` },
  ] : [];

  return (
    <ReportLayout
      title="Purchase Aging"
      subtitle="Track unpaid supplier bills and payables"
      category="Purchases"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
