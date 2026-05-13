'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../components/layout/Topbar';
import { businessApi } from '../../../lib/erp-api';
import { Loader2, Save, Building2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    if (!form.name.trim()) { toast.error('Business name is required'); return; }
    setSaving(true);
    try {
      await businessApi.updateProfile({
        name: form.name,
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
        }
      });
      toast.success('Settings updated successfully');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to update settings'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#D4D4D4] animate-spin" /></div>;
  if (!form) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Settings" />
      <main className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Business Settings</h2>
            <p className="text-[#94a3b8] text-sm mt-0.5">Manage your company profile and compliance details</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-sm hover:opacity-90 transition flex items-center gap-2 shadow-lg shadow-white/10/30 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="glass rounded-2xl p-5 border border-[#1A1A1A] text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#0A0A0A] border-2 border-[#1A1A1A] flex items-center justify-center mb-4 overflow-hidden relative group">
                {form.logo ? (
                  <img src={form.logo} alt="Logo" className="w-full h-full object-contain bg-white" />
                ) : (
                  <Building2 className="w-8 h-8 text-[#475569]" />
                )}
                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                  <span className="text-[10px] text-white font-semibold">Upload Logo</span>
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
              <h3 className="font-bold text-white text-lg">{form.name || form.businessName}</h3>
              {form.gstin && <p className="text-[#94a3b8] text-xs font-mono mt-1">GSTIN: {form.gstin}</p>}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* General Info */}
            <div className="glass rounded-2xl p-6 border border-[#1A1A1A] space-y-4">
              <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-3">
                <ShieldCheck className="w-5 h-5 text-[#D4D4D4]" />
                <h3 className="font-semibold text-white">General & Compliance</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Business Name *</label>
                  <input value={form.name || form.businessName || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">GSTIN</label>
                  <input value={form.gstin || ''} onChange={e => setForm({ ...form, gstin: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">PAN Number</label>
                  <input value={form.pan || ''} onChange={e => setForm({ ...form, pan: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Email Address</label>
                  <input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Phone Number</label>
                  <input value={form.phone || form.mobile || ''} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="glass rounded-2xl p-6 border border-[#1A1A1A] space-y-4">
              <h3 className="font-semibold text-white border-b border-[#1A1A1A] pb-3">Registered Address</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Street Address</label>
                  <input value={form.address?.street || ''} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">City</label>
                  <input value={form.address?.city || ''} onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">State</label>
                  <input value={form.address?.state || ''} onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">PIN Code</label>
                  <input value={form.address?.pinCode || ''} onChange={e => setForm({ ...form, address: { ...form.address, pinCode: e.target.value } })}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
