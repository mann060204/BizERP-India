'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'forecastDemand', label: 'Forecast Demand (30D)', align: 'center' },
    { key: 'recommendedPurchaseQty', label: 'Recommended Reorder Qty', align: 'center', format: (v: any) => <span className="font-bold text-blue-600">{v}</span> },
    { key: 'reorderRequirementValue', label: 'Requirement Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'stockoutRisk', label: 'Stockout Risk', align: 'center', format: (v: any) => <span className={`px-2 py-1 rounded text-xs font-bold ${v === 'High' ? 'bg-red-100 text-red-800' : v === 'Medium' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>{v}</span> },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getForecastPurchasePlanning();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Items To Reorder', value: summary.itemsToReorder || 0 },
    { label: 'Total Reorder Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalReorderValue || 0), highlight: true },
    { label: 'High Risk Items', value: summary.highRiskItems || 0 },] : [];

  return (
    <ReportLayout
      title="Forecast Purchase Planning"
      subtitle="Predict future purchase requirements based on daily consumption trends."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
