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

  // Kitchen statuses (from kitchen.actions.ts DEFAULT_STAGES)
  const kitchenStatuses = [
    { key: 'pending', label: statusT('pending') },
    { key: 'confirmed', label: statusT('confirmed') },
    { key: 'preparing', label: statusT('preparing') },
    { key: 'ready', label: statusT('ready') },
    { key: 'out_for_delivery', label: statusT('outForDelivery') },
    { key: 'delivered', label: statusT('delivered') },
    { key: 'completed', label: statusT('completed') },
  ];

  // Build chart data - include ALL statuses
  const allChartData = kitchenStatuses.map((status) => ({
    name: status.label,
    value: ordersByStatus[status.key] || 0,
    status: status.key,
  }));

  // For display, show only statuses with orders > 0
  const displayData = allChartData.filter(item => item.value > 0);
  const totalOrders = allChartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentage = totalOrders > 0 ? ((payload[0].value / totalOrders) * 100).toFixed(1) : '0.0';
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

  return (
    <Card variant="elevated" padding="md" className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('ordersByStatus')}</h3>
      {displayData.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center">
          <p className="text-gray-400 text-sm">No orders yet</p>
        </div>
      ) : (
        <div className="h-[320px] flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Pie Chart Container */}
            <div className="w-2/3 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {displayData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || '#6b7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Text - positioned relative to pie chart container */}
              <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Total</p>
              </div>
            </div>

            {/* Legend on the right */}
            <div className="w-1/3 h-full flex items-center justify-center">
              <div className="space-y-2">
                {displayData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[entry.status] || '#6b7280' }}
                    />
                    <span className="text-xs text-gray-700">{entry.name}</span>
                    <span className="text-xs font-semibold text-gray-900">({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
