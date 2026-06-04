'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'itemCode', label: 'Code' },
    { key: 'name', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Unit' },
    { key: 'currentStock', label: 'Stock', align: 'right' },
    { key: 'purchasePrice', label: 'Purchase Price', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'salePrice', label: 'Sale Price', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },  // Backend maps sellingPrice → salePrice
    { key: 'mrp', label: 'MRP', align: 'right', format: (v: any) => v ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v)) : '—' },
    { key: 'gstRate', label: 'GST %', align: 'center', format: (v: any) => `${v || 0}%` },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getItemList();
    return res.data?.data || [];
  };

  return (
    <ReportLayout
      title="Item List"
      subtitle="Master price list with stock and tax details"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
