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

interface OrdersCardProps {
  orders: Order[];
  currencySymbol: string;
  onEdit: (order: Order) => void;
}

export default function OrdersCard({ orders, currencySymbol, onEdit }: OrdersCardProps) {
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
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">{order.orderNumber}</h3>
              <p className="text-sm text-gray-600 mt-1">{order.customerName}</p>
              <p className="text-xs text-gray-500">{order.customerEmail}</p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-sm ${getStatusColor(order.status)}`}>
                {formatStatus(order.status)}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-sm ${getPaymentStatusColor(order.paymentStatus)}`}>
                {formatStatus(order.paymentStatus)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('orderType')}</span>
              <span className="text-sm font-medium text-gray-900">{formatOrderType(order.orderType)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('total')}</span>
              <span className="text-sm font-medium text-gray-900">{currencySymbol}{order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('created')}</span>
              <span className="text-sm font-medium text-gray-900">
                {formatRelativeTime(order.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-3 mt-3 border-t border-gray-200">
            <button
              onClick={() => onEdit(order)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-brand-navy bg-brand-navy/10 hover:bg-brand-navy/20 rounded-sm transition-colors"
            >
              <Pencil className="w-4 h-4" />
              {t('edit')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
