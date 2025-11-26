'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrencyValue } from '@/lib/utils/numberFormatter';
import { OrdersByType } from '@/lib/utils/analyticsCalculator';

interface OrdersByTypeChartProps {
  ordersByType: OrdersByType;
  currencySymbol: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export default function OrdersByTypeChart({
  ordersByType,
  currencySymbol,
  primaryColor,
  secondaryColor,
  accentColor,
}: OrdersByTypeChartProps) {
  const t = useTranslations('dashboard');

  const chartData = [
    {
      name: t('orderTypes.pickup'),
      orders: ordersByType.pickup.count,
      revenue: ordersByType.pickup.revenue,
    },
    {
      name: t('orderTypes.delivery'),
      orders: ordersByType.delivery.count,
      revenue: ordersByType.delivery.revenue,
    },
    {
      name: t('orderTypes.dineIn'),
      orders: ordersByType.dineIn.count,
      revenue: ordersByType.dineIn.revenue,
    },
  ];

  // Professional color palette - vibrant and visible
  const colors = ['#3b82f6', '#10b981', '#f59e0b'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-gray-900 font-semibold mb-2">{payload[0].payload.name}</p>
          <p className="text-gray-600 text-sm">
            Orders: <span className="text-gray-900 font-medium">{payload[0].payload.orders}</span>
          </p>
          <p className="text-gray-600 text-sm">
            Revenue: <span className="text-gray-900 font-medium">
              {formatCurrencyValue(payload[0].value, currencySymbol)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="elevated" padding="md" className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('charts.ordersByType')}</h3>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatCurrencyValue(value, currencySymbol, 0)}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
            <Bar dataKey="revenue" radius={[8, 8, 0, 0]} maxBarSize={60}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
