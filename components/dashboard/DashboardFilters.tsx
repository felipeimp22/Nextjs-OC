'use client';

import { useTranslations } from 'next-intl';
import Tabs from '@/components/shared/Tabs';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';

export type TimePeriod = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear';

interface DashboardFiltersProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

export function getDateRangeForPeriod(period: TimePeriod): { from: Date; to: Date } {
  const now = new Date();

  switch (period) {
    case 'today':
      return {
        from: startOfDay(now),
        to: endOfDay(now),
      };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday),
      };
    case 'last7days':
      return {
        from: startOfDay(subDays(now, 6)),
        to: endOfDay(now),
      };
    case 'last30days':
      return {
        from: startOfDay(subDays(now, 29)),
        to: endOfDay(now),
      };
    case 'thisMonth':
      return {
        from: startOfMonth(now),
        to: endOfDay(now),
      };
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    case 'thisYear':
      return {
        from: startOfYear(now),
        to: endOfDay(now),
      };
    default:
      return {
        from: startOfDay(subDays(now, 6)),
        to: endOfDay(now),
      };
  }
}

export default function DashboardFilters({ selectedPeriod, onPeriodChange }: DashboardFiltersProps) {
  const t = useTranslations('dashboard.filters');

  const tabs = [
    { id: 'today', label: t('today') },
    { id: 'yesterday', label: t('yesterday') },
    { id: 'last7days', label: t('last7days') },
    { id: 'last30days', label: t('last30days') },
    { id: 'thisMonth', label: t('thisMonth') },
    { id: 'lastMonth', label: t('lastMonth') },
    { id: 'thisYear', label: t('thisYear') },
  ];

  return (
    <div className="mb-6">
      <Tabs
        tabs={tabs}
        activeTab={selectedPeriod}
        onTabChange={(tabId) => onPeriodChange(tabId as TimePeriod)}
      />
    </div>
  );
}
