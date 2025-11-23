'use client';

import { useTranslations } from 'next-intl';
import { formatRelativeTime } from '@/lib/utils/dateFormatter';
import { Pencil } from 'lucide-react';

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  options?: Array<{ name: string; choice: string; priceAdjustment: number }>;
  specialInstructions?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  specialInstructions?: string;
  customerAddress?: any;
  driverTip?: number;
  prepTime?: number;
  scheduledPickupTime?: string | Date;
  deliveryInfo?: {
    provider?: string;
    externalId?: string;
  };
}

interface OrdersTableProps {
  orders: Order[];
  currencySymbol: string;
  onEdit: (order: Order) => void;
}

export default function OrdersTable({ orders, currencySymbol, onEdit }: OrdersTableProps) {
  const t = useTranslations('orders');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'refunded':
      case 'partially_refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatOrderType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('orderNumber')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('customer')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('type')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('status')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('payment')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('total')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('created')}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{order.customerName}</div>
                <div className="text-sm text-gray-500">{order.customerEmail}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">{formatOrderType(order.orderType)}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-sm ${getStatusColor(order.status)}`}>
                  {formatStatus(order.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-sm ${getPaymentStatusColor(order.paymentStatus)}`}>
                  {formatStatus(order.paymentStatus)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-900">{currencySymbol}{order.total.toFixed(2)}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-500">
                  {formatRelativeTime(order.createdAt)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <button
                  onClick={() => onEdit(order)}
                  className="p-2 text-gray-600 hover:text-brand-navy hover:bg-gray-100 rounded-sm transition-colors"
                  title={t('edit')}
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
