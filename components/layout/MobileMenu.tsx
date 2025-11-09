'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Home,
  Utensils,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  BarChart3,
  Megaphone,
  ChefHat,
  User,
  Plus,
  X,
  ChevronDown,
} from 'lucide-react';
import { useSignOut, useCurrentUser } from '@/hooks/useAuth';
import { useUserRestaurants } from '@/hooks/useRestaurants';
import { Avatar, Toggle } from '@/components/ui';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const t = useTranslations('sidebar');
  const tHeader = useTranslations('header');
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  const { data: user } = useCurrentUser();
  const { data: restaurants = [] } = useUserRestaurants();
  const signOutMutation = useSignOut();

  const [isPauseOrderingActive, setIsPauseOrderingActive] = useState(false);
  const [restaurantMenuOpen, setRestaurantMenuOpen] = useState(false);

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

  const handleLogout = () => {
    signOutMutation.mutate();
    onClose();
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-brand-navy">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center">
            <div className="flex items-center bg-white rounded-lg p-2">
              <img
                src="/images/iconLogo.png"
                alt="OrderChop Icon"
                className="w-8 h-8"
              />
            </div>
            <span className="text-slate-50 text-lg font-bold ml-2">OrderChop</span>
          </div>
          <button
            onClick={onClose}
            className="text-white p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="py-3 px-4 flex items-center justify-between border-b border-white/10">
          <span className="text-sm text-white">{t('pauseOrdering')}</span>
          <Toggle
            id="pause-ordering-mobile"
            checked={isPauseOrderingActive}
            onChange={setIsPauseOrderingActive}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {restaurants.length > 0 && (
            <div className="p-4 border-b border-white/10">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-white/10 rounded-lg text-white"
                onClick={() => setRestaurantMenuOpen(!restaurantMenuOpen)}
              >
                <span className="text-sm font-medium">
                  {restaurants[0]?.name || tHeader('selectRestaurant')}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${restaurantMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {restaurantMenuOpen && (
                <div className="mt-2 bg-white/5 rounded-lg overflow-hidden">
                  {restaurants.map((restaurant: any) => (
                    <button
                      key={restaurant.id}
                      onClick={() => {
                        handleNavigation(`/${restaurant.id}/dashboard`);
                        setRestaurantMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors"
                    >
                      <div className="flex flex-col">
                        <div className="font-medium text-white">{restaurant.name}</div>
                        <div className="text-xs text-white/60 capitalize">{restaurant.role}</div>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      handleNavigation('/setup');
                      setRestaurantMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-t border-white/10"
                  >
                    <div className="flex items-center text-brand-red font-medium">
                      <Plus className="mr-2 w-4 h-4" />
                      {tHeader('createNewRestaurant')}
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          <nav className="py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center px-6 py-4 transition-colors ${
                    isActive
                      ? 'text-brand-red font-semibold bg-white/5'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="px-6 py-4 border-t border-white/10">
            <button
              onClick={() => handleNavigation('/profile')}
              className="w-full flex items-center text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-colors"
            >
              <User className="w-5 h-5 mr-3" />
              <span>{tHeader('profile')}</span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <Avatar
                src={user?.image}
                alt={user?.name || 'User'}
                fallback={userInitial}
                size="md"
              />
              <div className="ml-3">
                <h3 className="font-medium text-sm text-white">{user?.name}</h3>
                <p className="text-xs text-white/60 truncate">{user?.email || ''}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={signOutMutation.isPending}
            className="w-full flex items-center justify-center text-white/70 hover:text-white text-sm transition-colors bg-white/10 hover:bg-white/20 py-3 rounded-lg"
          >
            <LogOut className="w-5 h-5 mr-2" />
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
