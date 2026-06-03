'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'date', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'accountId', label: 'Received Into Account', format: (v: any) => v?.name || '—' }, // populated
    { key: 'particulars', label: 'Received From / Details' }, // Backend maps description → particulars
    { key: 'voucherNo', label: 'Reference No.' },             // Backend maps referenceId → voucherNo
    { key: 'debit', label: 'Amount Received', align: 'right', format: (v: any) => `₹${Number(v || 0).toFixed(2)}` },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getPaymentReceived();
    return res.data?.data || [];
  };

  return (
    <ReportLayout
      title="Payment Received"
      subtitle="Summary of all incoming payments (Cash / Bank debited)"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
