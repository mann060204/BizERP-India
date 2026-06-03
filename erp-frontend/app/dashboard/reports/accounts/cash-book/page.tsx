'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'date', label: 'Date', format: (v: any) => new Date(v).toLocaleDateString() },
      { key: 'particulars', label: 'Particulars' },
      { key: 'voucherNo', label: 'Voucher No.' },
      { key: 'debit', label: 'Debit (In)', align: 'right', format: (v: any) => v ? `₹${v.toFixed(2)}` : '-' },
      { key: 'credit', label: 'Credit (Out)', align: 'right', format: (v: any) => v ? `₹${v.toFixed(2)}` : '-' },
      { key: 'balance', label: 'Balance', align: 'right', format: (v: any) => `₹${v.toFixed(2)}` }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getCashBook();
          return res.data?.data || [];
        };
        

  return (
    <ReportLayout 
      title="Cash Book"
      subtitle="Daily cash transaction summary"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
