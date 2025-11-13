'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/ToastContainer';
import { createInHouseOrder } from '@/lib/serverActions/kitchen.actions';
import ItemModifierSelector from './ItemModifierSelector';
import { Plus, Trash2, X } from 'lucide-react';

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

interface OrderInHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  menuItems: MenuItem[];
  options: Option[];
  menuRules: MenuRule[];
  currencySymbol: string;
  onOrderCreated: () => void;
}

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  price: number;
  options: Array<{ name: string; choice: string; priceAdjustment: number }>;
  specialInstructions: string;
}

export default function OrderInHouseModal({
  isOpen,
  onClose,
  restaurantId,
  menuItems,
  options,
  menuRules,
  currencySymbol,
  onOrderCreated,
}: OrderInHouseModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderType, setOrderType] = useState<'pickup' | 'delivery' | 'dine_in'>('dine_in');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'other'>('cash');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [items, setItems] = useState<OrderItemInput[]>([
    { menuItemId: '', quantity: 1, price: 0, options: [], specialInstructions: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleAddItem = () => {
    setItems([...items, { menuItemId: '', quantity: 1, price: 0, options: [], specialInstructions: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof OrderItemInput, value: any) => {
    const newItems = [...items];

    if (field === 'menuItemId' && value) {
      const menuItem = menuItems.find(mi => mi.id === value);
      if (menuItem) {
        newItems[index] = {
          ...newItems[index],
          menuItemId: value,
          price: menuItem.price,
          options: [],
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    setItems(newItems);
  };

  const calculateItemTotal = (item: OrderItemInput) => {
    let itemPrice = item.price;
    item.options.forEach(option => {
      itemPrice += option.priceAdjustment;
    });
    return itemPrice * item.quantity;
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      if (!item.menuItemId) return total;
      return total + calculateItemTotal(item);
    }, 0);
  };

  const handleSubmit = async () => {
    if (!customerName || !customerPhone) {
      showToast('error', 'Please fill in customer name and phone');
      return;
    }

    const validItems = items.filter(item => item.menuItemId && item.quantity > 0);
    if (validItems.length === 0) {
      showToast('error', 'Please add at least one item');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createInHouseOrder({
        restaurantId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || `${customerPhone}@inhouse.local`,
        items: validItems,
        orderType,
        paymentStatus,
        paymentMethod,
        specialInstructions,
      });

      if (result.success) {
        showToast('success', 'Order created successfully');
        onOrderCreated();
        handleClose();
      } else {
        showToast('error', result.error || 'Failed to create order');
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setOrderType('dine_in');
    setPaymentStatus('pending');
    setPaymentMethod('cash');
    setSpecialInstructions('');
    setItems([{ menuItemId: '', quantity: 1, price: 0, options: [], specialInstructions: '' }]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create In-House Order"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : `Create Order (${currencySymbol}${calculateTotal().toFixed(2)})`}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name *
            </label>
            <Input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Phone *
            </label>
            <Input
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Email (Optional)
            </label>
            <Input
              type="email"
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Type *
            </label>
            <Select value={orderType} onChange={e => setOrderType(e.target.value as any)}>
              <option value="dine_in">Dine In</option>
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status *
            </label>
            <Select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as any)}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </Select>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
            <Button size="sm" onClick={handleAddItem}>
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const selectedMenuItem = menuItems.find(mi => mi.id === item.menuItemId);
              const itemRules = selectedMenuItem
                ? menuRules.find(rule => rule.menuItemId === selectedMenuItem.id)
                : null;

              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Menu Item *
                          </label>
                          <Select
                            value={item.menuItemId}
                            onChange={e => handleItemChange(index, 'menuItemId', e.target.value)}
                          >
                            <option value="">Select item...</option>
                            {menuItems.map(mi => (
                              <option key={mi.id} value={mi.id}>
                                {mi.name}
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price ({currencySymbol}) *
                          </label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity *
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Item Total
                          </label>
                          <div className="px-4 py-2.5 bg-gray-100 rounded-lg text-gray-900 font-semibold">
                            {currencySymbol}{calculateItemTotal(item).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {itemRules && itemRules.appliedOptions && itemRules.appliedOptions.length > 0 && (
                        <ItemModifierSelector
                          itemRules={itemRules}
                          options={options}
                          selectedOptions={item.options.map(opt => ({
                            optionId: opt.name,
                            choiceId: opt.choice,
                            priceAdjustment: opt.priceAdjustment,
                          }))}
                          onOptionsChange={(newOptions) => {
                            const formattedOptions = newOptions.map(opt => ({
                              name: opt.optionName,
                              choice: opt.choiceName,
                              priceAdjustment: opt.priceAdjustment,
                            }));
                            handleItemChange(index, 'options', formattedOptions);
                          }}
                          currencySymbol={currencySymbol}
                        />
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Special Instructions (Optional)
                        </label>
                        <Input
                          value={item.specialInstructions}
                          onChange={e => handleItemChange(index, 'specialInstructions', e.target.value)}
                          placeholder="No onions, extra cheese..."
                        />
                      </div>
                    </div>

                    {items.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Special Instructions (Optional)
          </label>
          <textarea
            value={specialInstructions}
            onChange={e => setSpecialInstructions(e.target.value)}
            placeholder="Any special instructions for the entire order..."
            className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors resize-none"
            rows={3}
          />
        </div>

        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between text-lg font-bold">
            <span className="text-gray-700">Estimated Total:</span>
            <span className="text-gray-900">{currencySymbol}{calculateTotal().toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Final total will include taxes as configured in restaurant settings
          </p>
        </div>
      </div>
    </Modal>
  );
}
