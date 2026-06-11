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
    { key: 'unit', label: 'Unit' },
    { key: 'openingStock', label: 'Opening Stock', align: 'right' , format: (v: any) => typeof v === 'number' ? Number(v.toFixed(3)) : v},
    { key: 'stockIn', label: 'Stock In', align: 'right' , format: (v: any) => typeof v === 'number' ? Number(v.toFixed(3)) : v},
    { key: 'stockOut', label: 'Stock Out', align: 'right' , format: (v: any) => typeof v === 'number' ? Number(v.toFixed(3)) : v},
    { key: 'closingStock', label: 'Closing Stock', align: 'right', format: (v: any) => typeof v === 'number' ? Number(v.toFixed(3)) : v },
    { key: 'inventoryValue', label: 'Inventory Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getItemRegister();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Items', value: summary.totalItems },
    { label: 'Active Items', value: summary.activeItems },
    { label: 'Total Stock Quantity', value: summary.totalStockQuantity.toFixed(2), highlight: true },
    { label: 'Total Inventory Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalInventoryValue), highlight: true },
  ] : [];

  return (
    <ReportLayout
      title="Item Register"
      subtitle="Complete transaction history of every inventory item"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<InventoryReportHeader summaryCards={summaryCards} />}
    />
  );
}
