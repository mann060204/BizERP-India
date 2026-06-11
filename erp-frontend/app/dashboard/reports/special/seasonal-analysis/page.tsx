'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'month', label: 'Month' },
    { key: 'monthlyDemand', label: 'Monthly Demand (Qty)', align: 'center' },
    { key: 'seasonalRevenue', label: 'Seasonal Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'growthRate', label: 'Growth Rate', align: 'right', format: (v: any) => <span className={v > 0 ? 'text-green-600' : v < 0 ? 'text-red-600' : ''}>{v > 0 ? '+' : ''}{(v || 0).toFixed(2)}%</span> },
    { key: 'seasonalIndex', label: 'Seasonal Index', align: 'right', format: (v: any) => (v || 0).toFixed(2) },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getSeasonalAnalysis();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Peak Month', value: summary.peakMonth || '-', highlight: true },
    { label: 'Avg Monthly Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.avgMonthlyRevenue || 0) },
    { label: 'Highest Seasonal Index', value: (summary.highestIndex || 0).toFixed(2) },] : [];

  return (
    <ReportLayout
      title="Seasonal Product Analysis"
      subtitle="Identify seasonal demand patterns and peak sales periods."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
