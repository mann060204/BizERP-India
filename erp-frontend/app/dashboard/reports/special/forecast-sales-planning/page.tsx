'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'month', label: 'Month' },
    { key: 'forecastQuantity', label: 'Forecast Quantity', align: 'center' },
    { key: 'forecastRevenue', label: 'Forecast Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'growthPct', label: 'Growth %', align: 'right', format: (v: any) => <span className={v > 0 ? 'text-green-600' : v < 0 ? 'text-red-600' : ''}>{v > 0 ? '+' : ''}{(v || 0).toFixed(2)}%</span> },
    { key: 'salesTargets', label: 'Recommended Sales Target', align: 'right', format: (v: any) => v > 0 ? <span className="font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v)}</span> : '-' },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getForecastSalesPlanning();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Next Month Forecast Rev', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.nextMonthForecastRev || 0), highlight: true },
    { label: 'Projected Growth', value: `${(summary.projectedGrowth || 0).toFixed(2)}%` },
    { label: 'Recommended Target', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.recommendedTarget || 0) },
    { label: 'Forecast Method', value: summary.forecastMethod || '-' },] : [];

  return (
    <ReportLayout
      title="Forecast Sales Planning"
      subtitle="Predict future sales performance using 3-month moving average."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
