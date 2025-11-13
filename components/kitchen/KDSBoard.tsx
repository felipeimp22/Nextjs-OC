'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KDSColumn from './KDSColumn';
import OrderTicket from './OrderTicket';
import { updateOrdersBatch } from '@/lib/serverActions/kitchen.actions';
import { useToast } from '@/components/ui/ToastContainer';

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
  status: string;
  priority: number;
}

interface KitchenStage {
  id: string;
  status: string;
  displayName: string;
  color: string;
  order: number;
  isEnabled: boolean;
}

interface KDSBoardProps {
  initialOrders: Order[];
  stages: KitchenStage[];
  currencySymbol: string;
}

export default function KDSBoard({ initialOrders, stages, currencySymbol }: KDSBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const { showToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const enabledStages = useMemo(
    () => stages.filter(stage => stage.isEnabled).sort((a, b) => a.order - b.order),
    [stages]
  );

  const ordersByStatus = useMemo(() => {
    const grouped: Record<string, Order[]> = {};
    enabledStages.forEach(stage => {
      grouped[stage.status] = orders
        .filter(order => order.status === stage.status)
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
    });
    return grouped;
  }, [orders, enabledStages]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const order = orders.find(o => o.id === active.id);
    if (order) {
      setActiveOrder(order);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeOrder = orders.find(o => o.id === activeId);
    if (!activeOrder) return;

    const overIsColumn = enabledStages.some(stage => stage.status === overId);

    if (overIsColumn) {
      const newStatus = overId;
      if (activeOrder.status !== newStatus) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === activeId ? { ...order, status: newStatus } : order
          )
        );
      }
    } else {
      const overOrder = orders.find(o => o.id === overId);
      if (!overOrder) return;

      if (activeOrder.status !== overOrder.status) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === activeId ? { ...order, status: overOrder.status } : order
          )
        );
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOrder(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeOrder = orders.find(o => o.id === activeId);
    if (!activeOrder) return;

    const overIsColumn = enabledStages.some(stage => stage.status === overId);
    let finalStatus = activeOrder.status;

    if (overIsColumn) {
      finalStatus = overId;
    } else {
      const overOrder = orders.find(o => o.id === overId);
      if (overOrder) {
        finalStatus = overOrder.status;
      }
    }

    const statusOrders = orders.filter(o => o.status === finalStatus);
    const activeIndex = statusOrders.findIndex(o => o.id === activeId);
    const overIndex = statusOrders.findIndex(o => o.id === overId);

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      const reorderedOrders = arrayMove(statusOrders, activeIndex, overIndex);
      const updates = reorderedOrders.map((order, index) => ({
        id: order.id,
        priority: reorderedOrders.length - index,
        ...(order.id === activeId && { status: finalStatus }),
      }));

      setOrders(prevOrders => {
        const otherOrders = prevOrders.filter(o => o.status !== finalStatus);
        const updatedOrders = reorderedOrders.map((order, index) => ({
          ...order,
          priority: reorderedOrders.length - index,
          ...(order.id === activeId && { status: finalStatus }),
        }));
        return [...otherOrders, ...updatedOrders];
      });

      const result = await updateOrdersBatch(updates);
      if (!result.success) {
        showToast('error', 'Failed to update order');
        setOrders(initialOrders);
      }
    } else if (activeOrder.status !== finalStatus) {
      const updates = [
        {
          id: activeId,
          status: finalStatus,
        },
      ];

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === activeId ? { ...order, status: finalStatus } : order
        )
      );

      const result = await updateOrdersBatch(updates);
      if (!result.success) {
        showToast('error', 'Failed to update order');
        setOrders(initialOrders);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {enabledStages.map(stage => (
          <KDSColumn
            key={stage.status}
            status={stage.status}
            displayName={stage.displayName}
            color={stage.color}
            orders={ordersByStatus[stage.status] || []}
            currencySymbol={currencySymbol}
          />
        ))}
      </div>

      <DragOverlay>
        {activeOrder ? (
          <div className="rotate-3 scale-105">
            <OrderTicket order={activeOrder} currencySymbol={currencySymbol} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
