'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'billNumber', label: 'Bill Number' },
    { key: 'billDate', label: 'Bill Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'gstNumber', label: 'GST Number' },
    { key: 'taxableValue', label: 'Taxable Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'cgst', label: 'CGST', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'sgst', label: 'SGST', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'igst', label: 'IGST', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'gstTotal', label: 'GST Total', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'billTotal', label: 'Bill Total', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getPurchasesGST();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Taxable Purchases', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalTaxablePurchases || 0) },
    { label: 'Total Input GST', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalInputGST || 0), highlight: true },
    { label: 'CGST Total', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.cgstTotal || 0) },
    { label: 'SGST Total', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.sgstTotal || 0) },
    { label: 'IGST Total', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.igstTotal || 0) },
  ] : [];

  return (
    <ReportLayout
      title="GST Purchase Register"
      subtitle="Input GST tracking and ITC reporting"
      category="Purchases"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
