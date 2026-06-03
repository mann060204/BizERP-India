'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'itemCode', label: 'Code' },
      { key: 'name', label: 'Item Name' },
      { key: 'currentStock', label: 'Current Stock', align: 'right' },
      { key: 'lowStockAlert', label: 'Alert Level', align: 'right' },
      { key: 'supplierId', label: 'Primary Supplier' }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getLowLevelStock();
          return res.data?.data || [];
        };
        

  return (
    <ReportLayout 
      title="Low Level Stock"
      subtitle="Items below minimum stock threshold"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
