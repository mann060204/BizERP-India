'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { banksApi } from '../../../../lib/erp-api';
import { Plus, Edit2, Trash2, Loader2, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';

interface Bank {
  _id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  openingBalance: number;
}

export default function BankMasterPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifsc: '',
    branch: '',
    openingBalance: 0
  });

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const res = await banksApi.list();
      setBanks(res.data?.data || res.data || []);
    } catch (error) {
      toast.error('Failed to load banks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBank) {
        await banksApi.update(editingBank._id, formData);
        toast.success('Bank updated');
      } else {
        await banksApi.create(formData);
        toast.success('Bank added');
      }
      setIsModalOpen(false);
      fetchBanks();
    } catch (error) {
      toast.error('Failed to save bank');
    }
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({
      bankName: bank.bankName,
      accountName: bank.accountName,
      accountNumber: bank.accountNumber,
      ifsc: bank.ifsc,
      branch: bank.branch,
      openingBalance: bank.openingBalance
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank?')) return;
    try {
      await banksApi.delete(id);
      toast.success('Bank deleted');
      fetchBanks();
    } catch (error) {
      toast.error('Failed to delete bank');
    }
  };

  const openNewModal = () => {
    setEditingBank(null);
    setFormData({
      bankName: '',
      accountName: '',
      accountNumber: '',
      ifsc: '',
      branch: '',
      openingBalance: 0
    });
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Topbar title="Bank Master" />
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
             <Landmark className="w-6 h-6 text-action-500" />
             <h1 className="text-xl font-bold text-slate-900">Bank Accounts</h1>
          </div>
          <button 
            onClick={openNewModal}
            className="bg-action-600 hover:bg-action-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Bank
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-slate-400 animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <tr>
                    <th className="px-6 py-4">Bank Name</th>
                    <th className="px-6 py-4">Account Name</th>
                    <th className="px-6 py-4">Account No.</th>
                    <th className="px-6 py-4">IFSC</th>
                    <th className="px-6 py-4 text-right">Opening Bal.</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {banks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No bank accounts found. Click "Add Bank" to create one.
                      </td>
                    </tr>
                  ) : (
                    banks.map(bank => (
                      <tr key={bank._id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4 font-semibold text-slate-900">{bank.bankName}</td>
                        <td className="px-6 py-4 text-slate-600">{bank.accountName}</td>
                        <td className="px-6 py-4 font-mono text-slate-600">{bank.accountNumber}</td>
                        <td className="px-6 py-4 font-mono text-slate-600">{bank.ifsc || '-'}</td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-700">₹{bank.openingBalance.toFixed(3)}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-3">
                            <button onClick={() => handleEdit(bank)} className="text-blue-600 hover:text-blue-800 transition"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(bank._id)} className="text-red-500 hover:text-red-700 transition"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Landmark className="w-5 h-5 text-action-500" />
                {editingBank ? 'Edit Bank Account' : 'Add Bank Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Bank Name <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-action-500 focus:ring-1 focus:ring-action-500 transition" placeholder="e.g. HDFC Bank" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Account Name <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-action-500 focus:ring-1 focus:ring-action-500 transition" placeholder="e.g. BizERP Current A/c" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Account Number <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-action-500 focus:ring-1 focus:ring-action-500 transition font-mono" placeholder="e.g. 50200012345678" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">IFSC Code</label>
                  <input type="text" value={formData.ifsc} onChange={e => setFormData({...formData, ifsc: e.target.value.toUpperCase()})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-action-500 focus:ring-1 focus:ring-action-500 transition font-mono uppercase" placeholder="e.g. HDFC0001234" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Branch</label>
                  <input type="text" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-action-500 focus:ring-1 focus:ring-action-500 transition" placeholder="Branch Name" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Opening Balance (₹)</label>
                <input type="number" step="0.01" value={formData.openingBalance || ''} onChange={e => setFormData({...formData, openingBalance: parseFloat(e.target.value) || 0})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-action-500 focus:ring-1 focus:ring-action-500 transition font-medium" />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold bg-action-600 hover:bg-action-700 text-white rounded-xl transition shadow-sm">{editingBank ? 'Save Changes' : 'Add Bank'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
