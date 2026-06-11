'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'date', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'voucherNumber', label: 'Voucher Number' },
    { key: 'particulars', label: 'Particulars' },
    { key: 'debit', label: 'Debit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'credit', label: 'Credit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'balance', label: 'Balance', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getSupplierLedgerReport();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Opening Balance', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.openingBalance || 0) },
    { label: 'Purchases (Credit)', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.purchases || 0) },
    { label: 'Payments (Debit)', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.payments || 0) },
    { label: 'Closing Balance', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.closingBalance || 0), highlight: true },] : [];

  return (
    <ReportLayout
      title="Supplier Ledger Report"
      subtitle="Detailed supplier account statement."
      category="Analytics"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
