'use client';
import { useEffect, useState } from 'react';
import { LogOut, Sparkles } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';
import { businessApi } from '../../lib/erp-api';
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

  useEffect(() => {
    businessApi.getProfile().then(res => {
      if (res.data.business?.name) setBusinessName(res.data.business.name);
      else if (res.data.business?.businessName) setBusinessName(res.data.business.businessName);
    }).catch(() => {});
  }, []);

  const timeStr = currentTime
    ? currentTime.toLocaleString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'short',
        day: 'numeric', hour: '2-digit', minute: '2-digit',
        second: '2-digit', hour12: true
      })
    : 'Loading...';

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
    </header>
  );
}
