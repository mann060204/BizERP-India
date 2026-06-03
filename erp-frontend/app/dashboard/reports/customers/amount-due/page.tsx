'use client';
import { useCallback } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'name', label: 'Customer Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'gstin', label: 'GSTIN' },
    { key: 'currentBalance', label: 'Account Balance', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'balanceType', label: 'Type', align: 'center' },
    { key: 'outstandingInvoices', label: 'Open Invoices', align: 'center' },
    { key: 'outstandingBalance', label: 'Outstanding', align: 'right', format: (v: any) => {
      const n = Number(v||0);
      return <span className={n > 0 ? 'text-red-600 font-bold' : 'text-slate-500'}>₹{n.toFixed(2)}</span>;
    }},
    { key: 'creditLimit', label: 'Credit Limit', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'oldestDue', label: 'Oldest Due Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
  ];

  const fetchData = useCallback(async () => {
    const res = await reportsApi.getCustomerAmountDue();
    return res.data?.data || [];
  }, []);

  return (
    <ReportLayout title="Customer Amount Due" subtitle="Customers with outstanding balances or unpaid invoices"
      category="Customers" columns={columns} fetchData={fetchData}
    />
  );
}
