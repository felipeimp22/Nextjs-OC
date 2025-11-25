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

  const colors = [primaryColor, secondaryColor, accentColor];

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
    <Card variant="elevated" padding="md" className="bg-white border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('charts.ordersByType')}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatCurrencyValue(value, currencySymbol, 0)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
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
