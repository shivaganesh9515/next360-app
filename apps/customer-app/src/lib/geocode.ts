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
