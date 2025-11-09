'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import PrivateHeader from './PrivateHeader';
import PrivateSidebar from './PrivateSidebar';
import MobileMenu from './MobileMenu';
import { useCurrentUser } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui';
import { useIsMobile } from '@/hooks/use-mobile';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { data: user, isLoading } = useCurrentUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

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
    <ToastProvider>
      <div className="flex min-h-screen bg-gray-100 w-full overflow-x-hidden">
        <PrivateSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isMobile ? 'ml-0' : isCollapsed ? 'ml-20' : 'ml-64'
        }`}>
          <PrivateHeader onMenuClick={() => setMobileMenuOpen(true)} />
          <main className="flex-1 p-4 md:p-6 w-full overflow-x-hidden">
            <div className="w-[95%] md:w-full mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}