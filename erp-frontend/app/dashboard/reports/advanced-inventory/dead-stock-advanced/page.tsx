'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'item', label: 'Item' },
    { key: 'currentStock', label: 'Current Stock', align: 'right' },
    { key: 'lastSaleDate', label: 'Last Sale Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : 'No Recent Sales' },
    { key: 'daysUnsold', label: 'Days Unsold', align: 'center' },
    { key: 'stockValue', label: 'Blocked Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await reportsApi.getDeadStockAdvanced();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Dead Stock Items', value: summary.deadStockCount || 0 },
    { label: 'Blocked Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.deadStockValue || 0), highlight: summary.deadStockValue > 0 },
    { label: 'Inventory Blocked', value: `${(summary.inventoryBlocked || 0).toFixed(2)}%` },] : [];

  return (
    <ReportLayout
      title="Dead Stock Analysis"
      subtitle="Identify unsold inventory blocking capital (>180 days)"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
