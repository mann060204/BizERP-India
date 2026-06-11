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
    { key: 'currentStock', label: 'Current Stock', align: 'right' , format: (v: any) => typeof v === 'number' ? Number(v.toFixed(3)) : v},
    { key: 'lastSoldDate', label: 'Last Sold Date' },
    { key: 'daysSinceLastSale', label: 'Days Since Last Sale', align: 'right' },
    { key: 'stockValue', label: 'Stock Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'status', label: 'Status' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getSlowMovingItems();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Slow Moving Items Count', value: summary.slowMovingItemsCount },
    { label: 'Dead Stock Count', value: summary.deadStockCount, highlight: summary.deadStockCount > 0 },
    { label: 'Inventory Value Locked', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.inventoryValueLocked), highlight: true },
    { label: 'Unsold Days Average', value: summary.unsoldDaysAverage },
  ] : [];

  return (
    <ReportLayout
      title="Slow Moving Items"
      subtitle="Identify slow-moving or dead inventory"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<InventoryReportHeader summaryCards={summaryCards} />}
    />
  );
}
