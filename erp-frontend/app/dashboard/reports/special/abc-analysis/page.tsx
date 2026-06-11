'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'contributionPct', label: 'Contribution %', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },
    { key: 'cumulativePct', label: 'Cumulative %', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },
    { key: 'classification', label: 'Class', align: 'center', format: (v: any) => <span className={`px-2 py-1 rounded text-xs font-bold ${v === 'A' ? 'bg-green-100 text-green-800' : v === 'B' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{v}</span> },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getAbcAnalysis();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Products', value: summary.totalProducts || 0 },
    { label: 'Total Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalRevenue || 0), highlight: true },
    { label: 'A-Class Items', value: summary.aClassCount || 0 },
    { label: 'B-Class Items', value: summary.bClassCount || 0 },] : [];

  return (
    <ReportLayout
      title="ABC Analysis (Top Selling Products)"
      subtitle="Classify products into A, B, and C categories based on sales contribution and inventory importance."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
