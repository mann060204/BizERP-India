'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'numberOfBills', label: 'Number Of Bills', align: 'center' },
    { key: 'purchaseValue', label: 'Purchase Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'paidAmount', label: 'Paid Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'outstandingAmount', label: 'Outstanding Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'lastPurchaseDate', label: 'Last Purchase Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getPurchasesSupplierwise();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Suppliers', value: summary.totalSuppliers || 0 },
    { label: 'Total Purchases', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalPurchases || 0), highlight: true },
    { label: 'Outstanding Payables', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.outstandingPayables || 0), highlight: summary.outstandingPayables > 0 },
    { label: 'Average Purchase Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averagePurchaseValue || 0) },
  ] : [];

  return (
    <ReportLayout
      title="Supplierwise Summary"
      subtitle="Purchasing analysis by supplier"
      category="Purchases"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
