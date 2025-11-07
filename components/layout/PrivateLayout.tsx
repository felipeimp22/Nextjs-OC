'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import PrivateHeader from './PrivateHeader';
import PrivateSidebar from './PrivateSidebar';
import { useCurrentUser } from '@/hooks/useAuth';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <PrivateSidebar />
      <div className="flex-1 ml-64 transition-all duration-300">
        <PrivateHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}