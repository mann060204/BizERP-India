'use client';
import { useCallback } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';
import { formatAccountingBalance } from '@/lib/utils';

export default function Page() {
  const columns: any[] = [
    { key: 'name', label: 'Customer Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'gstin', label: 'GSTIN' },
    { key: 'currentBalance', label: 'Account Balance', align: 'right', format: (v: any) => { const bal = formatAccountingBalance(Number(v || 0), 'customer'); return <span className={bal.colorClass}>{bal.text}</span>; } },
    { key: 'outstandingInvoices', label: 'Open Invoices', align: 'center' },
    { key: 'outstandingBalance', label: 'Outstanding', align: 'right', format: (v: any) => {
      const n = Number(v||0);
      const bal = formatAccountingBalance(n, 'customer');
      return <span className={bal.colorClass + ' font-bold'}>{bal.text}</span>;
    }},
    { key: 'creditLimit', label: 'Credit Limit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
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
