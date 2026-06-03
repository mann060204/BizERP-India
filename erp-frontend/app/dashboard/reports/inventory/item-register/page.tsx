'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'itemCode', label: 'Code' },
      { key: 'name', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'currentStock', label: 'Current Stock', align: 'right' },
      { key: 'salePrice', label: 'Sale Price', align: 'right', format: (v: any) => `₹${(v||0).toFixed(2)}` }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getItemRegister();
          return res.data?.data || [];
        };
        

  return (
    <ReportLayout 
      title="Item Register"
      subtitle="Complete registry of all items"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
