'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'supplier', label: 'Supplier' },
    { key: 'purchaseValue', label: 'Purchase Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'deliveries', label: 'Deliveries', align: 'center' },
    { key: 'delayedDeliveries', label: 'Delayed Deliveries', align: 'center', format: (v: any) => v > 0 ? <span className="text-red-600 font-bold">{v}</span> : '0' },
    { key: 'returnPct', label: 'Return %', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getSupplierPerformance();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Suppliers', value: summary.totalSuppliers || 0 },
    { label: 'Purchase Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.purchaseValue || 0), highlight: true },
    { label: 'On-Time Delivery %', value: `${(summary.onTimeDeliveryPct || 0).toFixed(2)}%` },
    { label: 'Return Rate', value: `${(summary.returnRatePct || 0).toFixed(2)}%` },] : [];

  return (
    <ReportLayout
      title="Supplier Performance"
      subtitle="Evaluate supplier efficiency and reliability"
      category="Purchases"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
