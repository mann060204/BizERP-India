'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'supplier', label: 'Supplier' },
    { key: 'item', label: 'Item' },
    { key: 'quantityPurchased', label: 'Quantity Purchased', align: 'center' },
    { key: 'rate', label: 'Rate', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'purchaseValue', label: 'Purchase Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'lastPurchaseDate', label: 'Last Purchase Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getSupplierItemHistory();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Suppliers', value: summary.totalSuppliers || 0 },
    { label: 'Total Items', value: summary.totalItems || 0 },
    { label: 'Purchase Quantity', value: summary.purchaseQuantity || 0 },
    { label: 'Purchase Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.purchaseValue || 0), highlight: true },] : [];

  return (
    <ReportLayout
      title="Supplier Item History Report"
      subtitle="Track item purchase history from suppliers."
      category="Analytics"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
