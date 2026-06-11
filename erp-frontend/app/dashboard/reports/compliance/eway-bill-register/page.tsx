'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'ewbNumber', label: 'EWB Number' },
    { key: 'invoiceNumber', label: 'Invoice No.' },
    { key: 'vehicleNumber', label: 'Vehicle No.' },
    { key: 'consignor', label: 'Consignor' },
    { key: 'consignee', label: 'Consignee' },
    { key: 'status', label: 'Status', format: (v: any) => v === 'Active' ? <span className="text-green-600 font-medium">Active</span> : v },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getEwayBillRegister();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total EWBs', value: summary.totalEWBs || 0 },
    { label: 'Active', value: summary.active || 0, highlight: true },
    { label: 'Expired', value: summary.expired || 0 },
    { label: 'Cancelled', value: summary.cancelled || 0 },] : [];

  return (
    <ReportLayout
      title="E-Way Bill Register"
      subtitle="Track e-way bill movements and validity"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
