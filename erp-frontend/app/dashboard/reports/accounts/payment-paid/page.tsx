'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'date', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'accountId', label: 'Paid From Account', format: (v: any) => v?.name || '—' }, // populated
    { key: 'particulars', label: 'Paid To / Details' },  // Backend maps description → particulars
    { key: 'voucherNo', label: 'Reference No.' },        // Backend maps referenceId → voucherNo
    { key: 'credit', label: 'Amount Paid', align: 'right', format: (v: any) => `₹${Number(v || 0).toFixed(2)}` },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getPaymentPaid();
    return res.data?.data || [];
  };

  return (
    <ReportLayout
      title="Payment Paid"
      subtitle="Summary of all outgoing payments (Cash / Bank credited)"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
