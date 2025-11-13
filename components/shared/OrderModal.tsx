'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/ToastContainer';
import { createInHouseOrder, updateInHouseOrder } from '@/lib/serverActions/kitchen.actions';
import ItemModifierSelector from '@/components/kitchen/ItemModifierSelector';
import { Plus, Trash2 } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface Choice {
  id: string;
  name: string;
  basePrice: number;
  isAvailable: boolean;
}

interface Option {
  id: string;
  name: string;
  description?: string;
  choices: Choice[];
  multiSelect: boolean;
  minSelections: number;
  maxSelections: number;
  requiresSelection: boolean;
  allowQuantity: boolean;
  minQuantity: number;
  maxQuantity: number;
}

interface AppliedOption {
  optionId: string;
  required: boolean;
  order: number;
  choiceAdjustments: Array<{
    choiceId: string;
    priceAdjustment: number;
    isAvailable: boolean;
    isDefault: boolean;
  }>;
}

interface MenuRule {
  menuItemId: string;
  appliedOptions: AppliedOption[];
}

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  price: number;
  selectedModifiers: Array<{
    optionId: string;
    optionName: string;
    choiceId: string;
    choiceName: string;
    quantity: number;
    priceAdjustment: number;
  }>;
  specialInstructions: string;
}

interface ExistingOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  orderType: 'pickup' | 'delivery' | 'dine_in';
  paymentStatus: 'pending' | 'paid';
  paymentMethod: 'card' | 'cash' | 'other';
  specialInstructions?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    options?: Array<{ name: string; choice: string; priceAdjustment: number }>;
    specialInstructions?: string;
  }>;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  menuItems: MenuItem[];
  options: Option[];
  menuRules: MenuRule[];
  currencySymbol: string;
  onOrderSaved: () => void;
  existingOrder?: ExistingOrder;
}

