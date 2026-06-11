'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import InventoryReportHeader from '../../../../../components/reports/InventoryReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'serialNumber', label: 'Serial Number' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'status', label: 'Status' },
    { key: 'purchaseDate', label: 'Purchase Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'warrantyExpiry', label: 'Warranty Expiry', format: (v: any) => v && v !== '-' ? new Date(v).toLocaleDateString() : '-' },
    { key: 'customerAssigned', label: 'Customer Assigned' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getAvailableSerials();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Serials', value: summary.totalSerials },
    { label: 'Available Serials', value: summary.availableSerials, highlight: true },
    { label: 'Sold Serials', value: summary.soldSerials },
    { label: 'Reserved Serials', value: summary.reservedSerials },
  ] : [];

  return (
    <ReportLayout
      title="Available Serials"
      subtitle="Track serial-controlled inventory"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<InventoryReportHeader summaryCards={summaryCards} />}
    />
  );
}
