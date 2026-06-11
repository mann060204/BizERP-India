'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import SalesReportHeader from '../../../../../components/reports/SalesReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'invoiceNumber', label: 'Invoice Number' },
    { key: 'invoiceDate', label: 'Invoice Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'customer', label: 'Customer' },
    { key: 'dueDate', label: 'Due Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'invoiceAmount', label: 'Invoice Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'paidAmount', label: 'Paid Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'outstandingAmount', label: 'Outstanding', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'daysOverdue', label: 'Days Overdue', align: 'center' },
    { key: 'agingBucket', label: 'Aging Bucket' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getSalesAging();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Outstanding Amount', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalOutstandingAmount || 0), highlight: true },
    { label: 'Overdue Amount', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.overdueAmount || 0), highlight: true },
    { label: 'Current Receivables', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.currentReceivables || 0) },
    { label: 'Avg Collection Days', value: `${summary.averageCollectionDays || 0} days` },
  ] : [];

  return (
    <ReportLayout
      title="Sales Aging"
      subtitle="Track overdue customer invoices and pending collections"
      category="Sales"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<SalesReportHeader summaryCards={summaryCards} />}
    />
  );
}
