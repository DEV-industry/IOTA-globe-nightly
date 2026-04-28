import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  checkRateLimit,
  getRequestMeta,
  isAllowedOrigin,
  verifyAuthToken,
} from './_security.js';

const IOTA_RPC_URL = 'https://api.mainnet.iota.cafe';

// Metody z API IOTA, z których realnie korzysta aplikacja
const ALLOWED_METHODS = [
  'iota_getCheckpoints',
  'iota_multiGetTransactionBlocks',
  'iotax_getLatestIotaSystemState',
  'iotax_getValidatorsApy'
];

const MAX_BODY_BYTES = 12_000;
const MAX_TX_DIGESTS = 50;
const RPC_TIMEOUT_MS = 8000;

function isJsonContentType(contentType: string | string[] | undefined): boolean {
  if (!contentType) return false;
  if (Array.isArray(contentType)) return contentType.some((entry) => entry.includes('application/json'));
  return contentType.includes('application/json');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function validateRpcParams(method: string, params: unknown): boolean {
  switch (method) {
    case 'iota_getCheckpoints': {
      if (!Array.isArray(params)) return false;
      if (params.length < 1 || params.length > 3) return false;
      const [cursor, limit, descending] = params;
      if (cursor !== null && cursor !== undefined && typeof cursor !== 'string') return false;
      if (
        limit !== undefined &&
        (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0 || limit > 50)
      ) {
        return false;
      }
      if (descending !== undefined && typeof descending !== 'boolean') return false;
      return true;
    }
    case 'iota_multiGetTransactionBlocks': {
      if (!Array.isArray(params)) return false;
      if (params.length < 1 || params.length > 2) return false;
      const [digests, options] = params;
      if (!Array.isArray(digests)) return false;
      if (digests.length === 0 || digests.length > MAX_TX_DIGESTS) return false;
      if (!digests.every((digest) => typeof digest === 'string' && digest.length > 0 && digest.length <= 200)) {
        return false;
      }
      if (options === undefined) return true;
      if (!isPlainObject(options)) return false;
      const allowedKeys = [
        'showInput',
        'showEffects',
        'showEvents',
        'showBalanceChanges',
        'showObjectChanges',
        'showRawInput',
      ];
      if (!hasOnlyKeys(options, allowedKeys)) return false;
      return Object.values(options).every((value) => typeof value === 'boolean');
    }
    case 'iotax_getLatestIotaSystemState':
    case 'iotax_getValidatorsApy': {
      return params === undefined || (Array.isArray(params) && params.length === 0);
    }
    default:
      return false;
  }
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

  // 1. Zabezpieczenie CORS: Odrzuć żądanie, jeśli pochodzenie (origin) nie jest autoryzowane / puste
  if (!isAllowedOrigin(origin, meta.host, meta.referer)) {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');

  // Umożliwiamy Preflight (OPTIONS)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-App-Auth'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!isJsonContentType(req.headers['content-type'])) {
    return res.status(415).json({ error: 'Unsupported Media Type' });
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Payload Too Large' });
  }

  // Auth: signed token required
  const clientToken = req.headers['x-app-auth'];
  if (!verifyAuthToken(clientToken, meta)) {
    return res.status(401).json({ error: 'Unauthorized communication' });
  }

  // Rate limit per IP
  const ip = meta.ip || '127.0.0.1';
  if (!checkRateLimit(ip, 'rpc')) {
    return res.status(429).json({ error: 'Too Many Requests' });
  }

  try {
    const body = req.body as { method?: unknown; params?: unknown };
    const method = body?.method;
    const params = body?.params;
    
    if (!method || typeof method !== 'string') {
      return res.status(400).json({ error: 'Missing method' });
    }

    if (!ALLOWED_METHODS.includes(method)) {
      return res.status(403).json({ error: 'Method Not Allowed via this Proxy' });
    }

    if (!validateRpcParams(method, params)) {
      return res.status(400).json({ error: 'Invalid params' });
    }

    const rpcRes = await fetchWithTimeout(IOTA_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params: params || [],
      }),
    }, RPC_TIMEOUT_MS);

    if (!rpcRes.ok) {
      return res.status(rpcRes.status).json({ error: `RPC HTTP error ${rpcRes.status}` });
    }

    const data = await rpcRes.json();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in general RPC proxy:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
