'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'itemCode', label: 'Code' },
      { key: 'name', label: 'Item Name' },
      { key: 'currentStock', label: 'Current Stock', align: 'right' },
      { key: 'unit', label: 'Unit' }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getConsumableStock();
          return res.data?.data || [];
        };
        

  return (
    <ReportLayout 
      title="Consumable Stock"
      subtitle="Tracking of consumable inventory"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
