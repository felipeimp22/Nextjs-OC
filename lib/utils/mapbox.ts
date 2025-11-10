export interface MapboxSuggestion {
  name: string;
  mapbox_id: string;
  feature_type: string;
  address: string;
  full_address: string;
  place_formatted: string;
  context: {
    country?: { name: string; country_code: string };
    region?: { name: string; region_code: string };
    postcode?: { name: string };
    place?: { name: string };
    address?: { name: string; address_number: string; street_name: string };
  };
  language: string;
  maki: string;
}

export interface MapboxSearchResult {
  suggestions: MapboxSuggestion[];
  attribution: string;
}

export interface MapboxFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    mapbox_id: string;
    name: string;
    full_address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    context: {
      country?: { name: string; country_code: string };
      region?: { name: string; region_code: string };
      postcode?: { name: string };
      place?: { name: string };
      address?: { name: string; address_number: string; street_name: string };
    };
  };
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
  const token = process.env.MAPBOX_TOKEN;

  if (!token) {
    throw new Error('Mapbox token not configured. Please set MAPBOX_TOKEN in environment variables.');
  }

  const url = new URL('https://api.mapbox.com/search/searchbox/v1/suggest');
  url.searchParams.set('q', query);
  url.searchParams.set('access_token', token);
  url.searchParams.set('session_token', crypto.randomUUID());
  url.searchParams.set('language', 'en');
  url.searchParams.set('limit', '10');
  url.searchParams.set('types', 'address');

  console.log('[Mapbox Search] Request URL:', url.toString().replace(token, 'REDACTED'));

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Mapbox Search] Error response:', errorText);
    throw new Error(`Failed to search addresses: ${response.status}`);
  }

  const data = await response.json();
  console.log('[Mapbox Search] Response:', JSON.stringify(data, null, 2));

  return data;
}

export async function retrieveAddress(mapboxId: string): Promise<MapboxFeature> {
  const token = process.env.MAPBOX_TOKEN;

  if (!token) {
    throw new Error('Mapbox token not configured. Please set MAPBOX_TOKEN in environment variables.');
  }

  const url = new URL(`https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}`);
  url.searchParams.set('access_token', token);
  url.searchParams.set('session_token', crypto.randomUUID());

  console.log('[Mapbox Retrieve] Request URL:', url.toString().replace(token, 'REDACTED'));

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Mapbox Retrieve] Error response:', errorText);
    throw new Error(`Failed to retrieve address: ${response.status}`);
  }

  const data = await response.json();
  console.log('[Mapbox Retrieve] Response:', JSON.stringify(data, null, 2));

  return data.features[0];
}

export function parseAddress(feature: MapboxFeature): AddressComponents {
  const props = feature.properties;
  const ctx = props.context;

  const houseNumber = ctx.address?.address_number || '';
  const street = ctx.address?.street_name || ctx.address?.name || props.name;
  const city = ctx.place?.name || '';
  const state = ctx.region?.region_code || ctx.region?.name || '';
  const zipCode = ctx.postcode?.name || '';
  const country = ctx.country?.country_code || ctx.country?.name || '';
  const fullAddress = props.full_address || props.name;

  const coordinates = {
    lat: props.coordinates.latitude,
    lng: props.coordinates.longitude,
  };

  return {
    street,
    houseNumber,
    city,
    state,
    zipCode,
    country,
    fullAddress,
    coordinates,
  };
}

export function validateAddressHasHouseNumber(address: AddressComponents): boolean {
  return address.houseNumber !== '' && address.houseNumber !== '0';
}
