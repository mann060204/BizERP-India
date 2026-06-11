'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'customerName', label: 'Customer Name' },
    { key: 'ordersCount', label: 'Orders Count', align: 'center' },
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'averageOrderValue', label: 'Average Order Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'lastPurchaseDate', label: 'Last Purchase Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'purchaseFrequency', label: 'Purchase Frequency', align: 'center', format: (v: any) => `${(v || 0).toFixed(0)} Days` },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getCustomerPurchaseFrequency();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Active Customers', value: summary.activeCustomers || 0 },
    { label: 'Avg Purchase Frequency', value: (summary.averagePurchaseFrequency || 0).toFixed(1) },
    { label: 'Repeat Purchase Rate', value: `${(summary.repeatPurchaseRate || 0).toFixed(2)}%`, highlight: true },
    { label: 'Avg Days Between Orders', value: `${(summary.averageDaysBetweenOrders || 0).toFixed(0)} Days` },] : [];

  return (
    <ReportLayout
      title="Customer Purchase Frequency Report"
      subtitle="Measure how frequently customers purchase."
      category="Analytics"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
