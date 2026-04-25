/**
 * validatorLocations — maps validator names to human-readable city names.
 *
 * Used by the EpochOverlay rotating validator showcase to display
 * the city/location of the currently featured validator.
 */

import type { Validator } from '../types';

// ─── Validator name → City mapping ──────────────────────────────
// Mirrors the KNOWN_LOCATIONS keys in useGeocode.ts but maps to
// human-readable city names for display.

const VALIDATOR_CITY_MAP: Record<string, { city: string; country: string }> = {
  'kiln': { city: 'Paris', country: 'France' },
  'figment': { city: 'Toronto', country: 'Canada' },
  'dlt.green': { city: 'Graz', country: 'Austria' },
  'pandabyte': { city: 'Frankfurt', country: 'Germany' },
  'binance': { city: 'Tokyo', country: 'Japan' },
  'p2p validator': { city: 'Limassol', country: 'Cyprus' },
  'luganodes': { city: 'Lugano', country: 'Switzerland' },
  'swissiota': { city: 'Zurich', country: 'Switzerland' },
  'nansen': { city: 'Singapore', country: 'Singapore' },
  'iota 1': { city: 'Berlin', country: 'Germany' },
  'iota 2': { city: 'Berlin', country: 'Germany' },
  'iota 3': { city: 'Berlin', country: 'Germany' },
  'iota.guru': { city: 'Munich', country: 'Germany' },
  'ankr': { city: 'San Francisco', country: 'USA' },
  'allnodes': { city: 'Los Angeles', country: 'USA' },
  'twinstake': { city: 'London', country: 'UK' },
  'dsrv': { city: 'Seoul', country: 'South Korea' },
  'stakin': { city: 'Tallinn', country: 'Estonia' },
  'nightly': { city: 'Warsaw', country: 'Poland' },
  'jednaosma': { city: 'Warsaw', country: 'Poland' },
  'linkpool': { city: 'London', country: 'UK' },
  'cosmostation': { city: 'Seoul', country: 'South Korea' },
  'alchemy': { city: 'San Francisco', country: 'USA' },
  'sensei_node': { city: 'Buenos Aires', country: 'Argentina' },
  'cryptech': { city: 'Kyiv', country: 'Ukraine' },
  'pier two': { city: 'Sydney', country: 'Australia' },
  'klever': { city: 'São Paulo', country: 'Brazil' },
  'infstones': { city: 'Palo Alto', country: 'USA' },
  'b-harvest': { city: 'Seoul', country: 'South Korea' },
  'liquify': { city: 'Hong Kong', country: 'China' },
  'cetus': { city: 'Singapore', country: 'Singapore' },
  'blockpi': { city: 'Singapore', country: 'Singapore' },
  'hashkey': { city: 'Hong Kong', country: 'China' },
  'sentio': { city: 'San Francisco', country: 'USA' },
  'meria': { city: 'Paris', country: 'France' },
  'cream': { city: 'Taipei', country: 'Taiwan' },
};

// Sort keys by length descending so more-specific matches win
const SORTED_KEYS = Object.keys(VALIDATOR_CITY_MAP).sort(
  (a, b) => b.length - a.length,
);

/**
 * Resolves a validator to its city name for display.
 * Falls back to a region-based label if no exact match.
 */
export function getValidatorCity(validator: Validator): string {
  const searchText =
    `${validator.name} ${validator.description}`.toLowerCase();

  for (const key of SORTED_KEYS) {
    if (searchText.includes(key)) {
      const location = VALIDATOR_CITY_MAP[key];
      if (location) return location.city;
    }
  }

  return 'Decentralized';
}

/**
 * Returns the full location string (city + country) for a validator.
 */
export function getValidatorLocation(validator: Validator): {
  city: string;
  country: string;
} {
  const searchText =
    `${validator.name} ${validator.description}`.toLowerCase();

  for (const key of SORTED_KEYS) {
    if (searchText.includes(key)) {
      const location = VALIDATOR_CITY_MAP[key];
      if (location) return location;
    }
  }

  return { city: 'Decentralized', country: 'Global' };
}

/**
 * Counts unique cities from a list of validators.
 */
export function getUniqueCities(validators: Validator[]): number {
  const cities = new Set<string>();
  for (const v of validators) {
    cities.add(getValidatorCity(v));
  }
  // Don't count the fallback
  cities.delete('Decentralized');
  return Math.max(cities.size, 1);
}

/**
 * Counts unique countries from a list of validators.
 */
export function getUniqueCountries(validators: Validator[]): number {
  const countries = new Set<string>();
  for (const v of validators) {
    const loc = getValidatorLocation(v);
    countries.add(loc.country);
  }
  // Don't count the fallback
  countries.delete('Global');
  return Math.max(countries.size, 1);
}
