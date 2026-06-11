'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'item', label: 'Item' },
    { key: 'batchNumber', label: 'Batch Number' },
    { key: 'expiryDate', label: 'Expiry Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'quantity', label: 'Quantity', align: 'right' },
    { key: 'daysRemaining', label: 'Days Remaining', align: 'center', format: (v: any) => v < 0 ? <span className="text-red-600 font-bold">Expired</span> : v <= 30 ? <span className="text-orange-500 font-medium">{v} Days</span> : `${v} Days` },];

  const fetchData = async () => {
    const res = await reportsApi.getExpiryItems();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Already Expired', value: summary.expiredItems || 0, highlight: summary.expiredItems > 0 },
    { label: 'Expiring < 30 Days', value: summary.expiringWithin30Days || 0 },
    { label: 'Expiring 31-60 Days', value: summary.expiringWithin60Days || 0 },
    { label: 'Expiring 61-90 Days', value: summary.expiringWithin90Days || 0 },] : [];

  return (
    <ReportLayout
      title="Expiry Items Report"
      subtitle="Monitor and track expiring inventory batches"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
