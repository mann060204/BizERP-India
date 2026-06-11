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
    { key: 'gstNumber', label: 'GST Number' },
    { key: 'taxableValue', label: 'Taxable Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'cgst', label: 'CGST', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'sgst', label: 'SGST', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'igst', label: 'IGST', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'invoiceTotal', label: 'Invoice Total', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getSalesGST();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Taxable Sales', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalTaxableSales || 0) },
    { label: 'Total GST Collected', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalGSTCollected || 0), highlight: true },
    { label: 'CGST Total', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.cgstTotal || 0) },
    { label: 'SGST Total', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.sgstTotal || 0) },
  ] : [];

  return (
    <ReportLayout
      title="GST Sales Register"
      subtitle="Detailed GST sales reporting"
      category="Sales"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<SalesReportHeader summaryCards={summaryCards} />}
    />
  );
}
