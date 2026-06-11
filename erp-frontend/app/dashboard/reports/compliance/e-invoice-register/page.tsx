'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'invoiceNumber', label: 'Invoice No.' },
    { key: 'irn', label: 'IRN' },
    { key: 'date', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'customer', label: 'Customer' },
    { key: 'amount', label: 'Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'status', label: 'Status' },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getEInvoiceRegister();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total E-Invoices', value: summary.totalEInvoices || 0 },
    { label: 'IRN Generated', value: summary.irnGenerated || 0, highlight: true },
    { label: 'Cancelled', value: summary.cancelled || 0 },
    { label: 'Pending (mock)', value: summary.pending || 0 },] : [];

  return (
    <ReportLayout
      title="E-Invoice Register"
      subtitle="Track IRN generation and statuses"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
