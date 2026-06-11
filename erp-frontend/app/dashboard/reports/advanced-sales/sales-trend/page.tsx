'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'month', label: 'Month' },
    { key: 'orders', label: 'Orders', align: 'center' },
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'profit', label: 'Est. Profit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'growthPct', label: 'Growth %', align: 'right', format: (v: any) => v > 0 ? <span className="text-green-600 font-medium">+{v.toFixed(2)}%</span> : v < 0 ? <span className="text-red-600 font-medium">{v.toFixed(2)}%</span> : '0%' },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getSalesTrend();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Monthly Avg Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.monthlyRevenue || 0) },
    { label: 'Current Growth', value: `${(summary.growthPct || 0).toFixed(2)}%`, highlight: summary.growthPct > 0 },
    { label: 'Total Orders', value: summary.ordersCount || 0 },
    { label: 'Avg Order Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averageOrderValue || 0) },] : [];

  return (
    <ReportLayout
      title="Sales Trend Report"
      subtitle="Month-over-month revenue and order growth"
      category="Sales"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
