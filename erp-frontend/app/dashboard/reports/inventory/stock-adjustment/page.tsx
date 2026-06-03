'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'date', label: 'Date', format: (v: any) => new Date(v).toLocaleDateString() },
      { key: 'productId', label: 'Product', format: (v: any) => v?.name || 'Unknown' },
      { key: 'type', label: 'Adjustment Type' },
      { key: 'quantity', label: 'Quantity', align: 'right' },
      { key: 'reason', label: 'Reason' }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getStockAdjustment();
          return res.data?.data || [];
        };
        

  return (
    <ReportLayout 
      title="Stock Adjustment"
      subtitle="History of manual stock adjustments"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
