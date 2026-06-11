'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'unsoldDays', label: 'Unsold Days', align: 'center', format: (v: any) => <span className="text-red-600 font-medium">{v}</span> },
    { key: 'deadStockValue', label: 'Dead Stock Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'recoveryPotential', label: 'Recovery Potential', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'recommendedAction', label: 'Recommended Action', align: 'center', format: (v: any) => <span className="px-2 py-1 rounded bg-slate-100 text-slate-800 text-xs font-bold border">{v}</span> },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getDeadStockRecovery();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Dead Items Count', value: summary.deadItemsCount || 0 },
    { label: 'Total Dead Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalDeadValue || 0), highlight: true },
    { label: 'Max Unsold Days', value: summary.maxUnsoldDays || 0 },
    { label: 'Potential Recovery', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.potentialRecovery || 0) },] : [];

  return (
    <ReportLayout
      title="Dead Stock Recovery Report"
      subtitle="Identify slow-moving inventory and recommend recovery actions."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
