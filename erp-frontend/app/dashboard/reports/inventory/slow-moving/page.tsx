'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'itemCode', label: 'Code' },
      { key: 'name', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'currentStock', label: 'Stuck Stock', align: 'right' },
      { key: 'purchasePrice', label: 'Unit Cost', align: 'right', format: (v: any) => `₹${(v||0).toFixed(2)}` }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getSlowMovingItems();
          return res.data?.data || [];
        };
        

  return (
    <ReportLayout 
      title="Items Not Moving"
      subtitle="Dead stock or slow-moving items"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
