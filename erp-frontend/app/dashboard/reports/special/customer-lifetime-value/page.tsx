'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'customerName', label: 'Customer Name' },
    { key: 'ordersCount', label: 'Orders Count', align: 'center' },
    { key: 'averageOrderValue', label: 'Average Order Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'totalRevenue', label: 'Total Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'clv', label: 'Historical CLV', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getCustomerLifetimeValue();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Customers', value: summary.totalCustomers || 0 },
    { label: 'Avg Orders / Customer', value: (summary.avgOrdersCount || 0).toFixed(1) },
    { label: 'Average Order Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.avgOrderValue || 0) },
    { label: 'Average CLV', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.avgClv || 0), highlight: true },] : [];

  return (
    <ReportLayout
      title="Customer Lifetime Value (CLV)"
      subtitle="Determine long-term customer value based on historical purchase data."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
