'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'billNumber', label: 'Bill Number' },
    { key: 'billDate', label: 'Bill Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'taxableAmount', label: 'Taxable Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'gstAmount', label: 'GST Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'totalBillAmount', label: 'Total Bill Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'paymentStatus', label: 'Payment Status', align: 'center', format: (v: any) => <span className="capitalize">{v}</span> },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getPurchasesBillwise();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Purchase Bills', value: summary.totalPurchaseBills || 0 },
    { label: 'Total Purchase Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalPurchaseValue || 0), highlight: true },
    { label: 'Paid Bills', value: summary.paidBills || 0 },
    { label: 'Unpaid Bills', value: summary.unpaidBills || 0, highlight: summary.unpaidBills > 0 },
  ] : [];

  return (
    <ReportLayout
      title="Billwise Purchase"
      subtitle="Complete purchase bill analysis"
      category="Purchases"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
