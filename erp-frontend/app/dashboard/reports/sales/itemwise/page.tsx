'use client';
import { useState, useCallback } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import DateRangeFilter from '../../../../../components/reports/DateRangeFilter';
import { reportsApi } from '../../../../../lib/erp-api';

const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

export default function Page() {
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(lastDay);
  const [key, setKey] = useState(0); // force ReportLayout remount on refresh

  const columns: any[] = [
    { key: 'productName', label: 'Item Name' },
    { key: 'totalQty', label: 'Total Qty', align: 'right' },
    { key: 'totalTaxable', label: 'Taxable Amount', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'totalGST', label: 'GST Amount', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'totalDiscount', label: 'Discount', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'totalAmount', label: 'Total Amount', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'invoiceCount', label: 'Invoices', align: 'center' },
  ];

  const fetchData = useCallback(async () => {
    const res = await reportsApi.getSalesItemwise({ from, to });
    return res.data?.data || [];
  }, [from, to]);

  return (
    <ReportLayout title="Itemwise Sales" subtitle={`Product-wise sales analysis • ${from} to ${to}`}
      category="Accounts" columns={columns} fetchData={fetchData} key={`${key}-${from}-${to}`}
      extraHeader={
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo}
          onRefresh={() => setKey(k => k + 1)} />
      }
    />
  );
}
