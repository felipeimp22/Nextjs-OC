'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, User, Package, Phone } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/dateFormatter';

interface OrderItem {
  name: string;
  quantity: number;
  options?: Array<{ name: string; choice: string }>;
  specialInstructions?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: string;
  items: OrderItem[];
  total: number;
  specialInstructions?: string;
  createdAt: Date;
  paymentStatus: string;
  prepTime?: number;
  scheduledPickupTime?: Date;
}

interface OrderTicketProps {
  order: Order;
  currencySymbol: string;
}

export default function OrderTicket({ order, currencySymbol }: OrderTicketProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getOrderTypeColor = (type: string) => {
    switch (type) {
      case 'pickup':
        return 'bg-blue-100 text-blue-800';
      case 'delivery':
        return 'bg-purple-100 text-purple-800';
      case 'dine_in':
        return 'bg-green-100 text-green-800';
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border-2 border-gray-200 p-4 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {order.orderNumber}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getOrderTypeColor(
                  order.orderType
                )}`}
              >
                <Package className="w-3 h-3 mr-1" />
                {order.orderType.replace('_', ' ').toUpperCase()}
              </span>
              <span
                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getPaymentStatusColor(
                  order.paymentStatus
                )}`}
              >
                {order.paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{formatRelativeTime(order.createdAt)}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{order.customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{order.customerPhone}</span>
          </div>
          {order.prepTime && (
            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
              <Clock className="w-4 h-4" />
              <span>Prep: {order.prepTime} min</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-3">
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="text-sm">
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-gray-900">
                    {item.quantity}x {item.name}
                  </span>
                </div>
                {item.options && item.options.length > 0 && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {item.options.map((option, optIndex) => (
                      <div key={optIndex} className="text-xs text-gray-600">
                        • {option.name}: {option.choice}
                      </div>
                    ))}
                  </div>
                )}
                {item.specialInstructions && (
                  <div className="ml-6 mt-1 text-xs italic text-orange-600">
                    Note: {item.specialInstructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {order.specialInstructions && (
          <div className="border-t border-orange-200 pt-2 bg-orange-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
            <p className="text-xs font-semibold text-orange-900">Order Note:</p>
            <p className="text-sm text-orange-700 mt-1">{order.specialInstructions}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-600">Total</span>
          <span className="text-lg font-bold text-gray-900">
            {currencySymbol}{order.total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
