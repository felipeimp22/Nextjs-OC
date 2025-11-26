'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { ArrowUp, ArrowDown, TrendingUp, ShoppingCart, Users, DollarSign } from 'lucide-react';
import { formatCurrencyValue, formatPercentage, calculatePercentageChange } from '@/lib/utils/numberFormatter';
import { RevenueMetrics, OrderMetrics, CustomerMetrics } from '@/lib/utils/analyticsCalculator';

interface DashboardKPICardsProps {
  currentRevenue: RevenueMetrics;
  previousRevenue: RevenueMetrics;
  currentOrders: OrderMetrics;
  previousOrders: OrderMetrics;
  currentCustomers: CustomerMetrics;
  previousCustomers: CustomerMetrics;
  currencySymbol: string;
}

interface KPICardProps {
  title: string;
  value: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  iconColor: string;
}

function KPICard({ title, value, change, icon, iconColor }: KPICardProps) {
  const t = useTranslations('dashboard.kpis');

  return (
    <Card variant="elevated" padding="md" className="flex flex-col h-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-xl ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{value}</p>
        {change && (
          <div className="flex items-center gap-1.5 mt-auto">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
              change.isPositive ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {change.isPositive ? (
                <ArrowUp className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-red-600" />
              )}
              <span className={`text-sm font-semibold ${change.isPositive ? 'text-green-700' : 'text-red-700'}`}>
                {formatPercentage(change.value, 1)}
              </span>
            </div>
            <span className="text-xs text-gray-500">{t('vsPrevious')}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function DashboardKPICards({
  currentRevenue,
  previousRevenue,
  currentOrders,
  previousOrders,
  currentCustomers,
  previousCustomers,
  currencySymbol,
}: DashboardKPICardsProps) {
  const t = useTranslations('dashboard.kpis');

  const revenueChange = calculatePercentageChange(
    currentRevenue.totalRevenue,
    previousRevenue.totalRevenue
  );

  const ordersChange = calculatePercentageChange(
    currentOrders.totalOrders,
    previousOrders.totalOrders
  );

  const newCustomersChange = calculatePercentageChange(
    currentCustomers.newCustomers,
    previousCustomers.newCustomers
  );

  const aovChange = calculatePercentageChange(
    currentRevenue.averageOrderValue,
    previousRevenue.averageOrderValue
  );

  const kpis = [
    {
      title: t('totalRevenue'),
      value: formatCurrencyValue(currentRevenue.totalRevenue, currencySymbol),
      change: revenueChange,
      icon: <DollarSign className="w-6 h-6 text-emerald-600" />,
      iconColor: 'bg-emerald-50',
    },
    {
      title: t('totalOrders'),
      value: currentOrders.totalOrders.toString(),
      change: ordersChange,
      icon: <ShoppingCart className="w-6 h-6 text-blue-600" />,
      iconColor: 'bg-blue-50',
    },
    {
      title: t('avgOrderValue'),
      value: formatCurrencyValue(currentRevenue.averageOrderValue, currencySymbol),
      change: aovChange,
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      iconColor: 'bg-purple-50',
    },
    {
      title: t('newCustomers'),
      value: currentCustomers.newCustomers.toString(),
      change: newCustomersChange,
      icon: <Users className="w-6 h-6 text-orange-600" />,
      iconColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  );
}
