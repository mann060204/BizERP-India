'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'productName', label: 'Item Name' },
      { key: 'totalSold', label: 'Qty Sold (Last 30 Days)', align: 'right' }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getFastMovingItems();
          return res.data?.data || [];
        };
        

  return (
    <ReportLayout 
      title="Fast Moving Item"
      subtitle="High velocity inventory items"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
