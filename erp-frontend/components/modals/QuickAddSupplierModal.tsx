import React, { useState } from 'react';
import { suppliersApi } from '../../lib/erp-api';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const INDIAN_STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

export default function QuickAddSupplierModal({ onClose, onAdded }: { onClose: () => void; onAdded: (supplier: any) => void; }) {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', street: '', city: '', state: '', pinCode: '', country: 'India',
    email: '', mobile: '',
    pan: '', gstin: '', contactPerson: '',
    balanceType: 'Credit', openingBalance: 0,
    note: ''
  });

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Full Name is required'); return; }
    if (!form.state.trim()) { toast.error('State is required'); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        address: { street: form.street, city: form.city, state: form.state, pinCode: form.pinCode, country: form.country },
        email: form.email,
        mobile: form.mobile,
        pan: form.pan,
        gstin: form.gstin,
        contactPerson: form.contactPerson,
        balanceType: form.balanceType,
        openingBalance: Math.abs(form.openingBalance),
        note: form.note,
      };
      const { data } = await suppliersApi.create(payload);
      toast.success('Supplier Information Saved!');
      onAdded(data.supplier);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/60 backdrop-blur-sm">
      <div className="bg-[#F1F5F9] border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0 bg-white rounded-t-2xl">
          <div>
            <h3 className="text-slate-900 font-bold text-lg">Add New Supplier</h3>
            <p className="text-xs text-slate-600 mt-0.5">Fill in the supplier details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F1F5F9] text-slate-600 hover:text-slate-900 transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-1 overflow-y-auto p-4 bg-[#F1F5F9]">
          <div className="flex flex-col md:flex-row gap-4 w-full mx-auto">
            
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
               {/* Column 1 */}
               <div className="space-y-4">
                 <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-5 shadow-sm">
                   <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Supplier Details</legend>
                   <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                     <label className="text-slate-600">Full Name <span className="text-red-500">*</span></label>
                     <input className="erp-input w-full bg-[#F1F5F9]" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
                     
                     <label className="text-slate-600">Contact Person</label>
                     <input className="erp-input w-full bg-[#F1F5F9]" value={form.contactPerson} onChange={e=>setForm({...form, contactPerson: e.target.value})} />
                     
                     <label className="self-start mt-2 text-slate-600">Address / Street</label>
                     <textarea className="erp-input w-full h-16 resize-none bg-[#F1F5F9]" value={form.street} onChange={e=>setForm({...form, street: e.target.value})} />
                     
                     <label className="text-slate-600">City</label>
                     <input className="erp-input w-full bg-[#F1F5F9]" value={form.city} onChange={e=>setForm({...form, city: e.target.value})} />
                     
                     <label className="text-slate-600">State <span className="text-red-500">*</span></label>
                     <select className="erp-input w-full bg-[#F1F5F9]" value={form.state} onChange={e=>setForm({...form, state: e.target.value})}>
                       <option value=""></option>
                       {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                     </select>
                     
                     <label className="text-slate-600">PIN Code</label>
                     <input className="erp-input w-full bg-[#F1F5F9]" value={form.pinCode} onChange={e=>setForm({...form, pinCode: e.target.value})} />
                     
                     <label className="text-slate-600">Country</label>
                     <input className="erp-input w-full bg-[#F1F5F9]" value={form.country} onChange={e=>setForm({...form, country: e.target.value})} />
                   </div>
                 </fieldset>
               </div>
               
               {/* Column 2 */}
               <div className="space-y-4">
                 
                 <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-5 shadow-sm">
                   <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Contact & Tax Details</legend>
                   <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                     <label className="text-slate-600">Email ID</label>
                     <input className="erp-input w-full bg-[#F1F5F9]" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
                     
                     <label className="text-slate-600">Contact No</label>
                     <input className="erp-input w-full bg-[#F1F5F9]" value={form.mobile} onChange={e=>setForm({...form, mobile: e.target.value})} />

                     <label className="text-slate-600">PAN No.</label>
                     <input className="erp-input w-full bg-[#F1F5F9] uppercase" value={form.pan} onChange={e=>setForm({...form, pan: e.target.value})} />
                     
                     <label className="text-slate-600">GSTIN</label>
                     <input className="erp-input w-full uppercase bg-[#F1F5F9]" value={form.gstin} onChange={e=>setForm({...form, gstin: e.target.value})} />
                   </div>
                 </fieldset>
                 
                 <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-5 shadow-sm">
                   <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Account Details</legend>
                   <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                     <label className="text-slate-600">Opening Balance</label>
                     <div className="flex">
                        <span className="bg-[#1e3a8a] text-slate-900 px-2.5 py-1 border border-slate-200 border-r-0 flex items-center shadow-inner">₹</span>
                        <input type="number" className="erp-input w-full rounded-l-none bg-[#F1F5F9]" value={form.openingBalance === 0 ? '' : form.openingBalance} onChange={e=>setForm({...form, openingBalance: parseFloat(e.target.value) || 0})} />
                     </div>
                     <label className="text-slate-600">Type</label>
                     <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                           <input type="radio" name="balType" checked={form.balanceType === 'Debit'} onChange={() => setForm({...form, balanceType: 'Debit'})} className="accent-[#1e3a8a] w-3.5 h-3.5" /> Debit
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                           <input type="radio" name="balType" checked={form.balanceType === 'Credit'} onChange={() => setForm({...form, balanceType: 'Credit'})} className="accent-[#1e3a8a] w-3.5 h-3.5" /> Credit
                        </label>
                     </div>
                     
                     <label className="self-start mt-2 text-slate-600">Note</label>
                     <textarea className="erp-input w-full h-16 resize-none bg-[#F1F5F9]" value={form.note} onChange={e=>setForm({...form, note: e.target.value})} />
                   </div>
                 </fieldset>
                 
               </div>
            </div>
         </div>
      
        </div>

        <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-2xl shrink-0">
            <button onClick={handleSave} disabled={saving} className="bg-[#1e3a8a] hover:bg-action-600 text-slate-900 px-8 py-2 rounded flex items-center gap-2 text-sm font-semibold shadow-md transition disabled:opacity-50">
                <Save className="w-4 h-4" /> Save Supplier
            </button>
        </div>
      </div>
    </div>
  );
}
