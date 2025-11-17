'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/ToastContainer';
import { createInHouseOrder, updateInHouseOrder, calculateDeliveryFeeEstimate } from '@/lib/serverActions/order.actions';
import ItemModifierSelector from '@/components/shared/ItemModifierSelector';
import { calculateItemTotalPrice } from '@/lib/utils/modifierPricingCalculator';
import LocationAutocomplete from '@/components/shared/LocationAutocomplete';
import type { AddressComponents } from '@/lib/utils/mapbox';
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

interface PriceAdjustment {
  targetOptionId: string;
  targetChoiceId?: string;
  adjustmentType: 'multiplier' | 'addition' | 'fixed';
  value: number;
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
    adjustments: PriceAdjustment[];
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
  deliveryAddress?: string;
  specialInstructions?: string;
  prepTime?: number;
  scheduledPickupTime?: string | Date;
  deliveryInfo?: {
    provider?: string;
    externalId?: string;
  };
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    options?: Array<{ name: string; choice: string; priceAdjustment: number }>;
    specialInstructions?: string;
  }>;
}

interface DeliverySettings {
  enabled: boolean;
  driverProvider: string;
}

interface TaxSetting {
  id?: string;
  name: string;
  rate: number;
  enabled: boolean;
  type: 'percentage' | 'fixed';
  applyTo: 'entire_order' | 'per_item';
}

