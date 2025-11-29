/**
 * OrderCalculationService - Single source of truth for all order calculations
 *
 * All values are in restaurant's configured currency (no conversion needed).
 *
 * This service handles:
 * - Item price calculation with modifiers
 * - Tax calculation
 * - Delivery fee calculation (local and Shipday)
 * - Platform fee calculation
 */

import prisma from '@/lib/prisma';
import { calculateTaxes, TaxSetting, TaxCalculationItem } from '@/lib/utils/taxCalculator';
import { calculateGlobalFee, GlobalFeeSettings } from '@/lib/utils/feeCalculator';
import { calculateItemTotalPrice } from '@/lib/utils/modifierPricingCalculator';

export interface OrderCalculationInput {
  restaurantId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    selectedOptions?: Array<{
      optionId: string;
      choiceId: string;
      quantity?: number;
    }>;
    specialInstructions?: string;
  }>;
  orderType: 'pickup' | 'delivery' | 'dine_in';
  tip?: number;
  driverTip?: number;
  deliveryAddress?: string;
  deliveryCoordinates?: { latitude: number; longitude: number };
  customerName?: string;
  customerPhone?: string;
}

export interface CalculatedOrderItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  modifierPrice: number;
  finalPrice: number;
  quantity: number;
  total: number;
  options: Array<{
    name: string;
    choice: string;
    priceAdjustment: number;
  }>;
  specialInstructions?: string;
}

export interface OrderCalculationResult {
  items: CalculatedOrderItem[];
  subtotal: number;
  tax: number;
  taxBreakdown: Array<{
    name: string;
    rate: number | null;
    amount: number;
    type: 'percentage' | 'fixed';
  }>;
  deliveryFee: number;
  deliveryDetails?: {
    distance: number;
    distanceUnit: 'miles' | 'km';
    provider: 'local' | 'shipday';
    tierUsed?: string;
    withinRadius: boolean;
  };
  tip: number;
  driverTip: number;
  platformFee: number;
  total: number;
  currency: string;
  currencySymbol: string;
}

