'use client';
import { Bell, Search, Sun, Moon } from 'lucide-react';
import { useAppSelector } from '../../hooks/useRedux';
import { useTheme } from 'next-themes';

export default function Topbar({ title }: { title?: string }) {
  const { user } = useAppSelector((s) => s.auth);
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 flex items-center justify-between px-6 dark:bg-[#0A0A0A] bg-white/80 backdrop-blur border-b dark:border-[#1A1A1A] border-gray-300 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Title pushed right of mobile menu btn */}
        <h1 className="dark:text-white text-gray-900 font-semibold text-lg ml-10 lg:ml-0">{title || 'Dashboard'}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-[#000000] bg-white border dark:border-[#1A1A1A] border-gray-300 w-56 dark:text-[#475569] text-gray-500 text-sm">
          <Search className="w-4 h-4" />
          <span>Search...</span>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl dark:bg-[#000000] bg-white border dark:border-[#1A1A1A] border-gray-300 dark:text-[#94a3b8] text-gray-600 hover:dark:text-white text-gray-900 transition"
        >
          <Sun className="w-5 h-5 hidden dark:block" />
          <Moon className="w-5 h-5 block dark:hidden" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl dark:bg-[#000000] bg-white border dark:border-[#1A1A1A] border-gray-300 dark:text-[#94a3b8] text-gray-600 hover:dark:text-white text-gray-900 transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D4D4D4]" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center dark:text-white text-gray-900 text-sm font-bold">
          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
        </div>
      </div>
    </header>
  );
}
