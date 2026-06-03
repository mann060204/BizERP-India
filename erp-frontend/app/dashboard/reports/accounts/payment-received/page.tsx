'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'date', label: 'Date', format: (v: any) => new Date(v).toLocaleDateString() },
      { key: 'accountId', label: 'Received In', format: (v: any) => v?.name || 'Unknown' },
      { key: 'particulars', label: 'Received From / Details' },
      { key: 'voucherNo', label: 'Reference No' },
      { key: 'debit', label: 'Amount Received', align: 'right', format: (v: any) => `₹${v.toFixed(2)}` }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getPaymentReceived();
          return res.data?.data || [];
        };
        

  return (
    <ReportLayout 
      title="Payment Received"
      subtitle="Summary of all incoming payments"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
