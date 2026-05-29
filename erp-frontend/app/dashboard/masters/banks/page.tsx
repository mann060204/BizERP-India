'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { accountsApi } from '../../../../lib/erp-api';
import { Save, Loader2, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';

interface Account { _id: string; name: string; bankName?: string; accountNumber?: string; openingBalance: number; balanceType: string; }

export default function BankMasterPage() {
  const [banks, setBanks] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [accName, setAccName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accNo, setAccNo] = useState('');
  const [openingBal, setOpeningBal] = useState('');
  const [balType, setBalType] = useState('Cr'); // The screenshot defaults to Credit for some reason, we'll give radio buttons

  const fetchBanks = useCallback(async () => {
    setLoading(true);
    try {
      const { accounts } = await accountsApi.list({ type: 'Bank' });
      setBanks(accounts);
    } catch { toast.error('Failed to load bank accounts'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBanks(); }, [fetchBanks]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName || !bankName || !accNo) {
      toast.error('Please fill out all required fields');
      return;
    }
    try {
      await accountsApi.create({
        name: accName,
        bankName,
        type: 'Bank',
        accountNumber: accNo,
        openingBalance: Number(openingBal) || 0,
        balanceType: balType
      });
      toast.success('Bank Account created');
      setAccName(''); setBankName(''); setAccNo(''); setOpeningBal('');
      fetchBanks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating account');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Topbar title="Bank Master" />
      
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        
        {/* Form Card (Add Bank) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <Landmark className="w-5 h-5 text-action-500" />
            <h2 className="text-lg font-bold text-slate-900">Add Bank</h2>
          </div>
          <form onSubmit={handleSave} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              
              <div className="flex items-center gap-4">
                <label className="w-32 text-sm font-medium text-slate-700">Account Name <span className="text-red-500">*</span></label>
                <input required value={accName} onChange={e => setAccName(e.target.value)} className="flex-1 px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-action-500 focus:ring-1 focus:ring-action-500 text-sm" />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-32 text-sm font-medium text-slate-700">Bank Name <span className="text-red-500">*</span></label>
                <input required value={bankName} onChange={e => setBankName(e.target.value)} className="flex-1 px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-action-500 focus:ring-1 focus:ring-action-500 text-sm" />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-32 text-sm font-medium text-slate-700">Account No. <span className="text-red-500">*</span></label>
                <input required value={accNo} onChange={e => setAccNo(e.target.value)} className="flex-1 px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-action-500 focus:ring-1 focus:ring-action-500 text-sm" />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-32 text-sm font-medium text-slate-700">Type</label>
                <div className="flex items-center gap-6 flex-1">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="radio" name="balType" checked={balType === 'Cr'} onChange={() => setBalType('Cr')} className="w-4 h-4 text-action-500 focus:ring-action-500" />
                    Credit (+)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="radio" name="balType" checked={balType === 'Dr'} onChange={() => setBalType('Dr')} className="w-4 h-4 text-action-500 focus:ring-action-500" />
                    Debit (-)
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="w-32 text-sm font-medium text-slate-700">Opening Balance</label>
                <div className="flex-1 flex items-center">
                  <span className="px-3 py-1.5 border border-r-0 border-slate-300 bg-action-500 text-white rounded-l text-sm font-medium">₹</span>
                  <input type="number" step="0.01" value={openingBal} onChange={e => setOpeningBal(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-r focus:outline-none focus:border-action-500 focus:ring-1 focus:ring-action-500 text-sm" />
                </div>
              </div>

            </div>

            <div className="mt-6 flex justify-end">
              <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-action-600 hover:bg-action-700 text-white text-sm font-medium rounded shadow transition">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </form>
        </div>

        {/* Existing Data Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900">Existing Data</h2>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <th className="px-4 py-2 font-medium border-r border-blue-400/30 text-center w-16">S. No.</th>
                    <th className="px-4 py-2 font-medium border-r border-blue-400/30">A/c Name</th>
                    <th className="px-4 py-2 font-medium border-r border-blue-400/30">Bank Name</th>
                    <th className="px-4 py-2 font-medium border-r border-blue-400/30">A/c No</th>
                    <th className="px-4 py-2 font-medium">Opening Bal.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {banks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No bank accounts found.</td>
                    </tr>
                  ) : (
                    banks.map((bank, index) => (
                      <tr key={bank._id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-500">{index + 1}</td>
                        <td className="px-4 py-2 border-r border-slate-200 font-medium text-slate-900">{bank.name}</td>
                        <td className="px-4 py-2 border-r border-slate-200 text-slate-700">{bank.bankName || '-'}</td>
                        <td className="px-4 py-2 border-r border-slate-200 text-slate-700 font-mono text-xs">{bank.accountNumber || '-'}</td>
                        <td className="px-4 py-2 text-slate-900">
                          {bank.openingBalance > 0 ? bank.openingBalance.toFixed(2) : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
