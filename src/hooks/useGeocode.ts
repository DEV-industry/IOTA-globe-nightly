/**
 * useGeocode — resolves validators to lat/lng coordinates.
 *
 * Strategy (in order):
 *  1. Known city/country in validator name → hardcoded lookup table
 *  2. Extract hostname from netAddress → geo API (via proxy)  [future]
 *  3. Fallback: deterministic position based on address hash (snapped to known DC regions)
 */

import { useMemo } from 'react';
import type { Validator, ValidatorWithGeo } from '../types';

// ─── Known locations (city/country/validator → coords) ──────────
// Populated from common validator names and known infrastructure

const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  // Top IOTA Validators
  'kiln': { lat: 48.8566, lng: 2.3522 }, // Paris
  'figment': { lat: 43.6532, lng: -79.3832 }, // Toronto
  'dlt.green': { lat: 47.5162, lng: 14.5501 }, // Austria
  'pandabyte': { lat: 50.1109, lng: 8.6821 }, // Frankfurt
  'binance': { lat: 35.6762, lng: 139.6503 }, // Tokyo
  'p2p validator': { lat: 35.1264, lng: 33.4299 }, // Cyprus
  'luganodes': { lat: 46.0037, lng: 8.9511 }, // Lugano
  'swissiota': { lat: 47.3769, lng: 8.5417 }, // Zurich
  'nansen': { lat: 1.3521, lng: 103.8198 }, // Singapore
  'iota 1': { lat: 52.5200, lng: 13.4050 }, // Berlin
  'iota 2': { lat: 52.5200, lng: 13.4050 }, // Berlin
  'iota 3': { lat: 52.5200, lng: 13.4050 }, // Berlin
  'iota.guru': { lat: 51.1657, lng: 10.4515 }, // Germany
  'ankr': { lat: 37.7749, lng: -122.4194 }, // San Francisco
  'allnodes': { lat: 34.0522, lng: -118.2437 }, // Los Angeles
  'twinstake': { lat: 51.5074, lng: -0.1278 }, // London
  'dsrv': { lat: 37.5665, lng: 126.9780 }, // Seoul
  'stakin': { lat: 59.4370, lng: 24.7536 }, // Tallinn
  'nightly': { lat: 52.2297, lng: 21.0122 }, // Warsaw
  'jednaosma': { lat: 52.2297, lng: 21.0122 }, // Warsaw
  'linkpool': { lat: 51.5074, lng: -0.1278 }, // London
  'cosmostation': { lat: 37.5665, lng: 126.9780 }, // Seoul
  'alchemy': { lat: 37.7749, lng: -122.4194 }, // San Francisco
  'sensei_node': { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
  'cryptech': { lat: 50.4501, lng: 30.5234 }, // Kyiv
  'pier two': { lat: -33.8688, lng: 151.2093 }, // Sydney
  'klever': { lat: -23.5505, lng: -46.6333 }, // Sao Paulo
  'infstones': { lat: 37.4419, lng: -122.1430 }, // Palo Alto
  'b-harvest': { lat: 37.5665, lng: 126.9780 }, // Seoul
  'liquify': { lat: 22.3193, lng: 114.1694 }, // Hong Kong
  'cetus': { lat: 1.3521, lng: 103.8198 }, // Singapore
  'blockpi': { lat: 1.3521, lng: 103.8198 }, // Singapore
  'hashkey': { lat: 22.3193, lng: 114.1694 }, // Hong Kong
  'sentio': { lat: 37.7749, lng: -122.4194 }, // San Francisco
  'meria': { lat: 48.8566, lng: 2.3522 }, // Paris
  'cream': { lat: 25.0330, lng: 121.5654 }, // Taipei

  // Regions / Countries
  'us': { lat: 39.8, lng: -98.5 },
  'usa': { lat: 39.8, lng: -98.5 },
  'united states': { lat: 39.8, lng: -98.5 },
  'europe': { lat: 50.1, lng: 10.2 },
  'eu': { lat: 50.1, lng: 10.2 },
  'asia': { lat: 34.0, lng: 108.0 },
  'japan': { lat: 35.7, lng: 139.7 },
  'korea': { lat: 37.6, lng: 127.0 },
  'singapore': { lat: 1.35, lng: 103.8 },
  'india': { lat: 20.6, lng: 78.9 },
  'australia': { lat: -25.3, lng: 133.8 },
  'brazil': { lat: -14.2, lng: -51.9 },
  'canada': { lat: 56.1, lng: -106.3 },
  'germany': { lat: 51.2, lng: 10.4 },
  'uk': { lat: 55.4, lng: -3.4 },
  'france': { lat: 46.2, lng: 2.2 },
  'netherlands': { lat: 52.1, lng: 5.3 },
  'switzerland': { lat: 46.8, lng: 8.2 },
  'china': { lat: 35.9, lng: 104.2 },
  'hong kong': { lat: 22.3, lng: 114.2 },
  'taiwan': { lat: 23.7, lng: 120.9 },
  'vietnam': { lat: 14.1, lng: 108.3 },
  'thailand': { lat: 15.9, lng: 100.9 },
  'indonesia': { lat: -0.8, lng: 113.9 },
  'russia': { lat: 61.5, lng: 105.3 },
  'uae': { lat: 23.4, lng: 53.8 },
  'dubai': { lat: 25.2, lng: 55.3 },
  'turkey': { lat: 38.9, lng: 35.2 },
  'nigeria': { lat: 9.1, lng: 8.7 },
  'south africa': { lat: -30.6, lng: 22.9 },
  'kenya': { lat: -0.0, lng: 37.9 },
  'argentina': { lat: -38.4, lng: -63.6 },
  'mexico': { lat: 23.6, lng: -102.6 },
  'colombia': { lat: 4.6, lng: -74.3 },
  'chile': { lat: -35.7, lng: -71.5 },
  'poland': { lat: 51.9, lng: 19.1 },
  'ukraine': { lat: 48.4, lng: 31.2 },
  'spain': { lat: 40.5, lng: -3.7 },
  'italy': { lat: 41.9, lng: 12.6 },
  'portugal': { lat: 39.4, lng: -8.2 },
  'ireland': { lat: 53.1, lng: -7.7 },
  'finland': { lat: 61.9, lng: 25.7 },
  'sweden': { lat: 60.1, lng: 18.6 },
  'norway': { lat: 60.5, lng: 8.5 },
  'denmark': { lat: 56.3, lng: 9.5 },
  'austria': { lat: 47.5, lng: 14.6 },
  // Cities
  'new york': { lat: 40.7, lng: -74.0 },
  'san francisco': { lat: 37.8, lng: -122.4 },
  'los angeles': { lat: 34.1, lng: -118.2 },
  'chicago': { lat: 41.9, lng: -87.6 },
  'london': { lat: 51.5, lng: -0.1 },
  'paris': { lat: 48.9, lng: 2.3 },
  'berlin': { lat: 52.5, lng: 13.4 },
  'amsterdam': { lat: 52.4, lng: 4.9 },
  'zurich': { lat: 47.4, lng: 8.5 },
  'tokyo': { lat: 35.7, lng: 139.7 },
  'seoul': { lat: 37.6, lng: 127.0 },
  'beijing': { lat: 39.9, lng: 116.4 },
  'shanghai': { lat: 31.2, lng: 121.5 },
  'mumbai': { lat: 19.1, lng: 72.9 },
  'sydney': { lat: -33.9, lng: 151.2 },
  'toronto': { lat: 43.7, lng: -79.4 },
  'vancouver': { lat: 49.3, lng: -123.1 },
  'miami': { lat: 25.8, lng: -80.2 },
  'austin': { lat: 30.3, lng: -97.7 },
  'seattle': { lat: 47.6, lng: -122.3 },
  'moscow': { lat: 55.8, lng: 37.6 },
  'istanbul': { lat: 41.0, lng: 29.0 },
  'cairo': { lat: 30.0, lng: 31.2 },
  'nairobi': { lat: -1.3, lng: 36.8 },
  'lagos': { lat: 6.5, lng: 3.4 },
  'bangkok': { lat: 13.8, lng: 100.5 },
  'manila': { lat: 14.6, lng: 121.0 },
  'helsinki': { lat: 60.2, lng: 24.9 },
  'warsaw': { lat: 52.2, lng: 21.0 },
  'prague': { lat: 50.1, lng: 14.4 },
  'lisbon': { lat: 38.7, lng: -9.1 },
  'barcelona': { lat: 41.4, lng: 2.2 },
  'munich': { lat: 48.1, lng: 11.6 },
  'vienna': { lat: 48.2, lng: 16.4 },
};

