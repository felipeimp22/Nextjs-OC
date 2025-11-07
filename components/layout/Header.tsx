'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signOut } from '@/lib/serverActions/auth.actions';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/serverActions/auth.actions';
import { Menu, X, User, Home, LogOut, Newspaper, Briefcase, Zap, Store, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui';
import type { LucideIcon } from 'lucide-react';

// Menu item type
type MenuItem = {
  translationKey: string;
  href: string;
  icon: LucideIcon;
  type: 'both' | 'mobileOnly' | 'webOnly';
};

// Authenticated user menu items
const authenticatedMenu: MenuItem[] = [
  { translationKey: 'home', href: '/dashboard', icon: Home, type: 'both' },
  { translationKey: 'newspaper', href: '/newspaper', icon: Newspaper, type: 'both' },
  { translationKey: 'stories', href: '/stories', icon: BookOpen, type: 'both' },
  { translationKey: 'cases', href: '/cases', icon: Briefcase, type: 'both' },
  { translationKey: 'challenges', href: '/challenges', icon: Zap, type: 'both' },
  { translationKey: 'market', href: '/market', icon: Store, type: 'both' },
  { translationKey: 'profile', href: '/profile', icon: User, type: 'both' },
];

// Public/Unauthenticated menu items
const publicMenuKeys = ['about', 'community'];

export default function Header() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const { user, setUser, setLoading } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const result = await getCurrentUser();
      if (result.success && result.user) {
        setUser(result.user);
      }
      setLoading(false);
    }
    loadUser();
  }, [setUser, setLoading]);

  const handleLogout = async () => {
    await signOut();
    useAuthStore.getState().logout();
    window.location.href = '/';
  };

  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) return null;

  // Filter menu items based on display type
  const getFilteredMenu = (displayType: 'mobile' | 'web') => {
    return authenticatedMenu.filter(item => 
      item.type === 'both' || 
      (displayType === 'mobile' && item.type === 'mobileOnly') ||
      (displayType === 'web' && item.type === 'webOnly')
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-traces-gold-900/20">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href={user ? "/dashboard" : "/"} className="text-2xl font-bold text-traces-gold-300 tracking-wider">
          THE TRACES
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          {user ? (
            <>
              {getFilteredMenu('web').map((item) => (
                <Link
                  key={item.translationKey}
                  href={item.href}
                  className="text-traces-gold-100 hover:text-traces-gold-300 transition-colors font-light tracking-wide flex items-center gap-2"
                >
                  <item.icon size={18} />
                  {t(item.translationKey)}
                </Link>
              ))}
              <div className="flex items-center gap-4">
                <span className="text-traces-gold-200 text-sm">
                  {user.name || user.email}
                </span>
                <Button
                  onClick={handleLogout}
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut size={18} />
                  {t('logout')}
                </Button>
              </div>
            </>
          ) : (
            <>
              {publicMenuKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => document.getElementById(key)?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-traces-gold-100 hover:text-traces-gold-300 transition-colors cursor-pointer font-light tracking-wide"
                >
                  {t(key)}
                </button>
              ))}
              <Link href="/auth/signin">
                <Button variant="primary" size="sm">
                  {t('login')}
                </Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-traces-gold-300"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/95 border-t border-traces-gold-900/20">
          <nav className="container mx-auto px-6 py-4 flex flex-col gap-4">
            {user ? (
              <>
                {getFilteredMenu('mobile').map((item) => (
                  <Link
                    key={item.translationKey}
                    href={item.href}
                    className="text-traces-gold-100 hover:text-traces-gold-300 transition-colors font-light tracking-wide flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon size={18} />
                    {t(item.translationKey)}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="text-left text-traces-gold-100 hover:text-traces-gold-300 transition-colors font-light tracking-wide flex items-center gap-2"
                >
                  <LogOut size={18} />
                  {t('logout')}
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="text-traces-gold-100 hover:text-traces-gold-300 transition-colors font-light tracking-wide"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('login')}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}