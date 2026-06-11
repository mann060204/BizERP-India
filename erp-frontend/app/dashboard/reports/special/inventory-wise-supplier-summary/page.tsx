'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'quantityPurchased', label: 'Quantity Purchased', align: 'right' },
    { key: 'purchaseValue', label: 'Purchase Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'averageCost', label: 'Average Cost', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'lastPurchaseDate', label: 'Last Purchase Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getInventoryWiseSupplierSummary();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Inventory Items', value: summary.totalInventoryItems || 0 },
    { label: 'Total Suppliers', value: summary.totalSuppliers || 0 },
    { label: 'Total Purchase Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalPurchaseValue || 0), highlight: true },
    { label: 'Average Purchase Cost', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averagePurchaseCost || 0) },] : [];

  return (
    <ReportLayout
      title="Inventory Wise Supplier Summary"
      subtitle="Analyze suppliers providing specific inventory items."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
