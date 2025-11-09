'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Home,
  Utensils,
  ShoppingCart,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BarChart3,
  Megaphone,
  ChefHat,
  Shield
} from 'lucide-react';
import { useSignOut, useCurrentUser } from '@/hooks/useAuth';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import { Toggle } from '@/components/ui';

interface PrivateSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function PrivateSidebar({ isCollapsed, setIsCollapsed }: PrivateSidebarProps) {
  const t = useTranslations('sidebar');
  const pathname = usePathname();
  const params = useParams();
  const restaurantId = params.id as string;
  const { data: user } = useCurrentUser();
  const { selectedRestaurantName } = useRestaurantStore();
  const signOutMutation = useSignOut();

  const [isPauseOrderingActive, setIsPauseOrderingActive] = useState(false);

  const menuItems = [
    { icon: Home, label: t('dashboard'), path: `/${restaurantId}/dashboard`, roles: ['owner', 'manager', 'kitchen', 'staff'] },
    { icon: Utensils, label: t('menuManagement'), path: `/${restaurantId}/menu`, roles: ['owner', 'manager'] },
    { icon: ShoppingCart, label: t('orders'), path: `/${restaurantId}/orders`, roles: ['owner', 'manager', 'kitchen', 'staff'] },
    { icon: ChefHat, label: t('kitchen'), path: `/${restaurantId}/kitchen`, roles: ['owner', 'manager', 'kitchen'] },
    { icon: Users, label: t('customers'), path: `/${restaurantId}/customers`, roles: ['owner', 'manager', 'staff'] },
    { icon: Megaphone, label: t('marketing'), path: `/${restaurantId}/marketing`, roles: ['owner', 'manager'] },
    { icon: BarChart3, label: t('analytics'), path: `/${restaurantId}/analytics`, roles: ['owner', 'manager'] },
    { icon: Settings, label: t('settings'), path: `/${restaurantId}/settings`, roles: ['owner', 'manager'] },
  ];

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const handleLogout = () => {
    signOutMutation.mutate();
  };

  const filteredMenuItems = menuItems;

  return (
    <aside
      className={`hidden md:flex fixed left-0 top-0 h-screen bg-brand-navy text-white transition-all duration-300 z-40 flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className={`flex items-center p-4 flex-shrink-0 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="flex items-center bg-white rounded-lg p-2">
          <img
            src="/images/iconLogo.png"
            alt="OrderChop Icon"
            className="w-8 h-8"
          />
        </div>
        {!isCollapsed && (
          <span className="text-slate-50 text-lg font-bold ml-2">OrderChop</span>
        )}
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 bg-white rounded-full p-1.5 shadow-lg text-brand-navy hover:shadow-xl transition-shadow"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`py-3 flex items-center justify-between border-b border-white/10 ${
        isCollapsed ? 'px-2' : 'px-5'
      }`}>
        {!isCollapsed && <span className="text-sm">{t('pauseOrdering')}</span>}
        <div className={isCollapsed ? 'mx-auto' : ''}>
          <Toggle
            id="pause-ordering"
            checked={isPauseOrderingActive}
            onChange={setIsPauseOrderingActive}
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center py-3 transition-colors duration-200 ${
                isCollapsed ? 'px-0 justify-center' : 'px-5'
              } ${
                isActive
                  ? 'text-brand-red font-semibold bg-white/5'
                  : 'text-white hover:bg-white/10'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className={`w-5 h-5 ${!isCollapsed && 'mr-3'}`} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`p-5 border-t border-white/10 flex-shrink-0 ${isCollapsed ? 'px-2' : ''}`}>
        {!isCollapsed && (
          <>
            <p className="text-xs text-white/60 mb-2">{t('account')}</p>
            <div className="mb-4">
              <h3 className="font-medium text-sm">{selectedRestaurantName || 'Restaurant'}</h3>
              <p className="text-xs text-white/60 truncate">{user?.email || ''}</p>
            </div>
          </>
        )}
        <button
          onClick={handleLogout}
          disabled={signOutMutation.isPending}
          className={`flex items-center text-white/70 hover:text-white text-sm transition-colors ${
            isCollapsed ? 'justify-center w-full' : ''
          }`}
          title={isCollapsed ? t('logout') : ''}
        >
          <LogOut className={`w-5 h-5 ${!isCollapsed && 'mr-2'}`} />
          {!isCollapsed && t('logout')}
        </button>
      </div>
    </aside>
  );
}