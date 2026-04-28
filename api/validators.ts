import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  checkRateLimit,
  getRequestMeta,
  isAllowedOrigin,
  verifyAuthToken,
} from './_security.js';

const IOTA_RPC_URL = 'https://api.mainnet.iota.cafe';
const RPC_TIMEOUT_MS = 8000;

interface JsonRpcResponse<T = unknown> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

async function jsonRpc<T = unknown>(
  method: string,
  params: unknown[] = [],
): Promise<T> {
  const res = await fetchWithTimeout(IOTA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  }, RPC_TIMEOUT_MS);

  if (!res.ok) {
    throw new Error(`RPC HTTP error ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as JsonRpcResponse<T>;

  if (data.error) {
    throw new Error(`RPC error ${data.error.code}: ${data.error.message}`);
  }

  return data.result as T;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const meta = getRequestMeta(req);
  const origin = meta.origin;

  // 1. Zabezpieczenie CORS: Odrzuć, jeśli Origin brakuje albo jest na czarnej liście
  if (!isAllowedOrigin(origin, meta.host, meta.referer)) {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');

  // Umożliwianie Preflight (OPTIONS)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-App-Auth'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Auth: signed token required
  const clientToken = req.headers['x-app-auth'];
  if (!verifyAuthToken(clientToken, meta)) {
    return res.status(401).json({ error: 'Unauthorized communication' });
  }

  // Rate limiting per IP
  const ip = meta.ip || '127.0.0.1';
  if (!checkRateLimit(ip, 'validators')) {
    return res.status(429).json({ error: 'Too Many Requests' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const [systemState, apyData] = await Promise.all([
      jsonRpc<any>('iotax_getLatestIotaSystemState'),
      jsonRpc<any>('iotax_getValidatorsApy'),
    ]);

    const apyMap = new Map<string, number>();
    if (apyData?.apys && Array.isArray(apyData.apys)) {
      for (const entry of apyData.apys) {
        apyMap.set(entry.address, entry.apy);
      }
    }

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

    const responseData = {
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

    // Cache to prevent spamming the RPC node
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=59');

    return res.status(200).json(responseData);
  } catch (error: any) {
    console.error('Error in validators proxy:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
