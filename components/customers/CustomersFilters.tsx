'use client';

import { useTranslations } from 'next-intl';
import SearchFilter, { CustomFilter } from '@/components/shared/SearchFilter';

interface CustomersFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

export default function CustomersFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortByChange,
}: CustomersFiltersProps) {
  const t = useTranslations('customers');

  const sortOptions = [
    { value: 'totalSpent', label: t('sortOptions.totalSpent') },
    { value: 'orderCount', label: t('sortOptions.orderCount') },
    { value: 'lastOrderDate', label: t('sortOptions.lastOrderDate') },
    { value: 'name', label: t('sortOptions.name') },
  ];

  const filters: CustomFilter[] = [
    {
      id: 'sortBy',
      label: t('filters.sortBy'),
      placeholder: t('sortOptions.totalSpent'),
      options: sortOptions,
      value: sortBy,
      onChange: onSortByChange,
    },
  ];

  return (
    <div className="mb-6">
      <SearchFilter
        searchPlaceholder={t('searchPlaceholder')}
        onSearchChange={onSearchChange}
        filters={filters}
        debounceDelay={500}
      />
    </div>
  );
}
