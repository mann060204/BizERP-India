'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../components/layout/Topbar';
import { suppliersApi } from '../../../lib/erp-api';
import { Plus, Search, Truck, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Supplier { _id: string; name: string; mobile?: string; email?: string; gstin?: string; address?: any; openingBalance: number; }

const INDIAN_STATES = [
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra',
  'Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim',
  'Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', email: '', gstin: '', city: '', state: '', openingBalance: 0 });

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await suppliersApi.list({ search, limit: 100 });
      setSuppliers(data.suppliers);
    } catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const openCreate = () => { setEditing(null); setForm({ name: '', mobile: '', email: '', gstin: '', city: '', state: '', openingBalance: 0 }); setShowModal(true); };
  const openEdit = (s: Supplier) => { setEditing(s); setForm({ name: s.name, mobile: s.mobile || '', email: s.email || '', gstin: s.gstin || '', city: s.address?.city || '', state: s.address?.state || '', openingBalance: s.openingBalance }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Supplier name is required'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, mobile: form.mobile, email: form.email, gstin: form.gstin, address: { city: form.city, state: form.state }, openingBalance: form.openingBalance };
      if (editing) { await suppliersApi.update(editing._id, payload); toast.success('Supplier updated'); }
      else { await suppliersApi.create(payload); toast.success('Supplier created'); }
      setShowModal(false); fetchSuppliers();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action is irreversible.`)) return;
    try { await suppliersApi.delete(id); toast.success('Supplier deleted'); fetchSuppliers(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Suppliers" />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Supplier Directory</h2>
            <p className="text-[#94a3b8] text-sm mt-0.5">{suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} total</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-white/10/30">
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] transition text-sm" />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#D4D4D4] animate-spin" /></div>
        ) : suppliers.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Truck className="w-14 h-14 text-[#1A1A1A] mx-auto mb-4" />
            <p className="text-white font-semibold text-lg">No suppliers yet</p>
            <p className="text-[#475569] text-sm mt-1 mb-6">Add your first supplier to get started</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 text-sm font-semibold hover:opacity-90 transition">Add Supplier</button>
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
                  {suppliers.map((s) => (
                    <tr key={s._id} className="hover:bg-[#111111] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-400/20 flex items-center justify-center text-orange-400 text-xs font-bold">{s.name.charAt(0).toUpperCase()}</div>
                          <span className="text-white font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#94a3b8]">{s.mobile || '—'}</td>
                      <td className="px-5 py-4 text-[#94a3b8]">{s.email || '—'}</td>
                      <td className="px-5 py-4 text-[#94a3b8] font-mono text-xs">{s.gstin || '—'}</td>
                      <td className="px-5 py-4 text-[#94a3b8]">{[s.address?.city, s.address?.state].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={s.openingBalance > 0 ? 'text-green-400' : s.openingBalance < 0 ? 'text-red-400' : 'text-[#475569]'}>
                          ₹{s.openingBalance?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-[#1A1A1A] text-[#94a3b8] hover:text-white transition"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(s._id, s.name)} className="p-1.5 rounded-lg hover:bg-red-900/20 text-[#94a3b8] hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#1A1A1A]">
              <h3 className="text-white font-bold text-lg">{editing ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button onClick={() => setShowModal(false)} className="text-[#475569] hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Supplier Name *', key: 'name', placeholder: 'e.g. ABC Distributors' },
                { label: 'Mobile Number', key: 'mobile', placeholder: '9876543210' },
                { label: 'Email', key: 'email', placeholder: 'vendor@email.com' },
                { label: 'GSTIN', key: 'gstin', placeholder: '22AAAAA0000A1Z5' },
                { label: 'City', key: 'city', placeholder: 'Mumbai' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">{label}</label>
                  <input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">State</label>
                <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition">
                  <option value="">— Select State —</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Opening Balance (₹)</label>
                <input type="number" value={form.openingBalance} onChange={e => setForm({ ...form, openingBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-[#1A1A1A]">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#1A1A1A] text-[#94a3b8] hover:text-white hover:border-[#D4D4D4] font-medium text-sm transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editing ? 'Save Changes' : 'Add Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
