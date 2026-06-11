'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'paymentDate', label: 'Payment Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'voucherNumber', label: 'Voucher Number' },
    { key: 'amountPaid', label: 'Amount Paid', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'paymentMethod', label: 'Payment Method' },
    { key: 'referenceNumber', label: 'Reference Number' },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getSupplierPaymentHistory();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Payments', value: summary.totalPayments || 0 },
    { label: 'Average Payment Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averagePaymentValue || 0) },
    { label: 'Outstanding Payables', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.outstandingPayables || 0), highlight: true },
    { label: 'Payment Frequency', value: summary.paymentFrequency || '-' },] : [];

  return (
    <ReportLayout
      title="Supplier Payment History Report"
      subtitle="Track supplier payment behavior."
      category="Analytics"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
