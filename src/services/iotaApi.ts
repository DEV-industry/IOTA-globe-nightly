/**
 * IOTA API service — all external API calls live here.
 *
 * All requests go directly to the public IOTA mainnet JSON-RPC endpoint.
 * No backend proxy is needed — the endpoint has open CORS.
 */

import type { ValidatorsResponse } from '../types';

// ─── Config ─────────────────────────────────────────────────────

const IOTA_RPC_URL = 'https://api.mainnet.iota.cafe';

// ─── Internal helpers ───────────────────────────────────────────

interface JsonRpcResponse<T = unknown> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

/**
 * Low-level JSON-RPC call directly to the IOTA full node.
 */
async function jsonRpc<T = unknown>(
  method: string,
  params: unknown[] = [],
): Promise<T> {
  const res = await fetch(IOTA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });

  if (!res.ok) {
    throw new Error(`RPC HTTP error ${res.status}: ${res.statusText}`);
  }

  const data: JsonRpcResponse<T> = await res.json();

  if (data.error) {
    throw new Error(`RPC error ${data.error.code}: ${data.error.message}`);
  }

  return data.result as T;
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Fetches the combined validator + system state data.
 * This is the primary data source for the globe and sidebar.
 *
 * Replicates the logic previously in the Express proxy's
 * GET /api/validators endpoint: fetches system state and APYs
 * in parallel, then merges them into a single response.
 */
export async function fetchValidators(): Promise<ValidatorsResponse> {
  // Fire both calls in parallel (same as the old proxy did)
  const [systemState, apyData] = await Promise.all([
    jsonRpc<any>('iotax_getLatestIotaSystemState'),
    jsonRpc<any>('iotax_getValidatorsApy'),
  ]);

  // Build APY lookup map: address → apy
  const apyMap = new Map<string, number>();
  if (apyData?.apys && Array.isArray(apyData.apys)) {
    for (const entry of apyData.apys) {
      apyMap.set(entry.address, entry.apy);
    }
  }

  // Merge validator data with APYs (identical to the old proxy logic)
  const validators = (systemState?.activeValidators ?? []).map((v: any) => ({
    iotaAddress: v.iotaAddress,
    name: v.name,
    description: v.description,
    imageUrl: v.imageUrl,
    projectUrl: v.projectUrl,
    netAddress: v.netAddress,
    p2pAddress: v.p2pAddress,
    primaryAddress: v.primaryAddress,
    votingPower: v.votingPower,
    stakingPoolIotaBalance: v.stakingPoolIotaBalance,
    commissionRate: v.commissionRate,
    nextEpochCommissionRate: v.nextEpochCommissionRate,
    nextEpochStake: v.nextEpochStake,
    operationCapId: v.operationCapId,
    stakingPoolId: v.stakingPoolId,
    apy: apyMap.get(v.iotaAddress) ?? 0,
  }));

  return {
    epoch: systemState?.epoch,
    totalStake: systemState?.totalStake,
    epochStartTimestampMs: systemState?.epochStartTimestampMs,
    epochDurationMs: systemState?.epochDurationMs,
    referenceGasPrice: systemState?.referenceGasPrice,
    iotaTotalSupply: systemState?.iotaTotalSupply,
    storageFundTotalObjectStorageRebates: systemState?.storageFundTotalObjectStorageRebates,
    storageFundNonRefundableBalance: systemState?.storageFundNonRefundableBalance,
    activeValidatorCount: validators.length,
    validators,
  };
}

/**
 * Generic JSON-RPC call directly to the IOTA mainnet node.
 * Drop-in replacement for the old proxy-based rpcCall.
 */
export async function rpcCall<T = unknown>(
  method: string,
  params: unknown[] = [],
): Promise<T> {
  return jsonRpc<T>(method, params);
}
