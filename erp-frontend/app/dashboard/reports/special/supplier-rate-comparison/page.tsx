'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'item', label: 'Item' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'purchaseRate', label: 'Purchase Rate', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'lastPurchaseDate', label: 'Last Purchase Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'differencePct', label: 'Difference %', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getSupplierRateComparison();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Compared Items', value: summary.comparedItems || 0 },
    { label: 'Lowest Supplier Rate', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.lowestSupplierRate || 0) },
    { label: 'Highest Supplier Rate', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.highestSupplierRate || 0) },
    { label: 'Potential Savings', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.potentialSavings || 0), highlight: true },] : [];

  return (
    <ReportLayout
      title="Supplier Rate Comparison Report"
      subtitle="Compare item purchase rates across suppliers."
      category="Analytics"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
