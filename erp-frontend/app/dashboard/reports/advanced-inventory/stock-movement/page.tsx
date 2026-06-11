'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'date', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'item', label: 'Item' },
    { key: 'transactionType', label: 'Transaction Type' },
    { key: 'quantityIn', label: 'Quantity In', align: 'right', format: (v: any) => v > 0 ? <span className="text-green-600 font-medium">+{v}</span> : '-' },
    { key: 'quantityOut', label: 'Quantity Out', align: 'right', format: (v: any) => v > 0 ? <span className="text-red-600 font-medium">-{v}</span> : '-' },];

  const fetchData = async () => {
    const res = await reportsApi.getStockMovement();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Stock In', value: summary.stockIn || 0, highlight: true },
    { label: 'Total Stock Out', value: summary.stockOut || 0 },
    { label: 'Net Stock Change', value: summary.closingStock || 0, highlight: true },] : [];

  return (
    <ReportLayout
      title="Stock Movement"
      subtitle="Track inventory in/out movement historically"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
