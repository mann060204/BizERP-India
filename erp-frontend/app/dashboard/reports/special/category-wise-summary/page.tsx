'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'category', label: 'Category' },
    { key: 'itemsCount', label: 'Items Count', align: 'center' },
    { key: 'salesQuantity', label: 'Sales Quantity', align: 'center' },
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'purchaseValue', label: 'Purchase Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'inventoryValue', label: 'Inventory Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getCategoryWiseSummary();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Categories', value: summary.totalCategories || 0 },
    { label: 'Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.revenue || 0), highlight: true },
    { label: 'Purchases', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.purchases || 0) },
    { label: 'Inventory Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.inventoryValue || 0) },] : [];

  return (
    <ReportLayout
      title="Category Wise Summary"
      subtitle="Business summary grouped by product category."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
