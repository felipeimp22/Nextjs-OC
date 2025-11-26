'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardFilters, { TimePeriod, getDateRangeForPeriod } from '@/components/dashboard/DashboardFilters';
import DashboardKPICards from '@/components/dashboard/DashboardKPICards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import OrdersByTypeChart from '@/components/dashboard/OrdersByTypeChart';
import OrdersByStatusChart from '@/components/dashboard/OrdersByStatusChart';
import TopCustomersTable from '@/components/dashboard/TopCustomersTable';

export default function RestaurantDashboard() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('dashboard');
  const restaurantId = params.id as string;
  const { selectedRestaurantId, selectedRestaurantName, setSelectedRestaurant } = useRestaurantStore();

  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('last30days');
  const dateRange = getDateRangeForPeriod(selectedPeriod);

  const { data, isLoading, error } = useDashboardData(
    restaurantId,
    dateRange.from.toISOString(),
    dateRange.to.toISOString()
  );

  useEffect(() => {
    if (!selectedRestaurantId) {
      router.push('/setup');
    } else if (selectedRestaurantId !== restaurantId) {
      router.push(`/${selectedRestaurantId}/dashboard`);
    }
  }, [selectedRestaurantId, restaurantId, router]);

  if (!selectedRestaurantId || selectedRestaurantId !== restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
          <p className="ml-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">Failed to load dashboard data. Please try again.</p>
        </div>
      </div>
    );
  }

  const timezone = 'America/New_York';

  return (
    <div className="p-4 md:p-8">
      <DashboardFilters
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      <DashboardKPICards
        currentRevenue={data.currentPeriod.revenue}
        previousRevenue={data.previousPeriod.revenue}
        currentOrders={data.currentPeriod.orders}
        previousOrders={data.previousPeriod.orders}
        currentCustomers={data.currentPeriod.customers}
        previousCustomers={data.previousPeriod.customers}
        currencySymbol={data.restaurant.currencySymbol}
      />

      <div className="mb-6">
        <RevenueChart
          orders={data.currentPeriod.rawOrders}
          dateFrom={dateRange.from}
          dateTo={dateRange.to}
          timezone={timezone}
          currencySymbol={data.restaurant.currencySymbol}
          primaryColor={data.restaurant.primaryColor}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        <OrdersByTypeChart
          ordersByType={data.currentPeriod.ordersByType}
          currencySymbol={data.restaurant.currencySymbol}
          primaryColor={data.restaurant.primaryColor}
          secondaryColor={data.restaurant.secondaryColor}
          accentColor={data.restaurant.accentColor}
        />

        <OrdersByStatusChart
          ordersByStatus={data.currentPeriod.ordersByStatus}
          primaryColor={data.restaurant.primaryColor}
        />
      </div>

      <TopCustomersTable
        customers={data.currentPeriod.topCustomers}
        currencySymbol={data.restaurant.currencySymbol}
      />
    </div>
  );
}
