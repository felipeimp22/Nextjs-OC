// lib/utils/distance.ts

import axios from 'axios';

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  geoLocation?: GeoLocation;
}

export interface DistanceResult {
  distance: number; // in the requested unit
  isWithinRadius: boolean;
  unit: 'km' | 'miles';
}

export interface DeliveryFeeResult {
  baseFee: number;
  distanceFee: number;
  totalFee: number;
  distance: number;
  distanceUnit: string;
  tierUsed?: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateHaversineDistance(
  coord1: GeoLocation,
  coord2: GeoLocation,
  unit: 'km' | 'miles' = 'km'
): number {
  const R = unit === 'miles' ? 3959 : 6371; // Earth radius in miles or km

  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Number(distance.toFixed(3));
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Check if distance is within radius
 */
export function isWithinRadius(
  distance: number,
  maxRadius: number
): boolean {
  return distance <= maxRadius;
}

/**
 * Calculate distance and check if within delivery radius
 */
export function checkDeliveryDistance(
  origin: GeoLocation,
  destination: GeoLocation,
  maxRadius: number,
  unit: 'km' | 'miles' = 'km'
): DistanceResult {
  const distance = calculateHaversineDistance(origin, destination, unit);

  return {
    distance,
    isWithinRadius: isWithinRadius(distance, maxRadius),
    unit,
  };
}

/**
 * Geocode address using Mapbox
 */
export async function geocodeAddress(address: Address): Promise<GeoLocation> {
  try {
    const mapboxToken = process.env.MAPBOX_TOKEN;

    if (!mapboxToken) {
      throw new Error('Mapbox token not configured');
    }

    const mapboxUrl = process.env.MAPBOX_URL_GEOCODING || 'https://api.mapbox.com/geocoding/v5/mapbox.places';

    // Build query string
    const query = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}${address.country ? ', ' + address.country : ''}`;

    console.log('🗺️  Geocoding address:', query);

    const response: any = await axios.get( 
      `${mapboxUrl}/${encodeURIComponent(query)}.json`,
      {
        params: {
          access_token: mapboxToken,
          limit: 1,
          types: 'address',
        },
      }
    );

    if (!response.data.features || response.data.features.length === 0) {
      throw new Error('Address not found');
    }

    const [lng, lat] = response.data.features[0].center;

    console.log('✅ Address geocoded:', { lat, lng });

    return { lat, lng };
  } catch (error: any) {
    console.error('❌ Geocoding failed:', error.message);
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
}

/**
 * Calculate delivery fee based on distance and pricing tiers
 * NEW: Supports distance-based pricing with base fee + per unit charge
 */
export interface DeliveryPricingTier {
  name: string;
  distanceCovered: number; // Maximum distance this tier covers
  baseFee: number; // Base fee for distances up to distanceCovered
  additionalFeePerUnit: number; // Fee per unit AFTER distanceCovered
  isDefault: boolean;
}

export function calculateDeliveryFee(
  distance: number,
  pricingTiers: DeliveryPricingTier[],
  distanceUnit: 'km' | 'miles' = 'km'
): DeliveryFeeResult {
  // Sort tiers by distanceCovered to find the right one
  const sortedTiers = [...pricingTiers].sort((a, b) => a.distanceCovered - b.distanceCovered);

  // Find the appropriate tier
  let applicableTier = sortedTiers.find(tier => tier.isDefault);

  for (const tier of sortedTiers) {
    if (distance <= tier.distanceCovered) {
      applicableTier = tier;
      break;
    }
  }

  if (!applicableTier) {
    // If no tier found, use the last tier (highest coverage)
    applicableTier = sortedTiers[sortedTiers.length - 1];
  }

  // Calculate fees
  const baseFee = applicableTier.baseFee; // ✅ Changed to const
  let distanceFee = 0;

  // If distance exceeds the tier's covered distance, calculate additional fee
  if (distance > applicableTier.distanceCovered) {
    const excessDistance = distance - applicableTier.distanceCovered;
    distanceFee = excessDistance * applicableTier.additionalFeePerUnit;
  }

  const totalFee = baseFee + distanceFee;

  console.log('💰 Delivery fee calculated:', {
    tier: applicableTier.name,
    distance: `${distance.toFixed(2)} ${distanceUnit}`,
    baseFee: `$${baseFee.toFixed(2)}`,
    distanceFee: `$${distanceFee.toFixed(2)}`,
    totalFee: `$${totalFee.toFixed(2)}`,
  });

  return {
    baseFee: Number(baseFee.toFixed(2)),
    distanceFee: Number(distanceFee.toFixed(2)),
    totalFee: Number(totalFee.toFixed(2)),
    distance: Number(distance.toFixed(2)),
    distanceUnit,
    tierUsed: applicableTier.name,
  };
}

/**
 * Reverse geocode coordinates to address using Mapbox
 */
export async function reverseGeocode(location: GeoLocation): Promise<Address> {
  try {
    const mapboxToken = process.env.MAPBOX_TOKEN;

    if (!mapboxToken) {
      throw new Error('Mapbox token not configured');
    }

    const mapboxUrl = process.env.MAPBOX_URL_GEOCODING || 'https://api.mapbox.com/geocoding/v5/mapbox.places';

    console.log('🗺️  Reverse geocoding:', location);

    const response: any = await axios.get( // ✅ Type as any
      `${mapboxUrl}/${location.lng},${location.lat}.json`,
      {
        params: {
          access_token: mapboxToken,
          limit: 1,
          types: 'address',
        },
      }
    );

    if (!response.data.features || response.data.features.length === 0) {
      throw new Error('Address not found for coordinates');
    }

    const feature = response.data.features[0];
    const context = feature.context || [];

    const getContext = (type: string) =>
      context.find((c: any) => c.id.startsWith(type))?.text || '';

    const address: Address = {
      street: feature.properties.address
        ? `${feature.properties.address} ${feature.text}`
        : feature.text,
      city: getContext('place') || '',
      state: getContext('region') || '',
      zipCode: getContext('postcode') || '',
      country: getContext('country') || '',
      geoLocation: location,
    };

    console.log('✅ Reverse geocoded:', address.street);

    return address;
  } catch (error: any) {
    console.error('❌ Reverse geocoding failed:', error.message);
    throw new Error(`Failed to reverse geocode: ${error.message}`);
  }
}