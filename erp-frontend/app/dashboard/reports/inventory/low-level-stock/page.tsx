'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'itemCode', label: 'Code' },
    { key: 'name', label: 'Item Name' },
    { key: 'unit', label: 'Unit' },
    { key: 'currentStock', label: '', align: 'right', format: (v: any) => parseFloat((v || 0).toFixed(2)) },
    { key: 'lowStockAlert', label: 'Reorder Level', align: 'right' },  // Backend maps reorderLevel → lowStockAlert
    { key: 'supplierId', label: 'Supplier' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getLowLevelStock();
    return res.data?.data || [];
  };

  return (
    <ReportLayout
      title="Low Level Stock"
      subtitle="Items at or below reorder level — needs replenishment"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
