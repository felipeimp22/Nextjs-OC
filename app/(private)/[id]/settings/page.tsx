'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import Tabs from '@/components/shared/Tabs';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { FinancialSettings } from '@/components/settings/FinancialSettings';
import { DeliverySettings } from '@/components/settings/DeliverySettings';
import { StoreHoursSettings } from '@/components/settings/StoreHoursSettings';
import { UsersSettings } from '@/components/settings/UsersSettings';

type Tab = 'general' | 'financial' | 'delivery' | 'hours' | 'users';

export default function SettingsPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id as string;
  const { selectedRestaurantId } = useRestaurantStore();
  const t = useTranslations('settings');
  const [activeTab, setActiveTab] = useState<Tab>('general');

  useEffect(() => {
    if (!selectedRestaurantId) {
      router.push('/setup');
    } else if (selectedRestaurantId !== restaurantId) {
      router.push(`/${selectedRestaurantId}/settings`);
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
    { id: 'general', label: t('tabs.general') },
    { id: 'financial', label: t('tabs.financial') },
    { id: 'delivery', label: t('tabs.delivery') },
    { id: 'hours', label: t('tabs.hours') },
    { id: 'users', label: t('tabs.users') },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as Tab)}
        className="mb-4 md:mb-6"
      />

      <div className="bg-brand-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full">
        {activeTab === 'general' && <GeneralSettings restaurantId={restaurantId} />}
        {activeTab === 'financial' && <FinancialSettings restaurantId={restaurantId} />}
        {activeTab === 'delivery' && <DeliverySettings restaurantId={restaurantId} />}
        {activeTab === 'hours' && <StoreHoursSettings restaurantId={restaurantId} />}
        {activeTab === 'users' && <UsersSettings restaurantId={restaurantId} />}
      </div>
    </div>
  );
}
