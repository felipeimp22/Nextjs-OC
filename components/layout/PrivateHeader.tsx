'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown, User, LogOut, Plus, Menu } from 'lucide-react';
import { useSignOut, useCurrentUser } from '@/hooks/useAuth';
import { useUserRestaurants } from '@/hooks/useRestaurants';
import { Avatar, DropdownMenu, DropdownMenuItem, DropdownMenuHeader, DropdownMenuSeparator } from '@/components/ui';
import { useIsMobile } from '@/hooks/use-mobile';

interface PrivateHeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export default function PrivateHeader({ title, subtitle, onMenuClick }: PrivateHeaderProps) {
  const t = useTranslations('header');
  const tSettings = useTranslations('settings');
  const tMenu = useTranslations('menu');
  const tOrders = useTranslations('orders');
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { data: user } = useCurrentUser();
  const { data: restaurants = [] } = useUserRestaurants();
  const signOutMutation = useSignOut();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [restaurantMenuOpen, setRestaurantMenuOpen] = useState(false);

  const handleLogout = () => {
    signOutMutation.mutate();
  };

  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';

  // Determine page title and subtitle based on pathname (if not provided as props)
  const getPageInfo = () => {
    if (pathname?.includes('/menu')) {
      return {
        title: tMenu('title'),
        subtitle: tMenu('description'),
      };
    }
    if (pathname?.includes('/orders')) {
      return {
        title: tOrders('title'),
        subtitle: tOrders('description'),
      };
    }
    if (pathname?.includes('/settings')) {
      return {
        title: t('settings'),
        subtitle: tSettings('description'),
      };
    }
    return {
      title: t('dashboard'),
      subtitle: undefined,
    };
  };

  const pageInfo = getPageInfo();
  const displayTitle = title || pageInfo.title;
  const displaySubtitle = subtitle || pageInfo.subtitle;

  return (
    <header className="bg-white shadow-sm min-h-16 flex items-center justify-between px-4 md:px-6 py-4 w-full">
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="text-brand-navy p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-brand-navy truncate">
            {displayTitle}
          </h1>
          {displaySubtitle && (
            <p className="text-gray-600 mt-1 text-xs md:text-sm truncate">
              {displaySubtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-6 flex-shrink-0">
        {!isMobile && restaurants.length > 0 && (
          <div className="relative">
            <button
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => setRestaurantMenuOpen(!restaurantMenuOpen)}
            >
              <span className="text-sm font-medium max-w-[150px] truncate">
                {restaurants[0]?.name || t('selectRestaurant')}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
            
            <DropdownMenu 
              isOpen={restaurantMenuOpen} 
              onClose={() => setRestaurantMenuOpen(false)}
              className="w-64"
            >
              <div className="py-1">
                {restaurants.map((restaurant: any) => (
                  <DropdownMenuItem
                    key={restaurant.id}
                    onClick={() => {
                      setRestaurantMenuOpen(false);
                      router.push(`/${restaurant.id}/dashboard`);
                    }}
                  >
                    <div className="flex flex-col items-start">
                      <div className="font-medium">{restaurant.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{restaurant.role}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              
              <DropdownMenuSeparator />
              
              <div className="py-1">
                <DropdownMenuItem
                  onClick={() => {
                    setRestaurantMenuOpen(false);
                    router.push('/setup');
                  }}
                  className="text-brand-navy font-medium"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  {t('createNewRestaurant')}
                </DropdownMenuItem>
              </div>
            </DropdownMenu>
          </div>
        )}

        {!isMobile && (
          <div className="relative">
            <button
              className="flex items-center space-x-2"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <Avatar
                src={user?.image}
                alt={user?.name || 'User'}
                fallback={userInitial}
                size="md"
              />
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>
          
          <DropdownMenu 
            isOpen={profileMenuOpen} 
            onClose={() => setProfileMenuOpen(false)}
            className="w-56"
          >
            <DropdownMenuHeader>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </DropdownMenuHeader>
            
            <div className="py-1">
              <DropdownMenuItem
                onClick={() => {
                  setProfileMenuOpen(false);
                  router.push('/profile');
                }}
              >
                <User className="mr-2 w-4 h-4 text-gray-500" />
                {t('profile')}
              </DropdownMenuItem>
            </div>
            
            <DropdownMenuSeparator />
            
            <div className="py-1">
              <DropdownMenuItem
                onClick={handleLogout}
              >
                <LogOut className="mr-2 w-4 h-4 text-gray-500" />
                {t('logout')}
              </DropdownMenuItem>
            </div>
          </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}