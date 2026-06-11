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
    { key: 'invoiceAmount', label: 'Taxable Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'taxAmount', label: 'Tax Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'totalAmount', label: 'Total Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'paymentStatus', label: 'Status', align: 'center', format: (v: any) => <span className="capitalize">{v}</span> },
    { key: 'dueDate', label: 'Due Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getSalesInvoicewise();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Invoices', value: summary.totalInvoices },
    { label: 'Total Sales Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalSalesValue || 0), highlight: true },
    { label: 'Paid Invoices', value: summary.paidInvoices },
    { label: 'Unpaid Invoices', value: summary.unpaidInvoices, highlight: summary.unpaidInvoices > 0 },
  ] : [];

  return (
    <ReportLayout
      title="Invoicewise Sales"
      subtitle="Complete sales invoice analysis"
      category="Sales"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<SalesReportHeader summaryCards={summaryCards} />}
    />
  );
}
