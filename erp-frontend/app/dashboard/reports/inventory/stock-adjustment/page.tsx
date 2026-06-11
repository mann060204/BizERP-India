'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import InventoryReportHeader from '../../../../../components/reports/InventoryReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'adjustmentDate', label: 'Adjustment Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'previousQuantity', label: 'Prev Qty', align: 'center' },
    { key: 'adjustedQuantity', label: 'Adjusted Qty', align: 'center' },
    { key: 'difference', label: 'Difference', align: 'center' },
    { key: 'reason', label: 'Reason' },
    { key: 'user', label: 'User' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getStockAdjustment();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Adjustments', value: summary.totalAdjustments },
    { label: 'Positive Adjustments', value: summary.positiveAdjustments },
    { label: 'Negative Adjustments', value: summary.negativeAdjustments },
    { label: 'Net Adjustment Qty', value: summary.netAdjustmentValue, highlight: true },
  ] : [];

  return (
    <ReportLayout
      title="Stock Adjustment"
      subtitle="Track manual stock corrections"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<InventoryReportHeader summaryCards={summaryCards} />}
    />
  );
}
