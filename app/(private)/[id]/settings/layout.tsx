'use client';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const t = useTranslations('settings');

  const restaurantId = params.id as string;

  const tabs = [
    { id: 'general', href: `/${restaurantId}/settings`, label: t('tabs.general') },
    { id: 'financial', href: `/${restaurantId}/settings/financial`, label: t('tabs.financial') },
    { id: 'delivery', href: `/${restaurantId}/settings/delivery`, label: t('tabs.delivery') },
    { id: 'hours', href: `/${restaurantId}/settings/hours`, label: t('tabs.hours') },
    { id: 'users', href: `/${restaurantId}/settings/users`, label: t('tabs.users') },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 -mx-6 px-6 mb-6">
        <nav className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href ||
                            (tab.id === 'general' && pathname === `/${restaurantId}/settings`);

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`
                  px-4 py-3 font-medium text-sm whitespace-nowrap
                  border-b-2 transition-colors
                  ${isActive
                    ? 'border-brand-red text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {children}
      </div>
    </div>
  );
}
