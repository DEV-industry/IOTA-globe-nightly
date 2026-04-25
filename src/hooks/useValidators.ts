/**
 * useValidators — TanStack Query hook for live validator data.
 *
 * Fetches from /api/validators every 30 seconds.
 * Returns validators, system stats, loading/error states,
 * and the timestamp of the last successful fetch.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchValidators } from '../services/iotaApi';
import type { ValidatorsResponse } from '../types';

const REFETCH_INTERVAL = 30_000; // 30 seconds

export function useValidators() {
  const query = useQuery<ValidatorsResponse>({
    queryKey: ['validators'],
    queryFn: fetchValidators,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL - 5_000, // consider fresh for 25s
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  return {
    /** The full response including validators + system state */
    data: query.data,

    /** The array of validators */
    validators: query.data?.validators ?? [],

    /** System-level stats */
    epoch: query.data?.epoch,
    totalStake: query.data?.totalStake,
    iotaTotalSupply: query.data?.iotaTotalSupply,
    activeValidatorCount: query.data?.activeValidatorCount ?? 0,

    /** Query state */
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,

    /** Timestamp of last successful data fetch */
    dataUpdatedAt: query.dataUpdatedAt,

    /** Manual refetch trigger */
    refetch: query.refetch,
  };
}
