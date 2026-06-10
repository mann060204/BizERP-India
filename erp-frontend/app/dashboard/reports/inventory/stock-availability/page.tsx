'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'itemCode', label: 'Code' },
    { key: 'name', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Unit' },
    { key: 'currentStock', label: '', align: 'right', format: (v: any) => parseFloat((v || 0).toFixed(2)) },
    { key: 'reorderLevel', label: 'Reorder Level', align: 'right' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getStockAvailability();
    return res.data?.data || [];
  };

  return (
    <ReportLayout
      title="Stock Availability"
      subtitle="Products with stock currently available"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
