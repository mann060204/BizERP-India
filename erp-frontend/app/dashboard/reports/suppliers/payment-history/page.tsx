'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'paymentDate', label: 'Payment Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'voucherNumber', label: 'Voucher Number' },
    { key: 'paymentMethod', label: 'Payment Method', align: 'center' },
    { key: 'amountPaid', label: 'Amount Paid', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'referenceNumber', label: 'Reference Number' },
    { key: 'remarks', label: 'Remarks' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getSupplierPaymentHistory();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Payments Made', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalPaymentsMade || 0), highlight: true },
    { label: 'Number Of Payments', value: summary.numberOfPayments || 0 },
    { label: 'Average Payment Amount', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averagePaymentAmount || 0) },
    { label: 'Recent Payments', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.recentPayments || 0), highlight: true },
  ] : [];

  return (
    <ReportLayout
      title="Payment History"
      subtitle="Track payments made to suppliers"
      category="Suppliers"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
