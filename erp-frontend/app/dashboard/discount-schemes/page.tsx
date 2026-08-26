'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Topbar from '../../../components/layout/Topbar';
import { discountSchemesApi } from '../../../lib/erp-api';
import { Plus, Search, Tag, Edit2, Trash2, Loader2, Copy, Power, PowerOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DiscountSchemesPage() {
  const router = useRouter();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await discountSchemesApi.list();
      setSchemes(data.schemes);
    } catch { toast.error('Failed to load discount schemes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSchemes(); }, [fetchSchemes]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await discountSchemesApi.updateStatus(id, newStatus);
      toast.success(`Scheme ${newStatus.toLowerCase()}`);
      fetchSchemes();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filteredSchemes = schemes.filter(s => 
    s.schemeName.toLowerCase().includes(search.toLowerCase()) || 
    s.schemeCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Discount Schemes" />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Discount Schemes</h2>
            <p className="text-slate-600 text-sm mt-0.5">{filteredSchemes.length} scheme{filteredSchemes.length !== 1 ? 's' : ''} configured</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/discount-schemes/new"
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Scheme
            </Link>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search schemes by name or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-500 text-sm">Loading discount schemes...</p>
          </div>
        ) : filteredSchemes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No Schemes Found</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              Create flexible discount rules to automate pricing and boost sales.
            </p>
            <Link 
              href="/dashboard/discount-schemes/new"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-5 py-2.5 rounded-lg text-sm font-semibold border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create First Scheme
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Scheme Details</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Applicability</th>
                    <th className="px-6 py-4 font-semibold">Validity</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSchemes.map(scheme => (
                    <tr key={scheme._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{scheme.schemeName}</div>
                        <div className="text-xs text-slate-500 mt-1">{scheme.schemeCode}</div>
                        {scheme.buyCondition?.products?.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1 font-medium">
                            BUY {scheme.buyCondition.products.length} Items
                          </div>
                        )}
                        {scheme.getReward?.products?.length > 0 && (
                          <div className="text-xs text-emerald-600 font-medium">
                            GET {scheme.getReward.products.length} Items {scheme.getReward.benefitType === 'FREE' ? 'FREE' : 'DISCOUNTED'}
                          </div>
                        )}
                        {scheme.combo?.products?.length > 0 && (
                          <div className="text-xs text-purple-600 mt-1 font-medium">
                            COMBO of {scheme.combo.products.length} Items
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          {scheme.schemeType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {scheme.applicability?.customerScope} Customers<br/>
                        {scheme.applicability?.productScope} Products
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {scheme.startDate ? new Date(scheme.startDate).toLocaleDateString() : 'Always'} 
                        <br/>to<br/> 
                        {scheme.endDate ? new Date(scheme.endDate).toLocaleDateString() : 'Forever'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          scheme.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                          scheme.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                          scheme.status === 'EXPIRED' ? 'bg-slate-100 text-slate-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {scheme.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(scheme._id, scheme.status)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title={scheme.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                          >
                            {scheme.status === 'ACTIVE' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          <Link 
                            href={`/dashboard/discount-schemes/${scheme._id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
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
