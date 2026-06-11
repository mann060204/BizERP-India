'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'quantitySold', label: 'Quantity Sold', align: 'center' },
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'profit', label: 'Profit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'lastSoldDate', label: 'Last Sold Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getBottom100Products();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Bottom 100 Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.bottom100Revenue || 0) },
    { label: 'Average Bottom Sales', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averageBottomSales || 0) },] : [];

  return (
    <ReportLayout
      title="Bottom 100 Products"
      subtitle="Identify lowest-performing products by revenue."
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
