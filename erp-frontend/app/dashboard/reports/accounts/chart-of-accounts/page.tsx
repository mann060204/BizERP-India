'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'name', label: 'Account Name' },
      { key: 'accountType', label: 'Type' },
      { key: 'group', label: 'Group' },
      { key: 'openingBalance', label: 'Opening Balance', align: 'right', format: (v: any) => `₹${(v||0).toFixed(2)}` }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getChartOfAccounts();
          return res.data?.data || [];
        };
        

  return (
    <ReportLayout 
      title="Chart Of Accounts"
      subtitle="Directory of all ledger accounts"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
