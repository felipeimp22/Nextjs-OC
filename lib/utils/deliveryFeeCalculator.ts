/**
 * Delivery Fee Calculator Utility
 *
 * Calculates delivery fees based on:
 * 1. Local pricing tiers (restaurant's own delivery)
 * 2. Shipday integration (third-party delivery)
 *
 * Handles currency conversion and radius validation
 */

import { calculateDeliveryDistance, Coordinates } from './distanceCalculator';

export interface PricingTier {
  name: string;
  distanceCovered: number; // Maximum distance for this tier
  baseFee: number; // Base fee for distances within distanceCovered
  additionalFeePerUnit: number; // Fee per mile/km beyond distanceCovered
  isDefault?: boolean;
}

export interface DeliverySettings {
  enabled: boolean;
  distanceUnit: 'miles' | 'km';
  maximumRadius: number;
  driverProvider: 'local' | 'shipday';
  pricingTiers: PricingTier[];
  restaurantId?: string;
}

export interface DeliveryFeeResult {
  deliveryFee: number;
  distance: number;
  distanceUnit: 'miles' | 'km';
  withinRadius: boolean;
  provider: 'local' | 'shipday';
  tierUsed?: string;
  calculationDetails?: string;
  error?: string;
  currency?: string;
  originalFee?: number; // If currency conversion was applied
  originalCurrency?: string;
}

export interface ShipdayQuoteRequest {
  restaurantAddress: string;
  customerAddress: string;
  restaurantName?: string;
  customerName?: string;
  customerPhone?: string;
  orderValue?: number;
}

export interface ShipdayQuoteResponse {
  success: boolean;
  deliveryFee?: number;
  currency?: string;
  estimatedTime?: number; // in minutes
  carrierId?: string;
  carrierName?: string;
  error?: string;
}

/**
 * Calculate delivery fee using local pricing tiers
 */
export function calculateLocalDeliveryFee(
  distance: number,
  distanceUnit: 'miles' | 'km',
  pricingTiers: PricingTier[]
): {
  deliveryFee: number;
  tierUsed: string;
  calculationDetails: string;
} {
  console.log('💵 Calculating local delivery fee...');
  console.log('Distance:', `${distance} ${distanceUnit}`);
  console.log('Pricing tiers:', pricingTiers);

  // Find the default tier or the first tier
  const tier =
    pricingTiers.find((t) => t.isDefault) || pricingTiers[0];

  if (!tier) {
    console.error('❌ No pricing tier found');
    return {
      deliveryFee: 0,
      tierUsed: 'None',
      calculationDetails: 'No pricing tier available',
    };
  }

  let deliveryFee = 0;
  let calculationDetails = '';

  if (distance <= tier.distanceCovered) {
    // Within base distance - charge base fee only
    deliveryFee = tier.baseFee;
    calculationDetails = `Base fee for distances up to ${tier.distanceCovered} ${distanceUnit}: $${tier.baseFee.toFixed(2)}`;
  } else {
    // Beyond base distance - charge base fee + additional per unit
    const extraDistance = distance - tier.distanceCovered;
    const additionalFee = extraDistance * tier.additionalFeePerUnit;
    deliveryFee = tier.baseFee + additionalFee;
    calculationDetails = `Base fee ($${tier.baseFee.toFixed(2)}) + ${extraDistance.toFixed(2)} ${distanceUnit} × $${tier.additionalFeePerUnit.toFixed(2)} = $${deliveryFee.toFixed(2)}`;
  }

  console.log('✅ Local delivery fee calculated:', {
    tierUsed: tier.name,
    deliveryFee: `$${deliveryFee.toFixed(2)}`,
    details: calculationDetails,
  });

  return {
    deliveryFee: Number(deliveryFee.toFixed(2)),
    tierUsed: tier.name,
    calculationDetails,
  };
}

/**
 * Get delivery quote from Shipday API
 */
