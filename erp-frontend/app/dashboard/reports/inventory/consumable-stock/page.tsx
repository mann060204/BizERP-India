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
    { key: 'unit', label: 'Unit' },
    { key: 'openingStock', label: 'Opening Stock', align: 'right' , format: (v: any) => typeof v === 'number' ? Number(v.toFixed(3)) : v},
    { key: 'consumedQuantity', label: 'Consumed Qty', align: 'right', format: (v: any) => typeof v === 'number' ? Number(v.toFixed(3)) : v },
    { key: 'currentStock', label: 'Current Stock', align: 'right' , format: (v: any) => typeof v === 'number' ? Number(v.toFixed(3)) : v},
    { key: 'averageConsumption', label: 'Avg Consumption', align: 'right' },
    { key: 'remainingDays', label: 'Remaining Days', align: 'right' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getConsumableStock();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Consumable Items', value: summary.totalConsumableItems },
    { label: 'Current Consumable Stock', value: summary.currentConsumableStock.toFixed(2), highlight: true },
    { label: 'Monthly Consumption', value: summary.monthlyConsumption },
    { label: 'Estimated Days Remaining', value: summary.estimatedDaysRemaining },
  ] : [];

  return (
    <ReportLayout
      title="Consumable Stock"
      subtitle="Monitor consumable inventory usage"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<InventoryReportHeader summaryCards={summaryCards} />}
    />
  );
}
