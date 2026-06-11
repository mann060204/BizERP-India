'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'quantityPurchased', label: 'Quantity Purchased', align: 'right' },
    { key: 'purchaseValue', label: 'Purchase Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'averageCost', label: 'Average Cost', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'supplierCount', label: 'Supplier Count', align: 'center' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getPurchasesItemwise();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Items Purchased', value: summary.totalItemsPurchased || 0 },
    { label: 'Total Purchase Quantity', value: summary.totalPurchaseQuantity || 0 },
    { label: 'Total Purchase Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalPurchaseValue || 0), highlight: true },
    { label: 'Average Purchase Cost', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averagePurchaseCost || 0) },
  ] : [];

  return (
    <ReportLayout
      title="Itemwise Purchase"
      subtitle="Analyze purchases by product"
      category="Purchases"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
