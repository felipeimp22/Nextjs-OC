'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContainer';
import KDSBoard from '@/components/kitchen/KDSBoard';
import OrderInHouseModal from '@/components/kitchen/OrderInHouseModal';
import { getKitchenOrders, getKitchenStages } from '@/lib/serverActions/kitchen.actions';
import { getRestaurantMenuData } from '@/lib/serverActions/menu.actions';
import { Maximize2, Minimize2, Plus, RefreshCw, Settings } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Toggle from '@/components/ui/Toggle';

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

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface Option {
  id: string;
  name: string;
  choices: Array<{ id: string; name: string; basePrice: number }>;
}

interface MenuRule {
  menuItemId: string;
  appliedOptions: Array<{
    optionId: string;
    required: boolean;
  }>;
}

export default function KitchenPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id as string;
  const { selectedRestaurantId } = useRestaurantStore();
  const isMobile = useIsMobile();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isMaximized, setIsMaximized] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [stageSettings, setStageSettings] = useState<Record<string, boolean>>({});

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['kitchenOrders', restaurantId],
    queryFn: async () => {
      const result = await getKitchenOrders(restaurantId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    refetchInterval: 2 * 60 * 1000,
    enabled: !!selectedRestaurantId && selectedRestaurantId === restaurantId,
  });

  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['kitchenStages', restaurantId],
    queryFn: async () => {
      const result = await getKitchenStages(restaurantId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    refetchInterval: 2 * 60 * 1000,
    enabled: !!selectedRestaurantId && selectedRestaurantId === restaurantId,
  });

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['restaurantMenuData', restaurantId],
    queryFn: async () => {
      const result = await getRestaurantMenuData(restaurantId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!selectedRestaurantId && selectedRestaurantId === restaurantId,
  });

  const isLoading = ordersLoading || stagesLoading || menuLoading;

  useEffect(() => {
    if (!selectedRestaurantId) {
      router.push('/setup');
    } else if (selectedRestaurantId !== restaurantId) {
      router.push(`/${selectedRestaurantId}/kitchen`);
    }
  }, [selectedRestaurantId, restaurantId, router]);

  useEffect(() => {
    if (stages.length > 0) {
      const settings: Record<string, boolean> = {};
      stages.forEach(stage => {
        settings[stage.status] = stage.isEnabled;
      });
      setStageSettings(settings);
    }
  }, [stages]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['kitchenOrders', restaurantId] });
    queryClient.invalidateQueries({ queryKey: ['kitchenStages', restaurantId] });
    showToast('success', 'Orders refreshed');
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  const handleSaveStageSettings = async () => {
    const { updateKitchenStages } = await import('@/lib/serverActions/kitchen.actions');

    const updates = Object.entries(stageSettings).map(([status, isEnabled]) => ({
      status,
      isEnabled,
    }));

    const result = await updateKitchenStages(restaurantId, updates);

    if (result.success) {
      showToast('success', 'Stage settings updated');
      setIsSettingsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['kitchenStages', restaurantId] });
    } else {
      showToast('error', 'Failed to update stage settings');
    }
  };

  const handleOrderCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['kitchenOrders', restaurantId] });
  };

  if (!selectedRestaurantId || selectedRestaurantId !== restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  const KitchenContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Kitchen Display System</h1>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="secondary" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setIsSettingsModalOpen(true)}>
            <Settings className="w-4 h-4 mr-1" />
            Stages
          </Button>
          <Button size="sm" onClick={() => setIsOrderModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Order In House
          </Button>
          <button
            onClick={toggleMaximize}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title={isMaximized ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isMaximized ? (
              <Minimize2 className="w-5 h-5 text-gray-700" />
            ) : (
              <Maximize2 className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 min-h-0">
        <KDSBoard
          initialOrders={orders}
          stages={stages}
          currencySymbol={menuData?.currencySymbol || '$'}
        />
      </div>
    </div>
  );

  return (
    <>
      {isMaximized ? (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <KitchenContent />
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100vh-80px)]">
          <KitchenContent />
        </div>
      )}

      <OrderInHouseModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        restaurantId={restaurantId}
        menuItems={menuData?.menuItems || []}
        options={menuData?.options || []}
        menuRules={menuData?.menuRules || []}
        currencySymbol={menuData?.currencySymbol || '$'}
        onOrderCreated={handleOrderCreated}
      />

      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Kitchen Stage Settings"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSettingsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStageSettings}>
              Save Settings
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enable or disable stages to customize your kitchen display. Disabled stages will not be shown on the board.
          </p>
          <div className="space-y-3">
            {stages.map(stage => (
              <div
                key={stage.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="font-medium text-gray-900">{stage.displayName}</span>
                </div>
                <Toggle
                  checked={stageSettings[stage.status] ?? stage.isEnabled}
                  onChange={checked => {
                    setStageSettings(prev => ({
                      ...prev,
                      [stage.status]: checked,
                    }));
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
