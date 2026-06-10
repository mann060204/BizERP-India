'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../components/layout/Topbar';
import { businessApi } from '../../../lib/erp-api';
import { Loader2, Plus, Tag, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface DiscountScheme {
  _id?: string;
  name: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  isActive: boolean;
}

export default function DiscountSchemesPage() {
  const [schemes, setSchemes] = useState<DiscountScheme[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data } = await businessApi.getProfile();
      setSchemes(data.business?.discountSchemes || []);
    } catch (error) { 
      toast.error('Failed to load discount schemes'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const toggleStatus = async (idx: number) => {
    try {
      const updatedSchemes = [...schemes];
      updatedSchemes[idx].isActive = !updatedSchemes[idx].isActive;
      setSchemes(updatedSchemes); // Optimistic UI update
      
      await businessApi.updateProfile({ discountSchemes: updatedSchemes });
      toast.success(updatedSchemes[idx].isActive ? 'Scheme activated' : 'Scheme deactivated');
    } catch (error) {
      toast.error('Failed to update status');
      fetchProfile(); // Revert on failure
    }
  };

  const deleteScheme = async (idx: number) => {
    if (!confirm('Are you sure you want to delete this discount scheme?')) return;
    try {
      const updatedSchemes = schemes.filter((_, i) => i !== idx);
      setSchemes(updatedSchemes);
      await businessApi.updateProfile({ discountSchemes: updatedSchemes });
      toast.success('Scheme deleted');
    } catch (error) {
      toast.error('Failed to delete scheme');
      fetchProfile();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-50">
        <Topbar title="Discount Schemes" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Topbar title="Discount Schemes" />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <Tag className="w-8 h-8 text-rose-500" />
                Discount Schemes
              </h2>
              <p className="text-slate-600 mt-2">Manage all active promotional and bulk discount rules</p>
            </div>
            <Link
              href="/dashboard/discounts/new"
              className="px-6 py-2.5 bg-rose-600 text-slate-900 font-medium rounded-xl hover:bg-rose-700 transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Scheme
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F1F5F9]">
                  <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Scheme Name</th>
                  <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Value</th>
                  <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {schemes.map((scheme, idx) => (
                  <tr key={idx} className="hover:bg-[#F1F5F9] transition group">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 text-base block">{scheme.name}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-[#E2E8F0] text-slate-700">
                        {scheme.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900">
                        {scheme.type === 'PERCENTAGE' ? scheme.value + '%' : '₹' + scheme.value.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(idx)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${scheme.isActive ? 'bg-rose-600' : 'bg-[#333333]'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${scheme.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button 
                          onClick={() => deleteScheme(idx)}
                          className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                          title="Delete Scheme"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {schemes.length === 0 && (
              <div className="p-12 text-center text-slate-600">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No discount schemes found.</p>
                <Link href="/dashboard/discounts/new" className="text-rose-500 hover:underline mt-2 inline-block">Create one now</Link>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
