'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'category', label: 'Category' },
    { key: 'quantitySold', label: 'Quantity Sold', align: 'center' },
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'ordersCount', label: 'Orders Count', align: 'center' },
    { key: 'averageSellingPrice', label: 'Avg Selling Price', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getCategoryWiseSales();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Sales', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalSales || 0), highlight: true },
    { label: 'Total Quantity Sold', value: summary.totalQuantitySold || 0 },
    { label: 'Top Category', value: summary.topCategory || '-' },
    { label: 'Average Category Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averageCategoryRevenue || 0) },] : [];

  return (
    <ReportLayout
      title="Category Wise Sales"
      subtitle="Sales performance by category."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
