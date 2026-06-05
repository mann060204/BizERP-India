'use client';
import { useEffect, useState } from 'react';
import { LogOut, Sparkles, Loader2, CalendarDays } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';
import { businessApi, financialYearApi } from '../../lib/erp-api';
import toast from 'react-hot-toast';
import FinancialYearDropdown from './FinancialYearDropdown';

export default function Topbar({ title }: { title?: string }) {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [businessName, setBusinessName] = useState('My Business');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime
    ? currentTime.toLocaleString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'short',
        day: 'numeric', hour: '2-digit', minute: '2-digit',
        second: '2-digit', hour12: true
      })
    : 'Loading...';

  const [showLegacyModal, setShowLegacyModal] = useState(false);
  const [newFyName, setNewFyName] = useState('');
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    businessApi.getProfile().then(res => {
      if (res.data.business?.name) setBusinessName(res.data.business.name);
      else if (res.data.business?.businessName) setBusinessName(res.data.business.businessName);

      if (res.data.business?.financialYearLabel === 'FY Legacy') {
        setShowLegacyModal(true);
      }
    }).catch(() => {});
  }, []);

  const handleRenameLegacy = async () => {
    if (!newFyName.trim()) {
      toast.error('Financial Year name is required');
      return;
    }
    setRenaming(true);
    try {
      await financialYearApi.renameYear(newFyName);
      toast.success('Financial Year updated successfully!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update financial year');
      setRenaming(false);
    }
  };

  return (
    <header className="topbar-root h-14 flex items-center justify-between px-5 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-4">
        <h1 className="text-slate-900 font-bold text-base ml-10 lg:ml-0 tracking-tight">{title || 'Dashboard'}</h1>
        <div className="hidden sm:flex flex-col items-start">
          <span className="topbar-clock px-3 py-1 text-[11px] font-bold rounded-lg min-w-[220px] text-center leading-5">
            {timeStr}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <FinancialYearDropdown />

        <div className="flex items-center gap-2 pl-3 border-l" style={{ borderColor: 'var(--border)' }}>
          <div className="hidden md:flex flex-col items-end">
            <p className="text-[13px] font-bold text-slate-900 truncate max-w-[160px]">{businessName}</p>
            <p className="text-[11px] capitalize" style={{ color: 'var(--text-muted)' }}>{user?.role || 'Admin'}</p>
          </div>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
            style={{ background: 'var(--primary)' }}
          >
            {businessName.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={() => {
              dispatch(logout());
              window.location.href = '/login';
            }}
            className="p-2 rounded-xl transition-all hover:scale-110"
            style={{ color: 'var(--text-muted)' }}
            title="Logout"
            onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {/* Legacy FY Modal */}
      {showLegacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transform transition-all">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-indigo-50 to-blue-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Update Financial Year</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Please name your current active data</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                We noticed your data is under a legacy label. To enable robust financial year roll-overs and backups, please provide a name for your current financial year (e.g., <strong>FY 2024-25</strong>).
              </p>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Financial Year Name</label>
                <input 
                  autoFocus
                  placeholder="e.g. FY 2024-25"
                  value={newFyName}
                  onChange={e => setNewFyName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm transition"
                  onKeyDown={e => { if (e.key === 'Enter') handleRenameLegacy(); }}
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={handleRenameLegacy} 
                disabled={renaming || !newFyName.trim()}
                className="w-full px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-60"
              >
                {renaming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Name & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
