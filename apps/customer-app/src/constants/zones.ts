// MVP is zone-gated to Hyderabad and Vijayawada only (see CLAUDE.md "Zone-Gated Launch").
// No zones API exists on the backend yet, so this is a static client-side list until
// a real zones module ships — swap this out once GET /zones (or similar) exists.
export interface Zone {
  city: string;
  localities: string[];
}

export const SERVICEABLE_ZONES: Zone[] = [
  {
    city: 'Hyderabad',
    localities: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Kondapur', 'Kukatpally', 'Secunderabad'],
  },
  {
    city: 'Vijayawada',
    localities: ['Governorpet', 'Benz Circle', 'Patamata', 'Labbipet', 'Gunadala', 'Auto Nagar'],
  },
];

export function isServiceableCity(cityQuery: string): boolean {
  const normalized = cityQuery.trim().toLowerCase();
  return SERVICEABLE_ZONES.some((zone) => zone.city.toLowerCase() === normalized);
}