export async function getShipdayQuote(
  request: ShipdayQuoteRequest
): Promise<ShipdayQuoteResponse> {
  try {
    const apiKey = process.env.SHIPDAY_API_KEY;
    const baseUrl = process.env.SHIPDAY_BASE_URL || 'https://api.shipday.com';
    const dryRun = process.env.SHIPDAY_DRY_RUN === 'true';

    if (!apiKey) {
      console.error('❌ Shipday API key not configured');
      return {
        success: false,
        error: 'Shipday API key not configured',
      };
    }

    if (dryRun) {
      console.log('🧪 SHIPDAY DRY RUN MODE - Returning mock quote');
      // Return mock data for testing
      return {
        success: true,
        deliveryFee: 8.50,
        currency: 'USD',
        estimatedTime: 30,
        carrierId: 'mock-carrier',
        carrierName: 'Mock Carrier (Dry Run)',
      };
    }

    console.log('📦 Requesting Shipday quote...');
    console.log('Restaurant:', request.restaurantAddress);
    console.log('Customer:', request.customerAddress);

    // Shipday API endpoint for getting delivery quotes
    const url = `${baseUrl}/deliveries/quote`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pickupAddress: request.restaurantAddress,
        deliveryAddress: request.customerAddress,
        pickupBusinessName: request.restaurantName || 'Restaurant',
        deliveryName: request.customerName || 'Customer',
        deliveryPhoneNumber: request.customerPhone || '',
        orderValue: request.orderValue || 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Shipday API error:', response.status, errorText);
      return {
        success: false,
        error: `Shipday API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();

    console.log('✅ Shipday quote received:', data);

    // Parse Shipday response (adjust based on actual API response structure)
    // This is a placeholder - update based on actual Shipday API documentation
    const deliveryFee = data.deliveryFee || data.price || data.cost || 0;
    const currency = data.currency || 'USD';
    const estimatedTime = data.estimatedTime || data.eta || 0;

    return {
      success: true,
      deliveryFee: Number(deliveryFee),
      currency,
      estimatedTime,
      carrierId: data.carrierId || data.carrier_id,
      carrierName: data.carrierName || data.carrier_name,
    };
  } catch (error) {
    console.error('❌ Shipday quote error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Shipday error',
    };
  }
}

/**
 * Convert currency using a simple exchange rate API
 * In production, you should use a proper currency conversion service
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  try {
    // If same currency, no conversion needed
    if (fromCurrency === toCurrency) {
      return amount;
    }

    console.log(`💱 Converting ${amount} ${fromCurrency} to ${toCurrency}...`);

    // Use a free exchange rate API (you might want to use a paid service in production)
    const url = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('❌ Currency conversion API error');
      // Return original amount if conversion fails
      return amount;
    }

    const data = await response.json();
    const rate = data.rates[toCurrency];

    if (!rate) {
      console.error(`❌ Exchange rate not found for ${toCurrency}`);
      return amount;
    }

    const convertedAmount = amount * rate;
    console.log(`✅ Converted: ${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency} (rate: ${rate})`);

    return Number(convertedAmount.toFixed(2));
  } catch (error) {
    console.error('❌ Currency conversion error:', error);
    // Return original amount if conversion fails
    return amount;
  }
}

/**
 * Get restaurant currency from currency symbol
 * This is a helper to convert symbols like '$', '€', '£' to currency codes
 */
export function getCurrencyCodeFromSymbol(symbol: string): string {
  const symbolMap: { [key: string]: string } = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    '₹': 'INR',
    'R$': 'BRL',
    'C$': 'CAD',
    'A$': 'AUD',
    '₱': 'PHP',
    '₪': 'ILS',
    '₩': 'KRW',
    '฿': 'THB',
    'Rp': 'IDR',
    'RM': 'MYR',
    'S$': 'SGD',
  };

  return symbolMap[symbol] || 'USD';
}

/**
 * Main function to calculate delivery fee
 * Handles both local and Shipday providers
 */
export async function calculateDeliveryFee(
  restaurantAddress: string | Coordinates,
  deliveryAddress: string | Coordinates,
  deliverySettings: DeliverySettings,
  restaurantCurrencySymbol: string = '$',
  restaurantName?: string,
  customerName?: string,
  customerPhone?: string,
  orderValue?: number
): Promise<DeliveryFeeResult> {
  try {
    console.log('=== DELIVERY FEE CALCULATION ===');
    console.log('Provider:', deliverySettings.driverProvider);
    console.log('Restaurant currency:', restaurantCurrencySymbol);

    // Check if delivery is enabled
    if (!deliverySettings.enabled) {
      return {
        deliveryFee: 0,
        distance: 0,
        distanceUnit: deliverySettings.distanceUnit,
        withinRadius: false,
        provider: deliverySettings.driverProvider,
        error: 'Delivery not enabled',
      };
    }

    // Calculate distance
    // If deliveryAddress is already Coordinates, convert it to proper format
    const deliveryAddr = typeof deliveryAddress === 'string'
      ? deliveryAddress
      : deliveryAddress; // Coordinates object

    const distanceResult = await calculateDeliveryDistance(
      restaurantAddress,
      deliveryAddr,
      deliverySettings.maximumRadius,
      deliverySettings.distanceUnit
    );

    if (!distanceResult) {
      return {
        deliveryFee: 0,
        distance: 0,
        distanceUnit: deliverySettings.distanceUnit,
        withinRadius: false,
        provider: deliverySettings.driverProvider,
        error: 'Failed to calculate distance',
      };
    }

    // Check if within delivery radius
    if (!distanceResult.withinRadius) {
      return {
        deliveryFee: 0,
        distance: distanceResult.distance,
        distanceUnit: distanceResult.unit,
        withinRadius: false,
        provider: deliverySettings.driverProvider,
        error: `Delivery address is outside the ${deliverySettings.maximumRadius} ${deliverySettings.distanceUnit} delivery radius`,
      };
    }

    // Calculate fee based on provider
    if (deliverySettings.driverProvider === 'local') {
      // LOCAL DELIVERY - Use restaurant's pricing tiers
      const localFee = calculateLocalDeliveryFee(
        distanceResult.distance,
        deliverySettings.distanceUnit,
        deliverySettings.pricingTiers
      );

      return {
        deliveryFee: localFee.deliveryFee,
        distance: distanceResult.distance,
        distanceUnit: distanceResult.unit,
        withinRadius: true,
        provider: 'local',
        tierUsed: localFee.tierUsed,
        calculationDetails: localFee.calculationDetails,
        currency: getCurrencyCodeFromSymbol(restaurantCurrencySymbol),
      };
    } else {
      // SHIPDAY DELIVERY - Get quote from Shipday API
      const restaurantAddr = typeof restaurantAddress === 'string'
        ? restaurantAddress
        : `${restaurantAddress.latitude},${restaurantAddress.longitude}`;

      const shipdayQuote = await getShipdayQuote({
        restaurantAddress: restaurantAddr,
        customerAddress: deliveryAddress,
        restaurantName,
        customerName,
        customerPhone,
        orderValue,
      });

      if (!shipdayQuote.success || shipdayQuote.deliveryFee === undefined) {
        return {
          deliveryFee: 0,
          distance: distanceResult.distance,
          distanceUnit: distanceResult.unit,
          withinRadius: true,
          provider: 'shipday',
          error: shipdayQuote.error || 'Failed to get Shipday quote',
        };
      }

      // Convert currency if needed
      const restaurantCurrency = getCurrencyCodeFromSymbol(restaurantCurrencySymbol);
      const shipdayCurrency = shipdayQuote.currency || 'USD';

      let deliveryFee = shipdayQuote.deliveryFee;
      let originalFee: number | undefined;
      let originalCurrency: string | undefined;

      if (shipdayCurrency !== restaurantCurrency) {
        console.log(`🔄 Currency conversion needed: ${shipdayCurrency} → ${restaurantCurrency}`);
        originalFee = deliveryFee;
        originalCurrency = shipdayCurrency;
        deliveryFee = await convertCurrency(deliveryFee, shipdayCurrency, restaurantCurrency);
      }

      return {
        deliveryFee: Number(deliveryFee.toFixed(2)),
        distance: distanceResult.distance,
        distanceUnit: distanceResult.unit,
        withinRadius: true,
        provider: 'shipday',
        calculationDetails: `Shipday quote: ${shipdayQuote.carrierName || 'Carrier'} - ETA ${shipdayQuote.estimatedTime || 0} min`,
        currency: restaurantCurrency,
        originalFee,
        originalCurrency,
      };
    }
  } catch (error) {
    console.error('❌ Delivery fee calculation error:', error);
    return {
      deliveryFee: 0,
      distance: 0,
      distanceUnit: deliverySettings.distanceUnit,
      withinRadius: false,
      provider: deliverySettings.driverProvider,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate delivery settings
 */
export function validateDeliverySettings(
  settings: DeliverySettings
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!settings.distanceUnit || !['miles', 'km'].includes(settings.distanceUnit)) {
    errors.push('Invalid distance unit (must be "miles" or "km")');
  }

  if (settings.maximumRadius <= 0) {
    errors.push('Maximum radius must be greater than 0');
  }

  if (!['local', 'shipday'].includes(settings.driverProvider)) {
    errors.push('Invalid driver provider (must be "local" or "shipday")');
  }

  if (settings.driverProvider === 'local') {
    if (!settings.pricingTiers || settings.pricingTiers.length === 0) {
      errors.push('At least one pricing tier is required for local delivery');
    } else {
      settings.pricingTiers.forEach((tier, index) => {
        if (tier.baseFee < 0) {
          errors.push(`Tier ${index + 1}: Base fee cannot be negative`);
        }
        if (tier.distanceCovered <= 0) {
          errors.push(`Tier ${index + 1}: Distance covered must be greater than 0`);
        }
        if (tier.additionalFeePerUnit < 0) {
          errors.push(`Tier ${index + 1}: Additional fee per unit cannot be negative`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
