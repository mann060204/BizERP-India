'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [
    { key: 'expenseDate', label: 'Expense Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'voucherNumber', label: 'Voucher Number' },
    { key: 'expenseCategory', label: 'Expense Category' },
    { key: 'vendorSupplier', label: 'Vendor/Supplier' },
    { key: 'paymentMethod', label: 'Payment Method', align: 'center' },
    { key: 'amount', label: 'Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'taxAmount', label: 'Tax Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'totalAmount', label: 'Total Amount', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'remarks', label: 'Remarks' },
    { key: 'createdBy', label: 'Created By' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getExpensesSearch();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [
    { label: 'Total Expenses', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.totalExpenses || 0), highlight: true },
    { label: 'Number Of Expense Entries', value: summary.numberOfExpenseEntries || 0 },
    { label: 'Average Expense Amount', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.averageExpenseAmount || 0) },
    { label: 'Highest Expense', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.highestExpense || 0) },
  ] : [];

  return (
    <ReportLayout
      title="Search Expenses"
      subtitle="Searchable register of all business expenses"
      category="Expenses"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
