/**
 * Distance Calculator Utility
 *
 * Calculates distance between two coordinates using Mapbox API
 * Supports both miles and kilometers
 */

export interface Coordinates {
  longitude: number;
  latitude: number;
}

export interface DistanceResult {
  distance: number; // in the specified unit (miles or km)
  unit: 'miles' | 'km';
  withinRadius: boolean;
  maximumRadius: number;
}

export interface GeocodingResult {
  success: boolean;
  coordinates?: Coordinates;
  address?: string;
  error?: string;
}

/**
 * Convert meters to miles
 */
export function metersToMiles(meters: number): number {
  return meters * 0.000621371;
}

/**
 * Convert meters to kilometers
 */
export function metersToKilometers(meters: number): number {
  return meters / 1000;
}

/**
 * Convert miles to meters
 */
export function milesToMeters(miles: number): number {
  return miles / 0.000621371;
}

/**
 * Convert kilometers to meters
 */
export function kilometersToMeters(km: number): number {
  return km * 1000;
}

/**
 * Geocode an address to coordinates using Mapbox Geocoding API
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodingResult> {
  try {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!mapboxToken) {
      console.error('❌ Mapbox access token not configured');
      return {
        success: false,
        error: 'Mapbox access token not configured',
      };
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&limit=1`;

    console.log('🌍 Geocoding address:', address);

    const response = await fetch(url);

    if (!response.ok) {
      console.error('❌ Mapbox geocoding failed:', response.statusText);
      return {
        success: false,
        error: `Geocoding failed: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.error('❌ Address not found');
      return {
        success: false,
        error: 'Address not found',
      };
    }

    const feature = data.features[0];
    const [longitude, latitude] = feature.center;

    console.log('✅ Geocoding successful:', {
      address: feature.place_name,
      coordinates: { longitude, latitude },
    });

    return {
      success: true,
      coordinates: { longitude, latitude },
      address: feature.place_name,
    };
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown geocoding error',
    };
  }
}

/**
 * Calculate straight-line distance between two coordinates (Haversine formula)
 * This is a fallback if Mapbox API is not available
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceInMeters = R * c;
  return distanceInMeters;
}

/**
 * Calculate driving distance between two coordinates using Mapbox Directions API
 */
export async function calculateDrivingDistance(
  origin: Coordinates,
  destination: Coordinates,
  unit: 'miles' | 'km' = 'miles'
): Promise<DistanceResult | null> {
  try {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!mapboxToken) {
      console.error('❌ Mapbox access token not configured, falling back to Haversine');
      // Fallback to straight-line distance
      const distanceInMeters = calculateHaversineDistance(origin, destination);
      const distance = unit === 'miles'
        ? metersToMiles(distanceInMeters)
        : metersToKilometers(distanceInMeters);

      return {
        distance: Number(distance.toFixed(2)),
        unit,
        withinRadius: true, // Will be checked by caller
        maximumRadius: 0,
      };
    }

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?access_token=${mapboxToken}`;

    console.log('🚗 Calculating driving distance...');
    console.log('Origin:', origin);
    console.log('Destination:', destination);

    const response = await fetch(url);

    if (!response.ok) {
      console.error('❌ Mapbox directions API failed:', response.statusText);
      // Fallback to Haversine
      const distanceInMeters = calculateHaversineDistance(origin, destination);
      const distance = unit === 'miles'
        ? metersToMiles(distanceInMeters)
        : metersToKilometers(distanceInMeters);

      return {
        distance: Number(distance.toFixed(2)),
        unit,
        withinRadius: true,
        maximumRadius: 0,
      };
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.error('❌ No route found');
      return null;
    }

    const route = data.routes[0];
    const distanceInMeters = route.distance;

    const distance = unit === 'miles'
      ? metersToMiles(distanceInMeters)
      : metersToKilometers(distanceInMeters);

    console.log('✅ Distance calculated:', {
      distance: `${distance.toFixed(2)} ${unit}`,
      duration: `${(route.duration / 60).toFixed(0)} minutes`,
    });

    return {
      distance: Number(distance.toFixed(2)),
      unit,
      withinRadius: true, // Will be checked by caller
      maximumRadius: 0,
    };
  } catch (error) {
    console.error('❌ Distance calculation error:', error);
    // Fallback to Haversine
    const distanceInMeters = calculateHaversineDistance(origin, destination);
    const distance = unit === 'miles'
      ? metersToMiles(distanceInMeters)
      : metersToKilometers(distanceInMeters);

    return {
      distance: Number(distance.toFixed(2)),
      unit,
      withinRadius: true,
      maximumRadius: 0,
    };
  }
}

/**
 * Calculate distance between restaurant and delivery address
 * Returns distance and whether it's within the maximum radius
 */
export async function calculateDeliveryDistance(
  restaurantAddress: string | Coordinates,
  deliveryAddress: string,
  maximumRadius: number,
  unit: 'miles' | 'km' = 'miles'
): Promise<DistanceResult | null> {
  try {
    console.log('📍 Calculating delivery distance...');
    console.log('Restaurant:', restaurantAddress);
    console.log('Delivery address:', deliveryAddress);
    console.log('Maximum radius:', `${maximumRadius} ${unit}`);

    // Geocode restaurant address if it's a string
    let restaurantCoords: Coordinates;
    if (typeof restaurantAddress === 'string') {
      const restaurantGeocode = await geocodeAddress(restaurantAddress);
      if (!restaurantGeocode.success || !restaurantGeocode.coordinates) {
        console.error('❌ Failed to geocode restaurant address');
        return null;
      }
      restaurantCoords = restaurantGeocode.coordinates;
    } else {
      restaurantCoords = restaurantAddress;
    }

    // Geocode delivery address
    const deliveryGeocode = await geocodeAddress(deliveryAddress);
    if (!deliveryGeocode.success || !deliveryGeocode.coordinates) {
      console.error('❌ Failed to geocode delivery address');
      return null;
    }

    // Calculate driving distance
    const result = await calculateDrivingDistance(
      restaurantCoords,
      deliveryGeocode.coordinates,
      unit
    );

    if (!result) {
      return null;
    }

    // Check if within radius
    const withinRadius = result.distance <= maximumRadius;

    console.log('📊 Distance result:', {
      distance: `${result.distance} ${unit}`,
      maximumRadius: `${maximumRadius} ${unit}`,
      withinRadius,
    });

    return {
      ...result,
      withinRadius,
      maximumRadius,
    };
  } catch (error) {
    console.error('❌ Delivery distance calculation error:', error);
    return null;
  }
}
