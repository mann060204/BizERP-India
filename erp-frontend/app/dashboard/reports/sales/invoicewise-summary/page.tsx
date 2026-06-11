'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import SalesReportHeader from '../../../../../components/reports/SalesReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'invoiceNumber', label: 'Invoice Number' },
    { key: 'customer', label: 'Customer' },
    { key: 'taxableValue', label: 'Taxable Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'cgst', label: 'CGST', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'sgst', label: 'SGST', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'igst', label: 'IGST', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'gstTotal', label: 'GST Total', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'invoiceTotal', label: 'Invoice Total', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getSalesInvoicewiseSummary();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Invoices', value: summary.totalInvoices },
    { label: 'Taxable Sales', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.taxableSales || 0) },
    { label: 'Total GST', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalGST || 0) },
    { label: 'Net Invoice Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.netInvoiceValue || 0), highlight: true },
  ] : [];

  return (
    <ReportLayout
      title="Invoicewise Summary"
      subtitle="Complete invoice breakdown including taxes"
      category="Sales"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<SalesReportHeader summaryCards={summaryCards} />}
    />
  );
}
