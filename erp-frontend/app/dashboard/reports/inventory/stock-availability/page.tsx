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
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'availableQuantity', label: 'Available Qty', align: 'right' },
    { key: 'reservedQuantity', label: 'Reserved Qty', align: 'right' },
    { key: 'onOrderQuantity', label: 'On Order', align: 'right' },
    { key: 'netAvailableQuantity', label: 'Net Available', align: 'right' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getStockAvailability();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Available Quantity', value: summary.totalAvailableQuantity.toFixed(2) },
    { label: 'Inventory Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.inventoryValue), highlight: true },
    { label: 'Reserved Stock', value: summary.reservedStock },
    { label: 'Available For Sale', value: summary.availableForSale.toFixed(2), highlight: true },
  ] : [];

  return (
    <ReportLayout
      title="Stock Availability"
      subtitle="Current available stock across warehouses"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<InventoryReportHeader summaryCards={summaryCards} />}
    />
  );
}
