'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'month', label: 'Month' },
    { key: 'purchaseValue', label: 'Purchase Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'supplierCount', label: 'Suppliers Used', align: 'center' },
    { key: 'growthPct', label: 'Growth %', align: 'right', format: (v: any) => v > 0 ? <span className="text-red-600 font-medium">+{v.toFixed(2)}%</span> : v < 0 ? <span className="text-green-600 font-medium">{v.toFixed(2)}%</span> : '0%' },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getPurchaseTrend();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Monthly Avg Purchases', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.monthlyPurchases || 0) },
    { label: 'Supplier Spend', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.supplierSpend || 0), highlight: true },
    { label: 'Purchase Growth', value: `${(summary.purchaseGrowthPct || 0).toFixed(2)}%` },
    { label: 'Avg Order Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averageOrderValue || 0) },] : [];

  return (
    <ReportLayout
      title="Purchase Trend Report"
      subtitle="Month-over-month purchasing behavior"
      category="Purchases"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
