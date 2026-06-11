'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import SalesReportHeader from '../../../../../components/reports/SalesReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'customerName', label: 'Customer Name' },
    { key: 'numberOfInvoices', label: 'Number Of Invoices', align: 'center' },
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'cost', label: 'Cost', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'grossProfit', label: 'Gross Profit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'marginPercent', label: 'Margin %', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getCustomerwiseMargin();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Customers', value: summary.totalCustomers },
    { label: 'Total Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalRevenue || 0) },
    { label: 'Total Profit', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalProfit || 0), highlight: true },
    { label: 'Average Margin', value: `${(summary.averageCustomerMargin || 0).toFixed(2)}%`, highlight: true },
  ] : [];

  return (
    <ReportLayout
      title="Customerwise Margin"
      subtitle="Profitability analysis by customer"
      category="Sales"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<SalesReportHeader summaryCards={summaryCards} />}
    />
  );
}
