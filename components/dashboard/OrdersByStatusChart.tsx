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
  pending: '#f59e0b', // Orange
  confirmed: '#3b82f6', // Blue
  preparing: '#8b5cf6', // Purple
  ready: '#10b981', // Emerald
  out_for_delivery: '#06b6d4', // Cyan
  outForDelivery: '#06b6d4', // Cyan (alternative key)
  delivered: '#22c55e', // Green
  completed: '#10b981', // Emerald
  cancelled: '#ef4444', // Red
};

export default function OrdersByStatusChart({
  ordersByStatus,
  primaryColor,
}: OrdersByStatusChartProps) {
  const t = useTranslations('dashboard.charts');
  const statusT = useTranslations('orders.statusOptions');

  // Define all possible statuses to show (even if count is 0)
  const allStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled'];

  const chartData = allStatuses.map((status) => {
    const count = ordersByStatus[status] || 0;

    let translationKey = status;
    if (status === 'out_for_delivery') translationKey = 'outForDelivery';
    else if (status === 'dine_in') translationKey = 'dineIn';

    const statusKey = status.replace(/_/g, '');
    const capitalizedStatus = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);

    return {
      name: statusT(translationKey as any) || capitalizedStatus,
      value: count,
      status,
    };
  }).filter(item => item.value > 0); // Only show statuses with orders

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-gray-900 font-semibold mb-1">{payload[0].name}</p>
          <p className="text-gray-600 text-sm">
            Orders: <span className="text-gray-900 font-medium">{payload[0].value}</span>
          </p>
          <p className="text-gray-600 text-sm">
            Percentage: <span className="text-gray-900 font-medium">{percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const totalOrders = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card variant="elevated" padding="md" className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('ordersByStatus')}</h3>
      {chartData.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center">
          <p className="text-gray-400 text-sm">No orders yet</p>
        </div>
      ) : (
        <div className="h-[320px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={60}
                outerRadius={90}
                fill={primaryColor}
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[entry.status] || STATUS_COLORS[entry.status.replace('_', '')] || '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: '#6b7280' }}
                iconType="circle"
                layout="vertical"
                align="right"
                verticalAlign="middle"
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
          </div>
        </div>
      )}
    </Card>
  );
}
