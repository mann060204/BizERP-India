'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'customer', label: 'Customer' },
    { key: 'item', label: 'Item' },
    { key: 'quantitySold', label: 'Quantity Sold', align: 'center' },
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'lastPurchaseDate', label: 'Last Purchase Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'averageSellingPrice', label: 'Average Selling Price', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getCustomerWiseItemSales();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Customers', value: summary.totalCustomers || 0 },
    { label: 'Total Products Sold', value: summary.totalProductsSold || 0 },
    { label: 'Revenue Generated', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.revenueGenerated || 0), highlight: true },
    { label: 'Avg Items / Customer', value: (summary.averageItemsPerCustomer || 0).toFixed(2) },] : [];

  return (
    <ReportLayout
      title="Customer Wise Item Sales Report"
      subtitle="Analyze products purchased by each customer."
      category="Analytics"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
