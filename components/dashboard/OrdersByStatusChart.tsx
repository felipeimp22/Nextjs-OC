'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { OrdersByStatus } from '@/lib/utils/analyticsCalculator';

interface OrdersByStatusChartProps {
  ordersByStatus: OrdersByStatus;
  primaryColor: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  ready: '#10b981',
  out_for_delivery: '#06b6d4',
  delivered: '#22c55e',
  completed: '#10b981',
  cancelled: '#ef4444',
};

export default function OrdersByStatusChart({
  ordersByStatus,
  primaryColor,
}: OrdersByStatusChartProps) {
  const t = useTranslations('dashboard.charts');
  const statusT = useTranslations('orders.statusOptions');

  const chartData = Object.entries(ordersByStatus).map(([status, count]) => {
    const statusKey = status.replace(/_/g, '');
    const capitalizedStatus = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);

    let translationKey = status;
    if (status === 'out_for_delivery') translationKey = 'outForDelivery';
    else if (status === 'dine_in') translationKey = 'dineIn';

    return {
      name: statusT(translationKey as any) || capitalizedStatus,
      value: count,
      status,
    };
  }).filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-1">{payload[0].name}</p>
          <p className="text-gray-300 text-sm">
            Orders: <span className="text-white font-medium">{payload[0].value}</span>
          </p>
          <p className="text-gray-300 text-sm">
            Percentage: <span className="text-white font-medium">{percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="elevated" padding="md">
      <h3 className="text-lg font-semibold text-white mb-4">{t('ordersByStatus')}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill={primaryColor}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STATUS_COLORS[entry.status] || primaryColor}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
