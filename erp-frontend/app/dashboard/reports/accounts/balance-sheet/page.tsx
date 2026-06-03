'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'name', label: 'Account' },
      { key: 'accountType', label: 'Classification' },
      { key: 'balance', label: 'Current Balance', align: 'right', format: (v: any) => `₹${(v||0).toFixed(2)}` }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getBalanceSheet();
          const data = res.data?.data || { assets: [], liabilities: [], equity: [] };
          // Flatten for simple table view
          return [...data.assets, ...data.liabilities, ...data.equity].map(a => ({
            name: a.name, accountType: a.accountType, balance: a.openingBalance || 0 // In real app, calculate actual balance
          }));
        };
        

  return (
    <ReportLayout 
      title="Balance Sheet"
      subtitle="Snapshot of assets & liabilities"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
