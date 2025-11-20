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
import { QueryClient } from '@tanstack/react-query';
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
  restaurantId: string;
  queryClient: QueryClient;
}

export default function KDSBoard({ initialOrders, stages, currencySymbol, restaurantId, queryClient }: KDSBoardProps) {
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
    console.log('🟢 DRAG START');
    console.log('Active ID:', active.id);
    const order = orders.find(o => o.id === active.id);
    if (order) {
      console.log('Order found:', order.orderNumber, 'Status:', order.status);
      setActiveOrder(order);
    } else {
      console.log('❌ Order not found for ID:', active.id);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    console.log('🟡 DRAG OVER');
    console.log('Active:', active.id);
    console.log('Over:', over?.id || 'null');

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeOrder = orders.find(o => o.id === activeId);
    if (!activeOrder) {
      console.log('❌ Active order not found');
      return;
    }

    const overIsColumn = enabledStages.some(stage => stage.status === overId);

    if (overIsColumn) {
      console.log('Over column:', overId);
      // DO NOT UPDATE STATE HERE - let handleDragEnd do it
    } else {
      const overOrder = orders.find(o => o.id === overId);
      if (!overOrder) {
        console.log('❌ Over order not found');
        return;
      }

      console.log('Over order:', overOrder.orderNumber, 'Status:', overOrder.status);
      // DO NOT UPDATE STATE HERE - let handleDragEnd do it
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    console.log('🔴 DRAG END CALLED');
    console.log('Event:', event);

    const { active, over } = event;
    setActiveOrder(null);

    if (!over) {
      console.log('❌ No over target, drag cancelled');
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeOrder = orders.find(o => o.id === activeId);
    if (!activeOrder) {
      console.log('❌ Active order not found for ID:', activeId);
      return;
    }

    console.log('=== DRAG END ===');
    console.log('Active Order ID:', activeId);
    console.log('Active Order Number:', activeOrder.orderNumber);
    console.log('Dropped on:', overId);
    console.log('Current Status:', activeOrder.status);

    // Determine the new status
    let newStatus = activeOrder.status;

    // Check if dropped on a column (stage)
    const droppedStage = enabledStages.find(stage => stage.status === overId);
    if (droppedStage) {
      newStatus = droppedStage.status;
      console.log('✅ Dropped on column:', droppedStage.displayName, 'new status:', newStatus);
    } else {
      // Dropped on another order - get that order's status
      const targetOrder = orders.find(o => o.id === overId);
      if (targetOrder) {
        newStatus = targetOrder.status;
        console.log('✅ Dropped on order:', targetOrder.orderNumber, 'new status:', newStatus);
      } else {
        console.log('❌ Could not determine target - overId:', overId);
      }
    }

    // Check if status changed or if reordering within same column
    const statusChanged = activeOrder.status !== newStatus;

    if (!statusChanged) {
      // Same column - check if position changed
      console.log('Same column - checking if position changed');

      // If dropped on the column itself (empty area), no position change
      if (droppedStage) {
        console.log('⚠️ Dropped on empty column area - no position change');
        return;
      }

      // Get all orders in this column sorted by priority (highest first, then by createdAt)
      const ordersInColumn = orders
        .filter(o => o.status === activeOrder.status)
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

      // Find positions
      const activeIndex = ordersInColumn.findIndex(o => o.id === activeId);
      const targetIndex = ordersInColumn.findIndex(o => o.id === overId);

      if (activeIndex === -1 || targetIndex === -1) {
        console.log('❌ Could not find order positions');
        return;
      }

      if (activeIndex === targetIndex) {
        console.log('⚠️ No position change - same position');
        return;
      }

      console.log('📍 Position change detected:', activeIndex, '→', targetIndex);

      // Remove active order to calculate proper target position
      const ordersWithoutActive = ordersInColumn.filter(o => o.id !== activeId);
      const newTargetIndex = ordersWithoutActive.findIndex(o => o.id === overId);

      // Calculate new priority based on target position
      let newPriority: number;

      if (newTargetIndex === 0) {
        // Inserting at the top
        newPriority = ordersWithoutActive[0].priority + 1;
        console.log('📌 Inserting at top, new priority:', newPriority);
      } else if (newTargetIndex === ordersWithoutActive.length - 1) {
        // Inserting at the bottom (after the last order)
        newPriority = ordersWithoutActive[newTargetIndex].priority - 1;
        console.log('📌 Inserting at bottom, new priority:', newPriority);
      } else {
        // Inserting between orders
        const aboveOrder = ordersWithoutActive[newTargetIndex - 1];
        const belowOrder = ordersWithoutActive[newTargetIndex];

        const abovePriority = aboveOrder.priority;
        const belowPriority = belowOrder.priority;

        if (Math.abs(abovePriority - belowPriority) <= 1) {
          // Priorities too close, use decimal
          newPriority = (abovePriority + belowPriority) / 2;
          console.log('⚠️ Priorities close, using decimal:', newPriority);
        } else {
          newPriority = Math.floor((abovePriority + belowPriority) / 2);
          console.log('📌 Inserting between orders, new priority:', newPriority);
        }
      }

      // Update UI optimistically
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === activeId ? { ...order, priority: newPriority } : order
        )
      );

      // Update in database
      console.log('📤 Calling updateOrdersBatch with priority:', { id: activeId, priority: newPriority });

      try {
        const result = await updateOrdersBatch(restaurantId, [
          { id: activeId, priority: newPriority }
        ]);

        console.log('📥 Server response:', result);

        if (!result.success) {
          console.error('❌ Update failed:', result.error);
          showToast('error', 'Failed to update order position');
          setOrders(initialOrders);
        } else {
          console.log('✅ Priority updated successfully, invalidating cache...');
          queryClient.invalidateQueries({ queryKey: ['kitchenOrders', restaurantId] });
          showToast('success', 'Order position updated');
        }
      } catch (error) {
        console.error('💥 Exception in updateOrdersBatch:', error);
        showToast('error', 'Error updating order');
        setOrders(initialOrders);
      }

      return;
    }

    console.log('🔄 Status changing from', activeOrder.status, 'to', newStatus);

    // Update UI optimistically
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === activeId ? { ...order, status: newStatus } : order
      )
    );

    // Update in database
    console.log('📤 Calling updateOrdersBatch with:', { id: activeId, status: newStatus });

    try {
      const result = await updateOrdersBatch(restaurantId, [
        { id: activeId, status: newStatus }
      ]);

      console.log('📥 Server response:', result);

      if (!result.success) {
        console.error('❌ Update failed:', result.error);
        showToast('error', 'Failed to update order status');
        // Rollback on failure
        setOrders(initialOrders);
      } else {
        console.log('✅ Status updated successfully, invalidating cache...');
        queryClient.invalidateQueries({ queryKey: ['kitchenOrders', restaurantId] });
        showToast('success', 'Order status updated');
      }
    } catch (error) {
      console.error('💥 Exception in updateOrdersBatch:', error);
      showToast('error', 'Error updating order');
      setOrders(initialOrders);
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
