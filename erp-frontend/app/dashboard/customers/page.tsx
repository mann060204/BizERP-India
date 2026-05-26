'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Topbar from '../../../components/layout/Topbar';
import { customersApi } from '../../../lib/erp-api';
import { Plus, Search, Users, Phone, Edit2, Trash2, Loader2, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface Customer { _id: string; name: string; mobile?: string; email?: string; gstin?: string; billingAddress?: any; openingBalance: number; photo?: string; }

const INDIAN_STATES = [
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra',
  'Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim',
  'Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
];

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await customersApi.list({ search, limit: 100 });
      setCustomers(data.customers);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action is irreversible.`)) return;
    try { await customersApi.delete(id); toast.success('Customer deleted'); fetchCustomers(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Customers" />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Customer Directory</h2>
            <p className="text-[#94a3b8] text-sm mt-0.5">{customers.length} customer{customers.length !== 1 ? 's' : ''} total</p>
          </div>
          <Link href="/dashboard/customers/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-white/10/30">
            <Plus className="w-4 h-4" /> Add Customer
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, mobile, address, GSTIN..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] transition text-sm" />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#D4D4D4] animate-spin" /></div>
        ) : customers.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Users className="w-14 h-14 text-[#1A1A1A] mx-auto mb-4" />
            <p className="text-white font-semibold text-lg">No customers yet</p>
            <p className="text-[#475569] text-sm mt-1 mb-6">Add your first customer to get started</p>
            <Link href="/dashboard/customers/new" className="inline-block px-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 text-sm font-semibold hover:opacity-90 transition">Add Customer</Link>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1A1A1A]">
                    {['Name', 'Mobile', 'Email', 'GSTIN', 'City / State', 'Balance', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-[#94a3b8] font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {customers.map((c) => (
                    <tr key={c._id} className="hover:bg-[#111111] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {c.photo ? (
                            <img src={c.photo} alt={c.name} className="w-8 h-8 rounded-lg object-cover border border-[#1A1A1A]" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold">{c.name.charAt(0).toUpperCase()}</div>
                          )}
                          <span className="text-white font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#94a3b8]">{c.mobile || '—'}</td>
                      <td className="px-5 py-4 text-[#94a3b8]">{c.email || '—'}</td>
                      <td className="px-5 py-4 text-[#94a3b8] font-mono text-xs">{c.gstin || '—'}</td>
                      <td className="px-5 py-4 text-[#94a3b8]">{[c.billingAddress?.city, c.billingAddress?.state].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={c.openingBalance > 0 ? 'text-green-400' : c.openingBalance < 0 ? 'text-red-400' : 'text-[#475569]'}>
                          ₹{c.openingBalance?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => router.push(`/dashboard/customers/${c._id}`)} className="p-1.5 rounded-lg hover:bg-[#1A1A1A] text-[#94a3b8] hover:text-white transition"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(c._id, c.name)} className="p-1.5 rounded-lg hover:bg-red-900/20 text-[#94a3b8] hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
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