interface GlobalFee {
  enabled: boolean;
  threshold: number;
  belowPercent: number;
  aboveFlat: number;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  menuItems: MenuItem[];
  options: Option[];
  menuRules: MenuRule[];
  currencySymbol: string;
  taxSettings: TaxSetting[];
  globalFeeSettings?: GlobalFee | null;
  deliverySettings?: DeliverySettings | null;
  restaurantTimezone?: string;
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
  taxSettings,
  globalFeeSettings,
  deliverySettings = null,
  restaurantTimezone = 'America/New_York',
  onOrderSaved,
  existingOrder,
}: OrderModalProps) {
  const t = useTranslations('orders.modal');
  const tTypes = useTranslations('orders.typeOptions');
  const tPaymentStatus = useTranslations('orders.paymentStatusOptions');
  const tPaymentMethods = useTranslations('paymentMethods');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderType, setOrderType] = useState<'pickup' | 'delivery' | 'dine_in'>('dine_in');
  const [deliveryAddress, setDeliveryAddress] = useState<AddressComponents | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'other'>('cash');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [prepTime, setPrepTime] = useState(30);
  const [scheduledPickupTime, setScheduledPickupTime] = useState('');
  const [items, setItems] = useState<OrderItemInput[]>([
    { menuItemId: '', quantity: 1, price: 0, selectedModifiers: [], specialInstructions: '' },
  ]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryFeeLoading, setDeliveryFeeLoading] = useState(false);
  const [driverTip, setDriverTip] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const isShipdayOrder = existingOrder?.deliveryInfo?.provider === 'shipday' && existingOrder?.deliveryInfo?.externalId;
  const showShipdayFields = orderType === 'delivery' && deliverySettings?.driverProvider === 'shipday';

  const formatDateTimeForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (prepTime > 0 && (showShipdayFields || orderType === 'pickup' || orderType === 'delivery')) {
      // Use restaurant timezone (default to UTC if not provided)
      const timezone = restaurantTimezone || 'UTC';

      // Get current time in restaurant timezone
      const nowInRestaurantTz = new Date();

      // Add prep time
      const pickup = new Date(nowInRestaurantTz.getTime() + prepTime * 60000);

      // Format for datetime-local input (needs to be in restaurant timezone)
      // formatInTimeZone will convert the UTC date to the restaurant's local time
      const formattedTime = formatInTimeZone(pickup, timezone, "yyyy-MM-dd'T'HH:mm");

      setScheduledPickupTime(formattedTime);
    }
  }, [prepTime, orderType, showShipdayFields, restaurantTimezone]);

  // Calculate delivery fee when address is selected
  useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (orderType === 'delivery' && deliveryAddress && isOpen) {
        setDeliveryFeeLoading(true);
        try {
          const subtotal = calculateSubtotal();
          const { totalTax } = calculateTaxes();
          const platformFee = calculatePlatformFee();
          const orderValue = subtotal + totalTax + platformFee;

          const result = await calculateDeliveryFeeEstimate(
            restaurantId,
            deliveryAddress.fullAddress,
            {
              latitude: deliveryAddress.coordinates.lat,
              longitude: deliveryAddress.coordinates.lng,
            },
            customerName || undefined,
            customerPhone || undefined,
            orderValue
          );

          if (result.success) {
            setDeliveryFee(result.deliveryFee);
          } else {
            setDeliveryFee(0);
            if (result.error) {
              showToast('error', result.error);
            }
          }
        } catch (error: any) {
          console.error('Failed to calculate delivery fee:', error);
          setDeliveryFee(0);
        } finally {
          setDeliveryFeeLoading(false);
        }
      } else {
        // Reset delivery fee if not delivery order
        setDeliveryFee(0);
      }
    };

    fetchDeliveryFee();
  }, [orderType, deliveryAddress, items, isOpen]);

  // Debug logging for tax settings
  useEffect(() => {
    if (isOpen) {
      console.log('OrderModal - Tax Settings:', taxSettings);
      console.log('OrderModal - Tax Settings Length:', taxSettings?.length);
      console.log('OrderModal - Tax Settings Type:', Array.isArray(taxSettings) ? 'Array' : typeof taxSettings);
    }
  }, [isOpen, taxSettings]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (existingOrder && options.length > 0) {
      setCustomerName(existingOrder.customerName);
      setCustomerPhone(existingOrder.customerPhone);
      setCustomerEmail(existingOrder.customerEmail);
      setOrderType(existingOrder.orderType);
      setDeliveryAddress(existingOrder.deliveryAddress ? {
        street: '',
        houseNumber: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        fullAddress: existingOrder.deliveryAddress,
        coordinates: { lat: 0, lng: 0 }
      } : null);
      setPaymentStatus(existingOrder.paymentStatus);
      setPaymentMethod(existingOrder.paymentMethod);
      setSpecialInstructions(existingOrder.specialInstructions || '');
      setPrepTime(existingOrder.prepTime || 30);
      if (existingOrder.scheduledPickupTime) {
        const pickupDate = typeof existingOrder.scheduledPickupTime === 'string'
          ? new Date(existingOrder.scheduledPickupTime)
          : existingOrder.scheduledPickupTime;
        setScheduledPickupTime(formatDateTimeForInput(pickupDate));
      }

      const formattedItems: OrderItemInput[] = existingOrder.items.map(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
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

        let calculatedPrice = item.price;
        if (menuItem && selectedModifiers.length > 0) {
          const itemRules = menuRules.find(rule => rule.menuItemId === item.menuItemId);
          const selectedChoices = selectedModifiers.map(modifier => ({
            optionId: modifier.optionId,
            choiceId: modifier.choiceId,
            quantity: modifier.quantity,
          }));

          const result = calculateItemTotalPrice(
            menuItem.price,
            itemRules ? { appliedOptions: itemRules.appliedOptions } : null,
            selectedChoices,
            1
          );
          calculatedPrice = result.itemTotal;
        } else if (menuItem) {
          calculatedPrice = menuItem.price;
        }

        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: calculatedPrice,
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
      setPrepTime(30);
      setScheduledPickupTime('');
      setItems([{ menuItemId: '', quantity: 1, price: 0, selectedModifiers: [], specialInstructions: '' }]);
    }
  }, [existingOrder, isOpen, options, menuItems, menuRules]);

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
    } else if (field === 'selectedModifiers') {
      const currentItem = newItems[index];
      const menuItem = menuItems.find(mi => mi.id === currentItem.menuItemId);

      if (menuItem) {
        const itemRules = menuRules.find(rule => rule.menuItemId === currentItem.menuItemId);
        const selectedChoices = value.map((modifier: any) => ({
          optionId: modifier.optionId,
          choiceId: modifier.choiceId,
          quantity: modifier.quantity,
        }));

        const result = calculateItemTotalPrice(
          menuItem.price,
          itemRules ? { appliedOptions: itemRules.appliedOptions } : null,
          selectedChoices,
          1
        );

        newItems[index] = {
          ...currentItem,
          selectedModifiers: value,
          price: result.itemTotal,
        };
      } else {
        newItems[index] = { ...newItems[index], [field]: value };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    setItems(newItems);
  };

  const calculateItemTotal = (item: OrderItemInput) => {
    if (!item.menuItemId) {
      return 0;
    }

    return item.price * item.quantity;
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      if (!item.menuItemId) return total;
      return total + calculateItemTotal(item);
    }, 0);
  };

  const calculateTaxes = () => {
    const subtotal = calculateSubtotal();
    const taxes: { name: string; rate: number; amount: number; type: string }[] = [];
    let totalTax = 0;

    // Safety check: taxSettings might be undefined
    if (!taxSettings || !Array.isArray(taxSettings)) {
      console.log('calculateTaxes - No tax settings available');
      return { totalTax: 0, taxes: [] };
    }

    console.log('calculateTaxes - Subtotal:', subtotal);
    console.log('calculateTaxes - Processing taxes:', taxSettings);

    taxSettings.forEach(taxSetting => {
      console.log('calculateTaxes - Tax setting:', taxSetting);
      if (!taxSetting.enabled) {
        console.log(`calculateTaxes - Skipped disabled tax: ${taxSetting.name}`);
        return;
      }

      let taxAmount = 0;

      if (taxSetting.applyTo === 'per_item') {
        // Apply tax per item
        items.forEach(item => {
          if (!item.menuItemId) return;
          const itemTotal = calculateItemTotal(item);

          if (taxSetting.type === 'percentage') {
            taxAmount += (itemTotal * taxSetting.rate) / 100;
          } else if (taxSetting.type === 'fixed') {
            taxAmount += taxSetting.rate * item.quantity;
          }
        });
      } else {
        // Apply to entire order (subtotal)
        if (taxSetting.type === 'percentage') {
          taxAmount = (subtotal * taxSetting.rate) / 100;
        } else if (taxSetting.type === 'fixed') {
          taxAmount = taxSetting.rate;
        }
      }

      totalTax += taxAmount;
      taxes.push({
        name: taxSetting.name,
        rate: taxSetting.rate,
        amount: taxAmount,
        type: taxSetting.type,
      });
      console.log(`calculateTaxes - Added tax: ${taxSetting.name} (${taxSetting.type}) = $${taxAmount.toFixed(2)}`);
    });

    console.log('calculateTaxes - Final taxes:', taxes);
    console.log('calculateTaxes - Total tax:', totalTax);

    return { totalTax, taxes };
  };

  const calculatePlatformFee = () => {
    if (!globalFeeSettings || !globalFeeSettings.enabled) {
      return 0;
    }

    const subtotal = calculateSubtotal();
    const threshold = globalFeeSettings.threshold || 0;

    if (subtotal < threshold) {
      const belowPercent = globalFeeSettings.belowPercent || 0;
      return (subtotal * belowPercent) / 100;
    } else {
      return globalFeeSettings.aboveFlat || 0;
    }
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const { totalTax } = calculateTaxes();
    const platformFee = calculatePlatformFee();
    const tipAmount = orderType === 'delivery' ? driverTip : 0;
    return subtotal + totalTax + platformFee + deliveryFee + tipAmount;
  };

  const handleSubmit = async () => {
    if (!customerName || !customerPhone) {
      showToast('error', t('fillCustomerInfo'));
      return;
    }

    // Validate delivery address for delivery orders
    if (orderType === 'delivery' && !deliveryAddress) {
      showToast('error', 'Please select a delivery address');
      return;
    }

    const validItems = items.filter(item => item.menuItemId && item.quantity > 0);
    if (validItems.length === 0) {
      showToast('error', t('addAtLeastOneItem'));
      return;
    }

    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      const itemRules = menuRules.find(rule => rule.menuItemId === item.menuItemId);

      if (itemRules && itemRules.appliedOptions) {
        for (const appliedOption of itemRules.appliedOptions) {
          const option = options.find(opt => opt.id === appliedOption.optionId);

          if (!option) continue;

          const isRequired = appliedOption.required || option.requiresSelection;
          const selectedForOption = item.selectedModifiers.filter(
            sm => sm.optionId === option.id
          );

          if (isRequired) {
            const minRequired = option.multiSelect ? option.minSelections : 1;

            if (selectedForOption.length < minRequired) {
              const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
              const itemName = menuItem?.name || 'Item';

              if (option.multiSelect && option.minSelections > 0) {
                showToast(
                  'error',
                  `${itemName}: Please select at least ${option.minSelections} option${option.minSelections > 1 ? 's' : ''} for "${option.name}"`
                );
              } else {
                showToast(
                  'error',
                  `${itemName}: Please select an option for "${option.name}"`
                );
              }
              return;
            }
          }
        }
      }
    }

    setIsSubmitting(true);

    try {
      const formattedItems = validItems.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
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
        deliveryAddress: orderType === 'delivery' && deliveryAddress ? deliveryAddress.fullAddress : undefined,
        deliveryCoordinates: orderType === 'delivery' && deliveryAddress ? {
          latitude: deliveryAddress.coordinates.lat,
          longitude: deliveryAddress.coordinates.lng,
        } : undefined,
        paymentStatus,
        paymentMethod,
        specialInstructions,
        prepTime,
        scheduledPickupTime: scheduledPickupTime ? new Date(scheduledPickupTime).toISOString() : undefined,
        driverTip: orderType === 'delivery' ? driverTip : 0,
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
      setDeliveryAddress(null);
      setDeliveryFee(0);
      setDriverTip(0);
      setPrepTime(30);
      setScheduledPickupTime('');
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
          <Button onClick={handleSubmit} disabled={isSubmitting || isShipdayOrder}>
            {buttonText}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Shipday Order Warning */}
        {isShipdayOrder && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ {t('shipdayOrderWarning')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('customerName')} {t('required')}
            </label>
            <Input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              disabled={isShipdayOrder}
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

          {/* Delivery Address - Only show for delivery orders */}
          {orderType === 'delivery' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Address {t('required')}
                {isShipdayOrder && <span className="text-xs text-gray-500 ml-2">(Locked - Order dispatched to Shipday)</span>}
              </label>
              <LocationAutocomplete
                onSelect={(address) => setDeliveryAddress(address)}
                placeholder="Enter delivery address..."
                required={true}
                disabled={isShipdayOrder}
              />
              {isShipdayOrder && deliveryAddress && (
                <div className="mt-1 text-sm text-gray-600">
                  {deliveryAddress.fullAddress}
                </div>
              )}
            </div>
          )}

          {/* Driver Tip - Only show for delivery orders */}
          {orderType === 'delivery' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('driverTip')}
                {isShipdayOrder && <span className="text-xs text-gray-500 ml-2">(Locked - Order dispatched to Shipday)</span>}
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={driverTip}
                onChange={e => {
                  const value = parseFloat(e.target.value);
                  setDriverTip(isNaN(value) ? 0 : value);
                }}
                placeholder="0.00"
                disabled={isShipdayOrder}
              />
            </div>
          )}

          {/* Prep Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('prepTimeMinutes')}
              {isShipdayOrder && <span className="text-xs text-gray-500 ml-2">(Locked - Order dispatched to Shipday)</span>}
            </label>
            <Input
              type="number"
              min="0"
              value={prepTime}
              onChange={e => {
                const value = parseInt(e.target.value);
                setPrepTime(isNaN(value) ? 30 : value);
              }}
              placeholder={t('prepTimePlaceholder')}
              disabled={isShipdayOrder}
            />
          </div>

          {/* Pickup Time - Show for Shipday or all order types */}
          {(showShipdayFields || orderType === 'pickup' || orderType === 'delivery') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {orderType === 'delivery' ? t('deliveryTime') : t('pickupTime')}
                {isShipdayOrder && <span className="text-xs text-gray-500 ml-2">(Locked - Order dispatched to Shipday)</span>}
              </label>
              <Input
                type="datetime-local"
                value={scheduledPickupTime}
                onChange={e => setScheduledPickupTime(e.target.value)}
                disabled={isShipdayOrder}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('paymentStatus')} {t('required')}
            </label>
            <Select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as any)} disabled={isShipdayOrder}>
              <option value="pending">{tPaymentStatus('pending')}</option>
              <option value="paid">{tPaymentStatus('paid')}</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('paymentMethod')} {t('required')}
            </label>
            <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
              <option value="cash">{tPaymentMethods('cash')}</option>
              <option value="card">{tPaymentMethods('card')}</option>
              <option value="other">{tPaymentMethods('other')}</option>
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

        <div className="bg-gray-100 rounded-lg p-4 space-y-2">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-gray-700">
            <span className="text-sm font-medium">Subtotal</span>
            <span className="text-sm font-semibold">{currencySymbol}{calculateSubtotal().toFixed(2)}</span>
          </div>

          {/* Tax Breakdown */}
          {calculateTaxes().taxes.length > 0 && calculateTaxes().taxes.map((tax, index) => (
            <div key={index} className="flex items-center justify-between text-gray-600">
              <span className="text-sm">
                {tax.name} ({tax.type === 'percentage' ? `${tax.rate}%` : `${currencySymbol}${tax.rate.toFixed(2)}`})
              </span>
              <span className="text-sm">{currencySymbol}{tax.amount.toFixed(2)}</span>
            </div>
          ))}

          {/* Show message if no taxes configured */}
          {(!taxSettings || taxSettings.length === 0) && (
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs italic">No tax configured</span>
            </div>
          )}

          {/* Platform Fee */}
          {calculatePlatformFee() > 0 && (
            <div className="flex items-center justify-between text-gray-600">
              <span className="text-sm">
                Platform Fee
                {globalFeeSettings && calculateSubtotal() < globalFeeSettings.threshold
                  ? ` (${globalFeeSettings.belowPercent}%)`
                  : ''}
              </span>
              <span className="text-sm">{currencySymbol}{calculatePlatformFee().toFixed(2)}</span>
            </div>
          )}

          {/* Delivery Fee - Show for delivery orders (even when $0) */}
          {orderType === 'delivery' && (
            <div className="flex items-center justify-between text-gray-600">
              <span className="text-sm">
                Delivery Fee
                {deliveryFeeLoading && <span className="ml-2 text-xs text-gray-400">(calculating...)</span>}
              </span>
              <span className="text-sm">
                {deliveryFeeLoading ? '...' : `${currencySymbol}${deliveryFee.toFixed(2)}`}
              </span>
            </div>
          )}

          {/* Driver Tip - Show for delivery orders */}
          {orderType === 'delivery' && (
            <div className="flex items-center justify-between text-gray-600">
              <span className="text-sm">{t('driverTip')}</span>
              <span className="text-sm">{currencySymbol}{driverTip.toFixed(2)}</span>
            </div>
          )}

          {/* Divider - only show if there are items above total */}
          {(calculateTaxes().taxes.length > 0 || calculatePlatformFee() > 0 || orderType === 'delivery' || !taxSettings || taxSettings.length === 0) && (
            <div className="border-t border-gray-300 my-2"></div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between text-lg font-bold">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">{currencySymbol}{calculateTotal().toFixed(2)}</span>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {t('finalTotalNote')}
          </p>
        </div>
      </div>
    </Modal>
  );
}
