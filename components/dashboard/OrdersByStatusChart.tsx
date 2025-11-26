'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { OrdersByStatus } from '@/lib/utils/analyticsCalculator';

interface OrdersByStatusChartProps {
  ordersByStatus: OrdersByStatus;
  primaryColor: string;
}

// Align colors with kitchen stages (DEFAULT_STAGES in kitchen.actions.ts)
const STATUS_COLORS: Record<string, string> = {
  pending: '#EAB308', // Yellow
  confirmed: '#3B82F6', // Blue
  preparing: '#8B5CF6', // Purple
  ready: '#10B981', // Emerald
  out_for_delivery: '#F59E0B', // Orange
  outForDelivery: '#F59E0B', // Orange (alternative key)
  delivered: '#059669', // Dark Green
  completed: '#22C55E', // Green
};

export default function OrdersByStatusChart({
  ordersByStatus,
  primaryColor,
}: OrdersByStatusChartProps) {
  const t = useTranslations('dashboard.charts');
  const statusT = useTranslations('orders.statusOptions');

  // Use the same statuses as the kitchen stages (aligned with DEFAULT_STAGES in kitchen.actions.ts)
  const allStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed'];

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
  });

  // Filter for pie chart display (only non-zero values)
  const displayData = chartData.filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = displayData.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : '0.0';
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
      {displayData.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center">
          <p className="text-gray-400 text-sm">No orders yet</p>
        </div>
      ) : (
        <div className="h-[320px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={60}
                outerRadius={90}
                fill={primaryColor}
                dataKey="value"
                paddingAngle={2}
              >
                {displayData.map((entry, index) => (
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
