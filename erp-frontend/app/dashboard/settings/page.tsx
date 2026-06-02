'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../components/layout/Topbar';
import { businessApi } from '../../../lib/erp-api';
import { Loader2, Save, Building2, ShieldCheck, FileText, Package, X } from 'lucide-react';
import toast from 'react-hot-toast';



export default function SettingsPage() {
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'business' | 'application'>('business');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await businessApi.getProfile();
        setForm(data.business);
      } catch { toast.error('Failed to load business profile'); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    const businessName = form.name || form.businessName;
    if (!businessName?.trim()) { toast.error('Business name is required'); return; }
    setSaving(true);
    try {
      await businessApi.updateProfile({
        name: businessName,
        gstin: form.gstin,
        pan: form.pan,
        email: form.email,
        phone: form.phone || form.mobile,
        logo: form.logo,
        address: {
          street: form.address?.street,
          city: form.address?.city,
          state: form.address?.state,
          pinCode: form.address?.pinCode
        },
        bankDetails: {
          accountNumber: form.bankDetails?.accountNumber,
          bankName: form.bankDetails?.bankName,
          ifsc: form.bankDetails?.ifsc,
          branch: form.bankDetails?.branch,
          upiId: form.bankDetails?.upiId
        },
        termsAndConditions: form.termsAndConditions,
        invoiceTemplate: form.invoiceTemplate || 'A4',
        invoicePrefix: form.invoicePrefix || 'INV',
        nonGstInvoicePrefix: form.nonGstInvoicePrefix || 'NON-GST',
        purchaseOrderPrefix: form.purchaseOrderPrefix || 'PO',
        productGroups: form.productGroups || [],
        productBrands: form.productBrands || [],
        inventorySequencing: form.inventorySequencing || 'FIFO'
      });
      toast.success('Settings updated successfully');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to update settings'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-slate-700 animate-spin" /></div>;
  if (!form) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Settings" />
      <main className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Settings</h2>
            <p className="text-slate-600 text-sm mt-0.5">Manage your business and application preferences</p>
          </div>
          {activeTab === 'business' && (
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-action-500 text-white hover:bg-action-600 font-semibold text-sm hover:opacity-90 transition flex items-center gap-2 shadow-lg shadow-white/10/30 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          )}
        </div>

        <div className="flex gap-6 border-b border-slate-200">
          <button onClick={() => setActiveTab('business')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'business' ? 'border-action-500 text-action-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Business Profile</button>
          <button onClick={() => setActiveTab('application')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'application' ? 'border-action-500 text-action-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Application Settings</button>
        </div>

        {activeTab === 'business' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="glass rounded-2xl p-5 border border-slate-200 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mb-4 overflow-hidden relative group">
                {form.logo ? (
                  <img src={form.logo} alt="Logo" className="w-full h-full object-contain bg-white" />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-600" />
                )}
                <label className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                  <span className="text-[10px] text-slate-900 font-semibold">Upload Logo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setForm({ ...form, logo: reader.result as string });
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>
              <h3 className="font-bold text-slate-900 text-lg">{form.name || form.businessName}</h3>
              {form.gstin && <p className="text-slate-600 text-xs font-mono mt-1">GSTIN: {form.gstin}</p>}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* General Info */}
            <div className="glass rounded-2xl p-6 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <ShieldCheck className="w-5 h-5 text-slate-700" />
                <h3 className="font-semibold text-slate-900">General & Compliance</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Business Name *</label>
                  <input value={form.name || form.businessName || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">GSTIN</label>
                  <input value={form.gstin || ''} onChange={e => setForm({ ...form, gstin: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">PAN Number</label>
                  <input value={form.pan || ''} onChange={e => setForm({ ...form, pan: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Email Address</label>
                  <input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone Number</label>
                  <input value={form.phone || form.mobile || ''} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="glass rounded-2xl p-6 border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-3">Registered Address</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Street Address</label>
                  <input value={form.address?.street || ''} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">City</label>
                  <input value={form.address?.city || ''} onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">State</label>
                  <input value={form.address?.state || ''} onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">PIN Code</label>
                  <input value={form.address?.pinCode || ''} onChange={e => setForm({ ...form, address: { ...form.address, pinCode: e.target.value } })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="glass rounded-2xl p-6 border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-3">Bank Account Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Bank Name</label>
                  <input value={form.bankDetails?.bankName || ''} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, bankName: e.target.value } })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Account Number</label>
                  <input value={form.bankDetails?.accountNumber || ''} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, accountNumber: e.target.value } })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">IFSC Code</label>
                  <input value={form.bankDetails?.ifsc || ''} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, ifsc: e.target.value } })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Branch</label>
                  <input value={form.bankDetails?.branch || ''} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, branch: e.target.value } })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">UPI ID (Optional)</label>
                  <input value={form.bankDetails?.upiId || ''} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, upiId: e.target.value } })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
              </div>
            </div>

            {/* Invoice Settings */}
            <div className="glass rounded-2xl p-6 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <FileText className="w-5 h-5 text-slate-700" />
                <h3 className="font-semibold text-slate-900">Invoice Settings</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Invoice Print Template</label>
                  <select value={form.invoiceTemplate || 'A4'} onChange={e => setForm({ ...form, invoiceTemplate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition">
                    <option value="A4">A4 Standard Format</option>
                    <option value="POS">Thermal Receipt (POS)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">GST Invoice Prefix</label>
                    <input value={form.invoicePrefix || ''} onChange={e => setForm({ ...form, invoicePrefix: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition uppercase" placeholder="INV" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Non-GST Invoice Prefix</label>
                    <input value={form.nonGstInvoicePrefix || ''} onChange={e => setForm({ ...form, nonGstInvoicePrefix: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition uppercase" placeholder="NON-GST" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Purchase Order Prefix</label>
                    <input value={form.purchaseOrderPrefix || ''} onChange={e => setForm({ ...form, purchaseOrderPrefix: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition uppercase" placeholder="PO" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Default Terms & Conditions</label>
                  <textarea value={form.termsAndConditions || ''} onChange={e => setForm({ ...form, termsAndConditions: e.target.value })}
                    placeholder="Enter default terms and conditions to print on invoices..."
                    className="w-full h-32 resize-none px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
              </div>
            </div>


            {/* Inventory Settings */}
            <div className="glass rounded-2xl p-6 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <Package className="w-5 h-5 text-slate-700" />
                <h3 className="font-semibold text-slate-900">Inventory Tracking</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Batch Delivery Algorithm</label>
                  <select value={form.inventorySequencing || 'FIFO'} onChange={e => setForm({ ...form, inventorySequencing: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition">
                    <option value="FIFO">FIFO (First In, First Out)</option>
                    <option value="FEFO">FEFO (First Expiring, First Out)</option>
                    <option value="LIFO">LIFO (Last In, First Out)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">This determines the default sequence used when auto-assigning batches to invoices.</p>
                </div>
              </div>
            </div>

            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <div className="glass rounded-2xl p-6 border border-slate-200 space-y-4">
               <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-3">Application Preferences</h3>
               <div className="space-y-4 max-w-lg">
                 <div>
                   <label className="block text-xs font-medium text-slate-600 mb-1.5">Theme</label>
                   <select disabled className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm cursor-not-allowed">
                     <option>System Default (Coming Soon)</option>
                     <option>Light</option>
                     <option>Dark</option>
                   </select>
                   <p className="text-[10px] text-slate-500 mt-1">Theme customization is currently locked to System Default.</p>
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-slate-600 mb-1.5">Language</label>
                   <select disabled className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm cursor-not-allowed">
                     <option>English (Default)</option>
                   </select>
                   <p className="text-[10px] text-slate-500 mt-1">More languages will be supported in future updates.</p>
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-slate-600 mb-1.5">Date Format</label>
                   <select disabled className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm cursor-not-allowed">
                     <option>DD/MM/YYYY</option>
                     <option>MM/DD/YYYY</option>
                     <option>YYYY-MM-DD</option>
                   </select>
                   <p className="text-[10px] text-slate-500 mt-1">Date formatting is currently standard across the app.</p>
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
