'use client';
import { useEffect, useState } from 'react';
import { Bell, Search, LogOut } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';
import { businessApi } from '../../lib/erp-api';
import FinancialYearDropdown from './FinancialYearDropdown';

export default function Topbar({ title }: { title?: string }) {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [businessName, setBusinessName] = useState('My Business');

  useEffect(() => {
    businessApi.getProfile().then(res => {
      if (res.data.business?.name) setBusinessName(res.data.business.name);
      else if (res.data.business?.businessName) setBusinessName(res.data.business.businessName);
    }).catch(() => {});
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white backdrop-blur border-b border-slate-200 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Title pushed right of mobile menu btn */}
        <h1 className="text-slate-900 font-semibold text-lg ml-10 lg:ml-0">{title || 'Dashboard'}</h1>
      </div>

      <div className="flex items-center gap-4">
        <FinancialYearDropdown />

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-slate-900 truncate max-w-[150px]">{businessName}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role || 'Admin'}</p>
          </div>
          <button onClick={() => dispatch(logout())} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
