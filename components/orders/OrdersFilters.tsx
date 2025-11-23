'use client';

import { useTranslations } from 'next-intl';
import { useIsMobile } from '@/hooks/use-mobile';
import SearchFilter, { CustomFilter } from '@/components/shared/SearchFilter';
import { Input } from '@/components/ui/Input';

interface OrdersFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterOrderType: string;
  onFilterOrderTypeChange: (value: string) => void;
  filterPaymentStatus: string;
  onFilterPaymentStatusChange: (value: string) => void;
  filterDateRange: string;
  onFilterDateRangeChange: (value: string) => void;
  customDateFrom: string;
  onCustomDateFromChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customDateTo: string;
  onCustomDateToChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearCustomDates: () => void;
}

export default function OrdersFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterOrderType,
  onFilterOrderTypeChange,
  filterPaymentStatus,
  onFilterPaymentStatusChange,
  filterDateRange,
  onFilterDateRangeChange,
  customDateFrom,
  onCustomDateFromChange,
  customDateTo,
  onCustomDateToChange,
  onClearCustomDates,
}: OrdersFiltersProps) {
  const t = useTranslations('orders');
  const isMobile = useIsMobile();

  const statusOptions = [
    { value: 'pending', label: t('statusOptions.pending') },
    { value: 'confirmed', label: t('statusOptions.confirmed') },
    { value: 'preparing', label: t('statusOptions.preparing') },
    { value: 'ready', label: t('statusOptions.ready') },
    { value: 'out_for_delivery', label: t('statusOptions.outForDelivery') },
    { value: 'delivered', label: t('statusOptions.delivered') },
    { value: 'completed', label: t('statusOptions.completed') },
    { value: 'cancelled', label: t('statusOptions.cancelled') },
  ];

  const orderTypeOptions = [
    { value: 'pickup', label: t('typeOptions.pickup') },
    { value: 'delivery', label: t('typeOptions.delivery') },
    { value: 'dine_in', label: t('typeOptions.dineIn') },
  ];

  const paymentStatusOptions = [
    { value: 'pending', label: t('paymentStatusOptions.pending') },
    { value: 'paid', label: t('paymentStatusOptions.paid') },
    { value: 'failed', label: t('paymentStatusOptions.failed') },
    { value: 'refunded', label: t('paymentStatusOptions.refunded') },
    { value: 'partially_refunded', label: t('paymentStatusOptions.partiallyRefunded') },
  ];

  const dateRangeOptions = [
    { value: 'today', label: t('dateRangeOptions.today') },
    { value: 'last7days', label: t('dateRangeOptions.last7days') },
    { value: 'last30days', label: t('dateRangeOptions.last30days') },
    { value: 'thisMonth', label: t('dateRangeOptions.thisMonth') },
  ];

  const filters: CustomFilter[] = [
    {
      id: 'status',
      label: t('filters.status'),
      placeholder: t('filters.allStatuses'),
      options: statusOptions,
      value: filterStatus,
      onChange: onFilterStatusChange,
    },
    {
      id: 'orderType',
      label: t('filters.orderType'),
      placeholder: t('filters.allTypes'),
      options: orderTypeOptions,
      value: filterOrderType,
      onChange: onFilterOrderTypeChange,
    },
    {
      id: 'paymentStatus',
      label: t('filters.paymentStatus'),
      placeholder: t('filters.allPaymentStatuses'),
      options: paymentStatusOptions,
      value: filterPaymentStatus,
      onChange: onFilterPaymentStatusChange,
    },
    {
      id: 'dateRange',
      label: t('filters.quickDateFilter'),
      placeholder: t('filters.selectQuickFilter'),
      options: dateRangeOptions,
      value: filterDateRange,
      onChange: onFilterDateRangeChange,
    },
  ];

  return (
    <div className="mb-6 space-y-4">
      <SearchFilter
        searchPlaceholder={t('searchPlaceholder')}
        onSearchChange={onSearchChange}
        filters={filters}
        debounceDelay={500}
      />

      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-gray-700">{t('customDateRange.title')}</h3>
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3`}>
            <div className="flex-1">
              <label htmlFor="dateFrom" className="block text-xs text-gray-600 mb-1.5">
                {t('customDateRange.fromDate')}
              </label>
              <Input
                id="dateFrom"
                type="date"
                value={customDateFrom}
                onChange={onCustomDateFromChange}
                max={customDateTo || undefined}
                placeholder={t('customDateRange.selectStartDate')}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="dateTo" className="block text-xs text-gray-600 mb-1.5">
                {t('customDateRange.toDate')}
              </label>
              <Input
                id="dateTo"
                type="date"
                value={customDateTo}
                onChange={onCustomDateToChange}
                min={customDateFrom || undefined}
                placeholder={t('customDateRange.selectEndDate')}
              />
            </div>
          </div>
          {(customDateFrom || customDateTo) && (
            <button
              onClick={onClearCustomDates}
              className="text-xs text-brand-navy hover:text-brand-red transition-colors self-start"
            >
              {t('customDateRange.clearDates')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
