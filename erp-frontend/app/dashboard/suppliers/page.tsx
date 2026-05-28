'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../components/layout/Topbar';
import { suppliersApi } from '../../../lib/erp-api';
import { Search, Loader2, Save, X, Truck, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Supplier { 
  _id: string; name: string; mobile?: string; email?: string; gstin?: string; pan?: string;
  address?: { street?: string; city?: string; state?: string; pinCode?: string; country?: string; }; 
  openingBalance: number; balanceType?: 'Debit'|'Credit'; 
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await suppliersApi.list({ search, limit: 100 });
      setSuppliers(data.suppliers);
    } catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (s: Supplier) => { 
    setEditing(s); 
    setForm({ 
      name: s.name, mobile: s.mobile || '', email: s.email || '', gstin: s.gstin || '', pan: s.pan || '',
      street: s.address?.street || '', city: s.address?.city || '', state: s.address?.state || '', pinCode: s.address?.pinCode || '', country: s.address?.country || 'India',
      openingBalance: s.openingBalance, balanceType: s.balanceType || 'Credit', 
      contactPerson: s.contactPerson || '', note: s.note || '',
      bankName: s.bankDetails?.bankName || '', accountNumber: s.bankDetails?.accountNumber || '', ifsc: s.bankDetails?.ifsc || ''
    }); 
    setShowModal(true); 
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Company Name is required'); return; }
    if (!form.city.trim() || !form.state.trim()) { toast.error('City and State are required'); return; }
    
    setSaving(true);
    try {
      const payload = { 
        name: form.name, mobile: form.mobile, email: form.email, gstin: form.gstin, pan: form.pan,
        address: { street: form.street, city: form.city, state: form.state, pinCode: form.pinCode, country: form.country }, 
        openingBalance: form.openingBalance, balanceType: form.balanceType,
        contactPerson: form.contactPerson, note: form.note,
        bankDetails: { bankName: form.bankName, accountNumber: form.accountNumber, ifsc: form.ifsc }
      };
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
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] transition-colors">
      <Topbar title="Suppliers" />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">Supplier Directory</h2>
            <p className="text-[#64748B] text-sm mt-0.5">{suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} total</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[#0F172A] font-semibold text-sm transition shadow-lg shadow-indigo-600/20">
            + Add Supplier
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] focus:outline-none focus:border-indigo-500 transition text-sm" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
        ) : suppliers.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-[#E2E8F0]">
            <Truck className="w-14 h-14 text-indigo-500/50 mx-auto mb-4" />
            <p className="text-[#0F172A] font-semibold text-lg">No suppliers yet</p>
            <p className="text-[#475569] text-sm mt-1 mb-6">Add your first supplier to get started</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-[#0F172A] text-sm font-semibold hover:bg-indigo-500 transition">Add Supplier</button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-gray-50/50 bg-[#F1F5F9]">
                    {['Name', 'Mobile', 'Email', 'GSTIN', 'City / State', 'Balance', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-[#64748B] font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {suppliers.map((s) => (
                    <tr key={s._id} className="hover:bg-[#F1F5F9] hover:bg-gray-50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-400/20 flex items-center justify-center text-orange-600 text-orange-400 font-bold">{s.name.charAt(0).toUpperCase()}</div>
                          <span className="text-[#0F172A] font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#64748B]">{s.mobile || '—'}</td>
                      <td className="px-5 py-4 text-[#64748B]">{s.email || '—'}</td>
                      <td className="px-5 py-4 text-[#64748B] font-mono text-xs">{s.gstin || '—'}</td>
                      <td className="px-5 py-4 text-[#64748B]">{[s.address?.city, s.address?.state].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={s.openingBalance > 0 ? 'text-green-500' : s.openingBalance < 0 ? 'text-red-500' : 'text-[#475569]'}>
                          ₹{s.openingBalance?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-[#E2E8F0] hover:bg-gray-200 text-[#64748B] hover:text-[#0F172A] hover:text-gray-900 transition"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(s._id, s.name)} className="p-1.5 rounded-lg hover:bg-red-900/20 text-[#64748B] hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
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

      {/* Supplier Modal Design (Screenshot Match) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F8FAFC] backdrop-blur-sm">
          <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#64748B]" />
                <h3 className="text-[#0F172A] font-bold text-lg">{editing ? 'Edit Supplier Information' : 'New Supplier Information'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#475569] hover:text-[#0F172A] hover:text-gray-900 transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="border-b border-[#E2E8F0] px-6 py-2">
              <span className="text-sm font-semibold text-[#0F172A] border-b-2 border-indigo-500 pb-2 inline-block">Profile</span>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left Fixed Column - Account Status */}
              <div className="w-12 border-r border-[#E2E8F0] flex flex-col items-center py-6 bg-[#020202]">
                <div className="whitespace-nowrap -rotate-90 text-[10px] font-bold text-red-500 tracking-wider mt-20">
                  ACCOUNT STATUS: UNSAVED
                </div>
                <div className="mt-auto -rotate-90 whitespace-nowrap mb-20 text-[10px] font-semibold text-blue-500 cursor-pointer">
                  CHECK GSTIN STATUS
                </div>
              </div>

              {/* Main Form Content */}
              <div className="flex-1 p-6 overflow-y-auto bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Main Column */}
                  <div className="space-y-6">
                    <fieldset className="border border-[#CBD5E1] p-4 rounded-md">
                      <legend className="px-2 text-xs font-bold text-indigo-500 uppercase">Supplier Details</legend>
                      
                      <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-3 items-center gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right">Company Name <span className="text-red-500">*</span></label>
                          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="col-span-2 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right mt-1">Address</label>
                          <textarea value={form.street} onChange={e => setForm({...form, street: e.target.value})} rows={3} className="col-span-2 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none resize-none" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right">City <span className="text-red-500">*</span></label>
                          <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="col-span-2 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right">State <span className="text-red-500">*</span></label>
                          <select value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="col-span-2 px-2 py-1.5 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none">
                            <option value="">Select</option>
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right">Pin Code</label>
                          <input value={form.pinCode} onChange={e => setForm({...form, pinCode: e.target.value})} className="col-span-2 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right">Country</label>
                          <input value={form.country} onChange={e => setForm({...form, country: e.target.value})} className="col-span-2 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right">Email</label>
                          <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="col-span-2 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right">Phone No</label>
                          <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className="col-span-2 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none" />
                        </div>
                      </div>
                    </fieldset>

                    <fieldset className="border border-[#CBD5E1] p-4 rounded-md">
                      <legend className="px-2 text-xs font-bold text-indigo-500 uppercase">Bank Details</legend>
                      <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-3 items-center gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right">Bank Name</label>
                          <input value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})} className="col-span-2 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right">Bank A/c No.</label>
                          <input value={form.accountNumber} onChange={e => setForm({...form, accountNumber: e.target.value})} className="col-span-2 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right">IFSC Code</label>
                          <input value={form.ifsc} onChange={e => setForm({...form, ifsc: e.target.value})} className="col-span-2 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none" />
                        </div>
                      </div>
                    </fieldset>
                  </div>

                  {/* Right Main Column */}
                  <div className="space-y-6">
                    <fieldset className="border border-[#CBD5E1] p-4 rounded-md">
                      <legend className="px-2 text-xs font-bold text-indigo-500 uppercase">Tax Details</legend>
                      <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-3 items-center gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right">PAN No.</label>
                          <input value={form.pan} onChange={e => setForm({...form, pan: e.target.value})} className="col-span-2 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right">GSTIN</label>
                          <input value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value})} className="col-span-2 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none uppercase" />
                        </div>
                      </div>
                    </fieldset>

                    <fieldset className="border border-[#CBD5E1] p-4 rounded-md">
                      <legend className="px-2 text-xs font-bold text-indigo-500 uppercase">Account Details</legend>
                      <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-3 items-center gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right">Op. Balance</label>
                          <div className="col-span-2 flex gap-2">
                            <input type="number" value={form.openingBalance === 0 ? '' : form.openingBalance} onChange={e => setForm({...form, openingBalance: parseFloat(e.target.value) || 0})} className="flex-1 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none" />
                            <select value={form.balanceType} onChange={e => setForm({...form, balanceType: e.target.value})} className="w-24 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none">
                              <option value="Credit">Credit</option>
                              <option value="Debit">Debit</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </fieldset>

                    <fieldset className="border border-[#CBD5E1] p-4 rounded-md">
                      <legend className="px-2 text-xs font-bold text-indigo-500 uppercase">Contact Details</legend>
                      <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-3 items-center gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right">Contact Person</label>
                          <input value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} className="col-span-2 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none" />
                        </div>
                      </div>
                    </fieldset>

                    <fieldset className="border border-[#CBD5E1] p-4 rounded-md">
                      <legend className="px-2 text-xs font-bold text-indigo-500 uppercase">Other Details</legend>
                      <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-3 gap-2">
                          <label className="text-xs font-semibold text-[#64748B] text-right mt-1">Remark / Note</label>
                          <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} rows={3} className="col-span-2 px-2 py-1 border border-[#CBD5E1] bg-[#F1F5F9] rounded text-[#0F172A] text-sm focus:border-indigo-500 outline-none resize-none" />
                        </div>
                      </div>
                    </fieldset>

                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-[#E2E8F0] bg-[#F1F5F9] rounded-b-xl">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 rounded-lg border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] hover:text-gray-900 hover:bg-[#E2E8F0] hover:bg-white font-medium text-sm transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-8 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[#0F172A] font-semibold text-sm disabled:opacity-60 transition flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
