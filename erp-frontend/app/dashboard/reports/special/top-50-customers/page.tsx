'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'rank', label: 'Rank', align: 'center' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'ordersCount', label: 'Orders Count', align: 'center' },
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'profit', label: 'Profit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'outstandingAmount', label: 'Outstanding Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getTop50Customers();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Revenue From Top 50', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.revenueFromTop50 || 0), highlight: true },
    { label: 'Average Customer Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averageCustomerValue || 0) },
    { label: 'Profit Generated', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.profitGenerated || 0) },
    { label: 'Repeat Purchase %', value: `${(summary.repeatPurchasePct || 0).toFixed(2)}%` },] : [];

  return (
    <ReportLayout
      title="Top 50 Customers Report"
      subtitle="Identify highest-value customers."
      category="Analytics"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
