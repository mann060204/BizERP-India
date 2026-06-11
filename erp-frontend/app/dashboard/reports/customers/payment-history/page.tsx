'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'paymentDate', label: 'Payment Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'receiptNumber', label: 'Receipt Number' },
    { key: 'invoiceReference', label: 'Invoice Reference' },
    { key: 'paymentMethod', label: 'Payment Method', align: 'center' },
    { key: 'amountReceived', label: 'Amount Received', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'referenceNumber', label: 'Reference Number' },
    { key: 'remarks', label: 'Remarks' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getCustomerPaymentHistory();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Collections', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalCollections || 0), highlight: true },
    { label: 'Number Of Payments', value: summary.numberOfPayments || 0 },
    { label: 'Average Payment Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averagePaymentValue || 0) },
    { label: 'Recent Collections (Last 5)', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.recentCollections || 0), highlight: true },
  ] : [];

  return (
    <ReportLayout
      title="Payment History"
      subtitle="Complete customer payment tracking"
      category="Customers"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
