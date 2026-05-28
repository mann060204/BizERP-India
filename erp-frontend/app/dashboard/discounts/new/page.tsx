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
    <div className="flex flex-col h-screen bg-slate-50">
      <Topbar title="New Discount Scheme" />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          
          <div className="flex items-center gap-4 mb-8">
            <Link 
              href="/dashboard/discounts"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-[#E2E8F0] rounded-xl transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create Scheme</h2>
              <p className="text-slate-600 mt-1">Set up a new bulk or promotional discount rule</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-8">
            
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Scheme Name</label>
              <input 
                type="text"
                placeholder="e.g. Festival Special 10% Off"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#F1F5F9] border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-rose-500 transition text-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700">Discount Type</label>
                <div className="flex bg-[#F1F5F9] p-1.5 rounded-xl border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setType('PERCENTAGE')}
                    className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition ${type === 'PERCENTAGE' ? 'bg-[#E2E8F0] text-slate-900 shadow-sm' : 'text-slate-600 hover:text-[#D4D4D4]'}`}
                  >
                    <Percent className="w-4 h-4" /> Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('FLAT')}
                    className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition ${type === 'FLAT' ? 'bg-[#E2E8F0] text-slate-900 shadow-sm' : 'text-slate-600 hover:text-[#D4D4D4]'}`}
                  >
                    <DollarSign className="w-4 h-4" /> Flat Amount
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700">Discount Value</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {type === 'PERCENTAGE' ? (
                      <Percent className="w-5 h-5 text-slate-600" />
                    ) : (
                      <span className="text-slate-600 font-bold">₹</span>
                    )}
                  </div>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-full bg-[#F1F5F9] border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:border-rose-500 transition text-lg"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-4">
              <Link
                href="/dashboard/discounts"
                className="px-6 py-3 bg-[#F1F5F9] text-slate-900 font-medium rounded-xl hover:bg-[#E2E8F0] border border-slate-300 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-rose-600 text-slate-900 font-bold rounded-xl hover:bg-rose-700 transition shadow-lg shadow-rose-900/20 flex items-center gap-2 disabled:opacity-50"
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
