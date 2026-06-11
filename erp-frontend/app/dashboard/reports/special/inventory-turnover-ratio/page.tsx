'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'cogs', label: 'Cost of Goods Sold', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'avgInventoryValue', label: 'Avg Inventory Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'turnoverRatio', label: 'Turnover Ratio', align: 'right', format: (v: any) => (v || 0).toFixed(2) },
    { key: 'inventoryDays', label: 'Inventory Days', align: 'right', format: (v: any) => `${(v || 0).toFixed(0)} Days` },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getInventoryTurnoverRatio();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Overall Turnover Ratio', value: (summary.turnoverRatio || 0).toFixed(2), highlight: true },
    { label: 'Total Average Inventory', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averageInventory || 0) },
    { label: 'Total COGS', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.cogs || 0) },
    { label: 'Average Inventory Days', value: `${(summary.inventoryDays || 0).toFixed(0)} Days` },] : [];

  return (
    <ReportLayout
      title="Inventory Turnover Ratio"
      subtitle="Measure how efficiently inventory is sold and replenished."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
