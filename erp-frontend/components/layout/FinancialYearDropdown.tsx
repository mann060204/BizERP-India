'use client';
import { useState, useEffect } from 'react';
import { CalendarDays, ChevronDown, Check, Loader2 } from 'lucide-react';
import { financialYearApi } from '../../lib/erp-api';
import toast from 'react-hot-toast';

export default function FinancialYearDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  // We can determine the active year by looking at the first one, 
  // or by passing the current business ID from Redux if available.
  // Actually, the API might not tell us which one is active explicitly,
  // but if we have the current user's businessId, we can highlight it.

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await financialYearApi.getAvailableYears();
        setYears(res.years || []);
      } catch (e) {
        console.error('Failed to load financial years', e);
      } finally {
        setLoading(false);
      }
    };
    fetchYears();
  }, []);

  const handleSwitch = async (businessId: string) => {
    setSwitchingTo(businessId);
    try {
      const res = await financialYearApi.switchYear(businessId);
      if (res.token) {
        localStorage.setItem('erp_token', res.token);
      }
      toast.success('Switched Financial Year Successfully!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to switch financial year');
      setSwitchingTo(null);
    }
  };

  if (loading || years.length <= 1) return null; // Don't show dropdown if only 1 year exists

  const activeBusinessId = (() => {
    try {
      // Decode JWT to get businessId
      const token = localStorage.getItem('erp_token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.businessId;
    } catch { return null; }
  })();

  const activeYear = years.find(y => y._id === activeBusinessId) || years[0];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
      >
        <CalendarDays className="w-4 h-4 text-slate-500" />
        {activeYear?.financialYearLabel || 'Financial Year'}
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 shadow-xl rounded-xl py-2 z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Switch Financial Year</p>
            </div>
            {years.map((year) => (
              <div key={year._id} className="relative flex items-center group">
                <button
                  onClick={() => handleSwitch(year._id)}
                  disabled={switchingTo !== null || year._id === activeBusinessId}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition ${year._id === activeBusinessId ? 'bg-slate-50 text-action-600 font-medium' : 'text-slate-700 pr-10'} disabled:opacity-50`}
                >
                  <span>{year.financialYearLabel || year.businessName}</span>
                  {switchingTo === year._id && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                  {year._id === activeBusinessId && switchingTo === null && <Check className="w-4 h-4 text-action-600" />}
                </button>
                {year._id !== activeBusinessId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to permanently delete the financial year "${year.financialYearLabel}" and ALL its data (invoices, products, ledger)? This cannot be undone.`)) {
                        setSwitchingTo(year._id);
                        financialYearApi.deleteYear(year._id).then(() => {
                          toast.success('Financial year deleted successfully');
                          setYears(years.filter(y => y._id !== year._id));
                        }).catch((e: any) => {
                          toast.error(e.response?.data?.message || 'Failed to delete year');
                        }).finally(() => setSwitchingTo(null));
                      }
                    }}
                    className="absolute right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Financial Year"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
