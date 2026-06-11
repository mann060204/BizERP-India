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
    { key: 'category', label: 'Category' },
    { key: 'currentStock', label: 'Current Stock', align: 'right', format: (v: any) => parseFloat((v || 0).toFixed(2)) },
    { key: 'minStockLevel', label: 'Min. Stock', align: 'right' },
    { key: 'reorderQuantity', label: 'Reorder Qty', align: 'right' },
    { key: 'stockStatus', label: 'Status' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getLowLevelStock();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Low Stock Items', value: summary.lowStockItemsCount },
    { label: 'Out Of Stock', value: summary.outOfStockItems, highlight: summary.outOfStockItems > 0 },
    { label: 'Critical Stock', value: summary.criticalStockItems, highlight: summary.criticalStockItems > 0 },
    { label: 'Reorder Required', value: summary.reorderRequiredItems },
  ] : [];

  return (
    <ReportLayout
      title="Low Level Stock"
      subtitle="Identify items below minimum stock level"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<InventoryReportHeader summaryCards={summaryCards} />}
    />
  );
}
