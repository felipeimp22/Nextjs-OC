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
    { id: 'general', href: `/private/${restaurantId}/settings`, label: t('tabs.general') },
    { id: 'financial', href: `/private/${restaurantId}/settings/financial`, label: t('tabs.financial') },
    { id: 'delivery', href: `/private/${restaurantId}/settings/delivery`, label: t('tabs.delivery') },
    { id: 'hours', href: `/private/${restaurantId}/settings/hours`, label: t('tabs.hours') },
    { id: 'users', href: `/private/${restaurantId}/settings/users`, label: t('tabs.users') },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-traces-gold-100 mb-2">
          {t('title')}
        </h1>
        <p className="text-traces-dark-300">
          {t('description')}
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-traces-gold-900/30 mb-6 overflow-x-auto">
        <nav className="flex gap-2 min-w-max">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href ||
                            (tab.id === 'general' && pathname === `/private/${restaurantId}/settings`);

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`
                  px-4 py-3 font-light tracking-wider text-sm whitespace-nowrap
                  border-b-2 transition-colors
                  ${isActive
                    ? 'border-traces-gold-600 text-traces-gold-100'
                    : 'border-transparent text-traces-dark-300 hover:text-traces-gold-100 hover:border-traces-gold-900/50'
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
      <div className="bg-black/40 border border-traces-gold-900/30 rounded-sm">
        {children}
      </div>
    </div>
  );
}
