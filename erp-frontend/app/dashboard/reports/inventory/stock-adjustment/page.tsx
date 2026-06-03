'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'date', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' }, // uses createdAt
    { key: 'productId', label: 'Product', format: (v: any) => v?.name || '—' }, // populated object
    { key: 'type', label: 'Adjustment Type' },   // Backend maps 'add'→'Stock In (+)', 'subtract'→'Stock Out (-)'
    { key: 'quantity', label: 'Quantity', align: 'right' },
    { key: 'reason', label: 'Reason' },
    { key: 'notes', label: 'Notes' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getStockAdjustment();
    return res.data?.data || [];
  };

  return (
    <ReportLayout
      title="Stock Adjustment"
      subtitle="History of manual inventory adjustments"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
