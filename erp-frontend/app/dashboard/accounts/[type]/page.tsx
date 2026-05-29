'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Topbar from '../../../../components/layout/Topbar';
import { accountsApi } from '../../../../lib/erp-api';
import { Plus, Search, Landmark, ArrowRightLeft, Loader2, X, Download, Filter, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Account { _id: string; name: string; type: string; bankName?: string; accountNumber?: string; currentBalance: number; balanceType: string; openingBalance?: number; }
interface LedgerEntry { _id: string; date: string; description: string; debit: number; credit: number; referenceType: string; closingBalance?: number; }

export default function AccountsPage() {
  const params = useParams();
  const type = params.type as string; // 'Bank', 'Loan', 'Asset', 'Capital', 'Income', 'Tax'
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [periodOpeningBalance, setPeriodOpeningBalance] = useState(0);
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  
  // Modals
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  
  const fetchAccounts = useCallback(async () => {
    try {
      const { accounts } = await accountsApi.list({ type });
      setAccounts(accounts);
      if (accounts.length > 0 && !selectedAccount) {
        setSelectedAccount(accounts[0]);
      }
    } catch (e) { toast.error('Failed to load accounts'); }
    finally { setLoadingAccounts(false); }
  }, [type, selectedAccount]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const fetchAllAccounts = async () => {
    try {
      const { accounts } = await accountsApi.list();
      setAllAccounts(accounts);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    if (showTransfer) {
      fetchAllAccounts();
    }
  }, [showTransfer]);

  const fetchLedger = useCallback(async () => {
    if (!selectedAccount) return;
    setLoadingLedger(true);
    try {
      const query: any = {};
      if (fromDate) query.from = fromDate;
      if (toDate) query.to = toDate;
      
      const res = await accountsApi.getLedger(selectedAccount._id, query);
      setLedger(res.ledger);
      setPeriodOpeningBalance(res.periodOpeningBalance);
      // Update selected account to get latest balance
      setSelectedAccount(res.account);
    } catch (e) { toast.error('Failed to load ledger'); }
    finally { setLoadingLedger(false); }
  }, [selectedAccount, fromDate, toDate]);

  useEffect(() => {
    if (selectedAccount) fetchLedger();
  }, [selectedAccount?._id]); // Only re-fetch when account changes or search button clicked manually

  const handleSearchLedger = () => {
    fetchLedger();
  };

  // Add Account Form
  const [accName, setAccName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accNo, setAccNo] = useState('');
  const [openingBal, setOpeningBal] = useState('');
  const [balType, setBalType] = useState('Dr');

  const handleOpenAddAccount = () => {
    setEditAccountId(null);
    setAccName(''); setBankName(''); setAccNo(''); setOpeningBal(''); setBalType('Dr');
    setShowAddAccount(true);
  };

  const handleOpenEditAccount = () => {
    if (!selectedAccount) return;
    setEditAccountId(selectedAccount._id);
    setAccName(selectedAccount.name);
    setBankName(selectedAccount.bankName || '');
    setAccNo(selectedAccount.accountNumber || '');
    setOpeningBal(selectedAccount.openingBalance?.toString() || '');
    setBalType(selectedAccount.balanceType || 'Dr');
    setShowAddAccount(true);
  };

  const handleDeleteAccount = async (force: boolean = false) => {
    if (!selectedAccount) return;
    if (!force && !confirm(`Are you sure you want to delete ${selectedAccount.name}?`)) return;
    try {
      await accountsApi.delete(selectedAccount._id, force);
      toast.success('Account deleted successfully');
      setSelectedAccount(null);
      fetchAccounts();
    } catch (err: any) {
      if (err.response?.data?.message === 'HAS_TRANSACTIONS') {
        if (confirm(`This account has existing ledger transactions. Do you want to FORCE delete this account and wipe all its ledger history? This cannot be undone.`)) {
          handleDeleteAccount(true);
        }
      } else {
        toast.error(err.response?.data?.message || 'Error deleting account');
      }
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: accName,
        bankName: bankName,
        type: type,
        accountNumber: accNo,
        openingBalance: openingBal || 0,
        balanceType: balType
      };

      if (editAccountId) {
        // Just update
        await accountsApi.update(editAccountId, payload);
        toast.success(`${type} Account updated`);
      } else {
        await accountsApi.create(payload);
        toast.success(`${type} Account created`);
      }

      setShowAddAccount(false);
      setAccName(''); setBankName(''); setAccNo(''); setOpeningBal('');
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving account');
    }
  };

  // Add Transaction Form
  const [txnDate, setTxnDate] = useState(new Date().toISOString().substring(0,10));
  const [txnDesc, setTxnDesc] = useState('');
  const [txnType, setTxnType] = useState('Debit');
  const [txnAmt, setTxnAmt] = useState('');

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    try {
      await accountsApi.addTransaction(selectedAccount._id, {
        date: txnDate,
        description: txnDesc,
        debit: txnType === 'Debit' ? txnAmt : 0,
        credit: txnType === 'Credit' ? txnAmt : 0,
        referenceType: 'Adjustment'
      });
      toast.success('Transaction added successfully');
      setShowAddTransaction(false);
      setTxnDesc(''); setTxnAmt('');
      fetchLedger();
      fetchAccounts(); // to update balances in the list
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error adding transaction');
    }
  };

  const handleDeleteTransaction = async (txnId: string, referenceType: string) => {
    if (referenceType === 'Opening') {
      toast.error('Cannot delete the initial opening balance entry.');
      return;
    }
    if (!selectedAccount) return;
    if (!confirm('Are you sure you want to delete this transaction? The account balance will be recalculated.')) return;

    try {
      await accountsApi.deleteTransaction(selectedAccount._id, txnId);
      toast.success('Transaction deleted');
      fetchLedger();
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting transaction');
    }
  };

  // Transfer Form
  const [transferToId, setTransferToId] = useState('');
  const [transferAmt, setTransferAmt] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().substring(0,10));
  const [transferDesc, setTransferDesc] = useState('');

  const handleTransferFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !transferToId || !transferAmt) return;
    
    try {
      await accountsApi.transfer({
        fromAccountId: selectedAccount._id,
        toAccountId: transferToId,
        amount: transferAmt,
        date: transferDate,
        description: transferDesc
      });
      toast.success('Transfer completed successfully');
      setShowTransfer(false);
      setTransferToId(''); setTransferAmt(''); setTransferDesc('');
      fetchLedger();
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error transferring funds');
    }
  };

  // Calculate closing balance for the view
  let runningBalance = periodOpeningBalance;
  let runningBalType = selectedAccount?.balanceType || 'Dr';
  
  // Ledger row rendering logic
  const renderBalance = (bal: number, type: string) => {
     return <span className={bal < 0 ? 'text-red-600' : 'text-slate-900'}>₹{Math.abs(bal).toFixed(2)} {type}</span>;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title={`${type} Accounts`} />
      
      <main className="flex-1 p-4 lg:p-6 flex flex-col lg:flex-row gap-6">
        
        {/* Left Pane - Account List */}
        <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-4">
          <button onClick={handleOpenAddAccount} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-action-500 text-white hover:bg-action-600 font-semibold text-sm hover:opacity-90 transition shadow-lg w-full">
            <Landmark className="w-4 h-4" /> Add {type} Account
          </button>
          
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-[400px]">
            <div className="bg-[#1A1A1A] px-4 py-3 border-b border-slate-200">
              <h3 className="text-white font-bold text-sm tracking-wide">{type.toUpperCase()} ACCOUNTS</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingAccounts ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
              ) : accounts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No accounts found. Create one to get started.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {accounts.map(acc => (
                    <button 
                      key={acc._id} 
                      onClick={() => { setSelectedAccount(acc); setFromDate(''); setToDate(''); }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition ${selectedAccount?._id === acc._id ? 'bg-blue-50/50 border-l-4 border-action-500' : 'border-l-4 border-transparent'}`}
                    >
                      <div className="font-semibold text-slate-900 text-sm truncate">{acc.name}</div>
                      {acc.accountNumber && <div className="text-xs text-slate-500 mt-0.5">A/c No: {acc.accountNumber}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Pane - Ledger */}
        <div className="flex-1 flex flex-col gap-4">
          {selectedAccount ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
              {/* Account Header */}
              <div className="p-4 lg:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">{selectedAccount.name}</h2>
                    <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                      <button onClick={handleOpenEditAccount} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={handleDeleteAccount} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  {selectedAccount.bankName && <p className="text-sm text-slate-700 mt-1">{selectedAccount.bankName}</p>}
                  {selectedAccount.accountNumber && <p className="text-sm text-slate-600 mt-1">A/c No.: {selectedAccount.accountNumber}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Current Balance</p>
                  <p className={`text-2xl font-bold ${selectedAccount.balanceType === 'Dr' ? 'text-emerald-600' : 'text-red-600'}`}>
                    ₹{selectedAccount.currentBalance.toFixed(2)} {selectedAccount.balanceType}
                  </p>
                </div>
              </div>

              {/* Filters & Actions */}
              <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 uppercase">From</span>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 uppercase">To</span>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white" />
                  </div>
                  <button onClick={handleSearchLedger} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition">
                    Search
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowAddTransaction(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition">
                    <Plus className="w-4 h-4" /> Adjust
                  </button>
                  <button onClick={() => setShowTransfer(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition">
                    <ArrowRightLeft className="w-4 h-4" /> Transfer
                  </button>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="flex-1 overflow-auto bg-white">
                {loadingLedger ? (
                  <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#1A1A1A] sticky top-0">
                      <tr>
                        <th className="px-5 py-3 text-white font-medium text-xs tracking-wider">Date</th>
                        <th className="px-5 py-3 text-white font-medium text-xs tracking-wider">Description</th>
                        <th className="px-5 py-3 text-white font-medium text-xs tracking-wider text-right">Debit (₹)</th>
                        <th className="px-5 py-3 text-white font-medium text-xs tracking-wider text-right">Credit (₹)</th>
                        <th className="px-5 py-3 text-white font-medium text-xs tracking-wider text-right w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Opening Balance Row */}
                      {fromDate && (
                        <tr className="bg-slate-50/80 font-semibold">
                          <td className="px-5 py-3 text-slate-600" colSpan={2}>Opening Balance</td>
                          <td className="px-5 py-3 text-right text-emerald-600">{selectedAccount.balanceType === 'Dr' ? periodOpeningBalance.toFixed(2) : ''}</td>
                          <td className="px-5 py-3 text-right text-red-600">{selectedAccount.balanceType === 'Cr' ? periodOpeningBalance.toFixed(2) : ''}</td>
                          <td className="px-5 py-3"></td>
                        </tr>
                      )}
                      
                      {/* Transactions */}
                      {ledger.map((txn) => {
                        return (
                          <tr key={txn._id} className="hover:bg-slate-50 transition group/row">
                            <td className="px-5 py-3 text-slate-600">{new Date(txn.date).toLocaleDateString('en-IN')}</td>
                            <td className="px-5 py-3 text-slate-900">{txn.description}</td>
                            <td className="px-5 py-3 text-right text-slate-600">{txn.debit > 0 ? txn.debit.toFixed(2) : ''}</td>
                            <td className="px-5 py-3 text-right text-slate-600">{txn.credit > 0 ? txn.credit.toFixed(2) : ''}</td>
                            <td className="px-2 py-3 text-right">
                              {txn.referenceType !== 'Opening' && (
                                <button onClick={() => handleDeleteTransaction(txn._id, txn.referenceType)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition opacity-0 group-hover/row:opacity-100">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Closing Balance Row */}
                      {(() => {
                        const totalDr = ledger.reduce((acc, curr) => acc + (curr.debit || 0), 0) + (selectedAccount.balanceType === 'Dr' ? periodOpeningBalance : 0);
                        const totalCr = ledger.reduce((acc, curr) => acc + (curr.credit || 0), 0) + (selectedAccount.balanceType === 'Cr' ? periodOpeningBalance : 0);
                        const diff = totalDr - totalCr;
                        const closingBal = Math.abs(diff);
                        const closingBalType = diff >= 0 ? 'Dr' : 'Cr';

                        return (
                          <tr className="bg-slate-50/80 font-bold border-t-2 border-slate-200">
                            <td className="px-5 py-4 text-slate-800" colSpan={2}>Closing Balance</td>
                            <td colSpan={2} className="px-5 py-4 text-right text-slate-900">
                              {closingBal.toFixed(2)} {closingBalType}
                            </td>
                            <td className="px-5 py-4"></td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center h-full text-slate-500">
              <Landmark className="w-16 h-16 mb-4 text-slate-300" />
              <p>Select an account from the left pane to view its ledger.</p>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showAddAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">{editAccountId ? 'Edit' : 'Add'} {type} Account</h3>
              <button onClick={() => setShowAddAccount(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Account Name <span className="text-red-500">*</span></label>
                <input required value={accName} onChange={e => setAccName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-action-500/20 focus:border-action-500 transition text-sm" placeholder="e.g. State Bank of India" />
              </div>
              {(type === 'Bank' || type === 'Loan') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Bank Name</label>
                    <input value={bankName} onChange={e => setBankName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-action-500/20 focus:border-action-500 transition text-sm" placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Account Number</label>
                    <input value={accNo} onChange={e => setAccNo(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-action-500/20 focus:border-action-500 transition text-sm" placeholder="Optional" />
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Opening Balance</label>
                  <input type="number" step="0.01" value={openingBal} onChange={e => setOpeningBal(e.target.value)} disabled={!!editAccountId} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-action-500/20 focus:border-action-500 transition text-sm disabled:opacity-50" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Type</label>
                  <select value={balType} onChange={e => setBalType(e.target.value)} disabled={!!editAccountId} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-action-500/20 focus:border-action-500 transition text-sm disabled:opacity-50">
                    <option value="Dr">Debit (Dr)</option>
                    <option value="Cr">Credit (Cr)</option>
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 bg-action-500 hover:bg-action-600 text-white font-semibold rounded-xl transition shadow-lg shadow-action-500/30">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddTransaction && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Adjust Balance</h3>
              <button onClick={() => setShowAddTransaction(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Date <span className="text-red-500">*</span></label>
                <input type="date" required value={txnDate} onChange={e => setTxnDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-action-500/20 focus:border-action-500 transition text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Description <span className="text-red-500">*</span></label>
                <input required value={txnDesc} onChange={e => setTxnDesc(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-action-500/20 focus:border-action-500 transition text-sm" placeholder="e.g. Bank charges, Manual correction" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Amount (₹) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" required min="0.01" value={txnAmt} onChange={e => setTxnAmt(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-action-500/20 focus:border-action-500 transition text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Entry Type</label>
                  <select value={txnType} onChange={e => setTxnType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-action-500/20 focus:border-action-500 transition text-sm">
                    <option value="Debit">Debit (+)</option>
                    <option value="Credit">Credit (-)</option>
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-500/30">Save Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransfer && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Transfer Funds</h3>
              <button onClick={() => setShowTransfer(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleTransferFunds} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">From Account</label>
                <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium text-sm">
                  {selectedAccount.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">To Account <span className="text-red-500">*</span></label>
                <select required value={transferToId} onChange={e => setTransferToId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-action-500/20 focus:border-action-500 transition text-sm">
                  <option value="">Select Destination Account</option>
                  {allAccounts.filter(a => a._id !== selectedAccount._id).map(a => (
                    <option key={a._id} value={a._id}>{a.name} ({a.type})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={transferDate} onChange={e => setTransferDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-action-500/20 focus:border-action-500 transition text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Amount (₹) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" required min="0.01" value={transferAmt} onChange={e => setTransferAmt(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-action-500/20 focus:border-action-500 transition text-sm" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Description</label>
                <input value={transferDesc} onChange={e => setTransferDesc(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-action-500/20 focus:border-action-500 transition text-sm" placeholder="e.g. Fund transfer" />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/30">Complete Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
