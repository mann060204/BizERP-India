'use client';
import { Bell, Search } from 'lucide-react';
import { useAppSelector } from '../../hooks/useRedux';
import FinancialYearDropdown from './FinancialYearDropdown';

export default function Topbar({ title }: { title?: string }) {
  const { user } = useAppSelector((s) => s.auth);

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white backdrop-blur border-b border-slate-200 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Title pushed right of mobile menu btn */}
        <h1 className="text-slate-900 font-semibold text-lg ml-10 lg:ml-0">{title || 'Dashboard'}</h1>
      </div>

      <div className="flex items-center gap-4">
        <FinancialYearDropdown />
      </div>


    </header>
  );
}
