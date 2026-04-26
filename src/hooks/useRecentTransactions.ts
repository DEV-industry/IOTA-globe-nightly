/**
 * useRecentTransactions — Fetches recent transactions from checkpoints.
 *
 * Strategy: grab the latest N checkpoints, collect their tx digests,
 * then batch-fetch full tx details via iota_multiGetTransactionBlocks.
 * Refreshes every 10 seconds.
 */

import { useQuery } from '@tanstack/react-query';
import { rpcCall } from '../services/iotaApi';
import type { CheckpointsResponse } from '../types';

const REFETCH_INTERVAL = 10_000;
const CHECKPOINT_COUNT = 30; // fetch 30 checkpoints
const MAX_TX_DETAILS = 30;  // fetch details for up to 30 txs

// ─── Types ──────────────────────────────────────────────────────

export interface TransactionDetail {
  digest: string;
  kind: string;
  sender: string;
  status: 'success' | 'failure';
  gasUsed: {
    computationCost: string;
    storageCost: string;
    storageRebate: string;
  };
  timestampMs: string;
  executedEpoch: string;
}

// ─── Fetcher ────────────────────────────────────────────────────

async function fetchRecentTransactions(): Promise<TransactionDetail[]> {
  // Step 1: Get recent checkpoints with their tx digests
  const cpResponse = await rpcCall<CheckpointsResponse>(
    'iota_getCheckpoints',
    [null, CHECKPOINT_COUNT, true],
  );

  if (!cpResponse?.data) return [];

  // Collect all unique tx digests
  const allDigests: string[] = [];
  for (const cp of cpResponse.data) {
    if (cp.transactions) {
      for (const d of cp.transactions) {
        if (!allDigests.includes(d)) allDigests.push(d);
      }
    }
  }

  if (allDigests.length === 0) return [];

  // Step 2: Batch-fetch transaction details
  const digestsToFetch = allDigests.slice(0, MAX_TX_DETAILS);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txBlocks = await rpcCall<any[]>('iota_multiGetTransactionBlocks', [
    digestsToFetch,
    { showInput: true, showEffects: true },
  ]);

  if (!Array.isArray(txBlocks)) return [];

  // Step 3: Map to our TransactionDetail shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return txBlocks.map((tx: any) => ({
    digest: tx.digest,
    kind: tx.transaction?.data?.transaction?.kind ?? 'Unknown',
    sender: tx.transaction?.data?.sender ?? '',
    status: tx.effects?.status?.status === 'success' ? 'success' : 'failure',
    gasUsed: {
      computationCost: tx.effects?.gasUsed?.computationCost ?? '0',
      storageCost: tx.effects?.gasUsed?.storageCost ?? '0',
      storageRebate: tx.effects?.gasUsed?.storageRebate ?? '0',
    },
    timestampMs: tx.timestampMs ?? '0',
    executedEpoch: tx.effects?.executedEpoch ?? '',
  }));
}

// ─── Hook ───────────────────────────────────────────────────────

export function useRecentTransactions() {
  const query = useQuery<TransactionDetail[]>({
    queryKey: ['recentTransactions'],
    queryFn: fetchRecentTransactions,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL - 2_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  return {
    transactions: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    dataUpdatedAt: query.dataUpdatedAt,
    refetch: query.refetch,
  };
}
