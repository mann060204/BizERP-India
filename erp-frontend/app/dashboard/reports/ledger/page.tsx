'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { accountsApi } from '../../../../lib/erp-api';
import api from '../../../../lib/api';
import {
  Banknote, Building2, RefreshCw, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown, Calendar, Filter, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Account { _id: string; name: string; type: string; bankName?: string; currentBalance: number; balanceType: 'Dr' | 'Cr'; }
interface LedgerEntry {
  _id: string; date: string; description: string;
  debit: number; credit: number; closingBalance: number;
  voucherType: string; voucherNo: string; referenceType: string;
}

const formatINR = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const VOUCHER_COLORS: Record<string, string> = {
  Receipt: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  Payment: 'text-red-500 bg-red-50 border-red-200',
  Expense: 'text-amber-600 bg-amber-50 border-amber-200',
  Sale: 'text-blue-600 bg-blue-50 border-blue-200',
  Purchase: 'text-purple-600 bg-purple-50 border-purple-200',
  Opening: 'text-slate-600 bg-slate-50 border-slate-200',
};

export default function LedgerReportPage() {
  const [activeTab, setActiveTab] = useState<'CASH' | 'BANK'>('CASH');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);

  // Load accounts for the active tab
  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res = await accountsApi.list({ type: activeTab === 'CASH' ? 'Cash' : 'Bank' });
      const accts: Account[] = res.accounts || [];
      setAccounts(accts);
      if (accts.length > 0) {
        setSelectedAccountId(accts[0]._id);
      } else {
        setSelectedAccountId('');
        setEntries([]);
      }
    } catch { toast.error('Failed to load accounts'); }
    finally { setLoadingAccounts(false); }
  }, [activeTab]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const loadLedger = useCallback(async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    try {
      const res = await api.get(`/accounts/${selectedAccountId}/ledger`, {
        params: { from, to, limit: 500 }
      });
      setEntries(res.data.ledger || res.data.entries || []);
    } catch {
      toast.error('Failed to load ledger');
      setEntries([]);
    } finally { setLoading(false); }
  }, [selectedAccountId, from, to]);

  useEffect(() => { if (selectedAccountId) loadLedger(); }, [loadLedger]);

  const selectedAccount = accounts.find(a => a._id === selectedAccountId);
  const totalDebits = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredits = entries.reduce((s, e) => s + e.credit, 0);
  const netFlow = totalDebits - totalCredits;

  const exportCSV = () => {
    if (!entries.length) { toast.error('No data to export'); return; }
    const rows = [
      ['Date', 'Description', 'Voucher', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)'],
      ...entries.map(e => [
        formatDate(e.date), `"${e.description}"`, e.voucherType || '',
        e.debit || '', e.credit || '', e.closingBalance ?? ''
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedAccount?.name || 'ledger'}_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-base,#f8fafc)]">
      <Topbar title="Cash & Bank Ledger" />
      <main className="flex-1 p-6 space-y-5">

        {/* ─── Tab Switch ─── */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 w-fit shadow-sm">
          {(['CASH', 'BANK'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === tab
                  ? tab === 'CASH' ? 'bg-emerald-600 text-white shadow' : 'bg-blue-600 text-white shadow'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}>
              {tab === 'CASH' ? <Banknote className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
              {tab === 'CASH' ? 'Cash Ledger' : 'Bank Ledger'}
            </button>
          ))}
        </div>

        {/* ─── Filters Row ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Account selector */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[200px]"
              >
                {loadingAccounts ? (
                  <option>Loading...</option>
                ) : accounts.length === 0 ? (
                  <option>No {activeTab === 'CASH' ? 'Cash' : 'Bank'} accounts found</option>
                ) : (
                  accounts.map(a => (
                    <option key={a._id} value={a._id}>{a.name}{a.bankName ? ` — ${a.bankName}` : ''}</option>
                  ))
                )}
              </select>
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <span className="text-slate-400 text-sm">to</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <button onClick={loadLedger} disabled={loading}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition">
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Refresh
            </button>

            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition ml-auto">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* ─── KPI Cards ─── */}
        {selectedAccount && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">Current Balance</p>
              <p className={`text-2xl font-bold ${(selectedAccount.currentBalance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {formatINR(selectedAccount.currentBalance ?? 0)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{selectedAccount.balanceType === 'Dr' ? 'Debit balance' : 'Credit balance'}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">Total In (Period)</p>
              <p className="text-2xl font-bold text-emerald-600">{formatINR(totalDebits)}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><ArrowDownLeft className="w-3 h-3" /> Receipts</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">Total Out (Period)</p>
              <p className="text-2xl font-bold text-red-500">{formatINR(totalCredits)}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><ArrowUpRight className="w-3 h-3" /> Payments</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">Net Flow (Period)</p>
              <p className={`text-2xl font-bold ${netFlow >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatINR(netFlow)}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                {netFlow >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                {netFlow >= 0 ? 'Net positive' : 'Net negative'}
              </p>
            </div>
          </div>
        )}

        {/* ─── Ledger Table ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              {activeTab === 'CASH' ? <Banknote className="w-4 h-4 text-emerald-600" /> : <Building2 className="w-4 h-4 text-blue-600" />}
              <span className="font-semibold text-slate-800 text-sm">
                {selectedAccount?.name || '—'} {selectedAccount?.bankName ? `— ${selectedAccount.bankName}` : ''}
              </span>
            </div>
            <span className="text-xs text-slate-400">{entries.length} entries</span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-12 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-2">Date</div>
            <div className="col-span-5">Description</div>
            <div className="col-span-1 text-center">Type</div>
            <div className="col-span-1 text-right">In (Dr)</div>
            <div className="col-span-1 text-right">Out (Cr)</div>
            <div className="col-span-2 text-right">Balance</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              <Banknote className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p>No entries found for this period.</p>
              {activeTab === 'BANK' && (
                <p className="text-xs mt-1.5 text-amber-600">
                  If UPI/Cheque transactions are missing, run the migration script or check Payment Mode configuration.
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {entries.map((entry, i) => (
                <div key={entry._id || i} className="grid grid-cols-12 items-center px-5 py-2.5 hover:bg-slate-50/50 transition group text-sm">
                  <div className="col-span-2 text-slate-500 text-xs">{formatDate(entry.date)}</div>
                  <div className="col-span-5 text-slate-700 truncate pr-2" title={entry.description}>{entry.description}</div>
                  <div className="col-span-1 flex justify-center">
                    {entry.voucherType && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${VOUCHER_COLORS[entry.voucherType] || 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                        {entry.voucherType}
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 text-right font-semibold text-emerald-600">
                    {entry.debit > 0 ? formatINR(entry.debit) : '—'}
                  </div>
                  <div className="col-span-1 text-right font-semibold text-red-500">
                    {entry.credit > 0 ? formatINR(entry.credit) : '—'}
                  </div>
                  <div className={`col-span-2 text-right font-bold text-sm ${(entry.closingBalance ?? 0) >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                    {entry.closingBalance !== undefined ? formatINR(entry.closingBalance) : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer totals */}
          {entries.length > 0 && (
            <div className="grid grid-cols-12 px-5 py-3 bg-slate-50 border-t border-slate-200 text-sm font-bold text-slate-700">
              <div className="col-span-7">Period Total</div>
              <div className="col-span-1" />
              <div className="col-span-1 text-right text-emerald-600">{formatINR(totalDebits)}</div>
              <div className="col-span-1 text-right text-red-500">{formatINR(totalCredits)}</div>
              <div className={`col-span-2 text-right ${netFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(netFlow)}</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
