import { useQuery } from '@tanstack/react-query';
import { rpcCall } from '../services/iotaApi';
import type { CheckpointsResponse } from '../types';

const REFETCH_INTERVAL = 5_000; // update every 5s
const HISTORY_LIMIT = 50; // fetch last 50 blocks

export interface AnalyticsData {
  time: string; // HH:MM:SS
  blockTime: number; // ms
  movingAvg: number; // ms
  tps: number;
  txCount: number;
  baseFee: number;
  priorityFee: number;
  medianBase: number;
  medianPriority: number;
  // Raw stats for the top cards
  highestFeeBlock: number;
  totalTxs: number;
  avgFullness: number;
  totalTips: number;
}

export function useAnalyticsHistory() {
  const query = useQuery({
    queryKey: ['analyticsHistory'],
    queryFn: async () => {
      // 1. Fetch checkpoints
      const cpResponse = await rpcCall<CheckpointsResponse>(
        'iota_getCheckpoints',
        [null, HISTORY_LIMIT, true],
      );

      const checkpoints = cpResponse?.data || [];
      if (checkpoints.length < 2) return [];

      // Sort chronological (oldest first) for charts
      checkpoints.sort((a, b) => Number(a.sequenceNumber) - Number(b.sequenceNumber));

      const digests: string[] = [];
      checkpoints.forEach(cp => {
        if (cp.transactions) digests.push(...cp.transactions);
      });

      // 2. Fetch transaction blocks for fees (limit to 50 to avoid huge requests if network is busy)
      const txsToFetch = digests.slice(-50);
      let txDetails: any[] = [];
      if (txsToFetch.length > 0) {
        txDetails = await rpcCall<any[]>('iota_multiGetTransactionBlocks', [
          txsToFetch,
          { showInput: false, showEffects: true },
        ]);
      }

      // Map tx effects by digest for fast lookup
      const txEffectsMap = new Map<string, any>();
      if (Array.isArray(txDetails)) {
        txDetails.forEach(tx => {
          if (tx?.digest && tx?.effects) {
            txEffectsMap.set(tx.digest, tx.effects);
          }
        });
      }

      const results: AnalyticsData[] = [];
      let totalTxs = 0;
      let highestFeeBlock = 0;
      let totalTips = 0;

      // Calculate moving average variables
      const blockTimes: number[] = [];

      for (let i = 1; i < checkpoints.length; i++) {
        const prev = checkpoints[i - 1];
        const curr = checkpoints[i];

        if (!prev || !curr) continue;

        const prevTime = Number(prev.timestampMs);
        const currTime = Number(curr.timestampMs);
        const blockTime = currTime - prevTime;
        
        blockTimes.push(blockTime);
        if (blockTimes.length > 5) blockTimes.shift();
        const movingAvg = blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length;

        const txCount = curr.transactions?.length || 0;
        totalTxs += txCount;
        
        // TPS = txCount / (blockTime in seconds)
        // If blockTime is 0 or negative (edge cases), default to 0
        const tps = blockTime > 0 ? (txCount / (blockTime / 1000)) : 0;

        // Fees
        let blockBaseFee = 0;
        let blockPriorityFee = 0; // "tips"
        const blockFees: {base: number, prio: number}[] = [];

        if (curr.transactions) {
          curr.transactions.forEach(digest => {
            const effects = txEffectsMap.get(digest);
            if (effects?.gasUsed) {
              const compCost = Number(effects.gasUsed.computationCost || 0);
              const storageCost = Number(effects.gasUsed.storageCost || 0);
              const rebate = Number(effects.gasUsed.storageRebate || 0);
              // Simplified IOTA gas model:
              const base = Math.max(0, compCost + storageCost - rebate);
              // For visualization, we'll pretend there is a priority fee (IOTA uses reference gas price, tips aren't explicitly split in basic gasUsed like ETH, but we can simulate it if needed, or just map it).
              // Let's assume all cost is base fee for now, since IOTA doesn't have an explicit 'priority fee' field in gasUsed.
              const prio = 0; 
              
              blockBaseFee += base;
              blockPriorityFee += prio;
              blockFees.push({ base, prio });
            }
          });
        }

        totalTips += blockPriorityFee;
        const totalBlockFee = blockBaseFee + blockPriorityFee;
        if (totalBlockFee > highestFeeBlock) {
          highestFeeBlock = totalBlockFee;
        }

        // Median fee calculation
        let medianBase = 0;
        let medianPriority = 0;
        if (blockFees.length > 0) {
          blockFees.sort((a, b) => a.base - b.base);
          const midFee = blockFees[Math.floor(blockFees.length / 2)];
          medianBase = midFee?.base || 0;
          medianPriority = 0;
        }

        const date = new Date(currTime);
        const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

        results.push({
          time,
          blockTime,
          movingAvg,
          tps,
          txCount,
          baseFee: blockBaseFee / 1e9, // Convert nanos to IOTA
          priorityFee: blockPriorityFee / 1e9,
          medianBase: medianBase / 1e9,
          medianPriority: medianPriority / 1e9,
          highestFeeBlock: highestFeeBlock / 1e9,
          totalTxs,
          avgFullness: Math.min(100, Math.round((txCount / 10000) * 100)), // rough estimate: assuming 10k is max block capacity
          totalTips: totalTips / 1e9,
        });
      }

      return results;
    },
    refetchInterval: REFETCH_INTERVAL,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
  };
}
