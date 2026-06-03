'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'date', label: 'Date', format: (v: any) => new Date(v).toLocaleDateString() },
      { key: 'accountId', label: 'Account', format: (v: any) => v?.name || 'Unknown' },
      { key: 'particulars', label: 'Particulars' },
      { key: 'voucherType', label: 'Type' },
      { key: 'debit', label: 'Debit', align: 'right', format: (v: any) => v ? `₹${v.toFixed(2)}` : '-' },
      { key: 'credit', label: 'Credit', align: 'right', format: (v: any) => v ? `₹${v.toFixed(2)}` : '-' }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getBusinessBook();
          return res.data?.data || [];
        };
        

  return (
    <ReportLayout 
      title="Business Book"
      subtitle="Comprehensive business ledger"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