export default function OrderModal({
  isOpen,
  onClose,
  restaurantId,
  menuItems,
  options,
  menuRules,
  currencySymbol,
  onOrderSaved,
  existingOrder,
}: OrderModalProps) {
  const t = useTranslations('orders.modal');
  const tTypes = useTranslations('orders.typeOptions');
  const tPaymentStatus = useTranslations('orders.paymentStatusOptions');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderType, setOrderType] = useState<'pickup' | 'delivery' | 'dine_in'>('dine_in');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'other'>('cash');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [items, setItems] = useState<OrderItemInput[]>([
    { menuItemId: '', quantity: 1, price: 0, selectedModifiers: [], specialInstructions: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (existingOrder && options.length > 0) {
      setCustomerName(existingOrder.customerName);
      setCustomerPhone(existingOrder.customerPhone);
      setCustomerEmail(existingOrder.customerEmail);
      setOrderType(existingOrder.orderType);
      setPaymentStatus(existingOrder.paymentStatus);
      setPaymentMethod(existingOrder.paymentMethod);
      setSpecialInstructions(existingOrder.specialInstructions || '');

      const formattedItems: OrderItemInput[] = existingOrder.items.map(item => {
        const selectedModifiers = (item.options || []).map(orderOption => {
          const matchingOption = options.find(opt => opt.name === orderOption.name);

          if (!matchingOption) {
            return {
              optionId: '',
              optionName: orderOption.name,
              choiceId: '',
              choiceName: orderOption.choice,
              quantity: 1,
              priceAdjustment: orderOption.priceAdjustment,
            };
          }

          const matchingChoice = matchingOption.choices.find(
            choice => choice.name === orderOption.choice
          );

          return {
            optionId: matchingOption.id,
            optionName: matchingOption.name,
            choiceId: matchingChoice?.id || '',
            choiceName: orderOption.choice,
            quantity: 1,
            priceAdjustment: orderOption.priceAdjustment,
          };
        });

        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          selectedModifiers,
          specialInstructions: item.specialInstructions || '',
        };
      });

      setItems(formattedItems.length > 0 ? formattedItems : [
        { menuItemId: '', quantity: 1, price: 0, selectedModifiers: [], specialInstructions: '' },
      ]);
    } else if (!existingOrder) {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setOrderType('dine_in');
      setPaymentStatus('pending');
      setPaymentMethod('cash');
      setSpecialInstructions('');
      setItems([{ menuItemId: '', quantity: 1, price: 0, selectedModifiers: [], specialInstructions: '' }]);
    }
  }, [existingOrder, isOpen, options]);

  const handleAddItem = () => {
    setItems([...items, { menuItemId: '', quantity: 1, price: 0, selectedModifiers: [], specialInstructions: '' }]);
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
          selectedModifiers: [],
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    setItems(newItems);
  };

  const calculateItemTotal = (item: OrderItemInput) => {
    let itemPrice = item.price;
    item.selectedModifiers.forEach(modifier => {
      itemPrice += modifier.priceAdjustment * modifier.quantity;
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
      showToast('error', t('fillCustomerInfo'));
      return;
    }

    const validItems = items.filter(item => item.menuItemId && item.quantity > 0);
    if (validItems.length === 0) {
      showToast('error', t('addAtLeastOneItem'));
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedItems = validItems.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        options: item.selectedModifiers.map(mod => ({
          name: mod.optionName,
          choice: mod.choiceName,
          priceAdjustment: mod.priceAdjustment * mod.quantity,
        })),
        specialInstructions: item.specialInstructions,
      }));

      const input = {
        restaurantId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || `${customerPhone}@inhouse.local`,
        items: formattedItems,
        orderType,
        paymentStatus,
        paymentMethod,
        specialInstructions,
      };

      const result = existingOrder
        ? await updateInHouseOrder({ ...input, orderId: existingOrder.id })
        : await createInHouseOrder(input);

      if (result.success) {
        showToast('success', existingOrder ? t('orderUpdatedSuccess') : t('orderCreatedSuccess'));
        onOrderSaved();
        handleClose();
      } else {
        showToast('error', result.error || (existingOrder ? t('orderUpdatedFailed') : t('orderCreatedFailed')));
      }
    } catch (error: any) {
      showToast('error', error.message || (existingOrder ? t('orderUpdatedFailed') : t('orderCreatedFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setOrderType('dine_in');
      setPaymentStatus('pending');
      setPaymentMethod('cash');
      setSpecialInstructions('');
      setItems([{ menuItemId: '', quantity: 1, price: 0, selectedModifiers: [], specialInstructions: '' }]);
      onClose();
    }
  };

  const isEditMode = !!existingOrder;
  const buttonText = isSubmitting
    ? (isEditMode ? t('updating') : t('creating'))
    : (isEditMode ? t('updateOrder') : t('createOrder')) + ` (${currencySymbol}${calculateTotal().toFixed(2)})`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? t('editTitle') : t('createTitle')}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {buttonText}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('customerName')} {t('required')}
            </label>
            <Input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder={t('customerNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('customerPhone')} {t('required')}
            </label>
            <Input
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder={t('customerPhonePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('customerEmail')}
            </label>
            <Input
              type="email"
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
              placeholder={t('customerEmailPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('orderType')} {t('required')}
            </label>
            <Select value={orderType} onChange={e => setOrderType(e.target.value as any)}>
              <option value="dine_in">{tTypes('dineIn')}</option>
              <option value="pickup">{tTypes('pickup')}</option>
              <option value="delivery">{tTypes('delivery')}</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('paymentStatus')} {t('required')}
            </label>
            <Select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as any)}>
              <option value="pending">{tPaymentStatus('pending')}</option>
              <option value="paid">{tPaymentStatus('paid')}</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('paymentMethod')} {t('required')}
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
            <h3 className="text-lg font-semibold text-gray-900">{t('orderItems')}</h3>
            <Button size="sm" onClick={handleAddItem}>
              <Plus className="w-4 h-4 mr-1" />
              {t('addItem')}
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
                            {t('menuItem')} {t('required')}
                          </label>
                          <Select
                            value={item.menuItemId}
                            onChange={e => handleItemChange(index, 'menuItemId', e.target.value)}
                          >
                            <option value="">{t('selectItem')}</option>
                            {menuItems.map(mi => (
                              <option key={mi.id} value={mi.id}>
                                {mi.name}
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('price')} ({currencySymbol}) {t('required')}
                          </label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                            placeholder={t('pricePlaceholder')}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('quantity')} {t('required')}
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
                            {t('itemTotal')}
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
                          selectedOptions={item.selectedModifiers}
                          onOptionsChange={(newOptions) => {
                            handleItemChange(index, 'selectedModifiers', newOptions);
                          }}
                          currencySymbol={currencySymbol}
                        />
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('itemSpecialInstructions')}
                        </label>
                        <Input
                          value={item.specialInstructions}
                          onChange={e => handleItemChange(index, 'specialInstructions', e.target.value)}
                          placeholder={t('itemSpecialInstructionsPlaceholder')}
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
            {t('specialInstructions')}
          </label>
          <textarea
            value={specialInstructions}
            onChange={e => setSpecialInstructions(e.target.value)}
            placeholder={t('specialInstructionsPlaceholder')}
            className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors resize-none"
            rows={3}
          />
        </div>

        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between text-lg font-bold">
            <span className="text-gray-700">{t('estimatedTotal')}</span>
            <span className="text-gray-900">{currencySymbol}{calculateTotal().toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t('finalTotalNote')}
          </p>
        </div>
      </div>
    </Modal>
  );
}
