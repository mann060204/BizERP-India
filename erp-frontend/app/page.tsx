'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '../hooks/useRedux';

export default function Home() {
  const router = useRouter();
  const { token } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-[#D4D4D4] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
