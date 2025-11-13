'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import OrderTicket from './OrderTicket';

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
}

interface KDSColumnProps {
  status: string;
  displayName: string;
  color: string;
  orders: Order[];
  currencySymbol: string;
}

export default function KDSColumn({
  status,
  displayName,
  color,
  orders,
  currencySymbol,
}: KDSColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="flex flex-col h-full min-w-[320px] md:min-w-[360px]">
      <div
        className="flex items-center justify-between p-4 rounded-t-lg border-b-4"
        style={{
          backgroundColor: `${color}20`,
          borderBottomColor: color,
        }}
      >
        <h3 className="text-lg font-bold text-gray-900">{displayName}</h3>
        <span
          className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {orders.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50 rounded-b-lg border-2 border-t-0 ${
          isOver ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
        }`}
      >
        <SortableContext
          items={orders.map(o => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {orders.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              No orders
            </div>
          ) : (
            orders.map(order => (
              <OrderTicket
                key={order.id}
                order={order}
                currencySymbol={currencySymbol}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
