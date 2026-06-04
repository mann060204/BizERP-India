'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'itemCode', label: 'Code' },
    { key: 'name', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Unit' },
    { key: 'currentStock', label: 'Dead Stock', align: 'right' },
    { key: 'purchasePrice', label: 'Unit Cost', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getSlowMovingItems();
    return res.data?.data || [];
  };

  return (
    <ReportLayout
      title="Items Not Moving"
      subtitle="Products with no sales in the last 90 days (with stock)"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
