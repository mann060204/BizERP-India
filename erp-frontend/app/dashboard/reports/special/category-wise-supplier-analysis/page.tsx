'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'category', label: 'Category' },
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'purchaseValue', label: 'Purchase Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'quantityPurchased', label: 'Quantity Purchased', align: 'center' },
    { key: 'averageCost', label: 'Average Cost', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'contributionPct', label: 'Contribution %', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getCategoryWiseSupplierAnalysis();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Suppliers', value: summary.totalSuppliers || 0 },
    { label: 'Categories Covered', value: summary.categoriesCovered || 0 },
    { label: 'Purchase Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.purchaseValue || 0), highlight: true },
    { label: 'Supplier Diversity', value: summary.supplierDiversity || 0 },] : [];

  return (
    <ReportLayout
      title="Category Wise Supplier Analysis"
      subtitle="Analyze supplier contribution by category."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
