'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import SalesReportHeader from '../../../../../components/reports/SalesReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'customerName', label: 'Customer Name' },
    { key: 'numberOfOrders', label: 'Number Of Orders', align: 'center' },
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'outstanding', label: 'Outstanding', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'averageInvoiceValue', label: 'Avg Invoice Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'lastPurchaseDate', label: 'Last Purchase Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getSalesCustomerwiseSummary();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Customers', value: summary.totalCustomers },
    { label: 'Total Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalRevenue || 0), highlight: true },
    { label: 'Outstanding Amount', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.outstandingAmount || 0), highlight: summary.outstandingAmount > 0 },
    { label: 'Average Order Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averageOrderValue || 0) },
  ] : [];

  return (
    <ReportLayout
      title="Customerwise Summary"
      subtitle="Sales summary by customer"
      category="Sales"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<SalesReportHeader summaryCards={summaryCards} />}
    />
  );
}
