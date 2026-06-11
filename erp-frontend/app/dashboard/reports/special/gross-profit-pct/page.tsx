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
    { key: 'cost', label: 'Cost of Goods Sold', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'grossProfit', label: 'Gross Profit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'grossProfitPct', label: 'Gross Profit %', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getGrossProfitPct();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.revenue || 0) },
    { label: 'Total Cost', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.cost || 0) },
    { label: 'Total Gross Profit', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.grossProfit || 0), highlight: true },
    { label: 'Overall Gross Profit %', value: `${(summary.grossProfitPct || 0).toFixed(2)}%` },] : [];

  return (
    <ReportLayout
      title="Gross Profit %"
      subtitle="Analyze gross profit margins."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
