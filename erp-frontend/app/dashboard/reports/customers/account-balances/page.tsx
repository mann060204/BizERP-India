'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'customerCode', label: 'Customer Code' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'openingBalance', label: 'Opening Balance', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'debitAmount', label: 'Debit Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'creditAmount', label: 'Credit Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'closingBalance', label: 'Closing Balance', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getCustomerAccountBalances();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Customers', value: summary.totalCustomers || 0 },
    { label: 'Debit Balance', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.debitBalance || 0), highlight: true },
    { label: 'Credit Balance', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.creditBalance || 0) },
    { label: 'Net Receivable', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.netReceivable || 0), highlight: summary.netReceivable > 0 },
  ] : [];

  return (
    <ReportLayout
      title="Account Balances"
      subtitle="Customer ledger balance report"
      category="Customers"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
