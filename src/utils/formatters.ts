/**
 * Formatting utilities for IOTA Globe.
 */

import type { StakeTier, Validator } from '../types';

// IOTA uses 9 decimal places (like SUI)
const IOTA_DECIMALS = 9;
const NANOS_PER_IOTA = 10 ** IOTA_DECIMALS;

/**
 * Converts a nanos string (e.g. "74371086510579799") to a
 * human-readable IOTA amount with optional decimal places.
 */
export function nanosToIota(nanos: string, decimals = 2): string {
  const value = Number(nanos) / NANOS_PER_IOTA;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a large IOTA amount into compact notation (e.g. "74.4M IOTA").
 */
export function formatStakeCompact(nanos: string): string {
  const iota = Number(nanos) / NANOS_PER_IOTA;

  if (iota >= 1_000_000_000) return `${(iota / 1_000_000_000).toFixed(1)}B`;
  if (iota >= 1_000_000) return `${(iota / 1_000_000).toFixed(1)}M`;
  if (iota >= 1_000) return `${(iota / 1_000).toFixed(1)}K`;
  return iota.toFixed(2);
}

/**
 * Formats APY as a percentage string (e.g. 0.1039 → "10.39%").
 */
export function formatApy(apy: number): string {
  return `${(apy * 100).toFixed(2)}%`;
}

/**
 * Formats commission rate (basis points → percentage).
 * IOTA commission is in basis points: 1000 = 10%.
 */
export function formatCommission(rateBps: string): string {
  return `${(Number(rateBps) / 100).toFixed(1)}%`;
}

/**
 * Determines the stake tier for visual classification on the globe.
 *
 * - Top 10% by stake → "top"  (IOTA blue, large marker)
 * - Middle 50%       → "mid"  (white, medium marker)
 * - Bottom 40%       → "low"  (grey, small marker)
 */
export function getStakeTier(
  validator: Validator,
  allValidators: Validator[],
): StakeTier {
  const sorted = [...allValidators].sort(
    (a, b) =>
      Number(b.stakingPoolIotaBalance) - Number(a.stakingPoolIotaBalance),
  );
  const idx = sorted.findIndex(
    (v) => v.iotaAddress === validator.iotaAddress,
  );
  const percentile = idx / sorted.length;

  if (percentile < 0.1) return 'top';
  if (percentile < 0.6) return 'mid';
  return 'low';
}

/**
 * Returns the marker color based on stake tier.
 */
export function getTierColor(tier: StakeTier): string {
  switch (tier) {
    case 'top':
      return '#00c2ff'; // IOTA blue
    case 'mid':
      return '#ffffff'; // white
    case 'low':
      return '#8888aa'; // grey
  }
}

/**
 * Returns the marker radius based on stake tier.
 */
export function getTierRadius(tier: StakeTier): number {
  switch (tier) {
    case 'top':
      return 0.6;
    case 'mid':
      return 0.35;
    case 'low':
      return 0.2;
  }
}

/**
 * Returns the marker altitude based on stake tier.
 */
export function getTierAltitude(tier: StakeTier): number {
  switch (tier) {
    case 'top':
      return 0.06;
    case 'mid':
      return 0.03;
    case 'low':
      return 0.015;
  }
}

/**
 * Truncates an IOTA address for display (e.g. "0xa693...b9ff").
 */
export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Formats a "time ago" string from a timestamp.
 */
export function timeAgo(timestampMs: number): string {
  const seconds = Math.floor((Date.now() - timestampMs) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
