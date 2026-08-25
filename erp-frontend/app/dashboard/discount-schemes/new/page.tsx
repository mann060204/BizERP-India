'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../../../components/layout/Topbar';
import { discountSchemesApi } from '../../../../lib/erp-api';
import toast from 'react-hot-toast';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewDiscountSchemePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    schemeName: '',
    schemeCode: '',
    description: '',
    schemeType: 'PERCENTAGE',
    priority: 0,
    stackingRule: 'BEST_DISCOUNT',
    discountValue: '',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    applicability: {
      productScope: 'ALL',
      customerScope: 'ALL'
    }
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...(prev as any)[parent], [child]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.schemeName || !formData.schemeCode || !formData.discountValue) {
      return toast.error('Please fill required fields (Name, Code, Discount Value)');
    }
    
    setLoading(true);
    try {
      await discountSchemesApi.create({
        ...formData,
        discountValue: Number(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
        priority: Number(formData.priority),
        status: 'ACTIVE'
      });
      toast.success('Discount Scheme Created!');
      router.push('/dashboard/discount-schemes');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create scheme');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Topbar title="Create Discount Scheme" />
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard/discount-schemes" className="flex items-center text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Link>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Scheme'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 space-y-8">
            
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Scheme Name *</label>
                  <input type="text" name="schemeName" value={formData.schemeName} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Festival Offer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Scheme Code (Unique) *</label>
                  <input type="text" name="schemeCode" value={formData.schemeCode} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. FEST-2026" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            </div>

            {/* Scheme Type & Value */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Discount Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Scheme Type</label>
                  <select name="schemeType" value={formData.schemeType} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="PERCENTAGE">Percentage Discount (%)</option>
                    <option value="FLAT">Flat Amount Discount (₹)</option>
                    {/* Simplified for MVP, more to be added as per plan */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Discount Value *</label>
                  <input type="number" name="discountValue" value={formData.discountValue} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={formData.schemeType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 500'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Discount Amount (₹) [Optional]</label>
                  <input type="number" name="maxDiscountAmount" value={formData.maxDiscountAmount} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="No Limit" />
                </div>
              </div>
            </div>

            {/* Applicability */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Applicability</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customers</label>
                  <select name="applicability.customerScope" value={formData.applicability.customerScope} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="ALL">All Customers</option>
                    <option value="WHOLESALE">Wholesale Customers</option>
                    <option value="RETAIL">Retail Customers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Products</label>
                  <select name="applicability.productScope" value={formData.applicability.productScope} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="ALL">All Products</option>
                    {/* In a full version, this triggers a multi-select for specific products/categories */}
                  </select>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Validity & Engine Rules</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stacking Rule</label>
                  <select name="stackingRule" value={formData.stackingRule} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="BEST_DISCOUNT">Best Discount (Customer wins)</option>
                    <option value="PRIORITY_BASED">Priority Based (Highest priority wins)</option>
                    <option value="NO_STACKING">No Stacking (Exclusive)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority Level</label>
                  <input type="number" name="priority" value={formData.priority} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Higher number = higher priority" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
