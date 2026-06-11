'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import SalesReportHeader from '../../../../../components/reports/SalesReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'recurringInvoiceNumber', label: 'Recurring Invoice Number' },
    { key: 'customer', label: 'Customer' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'startDate', label: 'Start Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'nextBillingDate', label: 'Next Billing Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'amount', label: 'Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'status', label: 'Status' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getActiveRecurring();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Active Recurring Invoices', value: summary.activeRecurringInvoices || 0 },
    { label: 'Monthly Recurring Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.monthlyRecurringRevenue || 0), highlight: true },
    { label: 'Next Billing Amount', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.nextBillingAmount || 0) },
    { label: 'Upcoming Renewals', value: summary.upcomingRenewals || 0 },
  ] : [];

  return (
    <ReportLayout
      title="Active Recurring Invoices"
      subtitle="Track recurring invoices and subscriptions"
      category="Sales"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<SalesReportHeader summaryCards={summaryCards} />}
    />
  );
}
