'use client';
import { Bell, Search } from 'lucide-react';
import { useAppSelector } from '../../hooks/useRedux';

export default function Topbar({ title }: { title?: string }) {
  const { user } = useAppSelector((s) => s.auth);

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white backdrop-blur border-b border-slate-200 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Title pushed right of mobile menu btn */}
        <h1 className="text-slate-900 font-semibold text-lg ml-10 lg:ml-0">{title || 'Dashboard'}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 w-56 text-slate-600 text-sm">
          <Search className="w-4 h-4" />
          <span>Search...</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D4D4D4]" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-slate-900 text-sm font-bold">
          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
        </div>
      </div>
    </header>
  );
}
