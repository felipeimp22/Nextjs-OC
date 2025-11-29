interface OrderSummaryCardProps {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    total: number;
  }>;
  calculation: {
    subtotal: number;
    tax: number;
    taxBreakdown?: Array<{ name: string; amount: number }>;
    deliveryFee: number;
    platformFee: number;
    tip: number;
    driverTip: number;
    total: number;
  } | null;
  currencySymbol: string;
  isLoading: boolean;
}

export function OrderSummaryCard({
  items,
  calculation,
  currencySymbol,
  isLoading,
}: OrderSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

      {/* Items list */}
      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.quantity}x {item.name}
            </span>
            <span>
              {currencySymbol}
              {item.total.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>
            {currencySymbol}
            {calculation?.subtotal.toFixed(2)}
          </span>
        </div>

        {/* Tax breakdown */}
        {calculation?.taxBreakdown?.map((tax) => (
          <div key={tax.name} className="flex justify-between text-gray-600 text-sm">
            <span>{tax.name}</span>
            <span>
              {currencySymbol}
              {tax.amount.toFixed(2)}
            </span>
          </div>
        ))}

        {(calculation?.deliveryFee || 0) > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Delivery</span>
            <span>
              {currencySymbol}
              {calculation?.deliveryFee.toFixed(2)}
            </span>
          </div>
        )}

        {(calculation?.platformFee || 0) > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Service Fee</span>
            <span>
              {currencySymbol}
              {calculation?.platformFee.toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total</span>
          <span>
            {currencySymbol}
            {calculation?.total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
