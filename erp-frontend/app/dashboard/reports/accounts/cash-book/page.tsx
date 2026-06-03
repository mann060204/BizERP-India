'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'date', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'particulars', label: 'Particulars' },   // Backend maps description → particulars
    { key: 'voucherNo', label: 'Voucher No.' },     // Backend maps referenceId → voucherNo
    { key: 'referenceType', label: 'Type' },
    { key: 'debit', label: 'Debit (In)', align: 'right', format: (v: any) => v ? `₹${Number(v).toFixed(2)}` : '—' },
    { key: 'credit', label: 'Credit (Out)', align: 'right', format: (v: any) => v ? `₹${Number(v).toFixed(2)}` : '—' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getCashBook();
    return res.data?.data || [];
  };

  return (
    <ReportLayout
      title="Cash Book"
      subtitle="Daily cash & bank transaction summary"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
