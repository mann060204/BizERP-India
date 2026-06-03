'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    
      { key: 'batchNo', label: 'Batch / Serial No.' },
      { key: 'productId', label: 'Product', format: (v: any) => v?.name || 'Unknown' },
      { key: 'expiryDate', label: 'Expiry Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : 'N/A' },
      { key: 'currentStock', label: 'Available', align: 'right' },
      { key: 'salePrice', label: 'Sale Price', align: 'right', format: (v: any) => `₹${(v||0).toFixed(2)}` }
        
  ];

  
        const fetchData = async () => {
          const res = await reportsApi.getAvailableSerials();
          return res.data?.data || [];
        };
        

  return (
    <ReportLayout 
      title="Available Serials"
      subtitle="Available serial/batch numbers"
      category="Inventory"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
