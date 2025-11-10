'use server';

import { searchAddresses, retrieveAddress, parseAddress, validateAddressHasHouseNumber } from '@/lib/utils/mapbox';
import type { AddressComponents } from '@/lib/utils/mapbox';

export async function searchAddressesAction(query: string) {
  try {
    if (!query || query.length < 3) {
      return {
        success: false,
        error: 'Search query must be at least 3 characters',
      };
    }

    const results = await searchAddresses(query);

    return {
      success: true,
      data: results.features || [],
    };
  } catch (error: any) {
    console.error('Address search error:', error);
    return {
      success: false,
      error: error.message || 'Failed to search addresses',
    };
  }
}

export async function retrieveAddressAction(mapboxId: string) {
  try {
    if (!mapboxId) {
      return {
        success: false,
        error: 'Mapbox ID is required',
      };
    }

    const feature = await retrieveAddress(mapboxId);
    const addressComponents = parseAddress(feature);

    if (!validateAddressHasHouseNumber(addressComponents)) {
      return {
        success: false,
        error: 'Please select an address with a house number for delivery',
        data: addressComponents,
      };
    }

    return {
      success: true,
      data: addressComponents,
    };
  } catch (error: any) {
    console.error('Address retrieval error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve address',
    };
  }
}
