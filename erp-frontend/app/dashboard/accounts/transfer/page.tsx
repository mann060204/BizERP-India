'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { accountsApi } from '../../../../lib/erp-api';
import {
  ArrowRightLeft, Landmark, Wallet, Loader2, RefreshCw,
  ChevronsRight, CheckCircle2, History, X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Account {
  _id: string;
  name: string;
  type: string;
  bankName?: string;
  accountNumber?: string;
  currentBalance: number;
  balanceType: string;
}

type Direction = 'CASH_TO_BANK' | 'BANK_TO_CASH';

export default function CashBankTransferPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cashAccounts, setCashAccounts] = useState<Account[]>([]);
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [direction, setDirection] = useState<Direction>('CASH_TO_BANK');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyAccountId, setHistoryAccountId] = useState('');

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accountsApi.list();
      const all: Account[] = res.accounts || [];
      setAccounts(all);
      const cash = all.filter(a => a.type === 'Cash');
      const banks = all.filter(a => a.type === 'Bank');
      setCashAccounts(cash);
      setBankAccounts(banks);

      // Auto-select first options
      if (cash.length > 0) setFromAccountId(cash[0]._id);
      if (banks.length > 0) setToAccountId(banks[0]._id);
    } catch {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // When direction changes, swap from/to
  const handleDirectionChange = (dir: Direction) => {
    setDirection(dir);
    if (dir === 'CASH_TO_BANK') {
      if (cashAccounts.length > 0) setFromAccountId(cashAccounts[0]._id);
      if (bankAccounts.length > 0) setToAccountId(bankAccounts[0]._id);
    } else {
      if (bankAccounts.length > 0) setFromAccountId(bankAccounts[0]._id);
      if (cashAccounts.length > 0) setToAccountId(cashAccounts[0]._id);
    }
  };

  const fromOptions = direction === 'CASH_TO_BANK' ? cashAccounts : bankAccounts;
  const toOptions = direction === 'CASH_TO_BANK' ? bankAccounts : cashAccounts;

  const fromAccount = accounts.find(a => a._id === fromAccountId);
  const toAccount = accounts.find(a => a._id === toAccountId);

  const formatBalance = (acc: Account | undefined) => {
    if (!acc) return '—';
    const bal = acc.currentBalance;
    const sign = acc.balanceType === 'Cr' ? -1 : 1;
    return `₹${(Math.abs(bal)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const fetchHistory = async (accountId: string) => {
    if (!accountId) return;
    setLoadingHistory(true);
    setHistoryAccountId(accountId);
    try {
      const res = await accountsApi.getLedger(accountId);
      // Filter only Transfer entries
      const transfers = (res.ledger || []).filter((e: any) => e.referenceType === 'Transfer');
      setHistory(transfers);
    } catch {
      toast.error('Failed to load transfer history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) { toast.error('Select both accounts'); return; }
    if (fromAccountId === toAccountId) { toast.error('From and To accounts must be different'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }

    setSubmitting(true);
    try {
      await accountsApi.transfer({
        fromAccountId,
        toAccountId,
        amount: amt,
        date,
        description: description || (direction === 'CASH_TO_BANK' ? 'Cash deposited to bank' : 'Cash withdrawn from bank'),
      });
      toast.success('Transfer completed successfully! ✅');
      setAmount('');
      setDescription('');
      fetchAccounts(); // refresh balances
      if (historyAccountId) fetchHistory(historyAccountId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar title="Cash ↔ Bank Transfer" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  const hasNoCash = cashAccounts.length === 0;
  const hasNoBank = bankAccounts.length === 0;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Topbar title="Cash ↔ Bank Transfer" />

      <main className="flex-1 p-4 lg:p-8 max-w-5xl mx-auto w-full">

        {/* Header banner */}
        <div className="mb-6 rounded-2xl overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
          <div className="px-8 py-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <ArrowRightLeft className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Cash ↔ Bank Transfer</h1>
              <p className="text-slate-400 text-sm mt-0.5">Move funds between your cash and bank accounts instantly. All transactions are fully recorded in the ledger.</p>
            </div>
          </div>
        </div>

        {/* Warning if no accounts */}
        {(hasNoCash || hasNoBank) && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800">
                {hasNoCash && hasNoBank ? 'No Cash or Bank accounts found.' :
                 hasNoCash ? 'No Cash accounts found.' :
                 'No Bank accounts found.'}
              </p>
              <p className="text-sm text-amber-700 mt-0.5">
                Go to <a href="/dashboard/accounts/Bank" className="underline font-semibold">Accounts → Bank Account</a> to add bank accounts, or <a href="/dashboard/accounts/Cash" className="underline font-semibold">Accounts → Cash</a> for cash accounts.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Transfer Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-slate-500" />
                <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">New Transfer</h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">

                {/* Direction Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Transfer Direction</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleDirectionChange('CASH_TO_BANK')}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                        direction === 'CASH_TO_BANK'
                          ? 'bg-white text-slate-900 shadow-md'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      Cash → Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectionChange('BANK_TO_CASH')}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                        direction === 'BANK_TO_CASH'
                          ? 'bg-white text-slate-900 shadow-md'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Landmark className="w-4 h-4" />
                      Bank → Cash
                    </button>
                  </div>
                </div>

                {/* From / To Accounts */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex gap-3 items-end">
                    {/* From */}
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        From ({direction === 'CASH_TO_BANK' ? 'Cash' : 'Bank'})
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          {direction === 'CASH_TO_BANK'
                            ? <Wallet className="w-4 h-4 text-slate-400" />
                            : <Landmark className="w-4 h-4 text-slate-400" />}
                        </div>
                        <select
                          required
                          value={fromAccountId}
                          onChange={e => setFromAccountId(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition"
                        >
                          {fromOptions.length === 0 ? (
                            <option value="">No accounts</option>
                          ) : fromOptions.map(a => (
                            <option key={a._id} value={a._id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                      {fromAccount && (
                        <p className="text-xs text-slate-400 mt-1 ml-1">Balance: <span className="font-semibold text-slate-600">{formatBalance(fromAccount)}</span></p>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="mb-6 flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                        <ChevronsRight className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>

                    {/* To */}
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        To ({direction === 'CASH_TO_BANK' ? 'Bank' : 'Cash'})
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          {direction === 'CASH_TO_BANK'
                            ? <Landmark className="w-4 h-4 text-slate-400" />
                            : <Wallet className="w-4 h-4 text-slate-400" />}
                        </div>
                        <select
                          required
                          value={toAccountId}
                          onChange={e => setToAccountId(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition"
                        >
                          {toOptions.length === 0 ? (
                            <option value="">No accounts</option>
                          ) : toOptions.map(a => (
                            <option key={a._id} value={a._id}>{a.name}{a.accountNumber ? ` (${a.accountNumber})` : ''}</option>
                          ))}
                        </select>
                      </div>
                      {toAccount && (
                        <p className="text-xs text-slate-400 mt-1 ml-1">Balance: <span className="font-semibold text-slate-600">{formatBalance(toAccount)}</span></p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description / Narration</label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition"
                    placeholder={direction === 'CASH_TO_BANK' ? 'e.g. Cash deposited to HDFC Bank' : 'e.g. Cash withdrawn from SBI'}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || hasNoCash || hasNoBank}
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 transition shadow-lg
                    ${direction === 'CASH_TO_BANK'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}
                    ${(submitting || hasNoCash || hasNoBank) ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                  ) : (
                    <><ArrowRightLeft className="w-5 h-5" />
                    {direction === 'CASH_TO_BANK' ? 'Deposit Cash to Bank' : 'Withdraw Cash from Bank'}</>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right panel: Account Balances + History */}
          <div className="lg:col-span-2 space-y-4">

            {/* Account Balances */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Account Balances</h2>
                <button onClick={fetchAccounts} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {cashAccounts.concat(bankAccounts).map(acc => (
                  <div key={acc._id} className="px-5 py-3 flex items-center justify-between group">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                        ${acc.type === 'Bank'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-amber-50 text-amber-600'}`}>
                        {acc.type === 'Bank'
                          ? <Landmark className="w-4 h-4" />
                          : <Wallet className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{acc.name}</p>
                        {acc.accountNumber && (
                          <p className="text-xs text-slate-400">A/c: {acc.accountNumber}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatBalance(acc)}</p>
                      <p className="text-xs text-slate-400">{acc.balanceType === 'Dr' ? 'Dr' : 'Cr'}</p>
                    </div>
                  </div>
                ))}
                {cashAccounts.length === 0 && bankAccounts.length === 0 && (
                  <p className="px-5 py-6 text-center text-slate-400 text-sm">No cash or bank accounts found.</p>
                )}
              </div>
            </div>

            {/* Transfer History */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Transfer History</h2>
              </div>
              <div className="p-4">
                <div className="flex gap-2 mb-3">
                  <select
                    value={historyAccountId}
                    onChange={e => setHistoryAccountId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  >
                    <option value="">Select Account...</option>
                    {cashAccounts.concat(bankAccounts).map(a => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => fetchHistory(historyAccountId)}
                    disabled={!historyAccountId || loadingHistory}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition disabled:opacity-40"
                  >
                    {loadingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : 'View'}
                  </button>
                </div>

                {history.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {history.slice().reverse().map(txn => (
                      <div key={txn._id} className="flex items-start justify-between p-3 bg-slate-50 rounded-xl text-xs border border-slate-100">
                        <div>
                          <p className="font-semibold text-slate-700 leading-tight">{txn.description}</p>
                          <p className="text-slate-400 mt-0.5">{new Date(txn.date).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          {txn.debit > 0 && <p className="font-bold text-emerald-600">+₹{txn.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>}
                          {txn.credit > 0 && <p className="font-bold text-red-500">-₹{txn.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : historyAccountId && !loadingHistory ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No transfer history found.</p>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs text-center py-4">Select an account to view its transfer history.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
