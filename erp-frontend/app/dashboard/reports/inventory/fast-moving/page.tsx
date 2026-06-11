'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import InventoryReportHeader from '../../../../../components/reports/InventoryReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'itemCode', label: 'Code' },
    { key: 'name', label: 'Item Name' },
    { key: 'quantitySold', label: 'Quantity Sold', align: 'right' },
    { key: 'salesValue', label: 'Sales Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'averageMonthlySales', label: 'Avg Monthly Sales', align: 'right' },
    { key: 'stockTurnoverRatio', label: 'Stock Turnover Ratio', align: 'right' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getFastMovingItems();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Top Selling Item', value: summary.topSellingItem, highlight: true },
    { label: 'Total Quantity Sold', value: summary.totalQuantitySold.toFixed(2) },
    { label: 'Revenue Generated', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.revenueGenerated), highlight: true },
    { label: 'Fast Moving Items Count', value: summary.fastMovingItemsCount },
  ] : [];

  return (
    <ReportLayout
      title="Fast Moving Items"
      subtitle="Identify high-demand inventory"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<InventoryReportHeader summaryCards={summaryCards} />}
    />
  );
}
