'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'quantitySold', label: 'Quantity Sold', align: 'right' },
    { key: 'salesValue', label: 'Sales Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'lastPurchaseDate', label: 'Last Purchase Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'averageSellingPrice', label: 'Avg Selling Price', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getInventoryWiseCustomerSummary();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Items Sold', value: summary.totalItemsSold || 0 },
    { label: 'Total Customers', value: summary.totalCustomers || 0 },
    { label: 'Total Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalRevenue || 0), highlight: true },
    { label: 'Avg Revenue / Customer', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averageRevenuePerCustomer || 0) },] : [];

  return (
    <ReportLayout
      title="Inventory Wise Customer Summary"
      subtitle="Analyze which customers purchased specific inventory items."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
