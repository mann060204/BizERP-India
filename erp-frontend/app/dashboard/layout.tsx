'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { fetchMe } from '../../store/slices/authSlice';
import Sidebar from '../../components/layout/Sidebar';
import LegacyFYModal from '../../components/LegacyFYModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const [checking, setChecking] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('erp_token');
    if (!stored) {
      router.replace('/login');
    } else {
      dispatch(fetchMe()).finally(() => setChecking(false));
    }
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#D4D4D4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <LegacyFYModal />
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`flex-1 transition-all duration-300 min-w-0 ${collapsed ? 'lg:pl-[64px]' : 'lg:pl-[220px]'}`}>
        {children}
      </div>
    </div>
  );
}
