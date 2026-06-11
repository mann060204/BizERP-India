'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'category', label: 'Category' },
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'cost', label: 'Cost', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'profit', label: 'Profit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'margin', label: 'Margin %', align: 'right' },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getProfitabilityAnalysis();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.revenue || 0) },
    { label: 'Total Cost', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.cost || 0) },
    { label: 'Net Profit', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.profit || 0), highlight: true },
    { label: 'Margin %', value: `${(summary.marginPct || 0).toFixed(2)}%` },] : [];

  return (
    <ReportLayout
      title="Profitability Analysis"
      subtitle="High-level margin and cost analysis"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
