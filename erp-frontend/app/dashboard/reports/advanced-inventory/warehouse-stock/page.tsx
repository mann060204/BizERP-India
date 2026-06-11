'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'warehouse', label: 'Warehouse / Location' },
    { key: 'item', label: 'Item' },
    { key: 'quantity', label: 'Quantity', align: 'right' },
    { key: 'reserved', label: 'Reserved', align: 'right' },
    { key: 'available', label: 'Available', align: 'right' },
    { key: 'value', label: 'Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await reportsApi.getWarehouseWiseStock();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Warehouses', value: summary.warehousesCount || 0 },
    { label: 'Total Inventory', value: summary.totalInventory || 0, highlight: true },
    { label: 'Reserved Stock', value: summary.reservedStock || 0 },
    { label: 'Available Stock', value: summary.availableStock || 0 },] : [];

  return (
    <ReportLayout
      title="Warehouse Wise Stock"
      subtitle="Inventory visibility grouped by warehouse/location"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
