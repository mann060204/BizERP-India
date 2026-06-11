'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'product', label: 'Product' },
    { key: 'quantitySold', label: 'Quantity Sold', align: 'center' },
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'margin', label: 'Margin %', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },
    { key: 'profit', label: 'Est. Profit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getTopSellingProducts();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Best Seller', value: summary.bestSeller || '-' },
    { label: 'Quantity Sold (Top)', value: summary.quantitySold || 0 },
    { label: 'Top Product Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.revenue || 0), highlight: true },
    { label: 'Top Product Profit', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.profit || 0) },] : [];

  return (
    <ReportLayout
      title="Top Selling Products"
      subtitle="Best-performing products by revenue and quantity"
      category="Sales"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
