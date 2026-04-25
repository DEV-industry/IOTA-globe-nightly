/**
 * useGeocode — resolves validators to lat/lng coordinates.
 *
 * Strategy (in order):
 *  1. Known city/country in validator name → hardcoded lookup table
 *  2. Extract hostname from netAddress → geo API (via proxy)  [future]
 *  3. Fallback: deterministic position based on address hash
 *
 * For V1, we use strategy 1 + 3 (no external geo API calls).
 * This avoids rate limiting issues and keeps things fast.
 */

import { useMemo } from 'react';
import type { Validator, ValidatorWithGeo } from '../types';

// ─── Known locations (city/country → coords) ───────────────────
// Populated from common validator names and known infrastructure

const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number }> = {
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

/**
 * Simple deterministic hash → lat/lng from the address string.
 * Spreads validators somewhat evenly across the globe.
 */
function hashToCoords(address: string): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) & 0x7fffffff;
  }

  // Use different parts of the hash for lat and lng
  const lat = ((hash % 1200) / 1200) * 140 - 70; // -70 to +70
  const lng = (((hash >> 10) % 3600) / 3600) * 360 - 180; // -180 to +180

  return { lat, lng };
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
        // Add slight jitter so co-located validators don't stack
        return {
          lat: coords.lat + (Math.random() - 0.5) * 3,
          lng: coords.lng + (Math.random() - 0.5) * 3,
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

      // Strategy 3: fallback hash-based positioning
      const fallback = hashToCoords(v.iotaAddress);
      return { ...v, ...fallback, geoSource: 'fallback' as const };
    });
  }, [validators]);
}
