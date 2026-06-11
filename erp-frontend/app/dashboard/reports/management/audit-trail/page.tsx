'use client';
import { useState } from 'react';
import ReportLayout from '../../../../../components/reports/ReportLayout';
import ReportHeader from '../../../../../components/reports/ReportHeader';
import { reportsApi } from '../../../../../lib/erp-api';

export default function Page() {
  const [summary, setSummary] = useState<any>(null);

  const columns: any[] = [{ key: 'dateTime', label: 'Date/Time', format: (v: any) => v ? new Date(v).toLocaleString() : '-' },
    { key: 'user', label: 'User' },
    { key: 'module', label: 'Module' },
    { key: 'action', label: 'Action' },
    { key: 'oldValue', label: 'Old Value' },
    { key: 'newValue', label: 'New Value' },
    { key: 'ipAddress', label: 'IP Address' },];

  const fetchData = async () => {
    const res = await (reportsApi as any).getAuditTrail();
    if (res.data?.data?.summary) {
      setSummary(res.data.data.summary);
      return res.data.data.data || [];
    }
    return res.data?.data || [];
  };

  const summaryCards = summary ? [{ label: 'Total Activities', value: summary.totalActivities || 0 },
    { label: 'Login Events', value: summary.loginEvents || 0 },
    { label: 'Data Modifications', value: summary.dataModifications || 0 },
    { label: 'Critical Changes', value: summary.criticalChanges || 0, highlight: summary.criticalChanges > 0 },] : [];

  return (
    <ReportLayout
      title="Audit Trail Report"
      subtitle="Track all system changes and activities"
      category="Accounts"
      columns={columns}
      fetchData={fetchData}
      extraHeader={<ReportHeader summaryCards={summaryCards} />}
    />
  );
}
