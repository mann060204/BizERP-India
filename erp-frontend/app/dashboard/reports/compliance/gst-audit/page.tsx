'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'taxPeriod', label: 'Tax Period' },
    { key: 'taxableValue', label: 'Taxable Value', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'outputGST', label: 'Output GST', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'inputGST', label: 'Input GST (ITC)', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },
    { key: 'difference', label: 'Net Liability', align: 'right', format: (v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((v || 0)) },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getGSTAudit();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'GST Collected', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.gstCollected || 0) },
    { label: 'GST Paid / ITC', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.gstPaid || 0) },
    { label: 'Net Liability', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.netLiability || 0), highlight: summary.netLiability > 0 },] : [];

  return (
    <ReportLayout
      title="GST Audit Report"
      subtitle="Audit GST liabilities, ITC, and net payable"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
