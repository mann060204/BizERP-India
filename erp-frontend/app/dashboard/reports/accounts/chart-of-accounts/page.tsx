'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import { reportsApi } from '../../../../../lib/erp-api';
import { formatAccountingBalance } from '../../../../../lib/utils';

export default function Page() {
  const [summary, setSummary] = useState({ total: 0, active: 0, assets: 0, liabilities: 0 });

  const columns: any[] = [
    { key: 'name', label: 'Account Name' },
    { key: 'accountType', label: 'Type' },    // Backend transforms 'type' → 'accountType'
    { key: 'group', label: 'Group / Bank' },  // Backend maps bankName → group
    { key: 'balanceType', label: 'Dr/Cr' },
    { key: 'openingBalance', label: 'Opening Balance', align: 'right', format: (v: any, row: any) => { const bal = formatAccountingBalance(Number(v || 0), row?.type || 'asset'); return <span className={bal.colorClass}>{bal.text}</span>; } },
    { key: 'currentBalance', label: 'Current Balance', align: 'right', format: (v: any, row: any) => { const bal = formatAccountingBalance(Number(v || 0), row?.type || 'asset'); return <span className={bal.colorClass}>{bal.text}</span>; } },
  ];

  const fetchData = async () => {
    const res = await reportsApi.getChartOfAccounts();
    const records = res.data?.data || [];
    
    let total = records.length;
    let active = records.length; // Assuming all returned are active for now, as there's no status field usually sent
    let assets = 0;
    let liabilities = 0;
    
    records.forEach((row: any) => {
      const type = row.accountType || '';
      if (['Asset', 'Bank', 'Cash'].includes(type)) assets++;
      if (['Liability', 'Loan', 'Tax'].includes(type)) liabilities++;
    });

    setSummary({ total, active, assets, liabilities });

    return records;
  };

  const extraHeader = (
    <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="glass rounded-xl p-4 border border-slate-200 bg-white">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Accounts</p>
        <p className="text-xl font-bold text-slate-700">{summary.total}</p>
      </div>
      <div className="glass rounded-xl p-4 border border-blue-200 bg-blue-50/30">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Active Accounts</p>
        <p className="text-xl font-bold text-blue-700">{summary.active}</p>
      </div>
      <div className="glass rounded-xl p-4 border border-emerald-200 bg-emerald-50/30">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Asset Accounts</p>
        <p className="text-xl font-bold text-emerald-700">{summary.assets}</p>
      </div>
      <div className="glass rounded-xl p-4 border border-orange-200 bg-orange-50/30">
        <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">Liability Accounts</p>
        <p className="text-xl font-bold text-orange-700">{summary.liabilities}</p>
      </div>
    </div>
  );

  return (
    <ReportLayout
      title="Chart Of Accounts"
      subtitle="Directory of all ledger accounts"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={extraHeader}
    />
  );
}
