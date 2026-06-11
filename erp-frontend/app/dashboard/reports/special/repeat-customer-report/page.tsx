'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'customerName', label: 'Customer Name' },
    { key: 'ordersCount', label: 'Orders Count', align: 'center' },
    { key: 'purchaseFrequency', label: 'Avg Days Between Orders', align: 'center', format: (v: any) => `${(v || 0).toFixed(0)} Days` },
    { key: 'totalRevenue', label: 'Total Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'firstPurchase', label: 'First Purchase', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'latestPurchase', label: 'Latest Purchase', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getRepeatCustomerReport();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Repeat Customers', value: summary.repeatCustomers || 0 },
    { label: 'Retention Rate', value: `${(summary.retentionRate || 0).toFixed(2)}%`, highlight: true },
    { label: 'Repeat Revenue %', value: `${(summary.repeatRevenuePct || 0).toFixed(2)}%` },
    { label: 'Total Repeat Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalRepeatRevenue || 0) },] : [];

  return (
    <ReportLayout
      title="Repeat Customer Report"
      subtitle="Analyze customer retention and repeat purchase frequency."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
