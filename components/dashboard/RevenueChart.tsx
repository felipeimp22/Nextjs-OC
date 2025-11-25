'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { groupOrdersByDay } from '@/lib/utils/chartHelpers';
import { formatCurrencyValue } from '@/lib/utils/numberFormatter';

interface RevenueChartProps {
  orders: any[];
  dateFrom: Date;
  dateTo: Date;
  timezone: string;
  currencySymbol: string;
  primaryColor: string;
}

export default function RevenueChart({
  orders,
  dateFrom,
  dateTo,
  timezone,
  currencySymbol,
  primaryColor,
}: RevenueChartProps) {
  const t = useTranslations('dashboard.charts');

  const chartData = groupOrdersByDay(orders, dateFrom, dateTo, timezone);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-1">{payload[0].payload.label}</p>
          <p className="text-white font-bold">
            {formatCurrencyValue(payload[0].value, currencySymbol)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="elevated" padding="md">
      <h3 className="text-lg font-semibold text-white mb-4">{t('revenueTrends')}</h3>
      <div className="h-[300px] md:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatCurrencyValue(value, currencySymbol, 0)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={primaryColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
