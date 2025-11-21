// lib/utils/orderDraftCalculator.ts

/**
 * Order Draft Calculator
 *
 * This service calculates order totals including:
 * - Menu items with complex modifiers
 * - Cross-option price adjustments
 * - Taxes (centralized)
 * - Delivery fees (distance-based)
 * - Platform fees
 * - Tips
 *
 * Use this for:
 * 1. Shopping cart price preview
 * 2. Order submission validation
 * 3. Price consistency checks
 */

import { calculateTaxes, TaxSetting, TaxCalculationItem } from './taxCalculator';
import { calculateDeliveryFee, DeliveryPricingTier, GeoLocation, checkDeliveryDistance } from './distance';
import { DeliveryFactory } from '../delivery';
import { calculateItemTotalPrice } from './modifierPricingCalculator';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export interface Option {
  id: string;
  name: string;
  choices: Choice[];
}

export interface Choice {
  id: string;
  name: string;
  basePrice: number;
}

export interface AppliedOption {
  optionId: string;
  required: boolean;
  order: number;
  choiceAdjustments: ChoiceAdjustment[];
}

export interface ChoiceAdjustment {
  choiceId: string;
  priceAdjustment: number;
  isAvailable: boolean;
  isDefault: boolean;
  adjustments?: PriceAdjustment[];
}

export interface PriceAdjustment {
  targetOptionId: string;
  targetChoiceId?: string;
  adjustmentType: 'multiplier' | 'addition' | 'fixed';
  value: number;
}

export interface SelectedOption {
  optionId: string;
  choiceId: string;
  quantity?: number;
}

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  selectedOptions?: SelectedOption[];
  specialInstructions?: string;
}

export interface OrderItemResult {
  menuItemId: string;
  name: string;
  basePrice: number;
  adjustments: number;
  finalPrice: number;
  quantity: number;
  total: number;
  options: {
    name: string;
    choice: string;
    priceAdjustment: number;
  }[];
  specialInstructions?: string;
}

export interface GlobalFee {
  enabled: boolean;
  threshold: number;
  belowPercent: number;
  aboveFlat: number;
}

export interface OrderDraftInput {
  restaurantId: string;
  items: OrderItemInput[];
  orderType: 'pickup' | 'delivery' | 'dine_in';
  tip?: number;

  // Location data (for delivery)
  restaurantLocation?: GeoLocation;
  customerLocation?: GeoLocation;
  deliveryDistance?: number;

  // Settings (usually fetched from DB)
  taxSettings?: TaxSetting[];
  deliveryPricingTiers?: DeliveryPricingTier[];
  globalFee?: GlobalFee;
  distanceUnit?: 'km' | 'miles';
  useDeliveryProvider?: boolean; // Use external provider for estimate
}

export interface OrderDraftResult {
  items: OrderItemResult[];
  subtotal: number;
  tax: number;
  taxBreakdown: {
    name: string;
    rate: number | null;
    amount: number;
  }[];
  deliveryFee: number;
  deliveryDetails?: {
    distance?: number;
    tierUsed?: string;
    provider?: string;
  };
  tip: number;
  platformFee: number;
  total: number;
}

const toCents = (dollars: number) => Math.round(dollars * 100);
const toDollars = (cents: number) => Number((cents / 100).toFixed(2));

/**
 * Calculate order draft (shopping cart preview)
 */
