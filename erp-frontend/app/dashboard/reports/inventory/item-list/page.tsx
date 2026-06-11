'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import InventoryReportHeader from '../../../../../components/reports/InventoryReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'itemCode', label: 'Code' },
    { key: 'name', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'brand', label: 'Brand' },
    { key: 'unit', label: 'Unit' },
    { key: 'purchasePrice', label: 'Purchase Price', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'sellingPrice', label: 'Selling Price', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'currentStock', label: 'Current Stock', align: 'right' },
    { key: 'status', label: 'Status' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getItemList();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Items', value: summary.totalItems },
    { label: 'Active Items', value: summary.activeItems, highlight: true },
    { label: 'Inactive Items', value: summary.inactiveItems },
    { label: 'Categories Count', value: summary.categoriesCount },
  ] : [];

  return (
    <ReportLayout
      title="Item List"
      subtitle="Master catalog of all inventory items"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<InventoryReportHeader summaryCards={summaryCards} />}
    />
  );
}