export class OrderCalculationService {
  /**
   * Calculate complete order - fetches all required data internally
   * All values returned are in restaurant's configured currency
   */
  static async calculate(input: OrderCalculationInput): Promise<OrderCalculationResult> {
    console.log('=== ORDER CALCULATION SERVICE START ===');
    console.log('Restaurant ID:', input.restaurantId);
    console.log('Order Type:', input.orderType);
    console.log('Items:', input.items.length);

    // 1. Fetch restaurant with all settings
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
      include: {
        financialSettings: true,
        deliverySettings: true,
        storeHours: true,
      },
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // 2. Fetch menu items for this order
    const menuItemIds = input.items.map(i => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId: input.restaurantId },
    });

    // 3. Fetch menu rules and options
    const menuRules = await prisma.menuRules.findMany({
      where: { menuItemId: { in: menuItemIds } },
    });

    const options = await prisma.option.findMany({
      where: { restaurantId: input.restaurantId, isAvailable: true },
    });

    // 4. Build lookup maps
    const menuItemsMap = new Map(menuItems.map(item => [item.id, item]));
    const menuRulesMap = new Map(menuRules.map(rule => [rule.menuItemId, rule.appliedOptions]));
    const optionsMap = new Map(options.map(opt => [opt.id, opt]));

    // 5. Calculate items using modifierPricingCalculator
    const calculatedItems: CalculatedOrderItem[] = [];

    for (const orderItem of input.items) {
      const menuItem = menuItemsMap.get(orderItem.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item ${orderItem.menuItemId} not found`);
      }

      const itemRules = menuRulesMap.get(orderItem.menuItemId);
      const selectedChoices = (orderItem.selectedOptions || []).map(opt => ({
        optionId: opt.optionId,
        choiceId: opt.choiceId,
        quantity: opt.quantity || 1,
      }));

      const priceResult = calculateItemTotalPrice(
        menuItem.price,
        itemRules ? { appliedOptions: itemRules as any[] } : null,
        selectedChoices,
        orderItem.quantity
      );

      // Build formatted options for display
      const formattedOptions = (orderItem.selectedOptions || []).map(opt => {
        const option = optionsMap.get(opt.optionId);
        const choice = option?.choices?.find((c: any) => c.id === opt.choiceId);
        const choiceBreakdown = priceResult.breakdown.choiceBreakdown.find(
          cb => cb.choiceId === opt.choiceId
        );

        return {
          name: option?.name || 'Unknown',
          choice: choice?.name || 'Unknown',
          priceAdjustment: choiceBreakdown?.finalPrice || 0,
        };
      });

      calculatedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        basePrice: menuItem.price,
        modifierPrice: priceResult.modifierPrice,
        finalPrice: priceResult.itemTotal,
        quantity: orderItem.quantity,
        total: priceResult.total,
        options: formattedOptions,
        specialInstructions: orderItem.specialInstructions,
      });

      console.log(`  ✅ ${menuItem.name}: $${priceResult.total.toFixed(2)}`);
    }

    // 6. Calculate subtotal
    const subtotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);
    console.log(`💰 Subtotal: $${subtotal.toFixed(2)}`);

    // 7. Calculate taxes using taxCalculator
    const taxSettings = (restaurant.financialSettings?.taxes as TaxSetting[]) || [];
    const taxItems: TaxCalculationItem[] = calculatedItems.map(item => ({
      name: item.name,
      price: item.finalPrice,
      quantity: item.quantity,
      total: item.total,
    }));
    const taxResult = calculateTaxes(subtotal, taxItems, taxSettings);
    console.log(`🧾 Tax: $${taxResult.totalTax.toFixed(2)}`);

    // 8. Calculate delivery fee if delivery order
    let deliveryFee = 0;
    let deliveryDetails: OrderCalculationResult['deliveryDetails'] = undefined;

    if (input.orderType === 'delivery' && restaurant.deliverySettings) {
      const { calculateDeliveryFee } = await import('@/lib/utils/deliveryFeeCalculator');

      const restaurantAddress = `${restaurant.street}, ${restaurant.city}, ${restaurant.state} ${restaurant.zipCode}`;
      const deliverySettings = restaurant.deliverySettings as any;
      const currencySymbol = restaurant.financialSettings?.currencySymbol || '$';

      const deliveryAddressOrCoords = deliverySettings.driverProvider === 'shipday'
        ? input.deliveryAddress!
        : (input.deliveryCoordinates
            ? { longitude: input.deliveryCoordinates.longitude, latitude: input.deliveryCoordinates.latitude }
            : input.deliveryAddress!);

      const deliveryResult = await calculateDeliveryFee(
        restaurantAddress,
        deliveryAddressOrCoords,
        deliverySettings,
        currencySymbol,
        restaurant.name,
        input.customerName,
        input.customerPhone,
        subtotal + taxResult.totalTax
      );

      if (deliveryResult.error) {
        throw new Error(deliveryResult.error);
      }

      deliveryFee = deliveryResult.deliveryFee;
      deliveryDetails = {
        distance: deliveryResult.distance || 0,
        distanceUnit: deliveryResult.distanceUnit || 'miles',
        provider: deliveryResult.provider || 'local',
        tierUsed: deliveryResult.tierUsed,
        withinRadius: deliveryResult.withinRadius ?? true,
      };

      console.log(`🚚 Delivery Fee: $${deliveryFee.toFixed(2)}`);
    }

    // 9. Calculate platform fee using feeCalculator (already in restaurant's currency)
    const globalFeeSettings = restaurant.financialSettings?.globalFee as GlobalFeeSettings;
    const feeResult = calculateGlobalFee(subtotal, globalFeeSettings);
    const platformFee = feeResult.platformFee;
    console.log(`💼 Platform Fee: $${platformFee.toFixed(2)}`);

    // 10. Calculate totals
    const tip = input.tip || 0;
    const driverTip = input.driverTip || 0;
    const total = subtotal + taxResult.totalTax + deliveryFee + tip + driverTip + platformFee;

    console.log(`💵 Total: $${total.toFixed(2)}`);
    console.log('=== ORDER CALCULATION SERVICE END ===');

    return {
      items: calculatedItems,
      subtotal,
      tax: taxResult.totalTax,
      taxBreakdown: taxResult.breakdown,
      deliveryFee,
      deliveryDetails,
      tip,
      driverTip,
      platformFee,
      total,
      currency: restaurant.financialSettings?.currency || 'USD',
      currencySymbol: restaurant.financialSettings?.currencySymbol || '$',
    };
  }
}
