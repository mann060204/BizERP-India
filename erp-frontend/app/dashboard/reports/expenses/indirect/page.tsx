'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'expenseCategory', label: 'Expense Category' },
    { key: 'numberOfTransactions', label: 'Number Of Transactions', align: 'center' },
    { key: 'totalAmount', label: 'Total Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'taxAmount', label: 'Tax Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'averageExpense', label: 'Average Expense', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'percentageOfTotalExpenses', label: '% Of Total', align: 'right', format: (v: any) => `${(v || 0).toFixed(2)}%` },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getIndirectExpenses();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Indirect Expenses', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalIndirectExpenses || 0), highlight: true },
    { label: 'Monthly Average', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.monthlyAverage || 0) },
    { label: 'Highest Expense Category', value: summary.highestExpenseCategory || '-' },
    { label: 'Expense Growth %', value: `${summary.expenseGrowth || 0}%` },
  ] : [];

  return (
    <ReportLayout
      title="Indirect Expenses"
      subtitle="Track non-operational and indirect business expenses"
      category="Expenses"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