// Top data center regions globally for fallback to avoid ocean drops
const FALLBACK_REGIONS = [
  { lat: 39.0438, lng: -77.4874 }, // Ashburn, VA, USA (us-east)
  { lat: 45.8153, lng: -119.3204 }, // Boardman, OR, USA (us-west)
  { lat: 37.3382, lng: -121.8863 }, // San Jose, CA, USA
  { lat: 53.3498, lng: -6.2603 }, // Dublin, Ireland (eu-west)
  { lat: 50.1109, lng: 8.6821 }, // Frankfurt, Germany (eu-central)
  { lat: 35.6895, lng: 139.6917 }, // Tokyo, Japan (ap-northeast)
  { lat: 1.3521, lng: 103.8198 }, // Singapore (ap-southeast)
  { lat: -33.8688, lng: 151.2093 }, // Sydney, Australia
  { lat: -23.5505, lng: -46.6333 }, // Sao Paulo, Brazil
  { lat: 19.0760, lng: 72.8777 }, // Mumbai, India
  { lat: 37.5665, lng: 126.9780 }, // Seoul, South Korea
  { lat: 43.6532, lng: -79.3832 }, // Toronto, Canada
  { lat: 51.5074, lng: -0.1278 }, // London, UK
];

/**
 * Simple deterministic hash → lat/lng from the address string.
 * Uses a list of known data center regions instead of random coordinates
 * to ensure validators land on solid ground (not in the ocean).
 */
