'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'salesperson', label: 'Salesperson' },
    { key: 'orders', label: 'Orders', align: 'center' },
    { key: 'revenue', label: 'Revenue', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'profit', label: 'Est. Profit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'collectionPct', label: 'Collection %', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getSalespersonPerformance();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Salespeople', value: summary.totalSales || 0 },
    { label: 'Orders Closed', value: summary.ordersClosed || 0 },
    { label: 'Revenue Generated', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.revenueGenerated || 0), highlight: true },
    { label: 'Avg Deal Size', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averageDealSize || 0) },] : [];

  return (
    <ReportLayout
      title="Salesperson Performance"
      subtitle="Evaluate sales team performance and commissions"
      category="Sales"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
