'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'itemCode', label: 'Code' },
      { key: 'name', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'unit', label: 'Unit' },
      { key: 'currentStock', label: 'Available Stock', align: 'right' }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getStockAvailability();
          return res.data?.data || [];
        };
        

  return (
    <ReportLayout 
      title="Stock Availability"
      subtitle="Current available stock balances"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
