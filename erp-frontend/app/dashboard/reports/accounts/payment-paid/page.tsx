'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'date', label: 'Date', format: (v: any) => new Date(v).toLocaleDateString() },
      { key: 'accountId', label: 'Paid From', format: (v: any) => v?.name || 'Unknown' },
      { key: 'particulars', label: 'Paid To / Details' },
      { key: 'voucherNo', label: 'Reference No' },
      { key: 'credit', label: 'Amount Paid', align: 'right', format: (v: any) => `₹${v.toFixed(2)}` }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getPaymentPaid();
          return res.data?.data || [];
        };
        

  return (
    <ReportLayout 
      title="Payment Paid"
      subtitle="Summary of all outgoing payments"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
