'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'supplierCode', label: 'Supplier Code' },
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'openingBalance', label: 'Opening Balance', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'debit', label: 'Debit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'credit', label: 'Credit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'closingBalance', label: 'Closing Balance', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getSupplierAccountBalances();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Suppliers', value: summary.totalSuppliers || 0 },
    { label: 'Total Payables', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalPayables || 0), highlight: true },
    { label: 'Debit Balances', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.debitBalances || 0) },
    { label: 'Credit Balances', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.creditBalances || 0) },
  ] : [];

  return (
    <ReportLayout
      title="Account Balances"
      subtitle="Supplier ledger balances"
      category="Suppliers"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
