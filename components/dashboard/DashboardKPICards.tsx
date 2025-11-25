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
    <Card variant="elevated" padding="md" className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        <p className="text-2xl md:text-3xl font-bold text-white mb-2">{value}</p>
        {change && (
          <div className="flex items-center gap-1">
            {change.isPositive ? (
              <ArrowUp className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${change.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {formatPercentage(change.value, 1)}
            </span>
            <span className="text-sm text-gray-400 ml-1">{t('vsPrevious')}</span>
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
      icon: <DollarSign className="w-6 h-6 text-white" />,
      iconColor: 'bg-green-500/20',
    },
    {
      title: t('totalOrders'),
      value: currentOrders.totalOrders.toString(),
      change: ordersChange,
      icon: <ShoppingCart className="w-6 h-6 text-white" />,
      iconColor: 'bg-blue-500/20',
    },
    {
      title: t('avgOrderValue'),
      value: formatCurrencyValue(currentRevenue.averageOrderValue, currencySymbol),
      change: aovChange,
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      iconColor: 'bg-purple-500/20',
    },
    {
      title: t('newCustomers'),
      value: currentCustomers.newCustomers.toString(),
      change: newCustomersChange,
      icon: <Users className="w-6 h-6 text-white" />,
      iconColor: 'bg-orange-500/20',
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
