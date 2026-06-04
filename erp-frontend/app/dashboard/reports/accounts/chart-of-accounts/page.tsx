'use client';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const columns: any[] = [
    { key: 'name', label: 'Account Name' },
    { key: 'accountType', label: 'Type' },    // Backend transforms 'type' → 'accountType'
    { key: 'group', label: 'Group / Bank' },  // Backend maps bankName → group
    { key: 'balanceType', label: 'Dr/Cr' },
    { key: 'openingBalance', label: 'Opening Balance', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'currentBalance', label: 'Current Balance', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getChartOfAccounts();
    return res.data?.data || [];
  };

  return (
    <ReportLayout
      title="Chart Of Accounts"
      subtitle="Directory of all ledger accounts"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
    />
  );
}
