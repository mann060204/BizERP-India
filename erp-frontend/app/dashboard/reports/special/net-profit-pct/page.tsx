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
    { key: 'expenses', label: 'Allocated Expenses (Inc. COGS)', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'netProfit', label: 'Net Profit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'netProfitPct', label: 'Net Profit %', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getNetProfitPct();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.revenue || 0) },
    { label: 'Total Expenses', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.expenses || 0) },
    { label: 'Total Net Profit', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.netProfit || 0), highlight: true },
    { label: 'Overall Net Profit %', value: `${(summary.netProfitPct || 0).toFixed(2)}%` },] : [];

  return (
    <ReportLayout
      title="Net Profit %"
      subtitle="Analyze final profitability after allocating indirect expenses."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
