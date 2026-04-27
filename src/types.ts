/**
 * Shared TypeScript types for IOTA Globe.
 *
 * All types mirror the JSON shapes returned by the IOTA mainnet
 * JSON-RPC endpoint (merged/transformed in iotaApi.ts).
 */

// ─── Validator ──────────────────────────────────────────────────

export interface Validator {
  iotaAddress: string;
  name: string;
  description: string;
  imageUrl: string;
  projectUrl: string;
  netAddress: string;
  p2pAddress: string;
  primaryAddress: string;
  votingPower: string;
  stakingPoolIotaBalance: string;
  commissionRate: string;
  nextEpochCommissionRate: string;
  nextEpochStake: string;
  operationCapId: string;
  stakingPoolId: string;
  apy: number;
}

// ─── Validator with geo coordinates (after geocoding) ───────────

export interface ValidatorWithGeo extends Validator {
  lat: number;
  lng: number;
  geoSource: 'lookup' | 'geo-api' | 'fallback';
  country?: string;
}

// ─── Stake tier for visual classification ───────────────────────

export type StakeTier = 'top' | 'mid' | 'low';

// ─── System state response (merged in iotaApi.ts) ───────────────

export interface ValidatorsResponse {
  epoch: string;
  totalStake: string;
  epochStartTimestampMs: string;
  epochDurationMs: string;
  referenceGasPrice: string;
  iotaTotalSupply: string;
  activeValidatorCount: number;
  validators: Validator[];
  storageFundTotalObjectStorageRebates?: string;
  storageFundNonRefundableBalance?: string;
}

// ─── Transaction row for the data table ─────────────────────────

export interface TransactionRow {
  digest: string;
  sender: string;
  senderAddress: string;
  txns: string;
  gas: string;
  time: string;
}

// ─── Tab types for the data table ───────────────────────────────

export type DataTableTab = 'transactions' | 'validators' | 'checkpoints';

// ─── Checkpoints ────────────────────────────────────────────────

export interface Checkpoint {
  epoch: string;
  sequenceNumber: string;
  digest: string;
  networkTotalTransactions: string;
  previousDigest: string;
  timestampMs: string;
  transactions?: string[];
}

export interface CheckpointsResponse {
  data: Checkpoint[];
  nextCursor: string | null;
  hasNextPage: boolean;
}
