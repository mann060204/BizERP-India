'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'productName', label: 'Item Name' },
    { key: 'totalSold', label: 'Qty Sold (Last 30 Days)', align: 'right' },
    { key: 'totalRevenue', label: 'Revenue Generated', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getFastMovingItems();
    return res.data?.data || [];
  };

  return (
    <ReportLayout
      title="Fast Moving Items"
      subtitle="Top 20 highest selling products in the last 30 days"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
