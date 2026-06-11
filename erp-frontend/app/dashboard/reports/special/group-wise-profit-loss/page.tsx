'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'groupName', label: 'Group Name' },
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'cost', label: 'Cost', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'grossProfit', label: 'Gross Profit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'marginPct', label: 'Margin %', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },
    { key: 'contributionPct', label: 'Contribution %', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getGroupWiseProfitAndLoss();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalRevenue || 0) },
    { label: 'Total Cost', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalCost || 0) },
    { label: 'Gross Profit', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.grossProfit || 0), highlight: true },
    { label: 'Net Margin %', value: `${(summary.netMarginPct || 0).toFixed(2)}%` },] : [];

  return (
    <ReportLayout
      title="Group Wise Profit & Loss"
      subtitle="Profitability by item group."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
