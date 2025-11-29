import { Package, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderTypeSelectorProps {
  orderType: 'pickup' | 'delivery';
  deliveryEnabled: boolean;
  onOrderTypeChange: (type: 'pickup' | 'delivery') => void;
}

export function OrderTypeSelector({
  orderType,
  deliveryEnabled,
  onOrderTypeChange,
}: OrderTypeSelectorProps) {
  return (
    <div className="flex gap-4 mb-6">
      <button
        onClick={() => onOrderTypeChange('pickup')}
        className={cn(
          'flex-1 p-4 rounded-lg border-2 transition-all flex flex-col items-center',
          orderType === 'pickup'
            ? 'border-brand-navy bg-brand-navy/5'
            : 'border-gray-200 hover:border-gray-300'
        )}
      >
        <Package className="w-6 h-6 mb-2" />
        <span className="font-medium">Pickup</span>
      </button>
      {deliveryEnabled && (
        <button
          onClick={() => onOrderTypeChange('delivery')}
          className={cn(
            'flex-1 p-4 rounded-lg border-2 transition-all flex flex-col items-center',
            orderType === 'delivery'
              ? 'border-brand-navy bg-brand-navy/5'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <Truck className="w-6 h-6 mb-2" />
          <span className="font-medium">Delivery</span>
        </button>
      )}
    </div>
  );
}
