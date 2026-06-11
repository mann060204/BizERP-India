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
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'costValue', label: 'Cost Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'grossProfit', label: 'Gross Profit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'marginPercent', label: 'Margin %', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },
    { key: 'invoiceDate', label: 'Invoice Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getInvoicewiseMargin();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalRevenue || 0) },
    { label: 'Total Cost', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalCost || 0) },
    { label: 'Gross Profit', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.grossProfit || 0), highlight: true },
    { label: 'Average Margin', value: `${(summary.averageMarginPercent || 0).toFixed(2)}%`, highlight: true },
  ] : [];

  return (
    <ReportLayout
      title="Invoicewise Margin"
      subtitle="Profitability analysis for each invoice"
      category="Sales"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<SalesReportHeader summaryCards={summaryCards} />}
    />
  );
}
