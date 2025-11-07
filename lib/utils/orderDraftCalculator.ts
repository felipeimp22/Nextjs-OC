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

  for (const orderItem of input.items) {
    const menuItem = menuItems.get(orderItem.menuItemId);

    if (!menuItem) {
      throw new Error(`Menu item ${orderItem.menuItemId} not found`);
    }

    const appliedOptions = menuRules.get(orderItem.menuItemId) || [];

    // Initialize item calculation
    let basePrice = menuItem.price;
    let adjustments = 0;
    const formattedOptions: { name: string; choice: string; priceAdjustment: number }[] = [];

    // If no options selected, use base price
    if (!orderItem.selectedOptions || orderItem.selectedOptions.length === 0) {
      calculatedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        basePrice,
        adjustments: 0,
        finalPrice: basePrice,
        quantity: orderItem.quantity,
        total: basePrice * orderItem.quantity,
        options: [],
        specialInstructions: orderItem.specialInstructions,
      });
      continue;
    }

    // Build map of selected options
    const selectedOptionsMap = new Map<string, SelectedOption>();
    orderItem.selectedOptions.forEach(selected => {
      selectedOptionsMap.set(`${selected.optionId}-${selected.choiceId}`, selected);
    });

    // Calculate direct option prices (no cross-option adjustments yet)
    for (const selectedOption of orderItem.selectedOptions) {
      const { optionId, choiceId, quantity: optionQuantity = 1 } = selectedOption;

      const appliedOption = appliedOptions.find(ao => ao.optionId === optionId);
      if (!appliedOption) continue;

      const option = options.get(optionId);
      if (!option) continue;

      const choice = option.choices.find(c => c.id === choiceId);
      if (!choice) continue;

      const choiceAdjustment = appliedOption.choiceAdjustments.find(
        ca => ca.choiceId === choiceId
      );
      if (!choiceAdjustment) continue;

      // Check for fixed price adjustment (highest priority)
      const hasFixedPrice = choiceAdjustment.adjustments?.some(
        adj => adj.adjustmentType === 'fixed' && !adj.targetOptionId
      );

      if (hasFixedPrice) {
        const fixedAdj = choiceAdjustment.adjustments!.find(
          adj => adj.adjustmentType === 'fixed' && !adj.targetOptionId
        );

        if (fixedAdj) {
          const fixedPrice = fixedAdj.value * optionQuantity;
          adjustments += fixedPrice;

          formattedOptions.push({
            name: option.name,
            choice: choice.name,
            priceAdjustment: fixedPrice / optionQuantity,
          });

          console.log(`  💰 ${option.name} (${choice.name}): Fixed price $${fixedPrice.toFixed(2)}`);
          continue;
        }
      }

      // Calculate normal price
      const choiceBasePrice = choice.basePrice || 0;
      const choicePriceAdjustment = choiceAdjustment.priceAdjustment || 0;
      let optionPrice = (choiceBasePrice + choicePriceAdjustment) * optionQuantity;

      // Apply self-adjustments (non-targeting)
      if (choiceAdjustment.adjustments) {
        for (const adjustment of choiceAdjustment.adjustments) {
          if (adjustment.targetOptionId) continue; // Skip cross-option adjustments for now
          if (adjustment.adjustmentType === 'fixed') continue; // Already handled

          switch (adjustment.adjustmentType) {
            case 'multiplier':
              optionPrice = optionPrice * adjustment.value;
              console.log(`  ✖️  Multiplier ${adjustment.value}x: $${optionPrice.toFixed(2)}`);
              break;
            case 'addition':
              optionPrice += adjustment.value * optionQuantity;
              console.log(`  ➕ Addition +$${adjustment.value.toFixed(2)}: $${optionPrice.toFixed(2)}`);
              break;
          }
        }
      }

      adjustments += optionPrice;

      formattedOptions.push({
        name: option.name,
        choice: choice.name,
        priceAdjustment: optionPrice / optionQuantity,
      });

      console.log(`  💵 ${option.name} (${choice.name}): $${optionPrice.toFixed(2)}`);
    }

    // Process cross-option adjustments
    for (const selectedOption of orderItem.selectedOptions) {
      const { optionId, choiceId } = selectedOption;

      const appliedOption = appliedOptions.find(ao => ao.optionId === optionId);
      if (!appliedOption) continue;

      const choiceAdjustment = appliedOption.choiceAdjustments.find(
        ca => ca.choiceId === choiceId
      );
      if (!choiceAdjustment || !choiceAdjustment.adjustments) continue;

      for (const adjustment of choiceAdjustment.adjustments) {
        if (!adjustment.targetOptionId) continue; // Only process cross-option adjustments

        const targetOptionId = adjustment.targetOptionId;
        const targetChoiceId = adjustment.targetChoiceId;

        // Find target in selected options
        for (const targetOption of orderItem.selectedOptions) {
          if (targetOption.optionId !== targetOptionId) continue;
          if (targetChoiceId && targetOption.choiceId !== targetChoiceId) continue;

          const targetQuantity = targetOption.quantity || 1;
          const option = options.get(targetOption.optionId);
          const choice = option?.choices.find(c => c.id === targetOption.choiceId);

          if (!option || !choice) continue;

          // Calculate original price of target
          const targetAppliedOption = appliedOptions.find(ao => ao.optionId === targetOptionId);
          const targetChoiceAdjustment = targetAppliedOption?.choiceAdjustments.find(
            ca => ca.choiceId === targetOption.choiceId
          );

          const originalPrice = (choice.basePrice || 0) + (targetChoiceAdjustment?.priceAdjustment || 0);
          const originalTotal = originalPrice * targetQuantity;

          let adjustmentAmount = 0;

          switch (adjustment.adjustmentType) {
            case 'addition':
              adjustmentAmount = adjustment.value * targetQuantity;
              console.log(`  🔗 Cross-addition: +$${adjustmentAmount.toFixed(2)}`);
              break;
            case 'multiplier':
              adjustmentAmount = originalTotal * (adjustment.value - 1);
              console.log(`  🔗 Cross-multiplier ${adjustment.value}x: +$${adjustmentAmount.toFixed(2)}`);
              break;
            case 'fixed':
              adjustmentAmount = (adjustment.value * targetQuantity) - originalTotal;
              console.log(`  🔗 Cross-fixed $${adjustment.value.toFixed(2)}: +$${adjustmentAmount.toFixed(2)}`);
              break;
          }

          adjustments += adjustmentAmount;

          // Update formatted option
          const targetOptionIndex = formattedOptions.findIndex(
            opt => opt.name === option.name && opt.choice === choice.name
          );

          if (targetOptionIndex !== -1) {
            formattedOptions[targetOptionIndex].priceAdjustment +=
              adjustmentAmount / targetQuantity;
          }
        }
      }
    }

    const finalPrice = basePrice + adjustments;
    const total = finalPrice * orderItem.quantity;

    console.log(`✅ Item "${menuItem.name}": Base $${basePrice.toFixed(2)} + Adjustments $${adjustments.toFixed(2)} = $${finalPrice.toFixed(2)} × ${orderItem.quantity} = $${total.toFixed(2)}`);

    calculatedItems.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      basePrice,
      adjustments,
      finalPrice,
      quantity: orderItem.quantity,
      total,
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
