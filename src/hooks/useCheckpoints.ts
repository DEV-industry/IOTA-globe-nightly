import { useQuery } from '@tanstack/react-query';
import { rpcCall } from '../services/iotaApi';
import type { CheckpointsResponse } from '../types';

const REFETCH_INTERVAL = 5_000; // 5 seconds

export function useCheckpoints() {
  const query = useQuery<CheckpointsResponse>({
    queryKey: ['checkpoints'],
    queryFn: () =>
      rpcCall<CheckpointsResponse>('iota_getCheckpoints', [null, 10, true]),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL - 1_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  return {
    data: query.data,
    checkpoints: query.data?.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,
    dataUpdatedAt: query.dataUpdatedAt,
    refetch: query.refetch,
  };
}
