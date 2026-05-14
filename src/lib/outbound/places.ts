import type { PlacesSearchResult } from './types';

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.addressComponents',
  'places.internationalPhoneNumber',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.types',
  'places.primaryType',
  'places.businessStatus',
].join(',');

type AddressComponent = {
  longText: string;
  shortText: string;
  types: string[];
};

type PlacesApiResponse = {
  places?: Array<{
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    addressComponents?: AddressComponent[];
    internationalPhoneNumber?: string;
    nationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    primaryType?: string;
    types?: string[];
    businessStatus?: string;
  }>;
  nextPageToken?: string;
};

export async function searchPlaces(
  textQuery: string,
  options: {
    maxResults?: number;
    regionCode?: string;
    languageCode?: string;
  } = {},
): Promise<PlacesSearchResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY is not set');
  }

  const body = {
    textQuery,
    languageCode: options.languageCode ?? 'de',
    regionCode: options.regionCode ?? 'DE',
    maxResultCount: Math.min(options.maxResults ?? 20, 20),
  };

  const response = await fetch(PLACES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Places API ${response.status}: ${errBody.slice(0, 300)}`);
  }

  const data = (await response.json()) as PlacesApiResponse;
  const places = data.places ?? [];

  return places
    .filter((p) => p.businessStatus !== 'CLOSED_PERMANENTLY')
    .map((p): PlacesSearchResult => {
      const city = pickAddressComponent(p.addressComponents, ['locality', 'postal_town']);
      const region = pickAddressComponent(p.addressComponents, [
        'administrative_area_level_1',
      ]);
      const country = pickAddressComponent(p.addressComponents, ['country']) || 'DE';

      return {
        place_id: p.id,
        name: p.displayName?.text ?? '(ohne Name)',
        industry: p.primaryType ?? p.types?.[0] ?? null,
        address: p.formattedAddress ?? null,
        city,
        region,
        country,
        phone: p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? null,
        website: p.websiteUri ?? null,
        rating: typeof p.rating === 'number' ? p.rating : null,
        rating_count: typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
      };
    });
}

function pickAddressComponent(
  components: AddressComponent[] | undefined,
  types: string[],
): string | null {
  if (!components) return null;
  for (const t of types) {
    const match = components.find((c) => c.types.includes(t));
    if (match) return match.longText;
  }
  return null;
}
