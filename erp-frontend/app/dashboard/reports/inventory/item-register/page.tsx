'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'itemCode', label: 'Code' },
    { key: 'name', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Unit' },
    { key: 'currentStock', label: '', align: 'right', format: (v: any) => parseFloat((v || 0).toFixed(3)) },
    { key: 'purchasePrice', label: 'Purchase Price', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'salePrice', label: 'Sale Price', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'gstRate', label: 'GST %', align: 'right', format: (v: any) => `${v || 0}%` },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getItemRegister();
    return res.data?.data || [];
  };

  return (
    <ReportLayout
      title="Item Register"
      subtitle="Complete registry of all inventory items"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
