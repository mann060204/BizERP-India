'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { fetchMe } from '../../store/slices/authSlice';
import Sidebar from '../../components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const [checking, setChecking] = useState(true);

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
      <div className="min-h-screen flex items-center justify-center bg-[#000000]">
        <div className="w-8 h-8 border-4 border-[#D4D4D4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#000000]">
      <Sidebar />
      <div className="flex-1 lg:pl-60 transition-all duration-300 min-w-0">
        {children}
      </div>
    </div>
  );
}