function hashToCoords(address: string): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) & 0x7fffffff;
  }

  // Pick a random data center region deterministically
  const regionIndex = Math.abs(hash) % FALLBACK_REGIONS.length;
  const region = FALLBACK_REGIONS[regionIndex]!;

  // Add jitter so nodes in the same region don't overlap completely
  const jitterLat = ((hash % 100) / 100) * 4 - 2; // -2 to +2 degrees
  const jitterLng = (((hash >> 8) % 100) / 100) * 4 - 2;

  return {
    lat: region.lat + jitterLat,
    lng: region.lng + jitterLng
  };
}

/**
 * Try to match a validator name/description against known locations.
 */
function matchKnownLocation(
  validator: Validator,
): { lat: number; lng: number } | null {
  const searchText =
    `${validator.name} ${validator.description}`.toLowerCase();

  // Sort keys by length desc so more specific matches win
  const sortedKeys = Object.keys(KNOWN_LOCATIONS).sort(
    (a, b) => b.length - a.length,
  );

  for (const key of sortedKeys) {
    if (searchText.includes(key)) {
      const coords = KNOWN_LOCATIONS[key];
      if (coords) {
        // Add deterministic jitter based on address so co-located validators don't stack
        let hash = 0;
        for (let i = 0; i < validator.iotaAddress.length; i++) {
          hash = (hash * 31 + validator.iotaAddress.charCodeAt(i)) & 0x7fffffff;
        }
        const jitterLat = ((hash % 100) / 100) * 3 - 1.5;
        const jitterLng = (((hash >> 8) % 100) / 100) * 3 - 1.5;

        return {
          lat: coords.lat + jitterLat,
          lng: coords.lng + jitterLng,
        };
      }
    }
  }

  return null;
}

// ─── Hook ───────────────────────────────────────────────────────

/**
 * Takes an array of validators and returns them with lat/lng coordinates.
 * Memoized to avoid recalculating on every render.
 */
export function useGeocode(validators: Validator[]): ValidatorWithGeo[] {
  return useMemo(() => {
    return validators.map((v) => {
      // Strategy 1: known location from name/description
      const known = matchKnownLocation(v);
      if (known) {
        return { ...v, ...known, geoSource: 'lookup' as const };
      }

      // Strategy 3: fallback hash-based positioning to known DC regions
      const fallback = hashToCoords(v.iotaAddress);
      return { ...v, ...fallback, geoSource: 'fallback' as const };
    });
  }, [validators]);
}
