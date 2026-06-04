'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'batchNo', label: 'Batch / Serial No.' },
    { key: 'productId', label: 'Product', format: (v: any) => v?.name || '—' }, // populated object
    { key: 'expiryDate', label: 'Expiry Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : 'N/A' },
    { key: 'currentStock', label: 'Available Qty', align: 'right' },
    { key: 'mrp', label: 'MRP', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'salePrice', label: 'Sale Price', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'qualityStatus', label: 'Quality' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getAvailableSerials();
    return res.data?.data || [];
  };

  return (
    <ReportLayout
      title="Available Serials / Batches"
      subtitle="Active batches with available stock"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
