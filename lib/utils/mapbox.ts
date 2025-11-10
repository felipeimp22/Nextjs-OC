export interface MapboxFeature {
  id: string;
  type: string;
  place_type: string[];
  place_name: string;
  text: string;
  center: [number, number];
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    mapbox_id?: string;
    full_address?: string;
    address?: string;
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

export interface MapboxSearchResult {
  type: string;
  features: MapboxFeature[];
}

export interface AddressComponents {
  street: string;
  houseNumber: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  fullAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export async function searchAddresses(query: string): Promise<MapboxSearchResult> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;

  if (!token) {
    throw new Error('Mapbox token not configured');
  }

  const url = new URL('https://api.mapbox.com/search/searchbox/v1/suggest');
  url.searchParams.set('q', query);
  url.searchParams.set('access_token', token);
  url.searchParams.set('session_token', crypto.randomUUID());
  url.searchParams.set('language', 'en');
  url.searchParams.set('limit', '5');
  url.searchParams.set('types', 'address');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Failed to search addresses');
  }

  return response.json();
}

export async function retrieveAddress(mapboxId: string): Promise<MapboxFeature> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;

  if (!token) {
    throw new Error('Mapbox token not configured');
  }

  const url = new URL(`https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}`);
  url.searchParams.set('access_token', token);
  url.searchParams.set('session_token', crypto.randomUUID());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Failed to retrieve address');
  }

  const data = await response.json();
  return data.features[0];
}

export function parseAddress(feature: MapboxFeature): AddressComponents {
  const fullAddress = feature.properties.full_address || feature.place_name;

  const addressParts = feature.properties.address?.split(' ') || [];
  const houseNumber = addressParts[0] || '';
  const street = addressParts.slice(1).join(' ') || feature.text;

  let city = '';
  let state = '';
  let zipCode = '';
  let country = '';

  if (feature.context) {
    for (const ctx of feature.context) {
      if (ctx.id.startsWith('place')) {
        city = ctx.text;
      } else if (ctx.id.startsWith('region')) {
        state = ctx.short_code?.replace('US-', '') || ctx.text;
      } else if (ctx.id.startsWith('postcode')) {
        zipCode = ctx.text;
      } else if (ctx.id.startsWith('country')) {
        country = ctx.short_code || ctx.text;
      }
    }
  }

  return {
    street,
    houseNumber,
    city,
    state,
    zipCode,
    country,
    fullAddress,
    coordinates: {
      lat: feature.center[1],
      lng: feature.center[0],
    },
  };
}

export function validateAddressHasHouseNumber(address: AddressComponents): boolean {
  return address.houseNumber !== '' && address.houseNumber !== '0';
}
