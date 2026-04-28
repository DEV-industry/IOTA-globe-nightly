/**
 * IOTA API service — all external API calls live here.
 *
 * Modified to route through the Vercel Serverless Functions proxy.
 */

import type { ValidatorsResponse } from '../types';

// ─── Config ─────────────────────────────────────────────────────

// Use proxy base URL from env if set, otherwise fallback to local /api (proxied in dev via Vite)
const PROXY_BASE_URL = import.meta.env?.VITE_PROXY_BASE_URL ?? '/api';
const AUTH_REFRESH_SKEW_MS = 15_000;

interface AuthTokenResponse {
  token: string;
  expiresAt: number;
}

let cachedAuth: AuthTokenResponse | null = null;
let inflightAuth: Promise<AuthTokenResponse> | null = null;

function buildProxyUrl(path: string): string {
  const base = PROXY_BASE_URL.replace(/\/$/, '');
  const cleaned = path.replace(/^\//, '');
  return `${base}/${cleaned}`;
}

async function fetchAuthToken(): Promise<AuthTokenResponse> {
  const url = buildProxyUrl('auth');
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch proxy auth token: ${res.statusText}`);
  }
  const data = (await res.json()) as AuthTokenResponse;
  if (!data?.token || typeof data.expiresAt !== 'number') {
    throw new Error('Invalid proxy auth token response');
  }
  return data;
}

async function getAuthToken(): Promise<AuthTokenResponse> {
  const now = Date.now();
  if (cachedAuth && cachedAuth.expiresAt - AUTH_REFRESH_SKEW_MS > now) {
    return cachedAuth;
  }

  if (!inflightAuth) {
    inflightAuth = fetchAuthToken()
      .then((data) => {
        cachedAuth = data;
        return data;
      })
      .finally(() => {
        inflightAuth = null;
      });
  }

  return inflightAuth;
}

async function authorizedFetch(
  url: string,
  init: RequestInit = {},
  retry = true,
): Promise<Response> {
  const { token } = await getAuthToken();
  const headers = new Headers(init.headers ?? {});
  headers.set('x-app-auth', token);

  const response = await fetch(url, { ...init, headers });

  if (retry && (response.status === 401 || response.status === 403)) {
    cachedAuth = null;
    return authorizedFetch(url, init, false);
  }

  return response;
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Fetches the combined validator + system state data.
 * This is the primary data source for the globe and sidebar.
 * Calls our Vercel Serverless Function `/api/validators` which handles caching.
 */
export async function fetchValidators(): Promise<ValidatorsResponse> {
  const url = buildProxyUrl('validators');
  const res = await authorizedFetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch validators proxy API: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Generic JSON-RPC call routed via our `/api/rpc` proxy.
 */
export async function rpcCall<T = unknown>(
  method: string,
  params: unknown[] = [],
): Promise<T> {
  const url = buildProxyUrl('rpc');
  const res = await authorizedFetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ method, params }),
  });

  if (!res.ok) {
    throw new Error(`Proxy RPC HTTP error ${res.status}: ${res.statusText}`);
  }

  const data: JsonRpcResponse<T> = await res.json();

  if (data.error) {
    throw new Error(`RPC error ${data.error.code}: ${data.error.message}`);
  }

  return data.result as T;
}
