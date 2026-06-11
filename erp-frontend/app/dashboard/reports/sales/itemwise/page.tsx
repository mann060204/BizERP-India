'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import SalesReportHeader from '../../../../../components/reports/SalesReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'quantitySold', label: 'Quantity Sold', align: 'right', format: (v: any) => typeof v === 'number' ? Number(v.toFixed(3)) : v },
    { key: 'salesValue', label: 'Sales Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'averagePrice', label: 'Average Price', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'contributionPercent', label: 'Contribution %', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getSalesItemwise();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Quantity Sold', value: summary.totalQuantitySold },
    { label: 'Total Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalRevenue || 0), highlight: true },
    { label: 'Best Selling Item', value: summary.bestSellingItem },
    { label: 'Average Selling Price', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averageSellingPrice || 0) },
  ] : [];

  return (
    <ReportLayout
      title="Itemwise Sales"
      subtitle="Analyze sales performance by product"
      category="Sales"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<SalesReportHeader summaryCards={summaryCards} />}
    />
  );
}
