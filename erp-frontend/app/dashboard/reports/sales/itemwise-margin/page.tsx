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
  const [key, setKey] = useState(0);

  const columns: any[] = [
    { key: 'productName', label: 'Item Name' },
    { key: 'totalQtySold', label: 'Qty Sold', align: 'right' },
    { key: 'avgSaleRate', label: 'Avg Sale Rate', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'purchasePrice', label: 'Purchase Price', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'totalTaxable', label: 'Sale Taxable', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'estimatedCost', label: 'Est. Cost', align: 'right', format: (v: any) => `₹${Number(v||0).toFixed(2)}` },
    { key: 'grossProfit', label: 'Gross Profit', align: 'right', format: (v: any) => {
      const n = Number(v||0);
      return <span className={n >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>₹{n.toFixed(2)}</span>;
    }},
  ];

  const fetchData = useCallback(async () => {
    const res = await reportsApi.getItemwiseMargin({ from, to });
    return res.data?.data || [];
  }, [from, to]);

  return (
    <ReportLayout title="Itemwise Profit Margin" subtitle={`Gross profit per product (Sale price − Purchase cost) • ${from} to ${to}`}
      category="Sales" columns={columns} fetchData={fetchData} key={`${key}-${from}-${to}`}
      extraHeader={<DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onRefresh={() => setKey(k => k + 1)} />}
    />
  );
}
