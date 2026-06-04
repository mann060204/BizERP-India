'use client';
import { useCallback } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'name', label: 'Customer Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'gstin', label: 'GSTIN' },
    { key: 'openingBalance', label: 'Opening Balance', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'currentBalance', label: 'Current Balance', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'balanceType', label: 'Dr/Cr', align: 'center' },
    { key: 'creditLimit', label: 'Credit Limit', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v||0)) },
    { key: 'priceCategory', label: 'Category', align: 'center' },
  ];

  const fetchData = useCallback(async () => {
    const res = await reportsApi.getCustomerAccountBalances();
    return res.data?.data || [];
  }, []);

  return (
    <ReportLayout title="Customer Account Balances" subtitle="All customer ledger balances with credit information"
      category="Customers" columns={columns} fetchData={fetchData}
    />
  );
}
