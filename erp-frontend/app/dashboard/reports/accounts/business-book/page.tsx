'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'date', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'accountId', label: 'Account', format: (v: any) => v?.name || '—' }, // populated object
    { key: 'particulars', label: 'Particulars' },    // Backend maps description → particulars
    { key: 'voucherType', label: 'Type' },           // Backend maps referenceType → voucherType
    { key: 'debit', label: 'Debit', align: 'right', format: (v: any) => v ? `₹${Number(v).toFixed(2)}` : '—' },
    { key: 'credit', label: 'Credit', align: 'right', format: (v: any) => v ? `₹${Number(v).toFixed(2)}` : '—' },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getBusinessBook();
    return res.data?.data || [];
  };

  return (
    <ReportLayout
      title="Business Book"
      subtitle="Comprehensive business ledger — all transactions"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
