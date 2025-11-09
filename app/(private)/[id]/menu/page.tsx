'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import { useTranslations } from 'next-intl';
import Tabs from '@/components/shared/Tabs';
import MenuCategoriesList from '@/components/menu/MenuCategoriesList';
import MenuItemsList from '@/components/menu/MenuItemsList';
import OptionCategoriesList from '@/components/menu/OptionCategoriesList';
import OptionsList from '@/components/menu/OptionsList';

type Tab = 'categories' | 'items' | 'modifierCategories' | 'modifiers';

export default function MenuManagementPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id as string;
  const { selectedRestaurantId } = useRestaurantStore();
  const t = useTranslations('menu');
  const [activeTab, setActiveTab] = useState<Tab>('categories');

  useEffect(() => {
    if (!selectedRestaurantId) {
      router.push('/setup');
    } else if (selectedRestaurantId !== restaurantId) {
      router.push(`/${selectedRestaurantId}/menu`);
    }
  }, [selectedRestaurantId, restaurantId, router]);

  if (!selectedRestaurantId || selectedRestaurantId !== restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'categories', label: t('tabs.categories') },
    { id: 'items', label: t('tabs.items') },
    { id: 'modifierCategories', label: t('tabs.modifierCategories') },
    { id: 'modifiers', label: t('tabs.modifiers') },
  ];

  return (
    <div className="w-full md:max-w-7xl md:mx-auto">
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as Tab)}
        className="mb-4 md:mb-6"
      />

      <div className="mt-4 md:mt-6">
        {activeTab === 'categories' && <MenuCategoriesList restaurantId={restaurantId} />}
        {activeTab === 'items' && <MenuItemsList restaurantId={restaurantId} />}
        {activeTab === 'modifierCategories' && <OptionCategoriesList restaurantId={restaurantId} />}
        {activeTab === 'modifiers' && <OptionsList restaurantId={restaurantId} />}
      </div>
    </div>
  );
}
