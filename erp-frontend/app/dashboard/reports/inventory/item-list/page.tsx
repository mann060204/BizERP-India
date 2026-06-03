'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'itemCode', label: 'Code' },
      { key: 'name', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'unit', label: 'Unit' },
      { key: 'salePrice', label: 'Price', align: 'right', format: (v: any) => `₹${(v||0).toFixed(2)}` }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getItemList();
          return res.data?.data || [];
        };
        

  return (
    <ReportLayout 
      title="Item List"
      subtitle="Master list of inventory products"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
