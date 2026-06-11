'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'rank', label: 'Rank', align: 'center' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'purchaseValue', label: 'Purchase Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'billsCount', label: 'Bills Count', align: 'center' },
    { key: 'outstandingAmount', label: 'Outstanding Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getTopSuppliers();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Top 10 Supplier Spend', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.topSupplierSpend || 0), highlight: true },
    { label: 'Purchase Contribution %', value: `${(summary.purchaseContributionPct || 0).toFixed(2)}%` },
    { label: 'Supplier Count', value: summary.supplierCount || 0 },
    { label: 'Average Supplier Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averageSupplierValue || 0) },] : [];

  return (
    <ReportLayout
      title="Top Suppliers Report"
      subtitle="Identify most important suppliers."
      category="Analytics"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
