/**
 * Currency Converter Utility
 *
 * Handles currency conversion for platform fees
 * Platform fees are always charged in USD, so we need to convert
 * the restaurant's local currency to USD for display purposes
 *
 * Uses live exchange rates or fallback to approximate rates
 */

export interface ExchangeRates {
  [key: string]: number;
}

// Approximate exchange rates (USD as base currency = 1.00)
// These are fallback rates - in production, you should fetch live rates
export const FALLBACK_EXCHANGE_RATES: ExchangeRates = {
  USD: 1.00,
  CAD: 1.35,
  MXN: 17.00,
  BRL: 5.00,
  ARS: 350.00,
  CLP: 900.00,
  COP: 4000.00,
  PEN: 3.75,
  VES: 36.00,
  UYU: 39.00,
  PYG: 7200.00,
  BOB: 6.90,
  GYD: 209.00,
  SRD: 35.00,
  GTQ: 7.80,
  HNL: 24.70,
  NIO: 36.70,
  CRC: 520.00,
  PAB: 1.00,
  DOP: 56.50,
  CUP: 24.00,
  HTG: 132.00,
  JMD: 155.00,
  TTD: 6.80,
  BZD: 2.00,
  BBD: 2.00,
  XCD: 2.70,
};

/**
 * Convert amount from one currency to another
 * @param amount - Amount in source currency
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code (default: USD)
 * @param rates - Exchange rates object (optional, uses fallback if not provided)
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string = 'USD',
  rates: ExchangeRates = FALLBACK_EXCHANGE_RATES
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];

  if (!fromRate || !toRate) {
    console.warn(`Exchange rate not found for ${fromCurrency} or ${toCurrency}, returning original amount`);
    return amount;
  }

  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  const convertedAmount = usdAmount * toRate;

  return Number(convertedAmount.toFixed(2));
}

/**
 * Format currency amount with symbol
 * @param amount - Amount to format
 * @param currency - Currency code
 * @param symbol - Currency symbol (optional)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string,
  symbol?: string
): string {
  const formattedAmount = amount.toFixed(2);

  if (symbol) {
    return `${symbol}${formattedAmount}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Convert platform fee from USD to restaurant currency
 * Platform fees are always in USD, but we need to show the customer
 * the equivalent in their local currency
 *
 * @param platformFeeUSD - Platform fee in USD
 * @param restaurantCurrency - Restaurant's currency code
 * @param rates - Exchange rates (optional)
 * @returns Platform fee in restaurant currency
 */
export function convertPlatformFeeToLocal(
  platformFeeUSD: number,
  restaurantCurrency: string,
  rates: ExchangeRates = FALLBACK_EXCHANGE_RATES
): number {
  return convertCurrency(platformFeeUSD, 'USD', restaurantCurrency, rates);
}

/**
 * Fetch live exchange rates from an API
 * You can implement this to use a service like:
 * - Exchange Rate API (exchangerate-api.com)
 * - Open Exchange Rates (openexchangerates.org)
 * - Fixer.io
 *
 * @returns Exchange rates with USD as base
 */
export async function fetchLiveExchangeRates(): Promise<ExchangeRates> {
  try {
    // Example implementation (you'll need to add API key to env)
    // const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
    // const data = await response.json();
    // return data.rates;

    // For now, return fallback rates
    return FALLBACK_EXCHANGE_RATES;
  } catch (error) {
    console.error('Failed to fetch live exchange rates, using fallback', error);
    return FALLBACK_EXCHANGE_RATES;
  }
}
