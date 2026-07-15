// Free forward-geocoding via OpenStreetMap's Nominatim — no API key needed,
// appropriate for the low-volume "geocode one address the user just typed"
// use case this app has (not for bulk/high-frequency lookups; Nominatim's
// usage policy caps at ~1 request/sec and requires a real User-Agent, both
// satisfied here since this only fires once per address save).
export async function geocodeAddress(params: {
  fullAddress: string;
  city: string;
  state: string;
  pincode: string;
}): Promise<{ lat: number; lng: number } | null> {
  const query = [params.fullAddress, params.city, params.state, params.pincode, 'India']
    .filter(Boolean)
    .join(', ');

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Next360-CustomerApp/1.0' } },
    );
    if (!res.ok) return null;
    const results = await res.json();
    const first = Array.isArray(results) ? results[0] : undefined;
    if (!first) return null;
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
  } catch {
    return null;
  }
}

export interface ReverseGeocodeResult {
  fullAddress: string;
  city: string;
  state: string;
  pincode: string;
}

// Turns a map pin (lat/lng) back into fillable address fields — used by the
// map picker's "confirm this pin" step. Same Nominatim service/usage-policy
// rationale as geocodeAddress above (one request per pin-drop, not bulk).
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'User-Agent': 'Next360-CustomerApp/1.0' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address;
    if (!addr) return null;
    const road = [addr.house_number, addr.road].filter(Boolean).join(' ');
    const locality = addr.suburb || addr.neighbourhood || addr.village || addr.town || '';
    const fullAddress = [road, locality].filter(Boolean).join(', ') || data.display_name || '';
    return {
      fullAddress,
      city: addr.city || addr.town || addr.county || '',
      state: addr.state || '',
      pincode: addr.postcode || '',
    };
  } catch {
    return null;
  }
}

export interface PlaceSuggestion {
  label: string;
  lat: number;
  lng: number;
}

// Search-as-you-type autocomplete for the map picker's search bar. Restricted
// to India (countrycodes=in) since the app is India-only per CLAUDE.md.
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=in&q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Next360-CustomerApp/1.0' } },
    );
    if (!res.ok) return [];
    const results = await res.json();
    if (!Array.isArray(results)) return [];
    return results.map((r: any) => ({
      label: r.display_name as string,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
}
