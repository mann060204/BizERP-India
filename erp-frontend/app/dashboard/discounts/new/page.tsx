'use client';
import { useState } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { businessApi } from '../../../../lib/erp-api';
import { Loader2, Save, ArrowLeft, Percent, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewDiscountSchemePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [value, setValue] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const valNum = parseFloat(value);
    
    if (!name.trim()) return toast.error('Please enter a scheme name');
    if (isNaN(valNum) || valNum <= 0) return toast.error('Please enter a valid discount value');
    if (type === 'PERCENTAGE' && valNum > 100) return toast.error('Percentage cannot exceed 100%');

    try {
      setSaving(true);
      // Fetch current profile to append the new scheme
      const { data } = await businessApi.getProfile();
      const currentSchemes = data.business?.discountSchemes || [];
      
      const newScheme = {
        name: name.trim(),
        type,
        value: valNum,
        isActive: true
      };
      
      await businessApi.updateProfile({ discountSchemes: [...currentSchemes, newScheme] });
      toast.success('Discount scheme created successfully');
      router.push('/dashboard/discounts');
    } catch (error) {
      toast.error('Failed to create discount scheme');
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      <Topbar title="New Discount Scheme" />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          
          <div className="flex items-center gap-4 mb-8">
            <Link 
              href="/dashboard/discounts"
              className="p-2 text-[#64748b] hover:text-[#0F172A] hover:bg-[#1A1A1A] rounded-xl transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight">Create Scheme</h2>
              <p className="text-[#94a3b8] mt-1">Set up a new bulk or promotional discount rule</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 md:p-8 space-y-8">
            
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-[#D4D4D4]">Scheme Name</label>
              <input 
                type="text"
                placeholder="e.g. Festival Special 10% Off"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#111111] border border-[#262626] rounded-xl px-4 py-3 text-[#0F172A] focus:outline-none focus:border-rose-500 transition text-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-[#D4D4D4]">Discount Type</label>
                <div className="flex bg-[#111111] p-1.5 rounded-xl border border-[#262626]">
                  <button
                    type="button"
                    onClick={() => setType('PERCENTAGE')}
                    className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition ${type === 'PERCENTAGE' ? 'bg-[#1A1A1A] text-[#0F172A] shadow-sm' : 'text-[#64748b] hover:text-[#D4D4D4]'}`}
                  >
                    <Percent className="w-4 h-4" /> Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('FLAT')}
                    className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition ${type === 'FLAT' ? 'bg-[#1A1A1A] text-[#0F172A] shadow-sm' : 'text-[#64748b] hover:text-[#D4D4D4]'}`}
                  >
                    <DollarSign className="w-4 h-4" /> Flat Amount
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-[#D4D4D4]">Discount Value</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {type === 'PERCENTAGE' ? (
                      <Percent className="w-5 h-5 text-[#64748b]" />
                    ) : (
                      <span className="text-[#64748b] font-bold">₹</span>
                    )}
                  </div>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-full bg-[#111111] border border-[#262626] rounded-xl pl-12 pr-4 py-3 text-[#0F172A] focus:outline-none focus:border-rose-500 transition text-lg"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1A1A1A] flex justify-end gap-4">
              <Link
                href="/dashboard/discounts"
                className="px-6 py-3 bg-[#111111] text-[#0F172A] font-medium rounded-xl hover:bg-[#1A1A1A] border border-[#262626] transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-rose-600 text-[#0F172A] font-bold rounded-xl hover:bg-rose-700 transition shadow-lg shadow-rose-900/20 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Scheme
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}
