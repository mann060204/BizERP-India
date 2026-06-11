'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'returnNumber', label: 'Return Number' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'item', label: 'Item' },
    { key: 'quantityReturned', label: 'Quantity Returned', align: 'center' },
    { key: 'returnValue', label: 'Return Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'reason', label: 'Reason' },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getPurchaseReturnReport();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Returns', value: summary.totalReturns || 0 },
    { label: 'Return Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.returnValue || 0), highlight: true },
    { label: 'Return Percentage', value: `${(summary.returnPercentage || 0).toFixed(2)}%` },
    { label: 'Supplier Credits', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.supplierCredits || 0) },] : [];

  return (
    <ReportLayout
      title="Purchase Return Report"
      subtitle="Track returned purchases and supplier credits."
      category="Analytics"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
