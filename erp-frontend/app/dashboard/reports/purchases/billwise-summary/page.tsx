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
    { key: 'taxableValue', label: 'Taxable Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'cgst', label: 'CGST', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'sgst', label: 'SGST', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'igst', label: 'IGST', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'gstTotal', label: 'GST Total', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'billTotal', label: 'Bill Total', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getPurchasesBillwiseSummary();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Bills', value: summary.totalBills || 0 },
    { label: 'Taxable Purchases', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.taxablePurchases || 0) },
    { label: 'Total GST', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalGST || 0) },
    { label: 'Total Purchase Amount', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalPurchaseAmount || 0), highlight: true },
  ] : [];

  return (
    <ReportLayout
      title="Billwise Summary"
      subtitle="Detailed bill summary with tax breakup"
      category="Purchases"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
