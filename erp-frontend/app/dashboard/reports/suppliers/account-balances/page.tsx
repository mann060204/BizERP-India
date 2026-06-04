'use client';
import { useCallback } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';
import { formatAccountingBalance } from '@/lib/utils';

export default function Page() {
  const columns: any[] = [
    { key: 'name', label: 'Supplier Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'gstin', label: 'GSTIN' },
    { key: 'openingBalance', label: 'Opening Balance', align: 'right', format: (v: any) => formatAccountingBalance(Number(v || 0), 'supplier').text },
    { key: 'currentBalance', label: 'Current Balance', align: 'right', format: (v: any) => formatAccountingBalance(Number(v || 0), 'supplier').text },
    { key: 'creditLimit', label: 'Credit Limit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
  ];
  const fetchData = useCallback(async () => { const res = await reportsApi.getSupplierAccountBalances(); return res.data?.data || []; }, []);
  return <ReportLayout title="Supplier Account Balances" subtitle="All supplier ledger balances" category="Suppliers" columns={columns} fetchData={fetchData} />;
}
