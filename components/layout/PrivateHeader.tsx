'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown, User, LogOut, Plus } from 'lucide-react';
import { useSignOut, useCurrentUser } from '@/hooks/useAuth';
import { useUserRestaurants } from '@/hooks/useRestaurants';
import { Avatar, DropdownMenu, DropdownMenuItem, DropdownMenuHeader, DropdownMenuSeparator } from '@/components/ui';

export default function PrivateHeader() {
  const t = useTranslations('header');
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { data: restaurants = [] } = useUserRestaurants();
  const signOutMutation = useSignOut();
  
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [restaurantMenuOpen, setRestaurantMenuOpen] = useState(false);

  const handleLogout = () => {
    signOutMutation.mutate();
  };

  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-brand-navy">
        {t('dashboard')}
      </h1>
      
      <div className="flex items-center space-x-6">
        {restaurants.length > 0 && (
          <div className="relative">
            <button
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => setRestaurantMenuOpen(!restaurantMenuOpen)}
            >
              <span className="text-sm font-medium">
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
                      router.push(`/dashboard/${restaurant.id}`);
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
      </div>
    </header>
  );
}