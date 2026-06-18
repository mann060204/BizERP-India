'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../../components/layout/Topbar';
import { suppliersApi } from '../../../lib/erp-api';
import { formatAccountingBalance } from '@/lib/utils';
import { Search, Loader2, Save, X, Truck, Edit2, Trash2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import ExportDropdown from '../../../components/shared/ExportDropdown';

interface Supplier { 
  _id: string; name: string; mobile?: string; email?: string; gstin?: string; pan?: string;
  address?: { street?: string; city?: string; state?: string; pinCode?: string; country?: string; }; 
  openingBalance: number; currentBalance?: number; balanceType?: 'Debit'|'Credit'; 
  contactPerson?: string; note?: string;
  bankDetails?: { bankName?: string; accountNumber?: string; ifsc?: string; };
}

const INDIAN_STATES = [
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra',
  'Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim',
  'Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
];

const emptyForm = {
  name: '', mobile: '', email: '', gstin: '', pan: '', street: '', city: '', state: '', pinCode: '', country: 'India',
  openingBalance: 0, balanceType: 'Credit', contactPerson: '', contactMobile: '', note: '',
  bankName: '', accountNumber: '', ifsc: ''
};

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await suppliersApi.list({ search, limit: 100 });
      setSuppliers(data.suppliers);
    } catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const openCreate = () => { router.push('/dashboard/suppliers/new'); };
  const openEdit = (s: Supplier) => { 
    router.push(`/dashboard/suppliers/${s._id}`);
  };

  const handleSave = async () => {};

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action is irreversible.`)) return;
    try { await suppliersApi.delete(id); toast.success('Supplier deleted'); fetchSuppliers(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 transition-colors">
      <Topbar title="Suppliers" />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Supplier Directory</h2>
            <p className="text-slate-600 text-sm mt-0.5">{suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} total</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportDropdown 
              data={suppliers}
              filename="Suppliers_Export"
              columns={[
                { header: 'Name', key: 'name' },
                { header: 'Mobile', key: 'mobile' },
                { header: 'Email', key: 'email' },
                { header: 'GSTIN', key: 'gstin' },
                { header: 'PAN No', key: 'pan' },
                { header: 'Trade Name', key: 'tradeName' },
                { header: 'Opening Balance', key: 'openingBalance' },
                { header: 'Street', render: (s) => s.address?.street || '' },
                { header: 'City', render: (s) => s.address?.city || '' },
                { header: 'State', render: (s) => s.address?.state || '' },
                { header: 'Pincode', render: (s) => s.address?.pinCode || s.address?.pincode || '' }
              ]}
            />
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary text-white font-semibold text-sm transition shadow-lg shadow-primary/20">
              + Add Supplier
            </button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-action-400 transition text-sm" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        ) : suppliers.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
            <Truck className="w-14 h-14 text-primary/50 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold text-lg">No suppliers yet</p>
            <p className="text-slate-600 text-sm mt-1 mb-6">Add your first supplier to get started</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary transition">Add Supplier</button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-gray-50/50 bg-[#F1F5F9]">
                    {['Name', 'Mobile', 'Email', 'GSTIN', 'City / State', 'Balance', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-slate-600 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {suppliers.map((s) => (
                    <tr key={s._id} className="hover:bg-[#F1F5F9] hover:bg-gray-50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-400/20 flex items-center justify-center text-orange-600 text-orange-400 font-bold">{s.name.charAt(0).toUpperCase()}</div>
                          <span className="text-slate-900 font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{s.mobile || '—'}</td>
                      <td className="px-5 py-4 text-slate-600">{s.email || '—'}</td>
                      <td className="px-5 py-4 text-slate-600 font-mono text-xs">{s.gstin || '—'}</td>
                      <td className="px-5 py-4 text-slate-600">{[s.address?.city, s.address?.state].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`${formatAccountingBalance(s.currentBalance || 0, 'supplier').colorClass} font-medium`}>
                          {formatAccountingBalance(s.currentBalance || 0, 'supplier').text}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => router.push(`/dashboard/suppliers/${s._id}?mode=view`)} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition" title="View Profile"><Info className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-[#E2E8F0] hover:bg-primary-hover text-slate-600 hover:text-slate-900 hover:text-gray-900 transition"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(s._id, s.name)} className="p-1.5 rounded-lg hover:bg-red-900/20 text-slate-600 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
