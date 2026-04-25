/**
 * Express Proxy Server for IOTA JSON-RPC
 *
 * This proxy shields the frontend from direct RPC access:
 *  - SERVER_IOTA_RPC_URL is server-only (never VITE_ prefixed)
 *  - Rate limiting prevents abuse (60 req/min per IP by default)
 *  - CORS restricts access to our own frontend origin
 *
 * Routes:
 *   POST /api/rpc                 → Forward arbitrary JSON-RPC call
 *   GET  /api/validators          → Fetch system state + APYs (combined)
 *   GET  /api/health              → Healthcheck
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// ─── Config ─────────────────────────────────────────────────────
const PORT = parseInt(process.env.SERVER_PROXY_PORT || '3001', 10);
const IOTA_RPC_URL = process.env.SERVER_IOTA_RPC_URL || 'https://api.mainnet.iota.cafe:443';
const CORS_ORIGIN = process.env.SERVER_CORS_ORIGIN || 'http://localhost:5173';
const RATE_LIMIT_MAX = parseInt(process.env.SERVER_RATE_LIMIT_MAX || '60', 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.SERVER_RATE_LIMIT_WINDOW_MS || '60000', 10);

// ─── Allowed JSON-RPC methods (whitelist) ───────────────────────
const ALLOWED_METHODS = new Set([
  'iotax_getLatestIotaSystemState',
  'iotax_getLatestIotaSystemStateV2',
  'iotax_getValidatorsApy',
  'iotax_getCommitteeInfo',
  'iotax_getReferenceGasPrice',
  'iotax_getNetworkMetrics',
  'iotax_getCurrentEpoch',
  'iota_getCheckpoints',
]);

// ─── Helpers ────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: unknown[];
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

/**
 * Makes a JSON-RPC call to the IOTA full node.
 */
async function rpcCall<T = unknown>(
  method: string,
  params: unknown[] = [],
): Promise<JsonRpcResponse<T>> {
  const body: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: 1,
    method,
    params,
  };

  const response = await fetch(IOTA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`RPC responded with HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<JsonRpcResponse<T>>;
}

// ─── Express App ────────────────────────────────────────────────
const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  }),
);
app.use(
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  }),
);

// ─── Routes ─────────────────────────────────────────────────────

/**
 * GET /api/health
 * Simple healthcheck — also verifies RPC connectivity.
 */
app.get('/api/health', async (_req, res) => {
  try {
    const rpc = await rpcCall('iotax_getReferenceGasPrice');
    res.json({
      status: 'ok',
      rpcUrl: IOTA_RPC_URL.replace(/\/\/(.+?)[:@].*/, '//$1:***'), // redact credentials
      referenceGasPrice: rpc.result,
    });
  } catch (err) {
    res.status(502).json({
      status: 'error',
      message: err instanceof Error ? err.message : 'RPC unreachable',
    });
  }
});

/**
 * POST /api/rpc
 * Generic JSON-RPC proxy with method whitelist.
 *
 * Body: { method: string, params?: unknown[] }
 */
app.post('/api/rpc', async (req, res) => {
  const { method, params = [] } = req.body as {
    method?: string;
    params?: unknown[];
  };

  if (!method || typeof method !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "method" field' });
    return;
  }

  if (!ALLOWED_METHODS.has(method)) {
    res.status(403).json({
      error: `Method "${method}" is not allowed. Allowed: ${[...ALLOWED_METHODS].join(', ')}`,
    });
    return;
  }

  try {
    const data = await rpcCall(method, params);

    if (data.error) {
      res.status(502).json({ error: data.error });
      return;
    }

    res.json(data.result);
  } catch (err) {
    console.error(`[proxy] RPC error for ${method}:`, err);
    res.status(502).json({
      error: err instanceof Error ? err.message : 'RPC call failed',
    });
  }
});

/**
 * GET /api/validators
 * Convenience endpoint that fetches both system state and APYs in parallel,
 * then merges them into a single response the frontend can consume directly.
 *
 * Response shape:
 * {
 *   epoch: string,
 *   totalStake: string,
 *   epochStartTimestampMs: string,
 *   epochDurationMs: string,
 *   referenceGasPrice: string,
 *   validators: Array<{
 *     iotaAddress: string,
 *     name: string,
 *     description: string,
 *     imageUrl: string,
 *     projectUrl: string,
 *     netAddress: string,
 *     p2pAddress: string,
 *     primaryAddress: string,
 *     votingPower: string,
 *     stakingPoolIotaBalance: string,
 *     commissionRate: string,
 *     nextEpochCommissionRate: string,
 *     apy: number,
 *   }>
 * }
 */
app.get('/api/validators', async (_req, res) => {
  try {
    // Fire both calls in parallel
    const [systemStateRes, apyRes] = await Promise.all([
      rpcCall('iotax_getLatestIotaSystemState'),
      rpcCall('iotax_getValidatorsApy'),
    ]);

    if (systemStateRes.error) {
      res.status(502).json({ error: systemStateRes.error });
      return;
    }
    if (apyRes.error) {
      res.status(502).json({ error: apyRes.error });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const systemState = systemStateRes.result as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apyData = apyRes.result as any;

    // Build APY lookup map: address → apy
    const apyMap = new Map<string, number>();
    if (apyData?.apys && Array.isArray(apyData.apys)) {
      for (const entry of apyData.apys) {
        apyMap.set(entry.address, entry.apy);
      }
    }

    // Merge validator data with APYs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    res.json({
      epoch: systemState?.epoch,
      totalStake: systemState?.totalStake,
      epochStartTimestampMs: systemState?.epochStartTimestampMs,
      epochDurationMs: systemState?.epochDurationMs,
      referenceGasPrice: systemState?.referenceGasPrice,
      iotaTotalSupply: systemState?.iotaTotalSupply,
      activeValidatorCount: validators.length,
      validators,
    });
  } catch (err) {
    console.error('[proxy] /api/validators error:', err);
    res.status(502).json({
      error: err instanceof Error ? err.message : 'Failed to fetch validators',
    });
  }
});

// ─── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  IOTA Globe Proxy`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  Listening:  http://localhost:${PORT}`);
  console.log(`  RPC target: ${IOTA_RPC_URL}`);
  console.log(`  CORS:       ${CORS_ORIGIN}`);
  console.log(`  Rate limit: ${RATE_LIMIT_MAX} req / ${RATE_LIMIT_WINDOW / 1000}s\n`);
});