export async function calculateOrderDraft(
  input: OrderDraftInput,
  menuItems: Map<string, MenuItem>,
  menuRules: Map<string, AppliedOption[]>,
  options: Map<string, Option>
): Promise<OrderDraftResult> {
  console.log('🧮 === ORDER DRAFT CALCULATION START ===');
  console.log(`📦 Items: ${input.items.length}, Order Type: ${input.orderType}`);

  // ========================================
  // STEP 1: Calculate Item Prices with Modifiers
  // ========================================

  const calculatedItems: OrderItemResult[] = [];

  // Use centralized pricing calculator for consistent pricing across all flows
  for (const orderItem of input.items) {
    const menuItem = menuItems.get(orderItem.menuItemId);

    if (!menuItem) {
      throw new Error(`Menu item ${orderItem.menuItemId} not found`);
    }

    const appliedOptions = menuRules.get(orderItem.menuItemId);
    const selectedChoices = orderItem.selectedOptions || [];

    // Calculate using centralized logic
    // Note: Type cast needed because both files define similar but incompatible interfaces
    const pricingResult = calculateItemTotalPrice(
      menuItem.price,
      appliedOptions ? { appliedOptions: appliedOptions as any } : null,
      selectedChoices,
      1 // Calculate for single unit, will multiply by quantity later
    );

    // Format options for storage (map choice IDs back to names for display)
    const formattedOptions = selectedChoices.map(selected => {
      const option = options.get(selected.optionId);
      const choice = option?.choices.find((c: any) => c.id === selected.choiceId);

      // Find the price breakdown for this choice from the centralized calculator
      const choiceBreakdown = pricingResult.breakdown.choiceBreakdown.find(
        cb => cb.choiceId === selected.choiceId
      );

      // Use the final price from the calculator (includes all cross-option adjustments)
      const finalChoicePrice = choiceBreakdown ? choiceBreakdown.finalPrice : 0;

      return {
        name: option?.name || '',
        choice: choice?.name || '',
        priceAdjustment: finalChoicePrice,
      };
    });

    const itemTotal = pricingResult.itemTotal * orderItem.quantity;

    console.log(`✅ Item "${menuItem.name}": Base $${menuItem.price.toFixed(2)} + Modifiers $${pricingResult.modifierPrice.toFixed(2)} = $${pricingResult.itemTotal.toFixed(2)} × ${orderItem.quantity} = $${itemTotal.toFixed(2)}`);

    // Log any pricing errors from the calculator
    if (pricingResult.breakdown.errors.length > 0) {
      console.warn('⚠️ Pricing calculation errors:', pricingResult.breakdown.errors);
    }

    calculatedItems.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      basePrice: menuItem.price,
      adjustments: pricingResult.modifierPrice,
      finalPrice: pricingResult.itemTotal,
      quantity: orderItem.quantity,
      total: itemTotal,
      options: formattedOptions,
      specialInstructions: orderItem.specialInstructions,
    });
  }

  // ========================================
  // STEP 2: Calculate Subtotal
  // ========================================

  const subtotalCents = calculatedItems.reduce((sum, item) => sum + toCents(item.total), 0);
  const subtotal = toDollars(subtotalCents);

  console.log(`💰 Subtotal: $${subtotal.toFixed(2)}`);

  // ========================================
  // STEP 3: Calculate Taxes
  // ========================================

  let taxCents = 0;
  let taxBreakdown: any[] = [];

  if (input.taxSettings && input.taxSettings.length > 0) {
    const taxItems: TaxCalculationItem[] = calculatedItems.map(item => ({
      name: item.name,
      price: item.finalPrice,
      quantity: item.quantity,
      total: item.total,
    }));

    const taxResult = calculateTaxes(subtotal, taxItems, input.taxSettings);
    taxCents = toCents(taxResult.totalTax);
    taxBreakdown = taxResult.breakdown;

    console.log(`🧾 Taxes: $${taxResult.totalTax.toFixed(2)}`);
  }

  // ========================================
  // STEP 4: Calculate Delivery Fee
  // ========================================

  let deliveryFeeCents = 0;
  let deliveryDetails: any = {};

  if (input.orderType === 'delivery') {
    if (input.useDeliveryProvider && input.restaurantLocation && input.customerLocation) {
      // Use external delivery provider for estimate
      try {
        const deliveryProvider = await DeliveryFactory.getProvider();
        const estimate = await deliveryProvider.getEstimate({
          pickupAddress: input.restaurantLocation as any, // Type cast for simplicity
          deliveryAddress: input.customerLocation as any,
        });

        deliveryFeeCents = toCents(estimate.fee);
        deliveryDetails = {
          distance: estimate.distance,
          provider: estimate.provider,
        };

        console.log(`🚚 Delivery (${estimate.provider}): $${estimate.fee.toFixed(2)}`);
      } catch (error) {
        console.warn('⚠️ Delivery provider estimate failed, using manual calculation');
      }
    }

    // Fallback to manual calculation
    if (deliveryFeeCents === 0 && input.deliveryPricingTiers && input.deliveryPricingTiers.length > 0) {
      let distance = input.deliveryDistance || 0;

      // Calculate distance if locations provided
      if (!distance && input.restaurantLocation && input.customerLocation) {
        const distanceResult = checkDeliveryDistance(
          input.restaurantLocation,
          input.customerLocation,
          100, // Large radius for estimation
          input.distanceUnit || 'miles'
        );
        distance = distanceResult.distance;
      }

      const feeResult = calculateDeliveryFee(
        distance,
        input.deliveryPricingTiers,
        input.distanceUnit || 'miles'
      );

      deliveryFeeCents = toCents(feeResult.totalFee);
      deliveryDetails = {
        distance: feeResult.distance,
        tierUsed: feeResult.tierUsed,
      };

      console.log(`🚚 Delivery: $${feeResult.totalFee.toFixed(2)} (${feeResult.tierUsed})`);
    }
  }

  // ========================================
  // STEP 5: Calculate Platform Fee
  // ========================================

  let platformFeeCents = 0;

  if (input.globalFee && input.globalFee.enabled) {
    const thresholdCents = toCents(input.globalFee.threshold);

    if (subtotalCents < thresholdCents) {
      platformFeeCents = Math.round((subtotalCents * input.globalFee.belowPercent) / 100);
      console.log(`💼 Platform Fee (${input.globalFee.belowPercent}%): $${toDollars(platformFeeCents).toFixed(2)}`);
    } else {
      platformFeeCents = toCents(input.globalFee.aboveFlat);
      console.log(`💼 Platform Fee (flat): $${input.globalFee.aboveFlat.toFixed(2)}`);
    }
  }

  // ========================================
  // STEP 6: Add Tip
  // ========================================

  const tipCents = input.tip ? toCents(input.tip) : 0;

  if (tipCents > 0) {
    console.log(`💝 Tip: $${toDollars(tipCents).toFixed(2)}`);
  }

  // ========================================
  // STEP 7: Calculate Total
  // ========================================

  const totalCents = subtotalCents + taxCents + deliveryFeeCents + tipCents + platformFeeCents;

  console.log(`💵 TOTAL: $${toDollars(totalCents).toFixed(2)}`);
  console.log('🧮 === ORDER DRAFT CALCULATION END ===\n');

  return {
    items: calculatedItems,
    subtotal: toDollars(subtotalCents),
    tax: toDollars(taxCents),
    taxBreakdown,
    deliveryFee: toDollars(deliveryFeeCents),
    deliveryDetails,
    tip: toDollars(tipCents),
    platformFee: toDollars(platformFeeCents),
    total: toDollars(totalCents),
  };
}
